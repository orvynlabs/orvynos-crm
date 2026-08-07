"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast-provider";

export type WsUser = {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
  currentPage?: string;
};

export type WsEventPayload = {
  type: string;
  entity?: string;
  action?: string;
  data?: any;
  user?: Partial<WsUser>;
  timestamp?: number;
};

type WebSocketContextType = {
  isConnected: boolean;
  onlineUsers: WsUser[];
  onlineCount: number;
  lastEvent: WsEventPayload | null;
  sendEvent: (payload: any) => void;
};

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  onlineUsers: [],
  onlineCount: 0,
  lastEvent: null,
  sendEvent: () => {},
});

export function useWebSocket() {
  return useContext(WebSocketContext);
}

/**
 * Fast $O(N)$ helper to verify if a team member is online.
 */
export function isMemberOnline(
  member: { id?: string; userId?: string; email?: string; user?: { id?: string; email?: string } } | null | undefined,
  onlineUsers: WsUser[]
): boolean {
  if (!member || !onlineUsers || onlineUsers.length === 0) return false;

  const mId = member.userId || member.id || member.user?.id;
  const mEmail = (member.email || member.user?.email || "").toLowerCase();

  for (let i = 0; i < onlineUsers.length; i++) {
    const u = onlineUsers[i];
    if (mId && u.id && (u.id === mId || u.id === member.id || u.id === member.userId)) return true;
    if (mEmail && u.email && u.email.toLowerCase() === mEmail) return true;
  }

  return false;
}

type WebSocketProviderProps = {
  children: React.ReactNode;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

export function WebSocketProvider({ children, user }: WebSocketProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(true);

  // Pre-seed onlineUsers with current logged-in user to guarantee instant Online status
  const [onlineUsers, setOnlineUsers] = useState<WsUser[]>(() => {
    if (user && (user.id || user.email)) {
      return [
        {
          id: user.id || user.email!,
          name: user.name || "Team Member",
          email: user.email || "",
          image: user.image || null,
          currentPage: "/",
        },
      ];
    }
    return [];
  });

  const [lastEvent, setLastEvent] = useState<WsEventPayload | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const presencePollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const mergeOnlineUsers = useCallback(
    (fetchedUsers: WsUser[]) => {
      const userMap = new Map<string, WsUser>();

      if (user && (user.id || user.email)) {
        const myKey = (user.id || user.email!).toLowerCase();
        userMap.set(myKey, {
          id: user.id || user.email!,
          name: user.name || "Team Member",
          email: user.email || "",
          image: user.image || null,
          currentPage: pathname,
        });
      }

      for (let i = 0; i < fetchedUsers.length; i++) {
        const u = fetchedUsers[i];
        if (u.id || u.email) {
          const key = (u.id || u.email!).toLowerCase();
          userMap.set(key, u);
        }
      }

      const merged = Array.from(userMap.values());
      setOnlineUsers(merged);
    },
    [pathname, user]
  );

  const sendPresenceHeartbeat = useCallback(async () => {
    try {
      const res = await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPage: pathname }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.onlineUsers)) {
          mergeOnlineUsers(data.onlineUsers);
          setIsConnected(true);
        }
      }
    } catch {}
  }, [mergeOnlineUsers, pathname]);

  const getWsUrl = useCallback(() => {
    if (typeof window === "undefined") return "ws://localhost:3001";
    const host = window.location.hostname || "localhost";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${host}:3001`;
  }, []);

  const sendEvent = useCallback((payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const connectWs = useCallback(() => {
    if (typeof window === "undefined") return;
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }

        if (user && (user.id || user.email)) {
          ws.send(
            JSON.stringify({
              type: "presence:join",
              user: {
                id: user.id || user.email,
                name: user.name || "Team Member",
                email: user.email || "",
                image: user.image || null,
                currentPage: pathname,
              },
            })
          );
        }

        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const payload: WsEventPayload = JSON.parse(event.data);
          if (payload.type === "pong") return;

          setLastEvent(payload);

          window.dispatchEvent(new CustomEvent("crm:ws-event", { detail: payload }));

          if (payload.type === "presence:update" && payload.data) {
            mergeOnlineUsers(payload.data.onlineUsers || []);
            return;
          }

          if (payload.entity) {
            const myKey = (user?.id || user?.email || "").toLowerCase();
            const actorKey = (payload.user?.id || payload.user?.email || "").toLowerCase();
            const isOtherUser = actorKey && myKey ? actorKey !== myKey : true;
            const actorName = payload.user?.name ? payload.user.name.split(" ")[0] : "A team member";

            if (isOtherUser) {
              const entityName = payload.entity.charAt(0).toUpperCase() + payload.entity.slice(1);
              toast.info(`${actorName} ${payload.action ? payload.action.replace("_", " ") : "updated"} a ${entityName}`);
              router.refresh();
            }
          }
        } catch (e) {
          console.error("Error handling WS message:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        if (socketRef.current === ws) {
          socketRef.current = null;
        }
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connectWs();
          }, 3000);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {}
  }, [getWsUrl, mergeOnlineUsers, pathname, router, user]);

  // Sync real-time page navigation presence over WS when route changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && user && (user.id || user.email)) {
      try {
        socketRef.current.send(
          JSON.stringify({
            type: "presence:navigate",
            user: {
              id: user.id || user.email,
              name: user.name || "Team Member",
              email: user.email || "",
              image: user.image || null,
              currentPage: pathname,
            },
            currentPage: pathname,
          })
        );
      } catch {}
    }
  }, [pathname, user]);

  useEffect(() => {
    sendPresenceHeartbeat();
    connectWs();

    if (presencePollTimerRef.current) clearInterval(presencePollTimerRef.current);
    presencePollTimerRef.current = setInterval(sendPresenceHeartbeat, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendPresenceHeartbeat();
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          connectWs();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (presencePollTimerRef.current) clearInterval(presencePollTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {}
      }
    };
  }, [connectWs, sendPresenceHeartbeat]);

  const contextValue = useMemo(
    () => ({
      isConnected,
      onlineUsers,
      onlineCount: onlineUsers.length,
      lastEvent,
      sendEvent,
    }),
    [isConnected, onlineUsers, lastEvent, sendEvent]
  );

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
