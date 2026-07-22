"use client";

import { useState } from "react";
import { IconLogout, IconShieldCheck, IconCommand, IconSparkles } from "@tabler/icons-react";
import { signOutAction } from "@/lib/actions/auth";
import { getUserAvatarUrl, getUserInitials } from "@/lib/user-avatar";

type SidebarFooterProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
};

export function SidebarFooter({ user }: SidebarFooterProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const avatarUrl = getUserAvatarUrl(user);
  const initials = getUserInitials(user.name);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutAction();
    } catch {
      window.location.href = "/login";
    }
  };

  const triggerCommandPalette = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  return (
    <div className="p-3 border-t border-border/80 space-y-2 bg-surface-white font-sans">
      {/* User Session Row */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface-white hover:bg-surface-page border border-border/50 transition-colors group">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="h-8 w-8 rounded-full border border-border/80 overflow-hidden bg-brand-orange-tint flex items-center justify-center shrink-0 shadow-2xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name ?? ""} className="h-full w-full object-cover" />
              ) : (
                <span className="text-brand-orange text-[11px] font-extrabold">
                  {initials}
                </span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-stone-900" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-bold text-text-primary truncate capitalize">
              {user.name || "Co-Founder"}
            </h4>
            <p className="text-[9.5px] font-semibold text-text-secondary truncate flex items-center gap-1">
              <IconShieldCheck className="h-3 w-3 text-brand-orange" />
              Owner Account
            </p>
          </div>
        </div>

        {/* Quick Signout Button */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          title="Sign out of Orvynos CRM"
          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <IconLogout className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

