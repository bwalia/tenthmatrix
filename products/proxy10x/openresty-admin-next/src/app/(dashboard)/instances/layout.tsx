import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instances — Proxy10x Admin",
  description: "Proxy10x instance metadata and cluster topology.",
};

export default function InstancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
