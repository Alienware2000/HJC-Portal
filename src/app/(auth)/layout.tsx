export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex">
      {/* Left panel — branded */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] bg-[#0f1623] relative overflow-hidden flex-col justify-between p-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-amber-500/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.1]">
              <span className="text-[11px] font-bold text-white/90 tracking-tight">HJ</span>
            </div>
            <span className="text-[15px] font-semibold text-white/70">Healing Jesus Conference</span>
          </div>
          <h1 className="text-[32px] font-bold text-white leading-tight tracking-tight">
            Conference<br />Itinerary Portal
          </h1>
          <p className="text-[15px] text-white/40 mt-4 max-w-[320px] leading-relaxed">
            Manage your travel details, accommodation, and conference schedule all in one place.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/20">Healing Jesus Conference {new Date().getFullYear()}</p>
      </div>

      {/* Mobile brand header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 bg-white border-b border-gray-200 flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f1623]">
            <span className="text-[10px] font-bold text-white/90 tracking-tight">HJ</span>
          </div>
          <span className="text-[14px] font-semibold text-gray-900">Healing Jesus</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 pt-20 pb-10 lg:pt-10 bg-white">
        <div className="w-full max-w-[380px]">
          {children}
        </div>
      </div>
    </div>
  );
}
