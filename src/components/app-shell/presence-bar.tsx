"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/components/providers/websocket-provider";
import { getUserAvatarUrl, getUserInitials } from "@/lib/user-avatar";
import {
  IconWifi,
  IconWifiOff,
  IconActivity,
  IconCompass,
  IconChevronDown,
  IconSparkles,
  IconUserCheck,
  IconX,
} from "@tabler/icons-react";

export function PresenceBar() {
  const { isConnected, onlineUsers } = useWebSocket();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative font-sans">
      {/* 🔘 TOPBAR TRIGGER PILL BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Active online team members"
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-surface-page hover:bg-brand-orange-tint/40 border border-border/80 hover:border-brand-orange/50 text-xs shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer outline-none select-none shrink-0 group"
      >
        {/* WS Status Indicator Pulse Dot */}
        <div
          className="flex items-center gap-1 sm:gap-1.5"
          title={isConnected ? "Real-time WebSocket connected" : "Connecting WebSocket..."}
        >
          <span className="relative flex h-2 w-2">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              }`}
            />
          </span>
          {isConnected ? (
            <IconWifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" stroke={2.5} />
          ) : (
            <IconWifiOff className="h-3.5 w-3.5 text-amber-500 shrink-0" stroke={2.5} />
          )}
        </div>

        <div className="h-3 w-px bg-border/80" />

        {/* Online User Avatar Stack */}
        <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden">
          {onlineUsers.length > 0 ? (
            onlineUsers.slice(0, 4).map((u) => {
              const avatarUrl = getUserAvatarUrl(u);
              const initials = getUserInitials(u.name);
              return (
                <div
                  key={u.id}
                  className="relative inline-block h-5.5 w-5.5 rounded-full ring-2 ring-surface-white overflow-hidden bg-brand-orange-tint flex items-center justify-center shrink-0 shadow-2xs"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={u.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[8px] font-extrabold text-brand-orange">{initials}</span>
                  )}
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
              );
            })
          ) : (
            <span className="text-[11px] font-medium text-text-secondary">Connecting...</span>
          )}
        </div>

        <span className="text-[10.5px] font-extrabold text-text-secondary group-hover:text-brand-orange transition-colors shrink-0 flex items-center gap-1">
          <span>{onlineUsers.length}</span>
          <span className="hidden sm:inline">online</span>
          <IconChevronDown
            className={`h-3 w-3 text-text-secondary transition-transform duration-200 ${
              isOpen ? "rotate-180 text-brand-orange" : ""
            }`}
            stroke={2.5}
          />
        </span>
      </button>

      {/* 🚀 ANIMATED POP-OVER PRESENCE CARD (POPOVER) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 sm:right-0 top-full mt-2 z-50 w-[calc(100vw-2rem)] max-w-xs sm:w-80 rounded-2xl border border-border/90 bg-surface-white/95 dark:bg-surface-white/90 backdrop-blur-xl p-3 shadow-2xl overflow-hidden font-sans"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between gap-2 px-1 pb-2 border-b border-border/70 select-none">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-brand-orange-tint border border-brand-orange/20 flex items-center justify-center text-brand-orange shrink-0">
                    <IconActivity className="h-4 w-4 animate-pulse" stroke={2.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-text-primary tracking-tight">
                      Active Team ({onlineUsers.length})
                    </h4>
                    <p className="text-[10px] font-semibold text-text-secondary">
                      Real-time presence across CRM
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Live</span>
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-page transition-colors cursor-pointer"
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Online Users List */}
              <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                {onlineUsers.length > 0 ? (
                  onlineUsers.map((u, index) => {
                    const avatarUrl = getUserAvatarUrl(u);
                    const initials = getUserInitials(u.name);
                    const currentPage = u.currentPage || "/";

                    return (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.15 }}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-surface-page/70 hover:bg-brand-orange-tint/40 border border-border/50 hover:border-brand-orange/30 transition-all group/user select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0 select-none">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={u.name}
                                className="h-8.5 w-8.5 rounded-full object-cover border border-border/80 shadow-3xs group-hover/user:border-brand-orange/40 transition-colors"
                              />
                            ) : (
                              <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-tr from-brand-orange to-amber-500 text-white flex items-center justify-center text-xs font-black shadow-3xs">
                                {initials}
                              </div>
                            )}
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-900 animate-pulse" />
                          </div>

                          <div className="min-w-0 leading-tight">
                            <div className="text-xs font-extrabold text-text-primary truncate group-hover/user:text-brand-orange transition-colors">
                              {u.name}
                            </div>
                            {u.email && (
                              <div className="text-[10px] font-medium text-text-secondary truncate">
                                {u.email}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>Online</span>
                          </span>

                          {currentPage && (
                            <span className="text-[9px] font-bold text-text-secondary flex items-center gap-0.5 max-w-[95px] truncate">
                              <IconCompass className="h-3 w-3 shrink-0 text-brand-orange" stroke={2} />
                              <span className="truncate">{currentPage}</span>
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-text-secondary font-semibold">
                    No active team members online
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[9.5px] font-extrabold text-text-secondary select-none">
                <span className="flex items-center gap-1">
                  <IconSparkles className="h-3 w-3 text-brand-orange" />
                  <span>Real-Time Concurrency Sync</span>
                </span>
                <span className="text-brand-orange bg-brand-orange-tint/80 border border-brand-orange/20 px-1.5 py-0.5 rounded">
                  Orvyn Labs
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
