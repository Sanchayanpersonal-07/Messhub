import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, BellOff, CheckCheck, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await api.get<Notification[]>("/notifications/student");
      setNotifications(res.data || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unreadCount > 0 && (
              <span
                className="ml-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: "hsl(var(--destructive))",
                  color: "hsl(var(--destructive-foreground))",
                }}
              >
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Important updates from mess management
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-16 gap-3">
            <BellOff
              className="h-12 w-12"
              style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
            />
            <p
              className="text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              No notifications yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n._id}
              className="glass-card cursor-pointer transition-all"
              style={{
                borderLeft: n.isRead
                  ? undefined
                  : "3px solid hsl(var(--primary))",
                opacity: n.isRead ? 0.75 : 1,
              }}
              onClick={() => {
                if (!n.isRead) markAsRead(n._id);
              }}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: "hsl(var(--primary))" }}
                        />
                      )}
                      <p
                        className="font-semibold text-sm"
                        style={{
                          color: n.isRead
                            ? "hsl(var(--muted-foreground))"
                            : "hsl(var(--foreground))",
                        }}
                      >
                        {n.title}
                      </p>
                    </div>

                    <p
                      className="mt-1.5 text-sm leading-relaxed"
                      style={{
                        color: "hsl(var(--muted-foreground))",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {n.message}
                    </p>

                    <p
                      className="mt-2 text-xs"
                      style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
                    >
                      {dayjs(n.createdAt).fromNow()} &middot;{" "}
                      {dayjs(n.createdAt).format("DD MMM YYYY, h:mm A")}
                    </p>
                  </div>

                  {!n.isRead && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: "hsl(var(--primary) / 0.1)",
                        color: "hsl(var(--primary))",
                      }}
                    >
                      New
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
