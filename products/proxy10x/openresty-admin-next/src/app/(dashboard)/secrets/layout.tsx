import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secrets — Proxy10x Admin",
  description: "Encrypted credential storage.",
};

export default function SecretsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
