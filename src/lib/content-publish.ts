/**
 * Text-content publish path for `/admin` (ADR-0113). `src/app/api/admin/
 * content/route.ts`'s local-disk write (ADR-0112) only ever helps in
 * `next dev` — Vercel's deployed filesystem is read-only at runtime, so
 * writing there is not just unhelpful but throws. The only way new content
 * reaches a live Vercel deployment is a *new build* from a *new commit*, so
 * publishing means: commit the updated `content.json` to GitHub, then hit
 * the Vercel Deploy Hook. The actual commit/redeploy mechanism is shared
 * with the photo-replace path — see `github-publish.ts`.
 */
import { commitAndRedeploy, isPublishConfigured } from "@/lib/github-publish";
import type { SiteContent } from "@/lib/content-overrides";

const CONTENT_FILE_PATH = "src/data/content.json";

export { isPublishConfigured };

export const publishContent = async (content: SiteContent): Promise<void> => {
  const base64 = Buffer.from(`${JSON.stringify(content, null, 2)}\n`, "utf-8").toString("base64");
  await commitAndRedeploy(CONTENT_FILE_PATH, base64, "content: update via /admin");
};
