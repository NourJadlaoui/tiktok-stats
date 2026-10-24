'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Settings, ShieldCheck, CreditCard, LogOut, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface UserMenuProps {
  name: string;
  email: string;
  avatarUrl: string;
  isAdmin: boolean;
  planName?: string;
  /** % of the plan's monthly (or lifetime, for the free trial) request
   * allowance used so far — null/undefined when the plan is unlimited or
   * the user is an admin (who bypasses limits entirely). Drives the usage
   * ring drawn around the avatar, Claude-style. */
  usagePercent?: number | null;
  usageLabel?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function usageRingColor(pct: number): string {
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#25F4EE';
}

const USAGE_RING_TRACK = 'rgba(115, 115, 115, 0.3)';

/** A conic-gradient ring around the avatar showing % of plan usage — the
 * outer circle is filled edge-to-edge with the gradient, and the opaque
 * avatar sits centered on top of it, so only a thin ring around the edge
 * stays visible (a percent of it colored, the rest the gray track). Simpler
 * and more robust than an SVG stroke-dasharray ring, which is finicky to
 * size correctly via percentage width/height. */
function UsageRing({ percent, children }: { percent: number; children: React.ReactNode }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${usageRingColor(pct)} ${pct}%, ${USAGE_RING_TRACK} ${pct}% 100%)` }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full">{children}</div>
    </div>
  );
}

export default function UserMenu({ name, email, avatarUrl, isAdmin, planName, usagePercent, usageLabel }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const showRing = typeof usagePercent === 'number';

  const avatarInner = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt=""
      className={`h-8 w-8 rounded-full object-cover ${isAdmin ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-white dark:ring-offset-neutral-950' : ''}`}
      referrerPolicy="no-referrer"
    />
  ) : (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${
        isAdmin
          ? 'bg-gradient-to-br from-amber-400 to-amber-600 ring-2 ring-amber-300 ring-offset-1 ring-offset-white dark:ring-offset-neutral-950'
          : 'bg-neutral-900 dark:bg-white dark:text-neutral-900'
      }`}
    >
      {initials(name || email)}
    </div>
  );

  const Avatar = (
    <div className="relative shrink-0">
      {showRing ? (
        <UsageRing percent={usagePercent!}>{avatarInner}</UsageRing>
      ) : (
        <div className="flex h-9 w-9 items-center justify-center">{avatarInner}</div>
      )}
      {isAdmin && (
        <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 ring-2 ring-white dark:ring-neutral-950">
          <Crown size={9} className="text-amber-900" />
        </span>
      )}
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {Avatar}
        <span className="hidden text-left sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-medium leading-tight">{name}</span>
          {isAdmin ? (
            <span className="block text-[11px] font-semibold leading-tight text-amber-500">Admin</span>
          ) : (
            planName && <span className="block text-[11px] leading-tight text-neutral-400">{planName} plan</span>
          )}
        </span>
        <ChevronDown size={14} className={`text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            {Avatar}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                {name}
                {isAdmin && (
                  <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Crown size={9} /> ADMIN
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-neutral-400">{email}</p>
            </div>
          </div>
          <nav className="py-1 text-sm">
            {isAdmin ? (
              <div className="flex items-center justify-between px-4 py-1.5 text-xs text-neutral-400">
                <span>Access level</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Full admin (bypasses plan limits)
                </span>
              </div>
            ) : (
              planName && (
                <div className="px-4 py-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Current plan</span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {planName}
                    </span>
                  </div>
                  {usageLabel && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${usagePercent ?? 0}%`, backgroundColor: usageRingColor(usagePercent ?? 0) }}
                        />
                      </div>
                      <span className="shrink-0 text-[10px] text-neutral-400">{usageLabel}</span>
                    </div>
                  )}
                </div>
              )
            )}
            <Link
              href="/billing"
              className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
              onClick={() => setOpen(false)}
            >
              <CreditCard size={15} /> Billing &amp; plans
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
              onClick={() => setOpen(false)}
            >
              <Settings size={15} /> Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                onClick={() => setOpen(false)}
              >
                <ShieldCheck size={15} /> Admin dashboard
              </Link>
            )}
          </nav>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 border-t border-neutral-100 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:border-neutral-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
