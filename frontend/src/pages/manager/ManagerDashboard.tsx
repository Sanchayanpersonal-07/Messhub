import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  UtensilsCrossed,
  Bell,
} from "lucide-react";
import dayjs from "dayjs";

type Feedback = {
  _id: string;
  student_name?: string;
  category?: string;
  comment?: string;
  priority?: "high" | "medium" | "low";
  status?: "reported" | "in_progress" | "resolved";
  meal_type?: string;
  date?: string;
};

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    emoji: "🔴",
    bg: "hsl(var(--destructive)/0.08)",
    text: "hsl(var(--destructive))",
    border: "hsl(var(--destructive)/0.3)",
    cardBorder: "hsl(var(--destructive))",
  },
  medium: {
    label: "Medium",
    emoji: "🟡",
    bg: "rgba(245,158,11,0.08)",
    text: "hsl(38 92% 40%)",
    border: "rgba(245,158,11,0.3)",
    cardBorder: "#f59e0b",
  },
  low: {
    label: "Low",
    emoji: "🟢",
    bg: "hsl(var(--accent)/0.08)",
    text: "hsl(var(--accent))",
    border: "hsl(var(--accent)/0.3)",
    cardBorder: "hsl(var(--accent))",
  },
};

const STATUS_CONFIG = {
  reported: {
    label: "Reported",
    icon: <Clock className="h-3 w-3" />,
    bg: "hsl(var(--muted))",
    text: "hsl(var(--muted-foreground))",
    dot: "#94a3b8",
    border: "hsl(var(--muted-foreground)/0.3)",
  },
  in_progress: {
    label: "In Progress",
    icon: <AlertTriangle className="h-3 w-3" />,
    bg: "rgba(245,158,11,0.1)",
    text: "hsl(38 92% 40%)",
    dot: "#f59e0b",
    border: "rgba(245,158,11,0.35)",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle2 className="h-3 w-3" />,
    bg: "hsl(var(--accent)/0.1)",
    text: "hsl(var(--accent))",
    dot: "hsl(var(--accent))",
    border: "hsl(var(--accent)/0.4)",
  },
};

const STAT_CONFIG = [
  {
    key: "total",
    title: "Total Complaints",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "hsl(var(--primary))",
    border: "hsl(var(--primary))",
    href: "/manager/feedback",
  },
  {
    key: "high",
    title: "High Priority",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "hsl(var(--destructive))",
    border: "hsl(var(--destructive))",
    href: "/manager/feedback",
  },
  {
    key: "inProgress",
    title: "In Progress",
    icon: <Clock className="h-5 w-5" />,
    color: "#f59e0b",
    border: "#f59e0b",
    href: "/manager/feedback",
  },
  {
    key: "resolved",
    title: "Resolved",
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "hsl(var(--accent))",
    border: "hsl(var(--accent))",
    href: "/manager/feedback",
  },
];

const QUICK_ACTIONS = [
  {
    label: "Add Meal",
    icon: <UtensilsCrossed className="h-4 w-4" />,
    href: "/manager/meals",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary)/0.1)",
  },
  {
    label: "Send Notification",
    icon: <Bell className="h-4 w-4" />,
    href: "/manager/notifications",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  {
    label: "View Feedback",
    icon: <MessageSquare className="h-4 w-4" />,
    href: "/manager/feedback",
    color: "hsl(var(--accent))",
    bg: "hsl(var(--accent)/0.1)",
  },
];

const CATEGORY_EMOJI: Record<string, string> = {
  taste: "😋",
  hygiene: "🧹",
  quantity: "🍽️",
  others: "💬",
};

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/manager")
      .then((res) => {
        setStats(res.data.stats);
        setRecentFeedback(res.data.recent || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "Manager";

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Manager Dashboard</h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            {dayjs().format("dddd, DD MMMM YYYY")} · Welcome back, {firstName}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              to={a.href}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
              style={{
                backgroundColor: a.bg,
                color: a.color,
                border: `1px solid ${a.color}33`,
              }}
            >
              {a.icon}
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STAT_CONFIG.map((s) => (
          <Link key={s.key} to={s.href}>
            <Card
              className="glass-card hover:shadow-lg transition-all hover:-translate-y-0.5"
              style={{ borderLeft: `3px solid ${s.border}` }}
            >
              <CardContent className="py-4 px-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: s.color }}
                    >
                      {loading ? (
                        <span
                          className="inline-block h-8 w-10 animate-pulse rounded-lg"
                          style={{ backgroundColor: "hsl(var(--muted))" }}
                        />
                      ) : (
                        stats[s.key as keyof typeof stats]
                      )}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {s.title}
                    </p>
                  </div>
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${s.border}18` }}
                  >
                    <span style={{ color: s.color }}>{s.icon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Feedback */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-display">Recent Feedback</h2>
        <Link
          to="/manager/feedback"
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70"
          style={{ color: "hsl(var(--primary))" }}
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl"
              style={{ backgroundColor: "hsl(var(--muted)/0.5)" }}
            />
          ))}
        </div>
      ) : recentFeedback.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <MessageSquare className="h-10 w-10 opacity-20" />
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              No feedback yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recentFeedback.map((fb) => {
            const pc = fb.priority
              ? PRIORITY_CONFIG[fb.priority]
              : PRIORITY_CONFIG.low;
            const sc = fb.status
              ? STATUS_CONFIG[fb.status]
              : STATUS_CONFIG.reported;
            return (
              <Card
                key={fb._id}
                className="glass-card overflow-hidden"
                style={{ borderLeft: `3px solid ${pc.cardBorder}` }}
              >
                <CardContent className="flex items-center justify-between gap-4 py-3 px-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: pc.bg, color: pc.text }}
                    >
                      {fb.student_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">
                          {fb.student_name || "Student"}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-xs capitalize font-medium"
                          style={{
                            backgroundColor: "hsl(var(--muted))",
                            color: "hsl(var(--muted-foreground))",
                          }}
                        >
                          {CATEGORY_EMOJI[fb.category || ""] || ""}{" "}
                          {fb.category}
                        </span>
                        {fb.date && (
                          <span
                            className="text-xs"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {dayjs(fb.date).format("DD MMM")}
                          </span>
                        )}
                      </div>
                      {fb.comment && (
                        <p
                          className="mt-0.5 text-xs truncate italic"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          &ldquo;{fb.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: pc.bg,
                        color: pc.text,
                        border: `1px solid ${pc.border}`,
                      }}
                    >
                      <span>{pc.emoji}</span>
                      {pc.label}
                    </span>
                    <span
                      className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: sc.bg,
                        color: sc.text,
                        border: `1px solid ${sc.border}`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: sc.dot }}
                      />
                      {sc.icon}
                      {sc.label}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
