"use client";

import {
  CheckCheck,
  LockKeyhole,
  MessageCircleMore,
  Sparkles,
  UsersRound,
} from "lucide-react";

import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  footerText?: string;
  footerLinkLabel?: string;
  footerLinkHref?: string;
};

export default function AuthShell({
  badge,
  title,
  description,
  children,
  footerText,
  footerLinkLabel,
  footerLinkHref,
}: AuthShellProps) {
  return (
    <main
      className="
    relative
    flex items-center justify-center
    h-dvh
    w-full
    overflow-hidden
    bg-[#f6f3fc]
    p-3
    dark:bg-[#09090f]
    sm:p-5
    lg:p-6
  "
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-elitePurple/15 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.055]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <section className="relative mx-auto grid min-h-[calc(100dvh-1.5rem)] w-full max-w-[1440px] overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(76,29,149,0.13)] dark:border-white/5 dark:bg-[#111119] sm:min-h-[calc(100dvh-2.5rem)] lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#9d7cff] via-[#7c3aed] to-[#4c1d95] p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 top-16 h-64 w-64 rounded-full border border-white/15" />
            <div className="absolute -right-10 top-28 h-40 w-40 rounded-full border border-white/10" />
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
          </div>

          <Link
            href="/auth/login"
            className="relative z-10 inline-flex w-fit items-center gap-3"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-xl">
              <MessageCircleMore size={25} />
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight">
                Elite Messenger
              </span>
              <span className="block text-xs text-white/65">
                Connect without limits
              </span>
            </span>
          </Link>

          <div className="relative z-10 mx-auto my-10 w-full max-w-[520px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-lg">
              <Sparkles size={14} />A more social way to message
            </span>

            <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.08] tracking-[-0.04em] xl:text-5xl">
              Every conversation can become a connection.
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-white/70 xl:text-base">
              Chat privately, build groups, share moments, and discover new
              people from one premium experience.
            </p>

            <div className="mt-8 rounded-[28px] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-2xl xl:p-5">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                    <UsersRound size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-black">Weekend Crew</p>
                    <p className="mt-0.5 text-[11px] text-white/60">
                      6 members · 3 online
                    </p>
                  </div>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>

              <div className="space-y-3 py-5">
                <Bubble side="left" text="Are we still meeting tonight?" />
                <Bubble side="right" text="Yes. I just shared the location." />
                <Bubble side="left" text="Perfect — see you there ✨" />
              </div>

              <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm text-white/50">
                <span className="flex-1">Type a message...</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-elitePurple">
                  <MessageCircleMore size={16} />
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-5 text-xs font-semibold text-white/65">
            <span className="inline-flex items-center gap-2">
              <LockKeyhole size={14} />
              Secure authentication
            </span>
            <span className="inline-flex items-center gap-2">
              <UsersRound size={14} />
              Built for real connections
            </span>
          </div>
        </aside>

        <div className="flex min-h-0 flex-col bg-white px-4 py-5 dark:bg-[#111119] sm:px-8 sm:py-8 lg:px-10 lg:py-10 xl:px-14">
          <header className="flex items-center justify-between lg:hidden">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2.5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-elitePurple text-white shadow-lg shadow-elitePurple/20">
                <MessageCircleMore size={20} />
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                Elite Messenger
              </span>
            </Link>
            <span className="rounded-full bg-elitePurple/10 px-3 py-1.5 text-[10px] font-black text-elitePurple">
              ELITE
            </span>
          </header>

          <div className="flex flex-1 items-center justify-center py-8 sm:py-12 lg:py-6">
            <div className="w-full max-w-[520px]">
              <div className="mb-7 sm:mb-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-elitePurple/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-elitePurple">
                  <MessageCircleMore size={14} />
                  {badge}
                </span>
                <h1 className="mt-4 text-3xl font-black tracking-[-0.035em] text-slate-950 dark:text-white sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>

              {children}

              {footerText && footerLinkLabel && footerLinkHref ? (
                <p className="mt-7 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {footerText}{" "}
                  <Link
                    href={footerLinkHref}
                    className="font-black text-elitePurple transition hover:opacity-75"
                  >
                    {footerLinkLabel}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>

          <footer className="text-center text-[10px] font-semibold text-slate-400">
            By continuing, you agree to Elite Messenger&apos;s Terms and Privacy
            Policy.
          </footer>
        </div>
      </section>
    </main>
  );
}

function Bubble({ side, text }: { side: "left" | "right"; text: string }) {
  return (
    <div
      className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 ${
          side === "right"
            ? "rounded-br-md bg-white text-violet-950"
            : "rounded-bl-md bg-white/12 text-white"
        }`}
      >
        <p className="text-sm leading-5">{text}</p>
        <p
          className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${
            side === "right" ? "text-violet-900/45" : "text-white/45"
          }`}
        >
          8:43 PM
          {side === "right" ? <CheckCheck size={12} /> : null}
        </p>
      </div>
    </div>
  );
}
