import { redirect } from "next/navigation";

/**
 * /publications now redirects to /insights where the full articles
 * and publications list live (brief Rev 0, 2 November 2026, Section 10).
 */
export default function PublicationsRedirect() {
  redirect("/insights");
}
