"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { useAuth } from "@/lib/auth-context";

type NavItem = { href: string; label: string };

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return (
      pathname === "/dashboard" || pathname.startsWith("/dashboard/screens")
    );
  }
  if (href === "/dashboard/media") {
    return pathname.startsWith("/dashboard/media");
  }
  if (href === "/dashboard/menus") {
    return pathname.startsWith("/dashboard/menus");
  }
  if (href === "/dashboard/admin") {
    return pathname.startsWith("/dashboard/admin");
  }
  if (href === "/dashboard/support") {
    return pathname === "/dashboard/support";
  }
  if (href === "/dashboard/account") {
    return pathname === "/dashboard/account";
  }
  return pathname === href;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { token, user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { href: "/dashboard", label: "Screens" },
      { href: "/dashboard/media", label: "Media" },
      { href: "/dashboard/menus", label: "Menus" },
      { href: "/dashboard/support", label: "Support" },
    ];
    if (user?.is_admin) {
      items.push({ href: "/dashboard/admin", label: "Admin" });
    }
    items.push({ href: "/dashboard/account", label: "Account" });
    return items;
  }, [user?.is_admin]);

  if (loading || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-deep text-brand-text">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-deep text-brand-cream md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-brand-amber/10 bg-brand-sidebar md:flex">
        <div className="border-b border-brand-amber/10 p-4">
          <BrandLockup markSize={32} href="/dashboard" />
          <p className="mt-3 truncate font-mono text-[10px] text-brand-muted">
            {user?.email}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-3 text-sm font-medium transition md:min-h-0 ${
                navActive(pathname, item.href)
                  ? "bg-brand-amber/10 text-brand-amber"
                  : "text-brand-text hover:bg-brand-warm hover:text-brand-cream"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-brand-amber/10 p-3">
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="w-full rounded-lg px-3 py-3 text-left text-sm text-brand-muted transition hover:bg-brand-warm hover:text-brand-cream"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-h-0 w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto bg-brand-deep px-4 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-8 md:pb-8 md:pt-8">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-amber/20 bg-brand-deep/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
        aria-label="Primary"
      >
        <div className="scrollbar-none flex max-w-full snap-x snap-mandatory overflow-x-auto">
          {navItems.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-1 min-w-[4.5rem] shrink-0 snap-start flex-col items-center justify-center gap-1 px-2 py-2 text-center text-[13px] font-semibold leading-tight ${
                  active
                    ? "text-brand-amber"
                    : "text-brand-cream/70 active:text-brand-cream"
                }`}
              >
                <span>{item.label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="h-0.5 w-6 rounded-full bg-brand-amber"
                  />
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex min-h-[60px] min-w-[3.5rem] shrink-0 snap-start flex-col items-center justify-center px-2 text-[13px] font-semibold text-brand-cream/70 active:text-brand-cream"
          >
            Out
          </button>
        </div>
      </nav>
    </div>
  );
}
