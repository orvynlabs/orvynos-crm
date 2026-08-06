import http from "http";
import { WebSocketServer, WebSocket } from "ws";

export type WsUser = {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
  currentPage?: string;
};

export type WsClient = WebSocket & {
  isAlive?: boolean;
  user?: WsUser;
};

export type WsEventPayload = {
  type: string;
  entity?: string;
  action?: string;
  data?: any;
  user?: Partial<WsUser>;
  timestamp?: number;
};

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3001;

// Global set of online clients
const clients = new Set<WsClient>();

function getOnlineUsers(): WsUser[] {
  const userMap = new Map<string, WsUser>();
  for (const client of clients) {
    if (client.user?.id || client.user?.email) {
      const key = client.user.id ? client.user.id : client.user.email!.toLowerCase();
      userMap.set(key, client.user);
    }
  }
  return Array.from(userMap.values());
}

function broadcast(data: WsEventPayload, ignoreClient?: WsClient) {
  const payload = JSON.stringify({
    ...data,
    timestamp: data.timestamp || Date.now(),
  });

  for (const client of clients) {
    if (client !== ignoreClient && client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error("Error sending WS payload:", err);
      }
    }
  }
}

function broadcastPresence() {
  const onlineUsers = getOnlineUsers();
  broadcast({
    type: "presence:update",
    data: { onlineUsers, count: onlineUsers.length },
  });
}

// HTTP Server for handling REST broadcast calls from Server Actions
const httpServer = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/broadcast") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const payload: WsEventPayload = JSON.parse(body);
        broadcast(payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, clientCount: clients.size }));
      } catch (err: any) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err?.message || "Invalid JSON" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws: WsClient) => {
  ws.isAlive = true;
  clients.add(ws);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      if (message.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }

      if (message.type === "presence:join" || message.type === "presence:navigate") {
        if (message.user && message.user.id) {
          ws.user = {
            id: message.user.id,
            name: message.user.name || "Team Member",
            email: message.user.email || "",
            image: message.user.image || null,
            currentPage: message.currentPage || message.user.currentPage || "/",
          };
          broadcastPresence();
        }
        return;
      }

      if (message.type === "presence:leave") {
        clients.delete(ws);
        broadcastPresence();
        return;
      }

      // Re-broadcast client custom events
      broadcast(message, ws);
    } catch (e) {
      console.error("Failed to parse WS message:", e);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    broadcastPresence();
  });

  ws.on("error", (err) => {
    console.error("WS client error:", err);
    clients.delete(ws);
  });

  // Send initial presence state to newly connected client
  ws.send(
    JSON.stringify({
      type: "presence:update",
      data: { onlineUsers: getOnlineUsers(), count: getOnlineUsers().length },
      timestamp: Date.now(),
    })
  );
});

// Heartbeat ping interval to keep connections alive
const pingInterval = setInterval(() => {
  for (const client of clients) {
    if (client.isAlive === false) {
      clients.delete(client);
      client.terminate();
      continue;
    }
    client.isAlive = false;
    try {
      client.ping();
    } catch {}
  }
}, 30000);

wss.on("close", () => {
  clearInterval(pingInterval);
});

httpServer.listen(PORT, () => {
  console.log(`⚡ WebSocket Server running on ws://localhost:${PORT}`);
});
