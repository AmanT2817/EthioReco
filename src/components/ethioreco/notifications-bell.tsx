// EthioReco — Notifications Bell
// Shows unread count + dropdown list. Click a notification to open the matched item.

"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  itemId: string | null;
  matchScore: number | null;
  read: boolean;
  createdAt: string;
  item?: {
    id: string;
    title: string;
    type: string;
    ethiopianMetadata?: { traditionalGenre?: string | null } | null;
  } | null;
}

export function NotificationsBell() {
  const user = useAppStore((s) => s.user);
  const openItem = useAppStore((s) => s.openItem);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  // Poll every 30s for new notifications (cheap query, low priority)
  useEffect(() => {
    if (!user) return;
    const load = () => {
      api.getNotifications().then((r) => {
        const data = r.data as NotificationItem[];
        setNotifications(data);
        setUnread((r.meta as any)?.unreadCount ?? 0);
      }).catch(() => {});
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [user]);

  const handleClick = async () => {
    setOpen(!open);
    if (!open && unread > 0) {
      // Mark all as read after a brief delay (let user see them first)
      setTimeout(() => {
        api.markNotificationsRead().then(() => setUnread(0)).catch(() => {});
      }, 1500);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative p-2 text-ash hover:text-bone transition-colors"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-ember text-bone text-[9px] flex items-center justify-center font-mono">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-outside overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-graphite border border-border/60 rounded-lg shadow-2xl shadow-obsidian z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-widest text-ash">Notifications</h3>
              {unread > 0 && (
                <span className="text-[10px] text-ember match-score">{unread} new</span>
              )}
            </div>
            <div className="divide-y divide-border/30">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-ash">
                  No notifications yet.
                  <br />
                  Wishlist an item and toggle &quot;notify on match&quot; to receive signals.
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (n.itemId) {
                        setOpen(false);
                        openItem(n.itemId);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-3 hover:bg-secondary/40 transition-colors block",
                      !n.read && "bg-ember/5 border-l-2 border-ember",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-violet-halo">
                        {n.type === "cross_domain_match" ? "Cross-domain match" :
                         n.type === "rating_threshold" ? "Rating milestone" :
                         n.type === "cultural_pick" ? "Cultural pick" :
                         n.type === "rec_refreshed" ? "Recalibrated" : "System"}
                      </span>
                      <span className="text-[10px] text-ash">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-bone leading-tight mb-1">{n.title}</p>
                    <p className="text-xs text-ash leading-relaxed">{n.body}</p>
                    {n.matchScore !== null && (
                      <p className="match-score text-[10px] text-brass mt-1">
                        Match score: {(n.matchScore * 100).toFixed(0)}%
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString();
}
