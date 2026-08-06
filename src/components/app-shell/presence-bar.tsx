"use client";

import React from "react";
import { useWebSocket } from "@/components/providers/websocket-provider";
import { getUserAvatarUrl, getUserInitials } from "@/lib/user-avatar";
import { IconWifi, IconWifiOff } from "@tabler/icons-react";

export function PresenceBar() {
  const { isConnected, onlineUsers } = useWebSocket();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-surface-page border border-border/80 text-xs shadow-2xs select-none shrink-0">
      {/* WS Status Indicator Dot */}
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
          <IconWifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" stroke={2.5} />
        ) : (
          <IconWifiOff className="h-3.5 w-3.5 text-amber-500 shrink-0" stroke={2.5} />
        )}
      </div>

      <div className="h-3 w-px bg-border/80" />

      {/* Online Users Avatars — Shown on >= sm, or count on mobile */}
      <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden">
        {onlineUsers.length > 0 ? (
          onlineUsers.slice(0, 4).map((u) => {
            const avatarUrl = getUserAvatarUrl(u);
            const initials = getUserInitials(u.name);
            return (
              <div
                key={u.id}
                title={`${u.name}${u.currentPage ? ` (on ${u.currentPage})` : ""} — Online`}
                className="relative inline-block h-5 w-5 rounded-full ring-2 ring-surface-white overflow-hidden bg-brand-orange-tint flex items-center justify-center shrink-0"
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

      <span className="text-[10px] font-bold text-text-secondary shrink-0">
        {onlineUsers.length} <span className="hidden sm:inline">online</span>
      </span>
    </div>
  );
}
