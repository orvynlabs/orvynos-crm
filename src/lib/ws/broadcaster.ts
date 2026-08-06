import { auth } from "@/auth";

export type WsBroadcastEvent = {
  type: string;
  entity?: "lead" | "client" | "project" | "expense" | "payment" | "generator" | "standup" | "system";
  action?: "create" | "update" | "delete" | "stage_change" | "convert" | "status_change";
  data?: any;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

const WS_PORT = process.env.WS_PORT || 3001;
const BROADCAST_URL = process.env.WS_BROADCAST_URL || `http://localhost:${WS_PORT}/broadcast`;

/**
 * Broadcast an event to all active WebSocket clients.
 * Safely fails if the WebSocket server is unreachable.
 */
export async function broadcastWsEvent(event: WsBroadcastEvent) {
  try {
    let currentUser = event.user;
    if (!currentUser) {
      try {
        const session = await auth();
        if (session?.user) {
          currentUser = {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          };
        }
      } catch {}
    }

    const payload = {
      ...event,
      user: currentUser,
      timestamp: Date.now(),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(BROADCAST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (response && !response.ok) {
      console.warn("WebSocket broadcast returned non-200 status:", response.status);
    }
  } catch (err) {
    // Non-blocking catch to ensure server action never fails if WS is down
    console.warn("Failed to broadcast WS event:", err);
  }
}
