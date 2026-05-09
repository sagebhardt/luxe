import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your trip — Luxe",
  robots: { index: false, follow: false },
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
