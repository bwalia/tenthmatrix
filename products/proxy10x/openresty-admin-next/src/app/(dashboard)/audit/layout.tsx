import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit log — Proxy10x Admin",
  description:
    "History of configuration changes — who did what and when.",
};

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
