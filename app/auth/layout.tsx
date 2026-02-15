export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm md:p-8">
        {children}
      </div>
    </div>
  );
}