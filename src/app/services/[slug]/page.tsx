export { ServiceDetailPage as default, generateStaticParams, generateMetadata } from "@/views/services/service-detail";

// Next statically parses route segment config at compile time, so it can't
// be re-exported like the members above — must be a literal here. All valid
// slugs are known statically (mock data), so an unknown slug should 404
// immediately rather than attempt a request-time render; this also avoids a
// Next.js streaming quirk where `notFound()` returns HTTP 200 instead of 404
// for a streamed response (this app's root `loading.tsx` enables streaming).
export const dynamicParams = false;
