import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  Users,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  BarChart2,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import dayjs from "dayjs";

/* ── Types ── */
interface CategoryItem {
  name: string;
  value: number;
}
interface RatingItem {
  rating: number;
  count: number;
}

/* ── Colors ── */
const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#f59e0b",
  "hsl(var(--destructive))",
];

const CATEGORY_EMOJI: Record<string, string> = {
  taste: "😋",
  hygiene: "🧹",
  quantity: "🍽️",
  others: "💬",
};

const STAT_CONFIG = [
  {
    key: "students",
    title: "Total Students",
    icon: <Users className="h-5 w-5" />,
    color: "hsl(var(--primary))",
    border: "hsl(var(--primary))",
    href: "/warden",
  },
  {
    key: "feedback",
    title: "Total Feedback",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "#f59e0b",
    border: "#f59e0b",
    href: "/warden/feedback",
  },
  {
    key: "avgRating",
    title: "Avg Rating",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "hsl(var(--accent))",
    border: "hsl(var(--accent))",
    href: "/warden/analytics",
  },
  {
    key: "resolved",
    title: "Resolved",
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "hsl(var(--destructive))",
    border: "hsl(var(--destructive))",
    href: "/warden/feedback",
  },
];

const QUICK_ACTIONS = [
  {
    label: "Analytics",
    icon: <BarChart2 className="h-4 w-4" />,
    href: "/warden/analytics",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary)/0.1)",
  },
  {
    label: "Duty Reports",
    icon: <ClipboardList className="h-4 w-4" />,
    href: "/warden/duty-reports",
    color: "hsl(var(--accent))",
    bg: "hsl(var(--accent)/0.1)",
  },
  {
    label: "View Feedback",
    icon: <MessageSquare className="h-4 w-4" />,
    href: "/warden/feedback",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
];

/* ── Custom Tooltip ── */
const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{
        backgroundColor: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <p
        className="text-xs mb-0.5 font-semibold"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {label !== undefined ? `Rating: ${label}` : ""}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          className="font-bold"
          style={{ color: "hsl(var(--primary))" }}
        >
          {p.value} feedbacks
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{
        backgroundColor: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <p className="font-semibold capitalize">
        {CATEGORY_EMOJI[p.name] || ""} {p.name}
      </p>
      <p className="font-bold">{p.value} feedbacks</p>
    </div>
  );
};

export default function WardenDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    feedback: 0,
    avgRating: 0,
    resolved: 0,
  });
  const [categoryData, setCategoryData] = useState<CategoryItem[]>([]);
  const [ratingData, setRatingData] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/warden")
      .then((res) => {
        setStats(res.data.stats);
        setCategoryData(res.data.categoryData || []);
        setRatingData(res.data.ratingData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "Warden";

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Warden Dashboard</h1>
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
                      ) : s.key === "avgRating" ? (
                        `${Number(stats.avgRating).toFixed(1)} ★`
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

      {/* Charts */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Rating distribution */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base">
                Rating Distribution
              </CardTitle>
              <Link
                to="/warden/analytics"
                className="flex items-center gap-1 text-xs"
                style={{ color: "hsl(var(--primary))" }}
              >
                Full analytics <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div
                className="h-52 animate-pulse rounded-xl"
                style={{ backgroundColor: "hsl(var(--muted)/0.5)" }}
              />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={ratingData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="rating"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Stars",
                      position: "insideBottom",
                      offset: -2,
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {ratingData.map((entry, i) => {
                      const intensity = entry.rating / 5;
                      return (
                        <Cell
                          key={i}
                          fill={`hsl(var(--primary) / ${0.3 + intensity * 0.7})`}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category pie */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">
              Feedback by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div
                className="h-52 animate-pulse rounded-xl"
                style={{ backgroundColor: "hsl(var(--muted)/0.5)" }}
              />
            ) : categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 gap-2">
                <MessageSquare className="h-8 w-8 opacity-20" />
                <p
                  className="text-sm"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  No data yet
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={210}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {categoryData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom legend */}
                <div className="space-y-2 flex-1">
                  {categoryData.map((entry, i) => {
                    const total = categoryData.reduce((s, d) => s + d.value, 0);
                    const pct =
                      total > 0 ? Math.round((entry.value / total) * 100) : 0;
                    return (
                      <div key={entry.name} className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium capitalize">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            />
                            {CATEGORY_EMOJI[entry.name] || ""} {entry.name}
                          </span>
                          <span className="font-semibold">{pct}%</span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: "hsl(var(--muted))" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
