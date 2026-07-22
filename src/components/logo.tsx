import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Height-driven size: "sm" for nav/headers, "lg" for auth/hero pages */
  size?: "sm" | "lg";
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Orvyn Labs brand lockup — rendered from the official logo asset at
 * public/brand/logo.png so it always matches the real brand mark exactly.
 */
export function Logo({ size = "lg", className, style }: LogoProps) {
  const targetHeight = size === "lg" ? "56px" : "28px";

  return (
    <Image
      src="/brand/logo.png"
      alt="Orvyn Labs"
      width={1155}
      height={265}
      priority
      style={{ height: targetHeight, width: "auto", maxWidth: "100%", ...style }}
      className={cn(
        size === "lg" ? "h-14" : "h-7",
        "w-auto select-none object-contain",
        className
      )}
    />
  );
}
