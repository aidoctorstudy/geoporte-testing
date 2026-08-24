/**
 * Primary site navigation. Real content, not mock data — lives beside the
 * feature that consumes it (`Nav/`) rather than `data/mocks/`.
 */
export interface NavLink {
  label: string;
  href: string;
}

export const primaryNavLinks: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Publications", href: "/publications" },
];
