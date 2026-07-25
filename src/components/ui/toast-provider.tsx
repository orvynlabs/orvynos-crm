"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconAlertTriangle,
  IconX,
} from "@tabler/icons-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    (title: string, options?: { type?: ToastType; description?: string; duration?: number }): void;
    success: (title: string, description?: string, duration?: number) => void;
    error: (title: string, description?: string, duration?: number) => void;
    info: (title: string, description?: string, duration?: number) => void;
    warning: (title: string, description?: string, duration?: number) => void;
  };
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let globalAddToast: ((item: Omit<ToastItem, "id">) => void) | null = null;

export function toast(title: string, options?: { type?: ToastType; description?: string; duration?: number }) {
  if (globalAddToast) {
    globalAddToast({
      title,
      type: options?.type || "info",
      description: options?.description,
      duration: options?.duration,
    });
  }
}

toast.success = (title: string, description?: string, duration?: number) => {
  if (globalAddToast) globalAddToast({ title, type: "success", description, duration });
};

toast.error = (title: string, description?: string, duration?: number) => {
  if (globalAddToast) globalAddToast({ title, type: "error", description, duration });
};

toast.info = (title: string, description?: string, duration?: number) => {
  if (globalAddToast) globalAddToast({ title, type: "info", description, duration });
};

toast.warning = (title: string, description?: string, duration?: number) => {
  if (globalAddToast) globalAddToast({ title, type: "warning", description, duration });
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(({ title, type = "info", description, duration = 3800 }: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, title, type, description, duration }]); // Limit max 4 toasts at once
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  React.useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Floating Animated Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <SingleToast key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast,
      dismiss: () => {},
    };
  }
  return ctx;
}

// ─── Single Toast Component ───────────────────────────

function SingleToast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { type, title, description, duration = 3800 } = item;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const config = {
    success: {
      icon: IconCheck,
      iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30",
      accentBar: "bg-gradient-to-r from-emerald-500 to-teal-400",
    },
    error: {
      icon: IconAlertCircle,
      iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30",
      accentBar: "bg-gradient-to-r from-rose-500 to-red-400",
    },
    warning: {
      icon: IconAlertTriangle,
      iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30",
      accentBar: "bg-gradient-to-r from-amber-500 to-orange-400",
    },
    info: {
      icon: IconInfoCircle,
      iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30",
      accentBar: "bg-gradient-to-r from-violet-500 to-purple-400",
    },
  }[type];

  const IconComp = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.92, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.88, y: -12, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
      drag="x"
      dragConstraints={{ left: 0, right: 200 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 80) onDismiss();
      }}
      className="pointer-events-auto relative overflow-hidden rounded-2xl border border-border-custom bg-surface-white/95 dark:bg-stone-900/95 p-3.5 shadow-xl backdrop-blur-xl transition-shadow hover:shadow-2xl active:cursor-grabbing"
    >
      <div className="flex items-start gap-3">
        {/* Animated Icon Badge */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform ${config.iconBg}`}>
          <IconComp className="h-4 w-4 stroke-[2.5]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2 pt-0.5">
          <h4 className="text-xs font-bold text-foreground leading-snug tracking-tight">{title}</h4>
          {description && (
            <p className="text-[11px] text-text-secondary mt-0.5 leading-normal font-medium">{description}</p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="p-1 -mr-1 text-text-secondary hover:text-foreground rounded-lg transition-colors hover:bg-surface-page cursor-pointer"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Auto-dismiss progress countdown line */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-0.5 ${config.accentBar}`}
      />
    </motion.div>
  );
}
