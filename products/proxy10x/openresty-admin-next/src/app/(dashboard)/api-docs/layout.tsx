import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API docs — Proxy10x Admin",
  description:
    "Interactive Swagger / OpenAPI documentation for the Proxy10x REST API.",
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
