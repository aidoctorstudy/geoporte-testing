import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { ApiError, handle } from "@/lib/api";
import { isAdminSession } from "@/lib/admin-auth";
import { isPublishConfigured, commitAndRedeploy } from "@/lib/github-publish";
import { isKnownImagePath } from "@/lib/image-manifest";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB — safely under Vercel's ~4.5MB
// request body limit for serverless functions, so an oversized upload fails
// with this route's own clear error instead of an opaque platform 413.

const pathSchema = z.string().min(1);

/** Sniffs the first bytes rather than trusting the browser-supplied MIME
 * type (`file.type` on a `File` from `FormData` is attacker-controlled —
 * trivially spoofed) or the filename extension. Covers exactly the three
 * formats `/admin`'s file picker accepts. */
const detectImageType = (bytes: Uint8Array): "jpeg" | "png" | "webp" | null => {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
};

export const POST = handle(async (req) => {
  if (!(await isAdminSession())) {
    throw new ApiError(401, "not_authenticated", "Log in to /admin first.");
  }

  const form = await req.formData();
  const targetPath = pathSchema.parse(form.get("path"));
  const file = form.get("file");

  if (!(file instanceof File)) {
    throw new ApiError(400, "missing_file", "No file was uploaded.");
  }

  // The path isn't free-form — it must be one of the images `/admin`
  // actually showed in the Photos tab. Without this check, this endpoint
  // would let an authenticated-but-malicious request overwrite *any* path
  // in the repo (src/env.ts, the admin auth code itself, …) — not just an
  // image. See ADR-0114.
  if (!isKnownImagePath(targetPath)) {
    throw new ApiError(400, "unknown_path", "That path isn't a recognised site image.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new ApiError(400, "file_too_large", "Image is larger than 4MB — resize or compress it first.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (!detected) {
    throw new ApiError(400, "invalid_file_type", "File isn't a JPEG, PNG, or WEBP image.");
  }

  if (isPublishConfigured()) {
    const base64 = Buffer.from(bytes).toString("base64");
    await commitAndRedeploy(
      `public${targetPath}`,
      base64,
      `content: replace ${targetPath} via /admin`,
    );
    return { ok: true, published: true };
  }

  const diskPath = path.join(process.cwd(), "public", targetPath);
  await fs.writeFile(diskPath, bytes);
  return { ok: true, published: false };
});
