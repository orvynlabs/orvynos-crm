export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      await import("@/lib/ws/ws-server");
    } catch (err) {
      console.warn("Failed to auto-start WebSocket server via instrumentation:", err);
    }
  }
}
