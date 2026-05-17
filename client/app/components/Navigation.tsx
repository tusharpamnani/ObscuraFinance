"use client";

import Link from "next/link";
import { Moon } from "lucide-react";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();
  const navItems = [
    { href: "/vaults", label: "Vaults" },
    { href: "/profile", label: "Profile" },
    { href: "/analytics", label: "Analytics" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white">
          <Moon className="h-5 w-5 text-monad-purple" />
          <span className="text-sm font-semibold tracking-[0.12em] uppercase">ObscuraFinance</span>
          <span className="rounded-md bg-monad-purple/20 px-2 py-0.5 text-[10px] font-semibold text-monad-purple">
            Midnight
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${active
                    ? "bg-monad-purple/20 text-monad-purple"
                    : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${active ? "bg-monad-purple/20 text-monad-purple" : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
