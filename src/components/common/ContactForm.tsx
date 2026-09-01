"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useState, type FormEvent } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { contact } from "@/lib/company";

type Status = "idle" | "submitting" | "success" | "error";

const fieldClassName =
  "border-line bg-surface text-foreground placeholder:text-foreground-muted/60 focus:border-accent w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors duration-[var(--duration-fast)] ease-entrance";

/**
 * Wired to the existing `/api/contact` route handler (`src/app/api/contact/
 * route.ts`) via `apiFetch` — that endpoint already existed, validating name/
 * email/message with the same `zod` schema mirrored in this form's `maxLength`s,
 * but had no UI calling it anywhere in the app before this page.
 */
export const ContactForm = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const phone = String(data.get("phone") ?? "").trim();
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      ...(phone && { phone }),
      message: String(data.get("message") ?? ""),
    };

    setStatus("submitting");
    setErrorMessage("");
    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Something went wrong — please try again.",
      );
    }
  };

  if (status === "success") {
    return (
      <div className="border-line bg-surface rounded-2xl border p-8" role="status">
        <p className="text-foreground text-lg font-medium">Message sent.</p>
        <p className="text-foreground-muted mt-2 text-sm leading-relaxed">
          Thanks for reaching out — we aim to respond within{" "}
          {contact.responseTime.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div>
        <label htmlFor="contact-name" className="text-foreground-muted mb-2 block text-xs uppercase tracking-[0.12em]">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          className={fieldClassName}
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="text-foreground-muted mb-2 block text-xs uppercase tracking-[0.12em]">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={fieldClassName}
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className="text-foreground-muted mb-2 block text-xs uppercase tracking-[0.12em]">
          Phone <span className="normal-case text-foreground-muted/60">(optional)</span>
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          maxLength={30}
          autoComplete="tel"
          className={fieldClassName}
          placeholder="+61 4XX XXX XXX"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="text-foreground-muted mb-2 block text-xs uppercase tracking-[0.12em]">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          maxLength={2000}
          rows={5}
          className={`${fieldClassName} resize-none`}
          placeholder="Tell us about your project"
        />
      </div>

      {status === "error" && (
        <p role="alert" className="text-danger text-sm">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg px-6 py-3 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-entrance disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
};
