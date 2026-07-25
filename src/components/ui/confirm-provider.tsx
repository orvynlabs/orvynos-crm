"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconAlertTriangle, IconTrash, IconInfoCircle } from "@tabler/icons-react";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

let globalConfirm: ((options: ConfirmOptions) => Promise<boolean>) | null = null;

export function confirmModal(options: ConfirmOptions): Promise<boolean> {
  if (globalConfirm) {
    return globalConfirm(options);
  }
  if (typeof window !== "undefined") {
    return Promise.resolve(window.confirm(options.description ? `${options.title}\n\n${options.description}` : options.title));
  }
  return Promise.resolve(false);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setModalState({ open: true, options, resolve });
    });
  }, []);

  React.useEffect(() => {
    globalConfirm = confirm;
    return () => {
      globalConfirm = null;
    };
  }, [confirm]);

  const handleClose = (result: boolean) => {
    if (modalState) {
      modalState.resolve(result);
      setModalState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AnimatePresence>
        {modalState?.open && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Glass Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleClose(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            />

            {/* Modal Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.92, y: 8, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="relative w-full max-w-xs sm:max-w-sm overflow-hidden rounded-2xl border border-border-custom bg-surface-white dark:bg-stone-900 p-5 shadow-2xl z-10"
            >
              <div className="flex flex-col items-center text-center">
                {/* Icon Badge */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-3 shadow-2xs ${
                    modalState.options.variant === "warning"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
                      : modalState.options.variant === "info"
                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30"
                  }`}
                >
                  {modalState.options.variant === "warning" ? (
                    <IconAlertTriangle className="h-6 w-6 stroke-[2.2]" />
                  ) : modalState.options.variant === "info" ? (
                    <IconInfoCircle className="h-6 w-6 stroke-[2.2]" />
                  ) : (
                    <IconTrash className="h-6 w-6 stroke-[2.2]" />
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
                  {modalState.options.title}
                </h3>
                {modalState.options.description && (
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed font-medium">
                    {modalState.options.description}
                  </p>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2.5 w-full mt-5">
                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="w-full py-2 px-3 rounded-xl border border-border-custom bg-surface-page hover:bg-surface-white text-xs font-bold text-foreground transition-all active:scale-95 cursor-pointer touch-manipulation"
                  >
                    {modalState.options.cancelText || "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClose(true)}
                    className={`w-full py-2 px-3 rounded-xl text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation ${
                      modalState.options.variant === "warning"
                        ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                        : modalState.options.variant === "info"
                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                        : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-rose-600/20"
                    }`}
                  >
                    {modalState.options.confirmText || (modalState.options.variant === "danger" ? "Delete" : "Confirm")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return confirmModal;
  }
  return ctx.confirm;
}
