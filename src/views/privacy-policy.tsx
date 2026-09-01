import type { Metadata } from "next";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { contact } from "@/lib/company";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Privacy Policy | Geoporte",
    description: "How geoporte.com.au uses cookies and handles contact-form submissions.",
    url: "/privacy-policy",
  });
}

// Deliberately scoped to what this site's own code actually does — cookie
// categories mirrored from `CookiePreferencesModal.tsx`, contact-form
// handling mirrored from `/api/contact/route.ts` — rather than asserting
// broader legal claims (data retention windows, third-party processors,
// jurisdiction-specific rights) this page has no authority to make. See
// the ADR for this page in decisions-log.md.
export function PrivacyPolicyView() {
  return (
    <section
      aria-labelledby="privacy-policy-heading"
      className="mx-auto max-w-3xl px-6 py-24 md:px-8 md:py-32"
    >
      <SectionHeading
        id="privacy-policy-heading"
        tag="h1"
        eyebrow="Legal"
        heading="Privacy policy"
      />

      <Inview
        tag="div"
        mode="once"
        from={{ opacity: 0, y: 24 }}
        to={{ opacity: 1, y: 0 }}
        className="text-foreground-muted mt-10 flex max-w-2xl flex-col gap-6 text-base leading-relaxed"
      >
        <p>
          This page describes how geoporte.com.au uses cookies and handles
          the information you submit through our contact form.
        </p>

        <div>
          <h2 className="text-foreground text-lg font-medium">Cookies</h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <strong className="text-foreground">Strictly necessary</strong>{" "}
              — required for the site to work (navigation, security). These
              can&apos;t be turned off.
            </li>
            <li>
              <strong className="text-foreground">Analytics</strong> —
              anonymised usage stats so we know which pages help and which
              fall flat. No personal profile is built.
            </li>
            <li>
              <strong className="text-foreground">Marketing</strong> — lets
              us measure ad performance and re-show content you didn&apos;t
              finish reading. Opt out any time from the cookie preferences
              panel.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-foreground text-lg font-medium">Contact form</h2>
          <p className="mt-3">
            Information you submit through our contact form (name, email,
            phone, message) is used solely to respond to your enquiry.
          </p>
        </div>

        <p>
          We&apos;re finalising a fuller, formal privacy policy. For any
          question about how your information is handled in the meantime,
          reach out at{" "}
          <a
            href={`mailto:${contact.email}`}
            className="text-accent hover:text-glow transition-colors duration-[var(--duration-fast)] ease-entrance"
          >
            {contact.email}
          </a>
          .
        </p>
      </Inview>
    </section>
  );
}
