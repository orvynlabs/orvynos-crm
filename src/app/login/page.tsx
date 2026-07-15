"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import { Button } from "../../components/ui/button";
import { Logo } from "../../components/logo";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-surface-page text-text-primary font-sans">
      <div className="flex flex-col items-center mb-8 text-center">
        {/* Orvyn Labs Official Logo */}
        <Logo size="lg" className="mb-2" />
        <p className="text-sm font-medium text-text-secondary">
          Internal agency management platform
        </p>
      </div>

      <div className="w-full max-w-[400px] bg-surface-white border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-6">Sign In</h2>

        <form action={formAction} className="space-y-4">
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-200 dark:border-red-900/50 font-medium">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label 
              htmlFor="email" 
              className="text-xs font-bold text-text-primary uppercase tracking-wider"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@orvynlabs.com"
              required
              disabled={isPending}
              className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange disabled:cursor-not-allowed disabled:opacity-50 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label 
              htmlFor="password" 
              className="text-xs font-bold text-text-primary uppercase tracking-wider"
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
              className="flex h-9 w-full rounded-lg border border-border bg-surface-page px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange disabled:cursor-not-allowed disabled:opacity-50 font-medium"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-9 bg-brand-orange text-white hover:bg-brand-orange-hover rounded-lg font-bold transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-brand-orange/50 mt-2 cursor-pointer"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>

    </div>
  );
}
