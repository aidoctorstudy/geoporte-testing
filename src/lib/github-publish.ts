/**
 * Shared GitHub-commit-and-redeploy mechanism behind `/admin`'s publish
 * paths (ADR-0113, extended ADR-0114 for binary files) — used by both the
 * text-content save (`content-publish.ts`) and the photo-replace upload
 * (`photo-publish.ts`). Factored out because both need exactly the same two
 * steps: commit a file to GitHub via its Contents API, then hit the Vercel
 * Deploy Hook so a rebuild starts without waiting on Vercel's own git-push
 * webhook. Only *what* gets committed (JSON text vs. image bytes) and
 * *where* (`src/data/content.json` vs. a path chosen from the image
 * manifest) differs between the two callers.
 */
import { ApiError } from "@/lib/api";
import { getServerEnv } from "@/env";

const GITHUB_API_VERSION = "2022-11-28";

/** All three must be set together — see the fields' own comments in
 * `src/env.ts`. `GITHUB_BRANCH` is separately optional with its own
 * default, so it's not part of this check. */
export const isPublishConfigured = (): boolean => {
  const { GITHUB_TOKEN, GITHUB_REPO, VERCEL_DEPLOY_HOOK } = getServerEnv();
  return Boolean(GITHUB_TOKEN && GITHUB_REPO && VERCEL_DEPLOY_HOOK);
};

interface GitHubContentsResponse {
  sha: string;
}

const githubHeaders = (token: string) => ({
  authorization: `Bearer ${token}`,
  accept: "application/vnd.github+json",
  "x-github-api-version": GITHUB_API_VERSION,
});

/**
 * Commits `base64Content` to `repoPath` on GitHub (creating a new commit on
 * the configured branch), then triggers the Vercel rebuild. Throws
 * `ApiError` with a message safe to show in `/admin` on any failure — a bad
 * token, a renamed repo, a branch-protection rejection, or (most likely in
 * practice) a stale SHA from a concurrent save on the same file.
 *
 * Does *not* check `isPublishConfigured()` itself — callers check it first
 * to decide which code path to take at all (publish vs. local-disk write);
 * this function assumes that decision was already made.
 */
export const commitAndRedeploy = async (
  repoPath: string,
  base64Content: string,
  commitMessage: string,
): Promise<void> => {
  const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH, VERCEL_DEPLOY_HOOK } = getServerEnv();
  if (!GITHUB_TOKEN || !GITHUB_REPO || !VERCEL_DEPLOY_HOOK) {
    // isPublishConfigured() should have been checked first — defensive only.
    throw new ApiError(500, "publish_not_configured", "Publishing isn't configured.");
  }
  const branch = GITHUB_BRANCH || "master";
  const contentsUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${repoPath}`;

  // 1. Read the file's current SHA — required by the GitHub API to update
  // an existing file (and to detect a concurrent edit landing in between).
  const current = await fetch(`${contentsUrl}?ref=${branch}`, {
    headers: githubHeaders(GITHUB_TOKEN),
  });
  if (!current.ok) {
    throw new ApiError(
      502,
      "github_read_failed",
      `Couldn't read ${repoPath} from GitHub (${current.status}). Check GITHUB_TOKEN/GITHUB_REPO.`,
    );
  }
  const { sha } = (await current.json()) as GitHubContentsResponse;

  // 2. Commit the update.
  const update = await fetch(contentsUrl, {
    method: "PUT",
    headers: { ...githubHeaders(GITHUB_TOKEN), "content-type": "application/json" },
    body: JSON.stringify({ message: commitMessage, content: base64Content, sha, branch }),
  });
  if (!update.ok) {
    const status = update.status;
    if (status === 409 || status === 422) {
      throw new ApiError(
        409,
        "github_conflict",
        "Someone else published a change at the same time — reload and try again.",
      );
    }
    throw new ApiError(502, "github_write_failed", `GitHub rejected the commit (${status}).`);
  }

  // 3. Trigger the rebuild. Vercel's hook responds as soon as the build is
  // queued, not when it finishes — this call is fast; the ~2 minute wait
  // happens after it returns, not during.
  const hook = await fetch(VERCEL_DEPLOY_HOOK, { method: "POST" });
  if (!hook.ok) {
    throw new ApiError(
      502,
      "deploy_hook_failed",
      `Changes were committed, but triggering the rebuild failed (${hook.status}). It may need a manual redeploy from Vercel.`,
    );
  }
};
