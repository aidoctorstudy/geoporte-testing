"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ApiClientError } from "@/lib/api-client";

export interface AdminImageEntry {
  path: string;
  category: "Projects" | "Team" | "Services" | "Publications";
  usedIn: string[];
}

export interface AdminPhotosProps {
  images: AdminImageEntry[];
  publishConfigured: boolean;
}

const MAX_FILE_BYTES = 4 * 1024 * 1024; // keep in sync with app/api/admin/photos/route.ts
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

type UploadStatus = "idle" | "previewing" | "uploading" | "done" | "error";

/** One image's replace flow — file picker → side-by-side preview → confirm
 * upload. Self-contained state (no "save all" batching, unlike the text
 * tab): each photo publishes immediately on confirm, since there's no
 * useful meaning to "stage several photo replacements and publish them all
 * at once" the way there is for a block of edited text fields. */
const PhotoCard = ({
  entry,
  publishConfigured,
  onPublished,
}: {
  entry: AdminImageEntry;
  publishConfigured: boolean;
  onPublished: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");
  const [cacheBust, setCacheBust] = useState(0);

  const reset = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStatus("idle");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    if (picked.size > MAX_FILE_BYTES) {
      setError("That file is larger than 4MB — resize or compress it first.");
      setStatus("error");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(picked.type)) {
      setError("Only JPEG, PNG, or WEBP images are accepted.");
      setStatus("error");
      return;
    }
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setStatus("previewing");
    setError("");
  };

  const handleConfirm = async () => {
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const body = new FormData();
      body.set("path", entry.path);
      body.set("file", file);
      const res = await fetch("/api/admin/photos", { method: "POST", body });
      const payload = (await res.json().catch(() => null)) as
        | { data: { ok: boolean; published: boolean } }
        | { error: { message: string } }
        | null;
      if (!res.ok || !payload || "error" in payload) {
        throw new ApiClientError(
          "upload_failed",
          payload && "error" in payload ? payload.error.message : "Upload failed.",
          res.status,
        );
      }
      setStatus("done");
      setCacheBust((n) => n + 1);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onPublished();
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiClientError ? err.message : "Something went wrong — please try again.");
    }
  };

  const displaySrc = cacheBust > 0 ? `${entry.path}?v=${cacheBust}` : entry.path;

  return (
    <li className="border-line bg-surface flex flex-col gap-3 rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-background">
          <Image src={displaySrc} alt="" fill sizes="200px" className="object-cover" unoptimized />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-background">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local blob: object URL, not an optimizable asset
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="text-foreground-muted/50 flex h-full items-center justify-center text-xs">
              New photo
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-foreground text-sm font-medium">{entry.usedIn.join(", ")}</p>
        <p className="text-foreground-muted mt-0.5 truncate text-xs">{entry.path}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        className="hidden"
        aria-label={`Replace photo for ${entry.usedIn.join(", ")}`}
      />

      {status === "previewing" || status === "uploading" ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={status === "uploading"}
            className="bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors duration-[var(--duration-fast)] ease-entrance disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "uploading" && (
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {status === "uploading"
              ? publishConfigured
                ? "Uploading and publishing…"
                : "Uploading…"
              : "Confirm replace"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={status === "uploading"}
            className="text-foreground-muted hover:text-foreground border-line rounded-lg border px-4 py-2 text-xs transition-colors duration-[var(--duration-fast)] ease-entrance disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="border-line text-foreground hover:bg-background rounded-lg border px-4 py-2 text-xs font-medium transition-colors duration-[var(--duration-fast)] ease-entrance"
        >
          Replace
        </button>
      )}

      {status === "done" && (
        <p role="status" className="text-foreground-muted text-xs">
          {publishConfigured ? "Published — live in about 2 minutes." : "Saved locally."}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}
    </li>
  );
};

const CATEGORY_ORDER: AdminImageEntry["category"][] = ["Projects", "Team", "Services", "Publications"];

export const AdminPhotos = ({ images, publishConfigured }: AdminPhotosProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-10">
      <p className="text-foreground-muted text-sm leading-relaxed">
        Replaces the file in place — the page using it keeps showing at the same spot, just with the new
        photo. JPEG, PNG, or WEBP, up to 4MB. Crops to the same frame either way, so a similar aspect ratio
        looks best, but any size works.
      </p>

      {CATEGORY_ORDER.map((category) => {
        const entries = images.filter((image) => image.category === category);
        if (entries.length === 0) return null;
        return (
          <section key={category}>
            <h2 className="text-label text-xs uppercase tracking-[0.12em]">
              {category} ({entries.length})
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <PhotoCard
                  key={entry.path}
                  entry={entry}
                  publishConfigured={publishConfigured}
                  onPublished={() => router.refresh()}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
