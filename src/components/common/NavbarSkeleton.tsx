// components/common/NavbarSkeleton.tsx
export default function NavbarSkeleton() {
    return (
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* LOGO */}
            <div className="font-bold text-xl tracking-tight text-white">
              Preseed<span className="text-[var(--brand)]">Me</span>
            </div>
  
            {/* DESKTOP NAV SKELETON */}
            <div className="hidden md:flex items-center gap-8">
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
              <div className="pl-4 border-l border-white/10 ml-2">
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              </div>
            </div>
  
            {/* MOBILE TOGGLE SKELETON */}
            <div className="md:hidden w-6 h-6 bg-white/10 rounded animate-pulse" />
          </div>
        </nav>
      </header>
    );
  }