import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Proxy10x Admin",
  description: "Global application settings and environment configuration.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
