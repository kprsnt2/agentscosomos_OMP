'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Agora' },
    { href: '/topology', label: 'Topology' },
    { href: '/hearthfire', label: 'Hearthfire' },
    { href: '/voyage', label: 'Voyage' },
    { href: '/quarters', label: 'Quarters' },
    { href: '/blog', label: 'Dispatches' },
    { href: '/the-void', label: 'The Void' },
  ];

  return (
    <nav className="flex items-center gap-1 sm:gap-2 px-4 py-2 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 overflow-x-auto">
      <span className="font-mono font-bold text-sm mr-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-indigo-400 shrink-0">
        Cosmos
      </span>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-all shrink-0 ${
              isActive
                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
