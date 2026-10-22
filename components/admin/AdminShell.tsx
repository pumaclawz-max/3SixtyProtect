'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  ExternalLink,
  Inbox,
  LogOut,
  Menu,
  X,
  PlusCircle,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { signOutAction } from '@/app/admin/_actions/auth';
import { cn } from '@/lib/utils';

const NAV: { label: string; href: string; icon: typeof LayoutDashboard; sub?: string }[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Courses', href: '/admin/courses', icon: GraduationCap },
  { label: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
  { label: 'Enquiries', href: '/admin/enquiries', icon: Inbox },
  { label: 'Site activity', href: '/admin/activity', icon: Activity },
  { label: 'Vetting & Screening', href: '/admin/vetting', icon: ShieldCheck, sub: 'BS 7858 Screening' },
  { label: 'Users', href: '/admin/users', icon: Users },
];

const sectionLabel =
  'mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-300';

export function AdminShell({
  email,
  demo,
  children,
}: {
  email: string | null;
  demo: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);
  const initial = (email ?? 'D').trim().charAt(0).toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href="/admin/dashboard"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        >
          <Logo markClassName="h-11 w-11" />
          <span className="flex flex-col leading-none">
            <span className="font-heading text-sm font-bold uppercase tracking-tight text-white">
              Owner portal
            </span>
            <span className="mt-1.5 text-xs leading-snug text-ink-300">
              Courses, bookings &amp; screening
            </span>
          </span>
        </Link>
      </div>

      {demo ? (
        <div className="mx-4 mt-4 border border-white/20 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          Demo mode · read-only
        </div>
      ) : null}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5">
        <p className={sectionLabel}>Manage</p>
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-3 border-l-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.05em] transition-colors',
                    active
                      ? 'border-white bg-white/10 text-white'
                      : 'border-transparent text-ink-100 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors',
                      active ? 'text-white' : 'text-ink-200 group-hover:text-white',
                    )}
                  />
                  <span className="flex flex-col leading-tight">
                    {item.label}
                    {item.sub ? (
                      <span
                        className={cn(
                          'mt-0.5 text-[9px] tracking-[0.15em] transition-colors',
                          active ? 'text-ink-200' : 'text-ink-300 group-hover:text-ink-200',
                        )}
                      >
                        {item.sub}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className={cn(sectionLabel, 'mt-7')}>Quick actions</p>
        <Link
          href="/admin/courses/new"
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-2 border border-white bg-white px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-950 transition-colors hover:bg-transparent hover:text-white"
        >
          <PlusCircle className="h-4 w-4" />
          New course
        </Link>
        <Link
          href="/admin/vetting/new"
          onClick={() => setOpen(false)}
          className="mt-2 flex items-center justify-center gap-2 border border-white/40 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-200 transition-colors hover:border-white hover:bg-white hover:text-ink-950"
        >
          <UserPlus className="h-4 w-4" />
          New screening
        </Link>
      </nav>

      {/* Account */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="group flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-100 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-[18px] w-[18px] shrink-0 text-ink-200 transition-colors group-hover:text-white" />
          View website
        </Link>

        <div className="mt-2 flex items-center gap-3 border-t border-white/10 px-3 pt-3">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-heading text-xs font-bold uppercase text-white"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {email ?? 'Demo admin'}
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
              Signed in
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center border border-white/15 text-ink-300 transition-colors hover:border-white hover:bg-white hover:text-ink-950"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink-950 lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-ink-950 bg-background px-4 lg:hidden">
        <Link href="/admin/dashboard">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center border border-ink-950 text-ink-800"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-ink-950">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center text-ink-300 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      {/* Content */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
