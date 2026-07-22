"use client";

import { useActionState } from "react";
import dynamic from "next/dynamic";
import { authenticate } from "./actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const Strands = dynamic(() => import("@/components/ui/strands"), {
  ssr: false,
});

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="relative min-h-screen w-screen h-screen overflow-hidden bg-stone-950 font-sans selection:bg-brand-orange selection:text-white flex items-center justify-center">
      {/* ─── FULL PAGE WebGL ANIMATED BACKGROUND ─── */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <Strands
          colors={["#EA3B0C", "#F59E0B", "#8B5CF6", "#06B6D4"]}
          count={5}
          speed={0.7}
          amplitude={1.3}
          waviness={1.2}
          thickness={1.1}
          glow={3.2}
          taper={2.5}
          spread={1.2}
          intensity={0.85}
          saturation={1.9}
          opacity={1.0}
          scale={1.3}
          glass={false}
        />
      </div>

      {/* Subtle ambient lighting overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/40 pointer-events-none" />

      {/* ─── MODERN GLASS LOGIN CARD ─── */}
      <div className="relative z-10 w-full max-w-[360px] mx-4">
        <div className="bg-stone-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/80 space-y-5">
          {/* Brand Header — Compact Logo */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="px-3.5 py-2 rounded-xl bg-stone-900/90 border border-stone-800/80 shadow-md flex items-center justify-center">
              <Logo size="sm" className="h-6 w-auto" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white mt-1">
                Orvynos CRM
              </h1>
              <p className="text-[11px] text-stone-400 font-medium">
                Agency OS &amp; Financial Control
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form action={formAction} className="space-y-3.5 pt-1">
            {errorMessage && (
              <div className="bg-rose-950/60 text-rose-300 p-2.5 rounded-xl text-[11px] border border-rose-800/50 font-bold text-center">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-[10px] font-black text-stone-400 uppercase tracking-widest block text-left"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@orvynlabs.com"
                required
                disabled={isPending}
                className="flex h-10 w-full rounded-xl border border-stone-800 bg-stone-900/80 px-3.5 text-base md:text-xs text-white placeholder:text-stone-600 transition-all focus-visible:outline-none focus-visible:border-brand-orange focus-visible:ring-1 focus-visible:ring-brand-orange disabled:opacity-50 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-[10px] font-black text-stone-400 uppercase tracking-widest block text-left"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isPending}
                className="flex h-10 w-full rounded-xl border border-stone-800 bg-stone-900/80 px-3.5 text-base md:text-xs text-white placeholder:text-stone-600 transition-all focus-visible:outline-none focus-visible:border-brand-orange focus-visible:ring-1 focus-visible:ring-brand-orange disabled:opacity-50 font-semibold"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orange-hover hover:to-amber-600 text-white rounded-xl font-extrabold text-xs tracking-wide transition-all shadow-lg shadow-brand-orange/20 cursor-pointer active:scale-[0.98] mt-2.5"
            >
              {isPending ? "Signing in..." : "Sign In →"}
            </Button>
          </form>

          {/* Footer Badge */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-stone-500 font-semibold select-none">
            <span>Orvyn Labs</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              HQ Portal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
