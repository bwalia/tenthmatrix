import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookmarks — Proxy10x Admin",
  description: "Quick links to managed services and dashboards.",
};

export default function BookmarksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
