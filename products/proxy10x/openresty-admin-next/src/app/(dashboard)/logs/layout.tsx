import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logs & troubleshooting — Proxy10x Admin",
  description:
    "Access and error logs, backend monitoring, AI-powered log analysis.",
};

export default function LogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
