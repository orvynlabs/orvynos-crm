"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IconTarget,
  IconTrophy,
  IconCheck,
  IconChevronRight,
  IconSparkles,
  IconPencil,
  IconDeviceFloppy,
  IconRotate,
} from "@tabler/icons-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function RevenueTargetWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Default values: 50K Goal, 29K Achieved
  const [targetGoal, setTargetGoal] = useState(50000);
  const [currentAchieved, setCurrentAchieved] = useState(29000);

  // Form edit states
  const [editTarget, setEditTarget] = useState(50000);
  const [editAchieved, setEditAchieved] = useState(29000);

  useEffect(() => {
    try {
      const savedTarget = localStorage.getItem("orvynos_revenue_target");
      const savedAchieved = localStorage.getItem("orvynos_revenue_achieved");
      if (savedTarget) {
        const parsedT = Number(savedTarget);
        if (!isNaN(parsedT) && parsedT > 0) {
          setTargetGoal(parsedT);
          setEditTarget(parsedT);
        }
      }
      if (savedAchieved) {
        const parsedA = Number(savedAchieved);
        if (!isNaN(parsedA) && parsedA >= 0) {
          setCurrentAchieved(parsedA);
          setEditAchieved(parsedA);
        }
      }
    } catch (e) {}
  }, []);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTarget <= 0) return;
    setTargetGoal(editTarget);
    setCurrentAchieved(Math.max(0, editAchieved));
    try {
      localStorage.setItem("orvynos_revenue_target", String(editTarget));
      localStorage.setItem("orvynos_revenue_achieved", String(Math.max(0, editAchieved)));
    } catch (err) {}
    setIsEditing(false);
  };

  const handlePresetSelect = (target: number) => {
    setEditTarget(target);
  };

  const remainingAmount = Math.max(0, targetGoal - currentAchieved);
  const percentage = Math.min(100, Math.round((currentAchieved / targetGoal) * 100));

  const fmt = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(val);

  const formatShortK = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`;
    }
    if (val >= 1000) {
      return `₹${Math.round(val / 1000)}K`;
    }
    return `₹${val}`;
  };

  return (
    <>
      {/* ─── MOBILE COMPACT TARGET ICON TRIGGER (< sm) ─── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="flex sm:hidden items-center justify-center h-8 w-8 rounded-full border border-brand-orange/30 bg-brand-orange-tint/60 text-brand-orange hover:bg-brand-orange hover:text-white transition-all cursor-pointer relative shrink-0 shadow-2xs"
        title="Revenue Target Goal Tracker"
      >
        <IconTarget className="h-4 w-4" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange" />
        </span>
      </motion.button>

      {/* ─── DESKTOP TOPBAR COMPACT TARGET PILL WIDGET (>= sm) ─── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex items-center gap-2.5 h-9 px-3 rounded-full border border-brand-orange/30 bg-surface-white dark:bg-surface-white/90 hover:border-brand-orange hover:shadow-[0_0_14px_rgba(234,59,12,0.18)] transition-all duration-200 cursor-pointer group outline-none select-none relative overflow-hidden shrink-0"
      >
        {/* Shimmer Effect on Hover */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-orange/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

        {/* Live Pulsing Target Icon */}
        <div className="relative flex items-center justify-center shrink-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-orange-600 text-white shadow-2xs group-hover:rotate-12 transition-transform duration-300">
            <IconTarget className="h-3.5 w-3.5" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange" />
          </span>
        </div>

        {/* Crisp Single-Line Goal Counter */}
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <span className="font-extrabold text-foreground tracking-tight">
            {formatShortK(currentAchieved)} <span className="text-text-secondary/75 font-medium text-[11px]">/ {formatShortK(targetGoal)} Goal</span>
          </span>
        </div>

        {/* Mini Animated Progress Bar */}
        <div className="w-12 md:w-14 h-1.5 rounded-full bg-border/60 dark:bg-stone-800 overflow-hidden shrink-0">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-brand-orange via-orange-500 to-amber-500"
          />
        </div>

        {/* Percentage Badge */}
        <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full bg-brand-orange-tint text-brand-orange border border-brand-orange/30 shrink-0">
          {percentage}%
        </span>

        {/* Interactive Click Indicator Arrow */}
        <IconChevronRight className="h-3.5 w-3.5 text-text-secondary/50 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
      </motion.button>

      {/* ─── INTERACTIVE TARGET DETAILS MODAL SHEET ─── */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-surface-white border-l border-border font-sans">
          {/* Header */}
          <div className="p-5 border-b border-border bg-gradient-to-br from-brand-orange/15 via-surface-white to-orange-500/10 flex items-start justify-between gap-3">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-orange text-white shadow-sm">
                  <IconTrophy className="h-5 w-5" />
                </div>
                <span>Revenue Target Goal</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-text-secondary mt-1">
                Milestone revenue target &amp; achievement tracker for Orvyn OS.
              </SheetDescription>
            </SheetHeader>

            <button
              type="button"
              onClick={() => {
                setEditTarget(targetGoal);
                setEditAchieved(currentAchieved);
                setIsEditing(!isEditing);
              }}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                isEditing
                  ? "bg-stone-200 dark:bg-stone-800 border-stone-300 text-stone-700 dark:text-stone-300"
                  : "bg-brand-orange-tint border-brand-orange/30 text-brand-orange hover:bg-brand-orange hover:text-white"
              }`}
            >
              <IconPencil className="h-3.5 w-3.5" />
              <span>{isEditing ? "Close" : "Update Goal"}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* EDIT GOAL FORM (When user clicks Update Goal) */}
            {isEditing && (
              <form onSubmit={handleSaveGoal} className="p-4 rounded-2xl border border-brand-orange/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-orange uppercase tracking-wider flex items-center gap-1.5">
                    <IconPencil className="h-3.5 w-3.5" />
                    Configure Target Goal
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditTarget(50000);
                      setEditAchieved(29000);
                    }}
                    className="text-[10px] text-text-secondary hover:text-text-primary underline flex items-center gap-1 cursor-pointer"
                  >
                    <IconRotate className="h-3 w-3" /> Reset Defaults
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Quick Target Presets</label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {[
                      { label: "₹50K Goal", target: 50000 },
                      { label: "₹1 Lakh Goal", target: 100000 },
                      { label: "₹2.5 Lakhs", target: 250000 },
                      { label: "₹5 Lakhs", target: 500000 },
                    ].map((preset) => (
                      <button
                        key={preset.target}
                        type="button"
                        onClick={() => handlePresetSelect(preset.target)}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                          editTarget === preset.target
                            ? "bg-brand-orange text-white border-brand-orange font-black"
                            : "bg-surface-white border-border text-text-secondary hover:border-brand-orange/40"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Amount */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-extrabold text-foreground">Target Goal Amount (INR)</label>
                  <input
                    type="number"
                    step="1000"
                    value={editTarget}
                    onChange={(e) => setEditTarget(Number(e.target.value))}
                    className="w-full h-9 rounded-xl border border-border bg-surface-white px-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                </div>

                {/* Achieved Amount */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-extrabold text-foreground">Achieved Amount (INR)</label>
                  <input
                    type="number"
                    step="1000"
                    value={editAchieved}
                    onChange={(e) => setEditAchieved(Number(e.target.value))}
                    className="w-full h-9 rounded-xl border border-border bg-surface-white px-3 text-xs font-bold focus:outline-none focus:ring-1 focus-visible:ring-brand-orange"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-9 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  <IconDeviceFloppy className="h-4 w-4" />
                  Save Target Changes
                </button>
              </form>
            )}

            {/* Main Progress Ring & Stat Banner */}
            <div className="p-5 rounded-2xl border border-brand-orange/30 bg-gradient-to-br from-brand-orange-tint/50 via-surface-page to-orange-500/10 relative overflow-hidden space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange">
                    Milestone Progress
                  </span>
                  <div className="text-2xl font-black text-foreground mt-0.5 tracking-tight">
                    {fmt(currentAchieved)} <span className="text-xs font-bold text-text-secondary">/ {fmt(targetGoal)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-brand-orange">
                    {percentage}%
                  </span>
                  <div className="text-[10px] font-bold text-text-secondary">
                    {fmt(remainingAmount)} remaining
                  </div>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-3.5 rounded-full bg-stone-200 dark:bg-stone-800 p-0.5 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-orange via-orange-500 to-amber-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary pt-1">
                <span className="flex items-center gap-1 text-brand-orange font-extrabold">
                  <IconCheck className="h-3.5 w-3.5" /> {fmt(currentAchieved)} Collected
                </span>
                <span>Goal: {fmt(targetGoal)} Target</span>
              </div>
            </div>

            {/* Target Achievement Highlights */}
            <div className="p-4 rounded-xl border border-border bg-surface-page space-y-2 text-xs">
              <div className="font-extrabold text-foreground flex items-center gap-1.5">
                <IconSparkles className="h-4 w-4 text-brand-orange" />
                <span>Goal Target Insights</span>
              </div>
              <ul className="space-y-1.5 text-text-secondary text-[11.5px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-orange mt-1.5 shrink-0" />
                  <span><strong>{percentage}% Completed</strong> — {fmt(currentAchieved)} INR successfully generated &amp; tracked in Orvyn OS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span><strong>{fmt(remainingAmount)} Remaining</strong> — Amount needed to hit the official target milestone!</span>
                </li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
