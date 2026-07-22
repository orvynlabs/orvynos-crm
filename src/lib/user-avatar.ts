export function getUserAvatarUrl(user?: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
} | null): string | null {
  if (!user) return null;
  if (user.image && user.image.trim().length > 0) {
    return user.image;
  }

  const identifier = (user.email || user.name || "").toLowerCase();
  if (identifier.includes("asif")) return "/avatars/asif.jpg";
  if (identifier.includes("niyaf")) return "/avatars/niyaf.png";
  if (identifier.includes("mubashir")) return "/avatars/mubashir.png";
  if (identifier.includes("adhil")) return "/avatars/adhil.png";

  return null;
}

export function getUserInitials(name?: string | null): string {
  if (!name) return "O";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
