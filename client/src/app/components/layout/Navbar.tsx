import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <span className="font-display font-bold text-lg text-zinc-900">
            Sound Social
          </span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search artists, albums, tracks…"
            className="input"
          />
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/login" className="btn-ghost">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary">
            Join Free
          </Link>
        </div>

      </div>
    </nav>
  );
}