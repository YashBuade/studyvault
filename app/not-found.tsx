import Link from "next/link";
import { Compass, Home, LayoutDashboard } from "lucide-react";
import { PublicNavbar } from "@/components/ui/public-navbar";
import { PublicFooter } from "@/components/ui/public-footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))]">
      <PublicNavbar />
      <main className="page-shell flex min-h-[calc(100vh-128px)] items-center justify-center py-16">
        <div className="w-full max-w-2xl rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8 text-center shadow-[var(--shadow-md)] dark:bg-[rgb(var(--surface-elevated))] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))] dark:bg-[rgb(var(--primary-light))]/25 dark:text-[rgb(var(--text-primary))]">
            <Compass size={30} />
          </div>
          <p className="mt-6 text-6xl font-bold tracking-[-0.04em] text-[rgb(var(--primary))] sm:text-7xl">404</p>
          <h1 className="mt-4 text-3xl font-semibold text-[rgb(var(--text-primary))]">Page not found</h1>
          <p className="mt-3 text-[rgb(var(--text-secondary))]">Looks like this page doesn&apos;t exist.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn btn-primary">
              <Home size={16} />
              Go home
            </Link>
            <Link href="/dashboard" className="btn btn-secondary">
              <LayoutDashboard size={16} />
              Go to dashboard
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
