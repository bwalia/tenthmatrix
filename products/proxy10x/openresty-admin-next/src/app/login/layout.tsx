import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Proxy10x Admin",
  description: "Administrator sign-in.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
