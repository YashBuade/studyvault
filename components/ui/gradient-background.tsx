export function GradientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Primary gradient - top right - purple/blue */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/40 via-purple-500/30 to-transparent rounded-full blur-3xl animate-pulse will-change-transform"></div>
      
      {/* Secondary gradient - bottom left - blue/cyan */}
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/40 via-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      
      {/* Tertiary gradient - center right - subtle accent */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      
      {/* Accent gradient - bottom center */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-gradient-to-r from-blue-400/15 via-indigo-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "3s" }}></div>

      {/* Animated grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
