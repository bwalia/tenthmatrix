import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upstreams — Proxy10x Admin",
  description:
    "Backend server pools — load balancing, health checks, and keepalive configuration.",
};

export default function UpstreamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
