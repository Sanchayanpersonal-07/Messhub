import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Star,
  Loader2,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import dayjs from "dayjs";

interface Feedback {
  _id: string;
  student_id: { _id: string; name: string };
  meal_id: { _id: string; meal_type: string; date: string };
  category: "taste" | "hygiene" | "quantity" | "others";
  comment?: string;
  image_url?: string;
  rating: number;
  priority: "high" | "medium" | "low";
  status: "reported" | "in_progress" | "resolved";
  action_taken?: string;
  createdAt: string;
}

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
    icon: <AlertCircle className="h-3 w-3" />,
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

const CATEGORY_LABELS: Record<string, string> = {
  taste: "😋 Taste",
  hygiene: "🧹 Hygiene",
  quantity: "🍽️ Quantity",
  others: "💬 Others",
};

export default function WardenFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<Feedback[]>("/warden/feedback");
        setFeedbacks(res.data || []);
      } catch (err) {
        toast.error(
          (err as AxiosError<{ msg?: string }>)?.response?.data?.msg ||
            "Failed to load feedback",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = feedbacks.filter((fb) => {
    const matchSearch =
      !search ||
      fb.student_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
      fb.comment?.toLowerCase().includes(search.toLowerCase());
    const matchPriority =
      filterPriority === "all" || fb.priority === filterPriority;
    const matchStatus = filterStatus === "all" || fb.status === filterStatus;
    const matchCategory =
      filterCategory === "all" || fb.category === filterCategory;
    return matchSearch && matchPriority && matchStatus && matchCategory;
  });

  const total = feedbacks.length;
  const highCount = feedbacks.filter((f) => f.priority === "high").length;
  const resolvedCount = feedbacks.filter((f) => f.status === "resolved").length;
  const avgRating =
    total > 0
      ? (feedbacks.reduce((s, f) => s + f.rating, 0) / total).toFixed(1)
      : "—";

  const FilterBtn = ({
    value,
    current,
    onClick,
  }: {
    value: string;
    current: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all"
      style={{
        backgroundColor:
          current === value ? "hsl(var(--primary))" : "hsl(var(--muted))",
        color:
          current === value
            ? "hsl(var(--primary-foreground))"
            : "hsl(var(--muted-foreground))",
        border: `1px solid ${current === value ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
      }}
    >
      {value === "all" ? "All" : value.replace("_", " ")}
    </button>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Student Feedback
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          Monitor all student feedback across the mess
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Feedback",
            value: total,
            color: "hsl(var(--primary))",
            border: "hsl(var(--primary))",
          },
          {
            label: "Avg Rating",
            value: `${avgRating}★`,
            color: "#f59e0b",
            border: "#f59e0b",
          },
          {
            label: "High Priority",
            value: highCount,
            color: "hsl(var(--destructive))",
            border: "hsl(var(--destructive))",
          },
          {
            label: "Resolved",
            value: resolvedCount,
            color: "hsl(var(--accent))",
            border: "hsl(var(--accent))",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="glass-card"
            style={{ borderLeft: `3px solid ${s.border}` }}
          >
            <CardContent className="py-4 px-4">
              <p className="text-2xl font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {s.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-5">
        <div className="relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Input
            placeholder="Search by student or comment..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter
              className="h-3.5 w-3.5"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <span
              className="text-xs"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Priority:
            </span>
            {["all", "high", "medium", "low"].map((p) => (
              <FilterBtn
                key={p}
                value={p}
                current={filterPriority}
                onClick={() => setFilterPriority(p)}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Status:
            </span>
            {["all", "reported", "in_progress", "resolved"].map((s) => (
              <FilterBtn
                key={s}
                value={s}
                current={filterStatus}
                onClick={() => setFilterStatus(s)}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Category:
            </span>
            {["all", "taste", "hygiene", "quantity", "others"].map((c) => (
              <FilterBtn
                key={c}
                value={c}
                current={filterCategory}
                onClick={() => setFilterCategory(c)}
              />
            ))}
          </div>
        </div>
      </div>

      <p
        className="text-xs mb-3"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        Showing {filtered.length} of {total} entries
      </p>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center py-16 gap-3">
            <MessageSquare
              className="h-12 w-12"
              style={{ color: "hsl(var(--muted-foreground)/0.3)" }}
            />
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              {total === 0
                ? "No feedback submitted yet."
                : "No feedback matches your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((fb) => {
            const pc = PRIORITY_CONFIG[fb.priority];
            const sc = STATUS_CONFIG[fb.status];

            return (
              <Card
                key={fb._id}
                className="glass-card overflow-hidden"
                style={{ borderLeft: `3px solid ${pc.cardBorder}` }}
              >
                <CardContent className="py-4 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Student + meta */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: pc.bg, color: pc.text }}
                        >
                          {fb.student_id?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-semibold text-sm">
                          {fb.student_id?.name}
                        </span>
                        <span
                          className="text-xs capitalize"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {fb.meal_id?.meal_type} ·{" "}
                          {fb.meal_id?.date
                            ? dayjs(fb.meal_id.date).format("DD MMM YYYY")
                            : "—"}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: "hsl(var(--muted))",
                            color: "hsl(var(--muted-foreground))",
                          }}
                        >
                          {CATEGORY_LABELS[fb.category] || fb.category}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className="h-4 w-4"
                            style={{
                              fill: s <= fb.rating ? "#f59e0b" : "transparent",
                              color:
                                s <= fb.rating
                                  ? "#f59e0b"
                                  : "hsl(var(--muted-foreground)/0.2)",
                              filter:
                                s <= fb.rating
                                  ? "drop-shadow(0 0 2px #f59e0b55)"
                                  : "none",
                            }}
                          />
                        ))}
                        <span
                          className="ml-1.5 text-xs font-medium"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {fb.rating}/5
                        </span>
                      </div>

                      {/* Comment */}
                      {fb.comment && (
                        <p
                          className="text-sm italic leading-relaxed"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          &ldquo;{fb.comment}&rdquo;
                        </p>
                      )}

                      {/* Image proof */}
                      {fb.image_url && (
                        <div>
                          <p
                            className="text-xs font-semibold mb-1 flex items-center gap-1"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            📷 Photo Evidence
                          </p>
                          <a
                            href={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}/${fb.image_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                            style={{
                              border: "1.5px solid hsl(var(--border))",
                              maxWidth: "260px",
                            }}
                          >
                            <img
                              src={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}/${fb.image_url}`}
                              alt="Student evidence"
                              className="w-full max-h-40 object-cover"
                            />
                          </a>
                        </div>
                      )}

                      {/* Manager action_taken — proper box */}
                      {fb.action_taken && (
                        <div
                          className="rounded-lg px-3 py-2.5"
                          style={{
                            backgroundColor: "hsl(var(--accent)/0.07)",
                            border: "1px solid hsl(var(--accent)/0.2)",
                            borderLeft: "3px solid hsl(var(--accent))",
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2
                              className="h-3.5 w-3.5"
                              style={{ color: "hsl(var(--accent))" }}
                            />
                            <span
                              className="text-xs font-semibold uppercase tracking-wide"
                              style={{ color: "hsl(var(--accent))" }}
                            >
                              Manager Action
                            </span>
                          </div>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "hsl(var(--foreground))" }}
                          >
                            {fb.action_taken}
                          </p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <p
                        className="text-xs"
                        style={{ color: "hsl(var(--muted-foreground)/0.55)" }}
                      >
                        {dayjs(fb.createdAt).format("DD MMM YYYY, h:mm A")}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
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
                        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
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
