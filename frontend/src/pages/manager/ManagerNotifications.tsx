import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Bell,
  Loader2,
  Mail,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import dayjs from "dayjs";

interface Notification {
  _id: string;
  title: string;
  message: string;
  send_email: boolean;
  sent_to_count: number;
  email_delivery: { success: number; failed: number };
  email_status: "pending" | "sent" | "partial" | "failed";
  createdAt: string;
  created_by: { name: string };
}

export default function ManagerNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<Notification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await api.get<Notification[]>("/notifications");
      setHistory(res.data || []);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in both title and message");
      return;
    }

    try {
      setSending(true);
      const res = await api.post("/notifications/send", {
        title,
        message,
        send_email: sendEmail,
      });
      toast.success(res.data.msg);
      setTitle("");
      setMessage("");
      setTimeout(fetchHistory, 1500);
    } catch (err) {
      const msg = (err as AxiosError<{ msg?: string }>)?.response?.data?.msg;
      toast.error(msg || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setHistory((prev) => prev.filter((n) => n._id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "sent")
      return (
        <CheckCircle2
          className="h-4 w-4"
          style={{ color: "hsl(var(--accent))" }}
        />
      );
    if (status === "partial")
      return (
        <AlertTriangle
          className="h-4 w-4"
          style={{ color: "hsl(var(--warning))" }}
        />
      );
    if (status === "failed")
      return (
        <XCircle
          className="h-4 w-4"
          style={{ color: "hsl(var(--destructive))" }}
        />
      );
    return (
      <Clock
        className="h-4 w-4"
        style={{ color: "hsl(var(--muted-foreground))" }}
      />
    );
  };

  const statusColors: Record<string, string> = {
    sent: "hsl(var(--accent))",
    partial: "hsl(var(--warning))",
    failed: "hsl(var(--destructive))",
    pending: "hsl(var(--muted-foreground))",
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          Send important updates to all students — shown in their dashboard and
          optionally via email
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display text-base">
              Compose Notification
            </CardTitle>
            <CardDescription>
              All students will see this in their dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Menu Change — Today's Dinner"
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p
                className="text-xs text-right"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {title.length}/100
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                placeholder="e.g. Due to unavailability of vegetables, Aloo Gobi has been replaced with Dal Fry in today's dinner."
                value={message}
                maxLength={1000}
                rows={5}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p
                className="text-xs text-right"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {message.length}/1000
              </p>
            </div>

            {/* Email toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail
                  className="h-4 w-4"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Label className="cursor-pointer">Also send via Email</Label>
              </div>
              <button
                type="button"
                onClick={() => setSendEmail((v) => !v)}
                className="relative h-6 w-11 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: sendEmail
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground) / 0.3)",
                }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                  style={{
                    left: sendEmail ? "22px" : "2px",
                  }}
                />
              </button>
            </div>

            {/* Preview */}
            {(title || message) && (
              <div
                className="rounded-lg p-4 text-sm space-y-1.5"
                style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Preview
                </p>
                {title && <p className="font-bold">{title}</p>}
                {message && (
                  <p
                    style={{
                      color: "hsl(var(--muted-foreground))",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {message}
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full"
              style={{
                background:
                  "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to All Students
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <div>
          <h2 className="mb-4 text-lg font-bold font-display">
            Notification History
          </h2>

          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
            </div>
          ) : history.length === 0 ? (
            <Card className="glass-card">
              <CardContent
                className="py-10 text-center"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                No notifications sent yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-130 overflow-y-auto pr-1">
              {history.map((n) => (
                <Card key={n._id} className="glass-card">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusIcon status={n.email_status} />
                          <p className="font-semibold text-sm truncate">
                            {n.title}
                          </p>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                            style={{
                              backgroundColor: `${statusColors[n.email_status]}18`,
                              color: statusColors[n.email_status],
                            }}
                          >
                            {n.email_status}
                          </span>
                        </div>

                        <p
                          className="mt-1 text-xs line-clamp-2"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {n.message}
                        </p>

                        <div
                          className="mt-2 flex flex-wrap items-center gap-3 text-xs"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          <span>{n.sent_to_count} students</span>

                          {n.send_email && n.email_delivery && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {n.email_delivery.success} sent
                              {n.email_delivery.failed > 0 && (
                                <span
                                  style={{ color: "hsl(var(--destructive))" }}
                                >
                                  , {n.email_delivery.failed} failed
                                </span>
                              )}
                            </span>
                          )}

                          <span>
                            {dayjs(n.createdAt).format("DD MMM, h:mm A")}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(n._id)}
                        className="shrink-0 p-1.5 rounded-lg transition-colors"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
