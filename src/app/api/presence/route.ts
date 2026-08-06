import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type ActivePresenceUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  lastSeen: number;
  currentPage?: string;
};

// In-memory store for serverless presence (cleaned up periodically)
const presenceStore = new Map<string, ActivePresenceUser>();

function purgeStalePresence() {
  const cutoff = Date.now() - 30000; // 30 seconds
  for (const [key, user] of presenceStore.entries()) {
    if (user.lastSeen < cutoff) {
      presenceStore.delete(key);
    }
  }
}

export async function GET() {
  purgeStalePresence();
  const onlineUsers = Array.from(presenceStore.values()).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    currentPage: u.currentPage,
  }));

  return NextResponse.json({
    success: true,
    onlineUsers,
    count: onlineUsers.length,
  });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const currentUser = session?.user;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const key = (currentUser.id || currentUser.email || "unknown").toLowerCase();
    presenceStore.set(key, {
      id: currentUser.id || key,
      name: currentUser.name || "Team Member",
      email: currentUser.email || "",
      image: currentUser.image || null,
      lastSeen: Date.now(),
      currentPage: body.currentPage || "/",
    });

    purgeStalePresence();

    const onlineUsers = Array.from(presenceStore.values()).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      currentPage: u.currentPage,
    }));

    return NextResponse.json({
      success: true,
      onlineUsers,
      count: onlineUsers.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed presence update" }, { status: 500 });
  }
}
