'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { NAV_LINKS, SITE } from '@/lib/constants';
import { courseTypeHref, groupCourseTypes } from '@/lib/course-nav';
import type { CourseTypeInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Pages that count as being inside the Training Courses section. */
const COURSE_PATHS = ['/door-supervision', '/close-protection'];

const navLink =
  'font-mono text-[12px] uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950 focus-visible:ring-offset-2';
const navActive = 'border-b-2 border-ink-950 pb-0.5 text-ink-950';
const navIdle = 'text-ink-600 hover:text-ink-950';
const groupLabel = 'font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500';
const courseLink =
  'block py-1.5 text-sm leading-snug text-ink-700 underline-offset-4 transition-colors hover:text-ink-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950';

export function Header({ courseTypes = [] }: { courseTypes?: CourseTypeInfo[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile drawer
  const [mega, setMega] = useState(false); // desktop mega menu
  const [coursesOpen, setCoursesOpen] = useState(false); // mobile accordion
  const headerRef = useRef<HTMLElement>(null);
  // Hover opens the mega menu, so the click that usually follows must not
  // toggle it shut again. Both land in the same tick, before a re-render, so
  // the open state is mirrored in a ref: reading `mega` here gets a stale
  // value and closes the menu the instant the user clicks it.
  const megaOpen = useRef(false);
  const openedByHover = useRef(false);

  const closeMega = useCallback(() => {
    megaOpen.current = false;
    openedByHover.current = false;
    setMega(false);
  }, []);

  const openMega = useCallback((viaHover: boolean) => {
    if (!megaOpen.current) openedByHover.current = viaHover;
    megaOpen.current = true;
    setMega(true);
  }, []);

  const { featured, security, firstAid } = useMemo(
    () => groupCourseTypes(courseTypes),
    [courseTypes],
  );
  const hasCourses = featured.length + security.length + firstAid.length > 0;

  // Any navigation closes everything.
  useEffect(() => {
    setOpen(false);
    closeMega();
    setCoursesOpen(false);
  }, [pathname, closeMega]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open && !mega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      closeMega();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, mega, closeMega]);

  // A click anywhere outside the header dismisses the mega menu.
  useEffect(() => {
    if (!mega) return;
    const onDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) closeMega();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [mega, closeMega]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);
  const coursesActive = COURSE_PATHS.some((p) => pathname.startsWith(p));

  const featuredCards = (gridClass: string) => (
    <div className={gridClass}>
      {featured.map((f) => (
        <Link
          key={f.key}
          href={f.href}
          onClick={() => closeMega()}
          className="group/card flex flex-col justify-between border border-ink-950 bg-background px-4 py-3.5 transition-colors hover:bg-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950 focus-visible:ring-offset-2"
        >
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="shrink-0 border border-ink-950 px-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-950 transition-colors group-hover/card:border-white group-hover/card:text-white">
                {f.abbr}
              </span>
              <p className="font-heading text-lg uppercase leading-none tracking-tight text-ink-950 transition-colors group-hover/card:text-white">
                {f.label}
              </p>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink-600 transition-colors group-hover/card:text-ink-200">
              {f.blurb}
            </p>
          </div>
          <span className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-950 transition-colors group-hover/card:text-white">
            View course
            <ArrowRight
              className="h-3 w-3 transition-transform group-hover/card:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </Link>
      ))}
    </div>
  );

  const courseList = (types: CourseTypeInfo[], listClass: string) => (
    <ul className={listClass}>
      {types.map((t) => (
        <li key={t.key} className="break-inside-avoid">
          <Link
            href={courseTypeHref(t.key)}
            onClick={() => closeMega()}
            className={courseLink}
          >
            {t.short_label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <header
      ref={headerRef}
      onMouseLeave={() => closeMega()}
      className="sticky top-0 z-50 w-full border-b border-ink-950 bg-background"
    >
      <div className="mx-auto flex h-[82px] max-w-6xl items-center justify-between px-5 md:h-[104px]">
        <Link
          href="/"
          aria-label={`${SITE.name} home`}
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950 focus-visible:ring-offset-2"
        >
          <Logo markClassName="h-[64px] w-[64px] md:h-[86px] md:w-[86px]" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) =>
            link.mega && hasCourses ? (
              <button
                key={link.label}
                type="button"
                onClick={() => {
                  if (openedByHover.current) {
                    openedByHover.current = false; // hover opened it; keep it open
                    return;
                  }
                  if (megaOpen.current) closeMega();
                  else openMega(false);
                }}
                onMouseEnter={() => openMega(true)}
                aria-expanded={mega}
                aria-haspopup="true"
                aria-controls="training-courses-menu"
                className={cn(
                  navLink,
                  'inline-flex items-center gap-1.5',
                  coursesActive || mega ? navActive : navIdle,
                )}
              >
                {link.label}
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200',
                    mega && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <Link
                key={link.label}
                href={link.href ?? '/'}
                onMouseEnter={() => closeMega()}
                className={cn(
                  navLink,
                  isActive(link.href ?? '/') ? navActive : navIdle,
                )}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <Button href="/book" size="sm">
              Book
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="inline-flex h-11 w-11 items-center justify-center border border-ink-950 bg-background text-ink-950 transition-colors hover:bg-ink-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950 focus-visible:ring-offset-2 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Desktop mega menu */}
      {mega && hasCourses && (
        <div
          id="training-courses-menu"
          className="absolute inset-x-0 top-full hidden max-h-[calc(100vh-104px)] overflow-y-auto border-b-2 border-t border-b-ink-950 border-t-ink-200 bg-background lg:block"
        >
          <div className="mx-auto max-w-6xl px-5 py-9">
            {featured.length > 0 && (
              <section
                aria-labelledby="mega-featured"
                className="mb-7 border-b border-ink-200 pb-7"
              >
                <p id="mega-featured" className={groupLabel}>
                  Most Popular
                </p>
                {featuredCards('mt-3 grid gap-3 sm:grid-cols-2')}
              </section>
            )}

            <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,15rem)]">
              <section aria-labelledby="mega-security">
                <p id="mega-security" className={groupLabel}>
                  More Security Courses
                </p>
                {courseList(security, 'mt-4 columns-2 gap-x-8 xl:columns-3')}
              </section>

              <div className="hidden bg-ink-200 lg:block" aria-hidden="true" />

              <section aria-labelledby="mega-first-aid">
                <p id="mega-first-aid" className={groupLabel}>
                  First Aid Courses
                </p>
                {courseList(firstAid, 'mt-4')}
              </section>
            </div>

            <div className="mt-8 flex items-center justify-between gap-6 border-t border-ink-950 pt-6">
              <p className="max-w-lg text-sm text-ink-600">
                Accredited SIA and first aid qualifications, delivered in London
                and nationwide.
              </p>
              <Button href="/calendar" size="sm" className="shrink-0">
                View All Courses
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile full-screen drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-ink-950 px-4">
            <Link
              href="/"
              aria-label={`${SITE.name} home`}
              className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950 focus-visible:ring-offset-2"
            >
              <Logo markClassName="h-16 w-16" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center border border-ink-950 bg-background text-ink-950 transition-colors hover:bg-ink-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950 focus-visible:ring-offset-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav
            className={cn(
              'flex flex-1 flex-col gap-2 overflow-y-auto px-4',
              coursesOpen ? 'justify-start py-6' : 'justify-center',
            )}
          >
            {NAV_LINKS.map((link, i) => {
              const index = (
                <span className="font-mono text-[12px] tracking-[0.05em] text-ink-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
              );

              if (link.mega && hasCourses) {
                return (
                  <div key={link.label} className="border-b border-ink-200">
                    <button
                      type="button"
                      onClick={() => setCoursesOpen((v) => !v)}
                      aria-expanded={coursesOpen}
                      className={cn(
                        'flex w-full items-center gap-4 py-4 text-left font-heading text-3xl uppercase tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950 focus-visible:ring-offset-2',
                        coursesActive ? 'text-ink-950' : 'text-ink-800',
                      )}
                    >
                      {index}
                      <span className="flex-1">{link.label}</span>
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 shrink-0 text-ink-400 transition-transform duration-200',
                          coursesOpen && 'rotate-180',
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    {coursesOpen && (
                      <div className="pb-6 pl-10">
                        {featured.length > 0 && (
                          <>
                            <p className={groupLabel}>Most Popular</p>
                            {featuredCards('mt-3 grid gap-3')}
                          </>
                        )}
                        <p
                          className={cn(
                            groupLabel,
                            featured.length > 0 && 'mt-6',
                          )}
                        >
                          More Security Courses
                        </p>
                        {courseList(security, 'mt-3')}
                        <p className={cn(groupLabel, 'mt-6')}>First Aid Courses</p>
                        {courseList(firstAid, 'mt-3')}
                        <Button href="/calendar" size="sm" className="mt-6 w-full">
                          View All Courses
                        </Button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href ?? '/'}
                  className={cn(
                    'flex items-baseline gap-4 border-b border-ink-200 py-4 font-heading text-3xl uppercase tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950 focus-visible:ring-offset-2',
                    isActive(link.href ?? '/')
                      ? 'text-ink-950'
                      : 'text-ink-800 hover:text-ink-950',
                  )}
                >
                  {index}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 flex-col gap-4 border-t border-ink-950 px-4 py-6">
            <Button href="/book" className="w-full">
              Book a Course
            </Button>
            <a
              href={SITE.phoneHref}
              className="flex items-center justify-center gap-2 font-mono text-[12px] uppercase tracking-[0.05em] text-ink-600 transition-colors hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950 focus-visible:ring-offset-2"
            >
              {SITE.phone}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
