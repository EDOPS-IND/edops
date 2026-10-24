import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Response } from "express";
import { DrizzleService } from "../../database/drizzle.service";
import pg from "pg";

type CommunicationEvent = {
  organizationId: string;
  userIds: string[];
  type: "message.created" | "conversation.read" | "conversation.updated";
  conversationId: string;
  messageId?: string;
};

type Client = { userId: string; response: Response; heartbeat: NodeJS.Timeout };

@Injectable()
export class CommunicationRealtimeService implements OnModuleInit, OnModuleDestroy {
  private listener?: pg.PoolClient;
  private listenerRetry?: NodeJS.Timeout;
  private clients = new Map<string, Set<Client>>();

  constructor(private readonly drizzle: DrizzleService) {}

  async onModuleInit() {
    await this.startListener();
  }

  async onModuleDestroy() {
    for (const clients of this.clients.values()) {
      for (const client of clients) clearInterval(client.heartbeat);
    }
    this.clients.clear();
    if (this.listenerRetry) clearTimeout(this.listenerRetry);
    if (this.listener) {
      await this.listener.query("UNLISTEN edops_communication").catch(() => undefined);
      this.listener.release();
    }
  }

  private async startListener() {
    try {
      const listener = await this.drizzle.pool.connect();
      await listener.query("LISTEN edops_communication");
      this.listener = listener;
      listener.on("notification", (notification) => {
        if (!notification.payload) return;
        try { this.broadcast(JSON.parse(notification.payload) as CommunicationEvent); } catch { /* malformed events are ignored */ }
      });
      listener.on("error", () => {
        if (this.listener === listener) this.listener = undefined;
        listener.release();
        this.scheduleListenerReconnect();
      });
    } catch {
      this.scheduleListenerReconnect();
    }
  }

  private scheduleListenerReconnect() {
    if (!this.listenerRetry) {
      this.listenerRetry = setTimeout(() => {
        this.listenerRetry = undefined;
        void this.startListener();
      }, 5000);
    }
  }

  async publish(event: CommunicationEvent) {
    await this.drizzle.query("SELECT pg_notify($1, $2)", ["edops_communication", JSON.stringify(event)]);
  }

  connect(organizationId: string, userId: string, response: Response) {
    const key = `${organizationId}:${userId}`;
    const client: Client = {
      userId,
      response,
      heartbeat: setInterval(() => response.write(": heartbeat\n\n"), 25_000),
    };
    const clients = this.clients.get(key) || new Set<Client>();
    clients.add(client);
    this.clients.set(key, clients);
    response.status(200);
    response.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    response.flushHeaders?.();
    response.write("retry: 5000\n\n");
    const cleanup = () => {
      clearInterval(client.heartbeat);
      clients.delete(client);
      if (!clients.size) this.clients.delete(key);
    };
    response.once("close", cleanup);
    return cleanup;
  }

  private broadcast(event: CommunicationEvent) {
    for (const userId of event.userIds) {
      const clients = this.clients.get(`${event.organizationId}:${userId}`);
      if (!clients) continue;
      const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
      for (const client of clients) {
        try { if (!client.response.write(payload)) client.response.end(); } catch { client.response.end(); }
      }
    }
  }
}
