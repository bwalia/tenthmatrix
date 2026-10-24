import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users — Proxy10x Admin",
  description: "Administrator accounts and role management.",
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
