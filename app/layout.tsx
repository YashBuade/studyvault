import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/src/components/ui/toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyVault",
  description: "A premium student productivity workspace for notes, files, and planning.",
};

function ThemeScript() {
  const code = `(() => {
    const stored = localStorage.getItem("studyvault-theme");
    const theme = stored === "dark" || stored === "light" ? stored : "light";
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  })();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
        <ThemeScript />
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
