import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profiles — Proxy10x Admin",
  description: "Environment profiles (dev, int, acc, prod) for data isolation.",
};

export default function ProfilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
