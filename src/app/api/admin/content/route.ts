import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { ApiError, handle } from "@/lib/api";
import { isAdminSession } from "@/lib/admin-auth";
import { isPublishConfigured, publishContent } from "@/lib/content-publish";

const overrideMap = <T extends z.ZodRawShape>(shape: T) => z.record(z.string(), z.object(shape));

const contentSchema = z.object({
  hero: z.object({ heading: z.string().max(200).optional() }).optional(),
  services: overrideMap({
    shortDescription: z.string().max(300).optional(),
    overview: z.string().max(3000).optional(),
  }).optional(),
  projects: overrideMap({
    title: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
  }).optional(),
  team: overrideMap({
    name: z.string().max(200).optional(),
    bio: z.string().max(2000).optional(),
  }).optional(),
});

type ContentPayload = z.infer<typeof contentSchema>;

/** Drops blank fields so a cleared-out textarea doesn't persist as an
 * override of `""` (which would render as empty text on the live site
 * instead of falling back to the original copy), and drops an id's whole
 * entry once every field under it is blank — keeps `content.json` from
 * accumulating empty husks across edits. */
const pruneBlank = (payload: ContentPayload): ContentPayload => {
  const pruneRecord = <V extends Record<string, string | undefined>>(
    record: Record<string, V> | undefined,
  ): Record<string, V> | undefined => {
    if (!record) return undefined;
    const result: Record<string, V> = {};
    for (const [id, fields] of Object.entries(record)) {
      const kept = Object.fromEntries(
        Object.entries(fields).filter(([, value]) => typeof value === "string" && value.trim() !== ""),
      ) as V;
      if (Object.keys(kept).length > 0) result[id] = kept;
    }
    return result;
  };

  const heading = payload.hero?.heading?.trim();
  return {
    hero: heading ? { heading } : undefined,
    services: pruneRecord(payload.services),
    projects: pruneRecord(payload.projects),
    team: pruneRecord(payload.team),
  };
};

const CONTENT_PATH = path.join(process.cwd(), "src", "data", "content.json");

export const POST = handle(async (req) => {
  if (!(await isAdminSession())) {
    throw new ApiError(401, "not_authenticated", "Log in to /admin first.");
  }

  const input = contentSchema.parse(await req.json());
  const pruned = pruneBlank(input);

  // Two mutually exclusive modes (ADR-0113), chosen by which env vars are
  // configured — never both: a disk write on Vercel's read-only filesystem
  // would just throw, and it would be pointless even if it didn't, since
  // nothing there survives past this request.
  if (isPublishConfigured()) {
    await publishContent(pruned);
    return { ok: true, published: true };
  }

  await fs.writeFile(CONTENT_PATH, `${JSON.stringify(pruned, null, 2)}\n`, "utf-8");
  return { ok: true, published: false };
});
