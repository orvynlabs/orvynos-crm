import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Height-driven size: "sm" for nav/headers, "lg" for auth/hero pages */
  size?: "sm" | "lg";
  className?: string;
};

/**
 * Orvyn Labs brand lockup — rendered from the official logo asset at
 * public/brand/logo.png so it always matches the real brand mark exactly.
 * Replace that file to update the logo everywhere.
 */
export function Logo({ size = "lg", className }: LogoProps) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Orvyn Labs"
      width={1155}
      height={265}
      priority
      className={cn(
        size === "lg" ? "h-16" : "h-9",
        "w-auto select-none",
        className
      )}
    />
  );
}
