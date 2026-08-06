"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
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
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<WsUser[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [lastEvent, setLastEvent] = useState<WsEventPayload | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

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

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Send presence join message if user exists
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

        // Start ping interval
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

          // Dispatch custom browser event for specific client subscribers
          window.dispatchEvent(new CustomEvent("crm:ws-event", { detail: payload }));

          if (payload.type === "presence:update" && payload.data) {
            setOnlineUsers(payload.data.onlineUsers || []);
            setOnlineCount(payload.data.count || 0);
            return;
          }

          // Entity mutations from other users
          if (payload.entity) {
            const isOtherUser = payload.user && payload.user.id !== user?.id;
            const actorName = payload.user?.name ? payload.user.name.split(" ")[0] : "A team member";

            if (isOtherUser) {
              const entityName = payload.entity.charAt(0).toUpperCase() + payload.entity.slice(1);
              toast.info(
                `${actorName} ${payload.action || "updated"} a ${entityName}`
              );
            }

            // Perform smooth server component refresh
            router.refresh();
          }
        } catch (e) {
          console.error("Error handling WS message:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);

        // Reconnect with exponential backoff (max 10s)
        const timeout = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;

        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(connect, timeout);
      };

      ws.onerror = () => {
        // Socket closed handler will trigger reconnection
      };
    } catch (err) {
      console.warn("WebSocket connection error:", err);
    }
  }, [getWsUrl, pathname, router, user]);

  useEffect(() => {
    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {}
      }
    };
  }, [connect]);

  // Update server on route change
  useEffect(() => {
    if (isConnected && user?.id) {
      sendEvent({
        type: "presence:navigate",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          currentPage: pathname,
        },
      });
    }
  }, [pathname, isConnected, sendEvent, user]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        onlineUsers,
        onlineCount,
        lastEvent,
        sendEvent,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
