import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Providers } from "./providers";

const uiFont = GeistSans;

export const metadata: Metadata = {
  title: "StudyVault",
  description: "A modern study planner and note-taking app.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={uiFont.variable}>
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
