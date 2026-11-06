// Must live directly in this file, not re-exported — Next statically parses
// route segment config exports at compile time (same constraint
// `service-detail.tsx`'s own comment documents for `dynamicParams`).
// Non-negotiable here: this route reads the session cookie and must never be
// prerendered/cached — a cached response would show every visitor whatever
// the *first* build-time render produced (the login form), permanently,
// regardless of their own cookie.
export const dynamic = "force-dynamic";

export { AdminView as default, generateMetadata } from "@/views/admin";
