"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
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
    ];
    if (user?.is_admin) {
      items.push({ href: "/dashboard/admin", label: "Admin" });
    }
    items.push({ href: "/dashboard/account", label: "Account" });
    return items;
  }, [user?.is_admin]);

  if (loading || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/50 md:flex">
        <div className="border-b border-zinc-800 p-4">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-white"
          >
            KemisDisplay
          </Link>
          <p className="mt-1 truncate text-xs text-zinc-500">{user?.email}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-3 text-sm font-medium transition md:min-h-0 ${
                navActive(pathname, item.href)
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-3">
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="w-full rounded-lg px-3 py-3 text-left text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-auto p-4 pb-28 md:p-8 md:pb-8">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-zinc-800 bg-zinc-950/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-center text-[11px] font-medium leading-tight ${
              navActive(pathname, item.href)
                ? "text-emerald-400"
                : "text-zinc-500 active:text-zinc-300"
            }`}
          >
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="flex min-h-[52px] min-w-[56px] flex-col items-center justify-center px-2 text-[11px] font-medium text-zinc-600"
        >
          Out
        </button>
      </nav>
    </div>
  );
}
