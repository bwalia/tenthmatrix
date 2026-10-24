import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rules — Proxy10x Admin",
  description:
    "Routing rules — path, country, IP, and JWT matching with multi-backend traffic routing.",
};

export default function RulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
