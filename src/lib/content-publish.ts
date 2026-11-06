/**
 * Production publish path for `/admin` (ADR-0113). `src/app/api/admin/
 * content/route.ts`'s local-disk write (ADR-0112) only ever helps in
 * `next dev` — Vercel's deployed filesystem is read-only at runtime, so
 * writing there is not just unhelpful but throws. The only way new content
 * reaches a live Vercel deployment is a *new build* from a *new commit*, so
 * publishing means: commit the updated `content.json` to GitHub via its
 * Contents API, then hit the Vercel Deploy Hook so a rebuild starts without
 * waiting on Vercel's own git-push webhook (which may be slower, or not
 * configured to auto-deploy this branch).
 */
import { ApiError } from "@/lib/api";
import { getServerEnv } from "@/env";
import type { SiteContent } from "@/lib/content-overrides";

const CONTENT_FILE_PATH = "src/data/content.json";
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

/** Commits the new `content.json` to GitHub, then triggers the Vercel
 * rebuild. Throws `ApiError` with a message safe to show in `/admin` on any
 * failure — a bad token, a renamed repo, a branch-protection rejection, or
 * (most likely in practice) a stale SHA from a concurrent save. */
export const publishContent = async (content: SiteContent): Promise<void> => {
  const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH, VERCEL_DEPLOY_HOOK } = getServerEnv();
  if (!GITHUB_TOKEN || !GITHUB_REPO || !VERCEL_DEPLOY_HOOK) {
    // isPublishConfigured() should have been checked first — defensive only.
    throw new ApiError(500, "publish_not_configured", "Publishing isn't configured.");
  }
  const branch = GITHUB_BRANCH || "master";
  const contentsUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${CONTENT_FILE_PATH}`;

  // 1. Read the file's current SHA — required by the GitHub API to update
  // an existing file (and to detect a concurrent edit landing in between).
  const current = await fetch(`${contentsUrl}?ref=${branch}`, {
    headers: githubHeaders(GITHUB_TOKEN),
  });
  if (!current.ok) {
    throw new ApiError(
      502,
      "github_read_failed",
      `Couldn't read content.json from GitHub (${current.status}). Check GITHUB_TOKEN/GITHUB_REPO.`,
    );
  }
  const { sha } = (await current.json()) as GitHubContentsResponse;

  // 2. Commit the update.
  const body = Buffer.from(`${JSON.stringify(content, null, 2)}\n`, "utf-8").toString("base64");
  const update = await fetch(contentsUrl, {
    method: "PUT",
    headers: { ...githubHeaders(GITHUB_TOKEN), "content-type": "application/json" },
    body: JSON.stringify({
      message: "content: update via /admin",
      content: body,
      sha,
      branch,
    }),
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
      `Content was committed, but triggering the rebuild failed (${hook.status}). It may need a manual redeploy from Vercel.`,
    );
  }
};
