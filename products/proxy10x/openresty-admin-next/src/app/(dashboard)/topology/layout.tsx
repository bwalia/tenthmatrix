import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Topology — Proxy10x Admin",
  description:
    "Visual graph of servers, rules, and backends with live health status.",
};

export default function TopologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
