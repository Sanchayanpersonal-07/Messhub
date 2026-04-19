import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  BarChart2,
  Star,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import dayjs from "dayjs";

/* ── Types ── */
interface WeeklyData {
  date: string;
  avg: number;
  count: number;
}
interface PriorityData {
  name: "high" | "medium" | "low";
  value: number;
}
interface AnalyticsResponse {
  weeklyData: WeeklyData[];
  priorityData: PriorityData[];
  totalFeedback?: number;
  avgRating?: number;
  resolvedCount?: number;
  highPriorityCount?: number;
}

/* ── Colors ── */
const PC: Record<string, string> = {
  high: "hsl(var(--destructive))",
  medium: "#f59e0b",
  low: "hsl(var(--accent))",
};
const PBG: Record<string, string> = {
  high: "hsl(var(--destructive)/0.08)",
  medium: "rgba(245,158,11,0.08)",
  low: "hsl(var(--accent)/0.08)",
};

/* ── Tooltip prop types (replaces `any`) ── */
interface TooltipItem {
  value: number;
  name: string;
  color: string;
  payload: PriorityData;
}

interface LineTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}

interface PriorityTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
}

/* ── Custom tooltips ── */
const LineTooltip = ({ active, payload, label }: LineTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-sm shadow-lg"
      style={{
        backgroundColor: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <p
        className="text-xs font-semibold mb-1"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {p.name === "avg"
            ? `⭐ ${Number(p.value).toFixed(2)} / 5`
            : `📋 ${p.value} feedbacks`}
        </p>
      ))}
    </div>
  );
};

const PriorityTooltip = ({ active, payload }: PriorityTooltipProps) => {
  if (!active || !payload?.length) return null;
  const name = payload[0]?.payload?.name;
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-sm shadow-lg"
      style={{
        backgroundColor: "hsl(var(--background))",
        border: `1px solid ${PC[name]}55`,
      }}
    >
      <p className="font-semibold capitalize" style={{ color: PC[name] }}>
        {name} Priority
      </p>
      <p className="font-bold text-base">{payload[0].value} issues</p>
    </div>
  );
};

/* ── Skeleton ── */
const Skeleton = ({ h = 280 }: { h?: number }) => (
  <div
    className="w-full rounded-xl animate-pulse"
    style={{ height: h, backgroundColor: "hsl(var(--muted)/0.5)" }}
  />
);

/* ── Stat card ── */
function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  border,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  border: string;
}) {
  return (
    <Card className="glass-card" style={{ borderLeft: `3px solid ${border}` }}>
      <CardContent className="py-4 px-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold" style={{ color }}>
              {value}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {label}
            </p>
            {sub && (
              <p
                className="text-xs opacity-60 mt-0.5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {sub}
              </p>
            )}
          </div>
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${border}18` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WardenAnalytics() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [priorityData, setPriorityData] = useState<PriorityData[]>([]);
  const [summary, setSummary] = useState<Partial<AnalyticsResponse>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trend" | "volume" | "priority">(
    "trend",
  );

  useEffect(() => {
    api
      .get<AnalyticsResponse>("/warden/analytics")
      .then((res) => {
        setWeeklyData(res.data.weeklyData || []);
        setPriorityData(res.data.priorityData || []);
        setSummary(res.data);
      })
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  /* derived stats */
  const totalCount =
    summary.totalFeedback ?? weeklyData.reduce((s, d) => s + d.count, 0);
  const avgRating =
    summary.avgRating ??
    (weeklyData.length
      ? weeklyData.reduce((s, d) => s + d.avg * d.count, 0) /
        Math.max(totalCount, 1)
      : 0);
  const highCount =
    summary.highPriorityCount ??
    priorityData.find((p) => p.name === "high")?.value ??
    0;
  const resolvedCount = summary.resolvedCount ?? 0;

  /* formatted weekly data */
  const fmtData = weeklyData.map((d) => ({
    ...d,
    label: dayjs(d.date).format("DD MMM"),
    avg: Math.round(d.avg * 100) / 100,
  }));

  const TABS = [
    {
      key: "trend" as const,
      label: "Rating Trend",
      icon: <TrendingUp className="h-3.5 w-3.5" />,
    },
    {
      key: "volume" as const,
      label: "Volume",
      icon: <BarChart2 className="h-3.5 w-3.5" />,
    },
    {
      key: "priority" as const,
      label: "Priority",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <BarChart2 className="h-6 w-6" />
          Analytics
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          Feedback trends and issue resolution metrics
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Feedback"
          value={totalCount}
          sub="last 7 days"
          icon={<MessageSquare className="h-4 w-4" />}
          color="hsl(var(--primary))"
          border="hsl(var(--primary))"
        />
        <StatCard
          label="Avg Rating"
          value={`${avgRating.toFixed(1)} ★`}
          sub="out of 5"
          icon={<Star className="h-4 w-4" />}
          color="#f59e0b"
          border="#f59e0b"
        />
        <StatCard
          label="High Priority"
          value={highCount}
          sub="needs attention"
          icon={<AlertTriangle className="h-4 w-4" />}
          color="hsl(var(--destructive))"
          border="hsl(var(--destructive))"
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          sub="issues closed"
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="hsl(var(--accent))"
          border="hsl(var(--accent))"
        />
      </div>

      {/* Main layout */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* ── Left: tabbed main chart ── */}
        <Card className="glass-card md:col-span-2">
          <CardHeader className="pb-3">
            {/* Tab switcher */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display text-base">
                {activeTab === "trend" && "Average Rating — Last 7 Days"}
                {activeTab === "volume" && "Daily Feedback Volume"}
                {activeTab === "priority" && "Issues by Priority Level"}
              </CardTitle>
              <div
                className="flex gap-1 rounded-xl p-1"
                style={{ backgroundColor: "hsl(var(--muted)/0.5)" }}
              >
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all"
                    style={{
                      backgroundColor:
                        activeTab === t.key
                          ? "hsl(var(--background))"
                          : "transparent",
                      color:
                        activeTab === t.key
                          ? "hsl(var(--foreground))"
                          : "hsl(var(--muted-foreground))",
                      boxShadow:
                        activeTab === t.key
                          ? "0 1px 3px rgba(0,0,0,0.1)"
                          : "none",
                    }}
                  >
                    {t.icon}
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <Skeleton />
            ) : (
              <>
                {/* Rating trend line chart */}
                {activeTab === "trend" && (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={fmtData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 5]}
                        ticks={[0, 1, 2, 3, 4, 5]}
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<LineTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="avg"
                        name="avg"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{
                          r: 5,
                          fill: "hsl(var(--primary))",
                          strokeWidth: 2,
                          stroke: "hsl(var(--background))",
                        }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {/* Volume bar chart */}
                {activeTab === "volume" && (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={fmtData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<LineTooltip />} />
                      <Bar
                        dataKey="count"
                        name="count"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={50}
                      >
                        {fmtData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={`hsl(var(--primary) / ${0.35 + (i / Math.max(fmtData.length - 1, 1)) * 0.65})`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* Priority bar chart */}
                {activeTab === "priority" && (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={priorityData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<PriorityTooltip />} />
                      <Bar
                        dataKey="value"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={64}
                      >
                        {priorityData.map((e, i) => (
                          <Cell key={i} fill={PC[e.name]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          {/* Priority breakdown bars */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm">
                Priority Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <Skeleton h={130} />
              ) : priorityData.length === 0 ? (
                <p
                  className="text-xs text-center py-4"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  No data yet
                </p>
              ) : (
                (() => {
                  const total = priorityData.reduce((s, p) => s + p.value, 0);
                  return priorityData.map((p) => {
                    const pct =
                      total > 0 ? Math.round((p.value / total) * 100) : 0;
                    return (
                      <div key={p.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className="flex items-center gap-1.5 font-medium capitalize"
                            style={{ color: PC[p.name] }}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: PC[p.name] }}
                            />
                            {p.name}
                          </span>
                          <span className="font-semibold">
                            {p.value}
                            <span
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              {" "}
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: PBG[p.name] }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: PC[p.name],
                            }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </CardContent>
          </Card>

          {/* 7-day summary table */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm">
                7-Day Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton h={170} />
              ) : fmtData.length === 0 ? (
                <p
                  className="text-xs text-center py-4"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  No data yet
                </p>
              ) : (
                <div className="space-y-1.5">
                  {[...fmtData].reverse().map((d) => {
                    const ratingColor =
                      d.avg >= 4
                        ? "hsl(var(--accent))"
                        : d.avg >= 3
                          ? "#f59e0b"
                          : "hsl(var(--destructive))";
                    return (
                      <div
                        key={d.date}
                        className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs"
                        style={{ backgroundColor: "hsl(var(--muted)/0.4)" }}
                      >
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>
                          {d.label}
                        </span>
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center gap-1">
                            <Star
                              className="h-3 w-3"
                              style={{ fill: ratingColor, color: ratingColor }}
                            />
                            <span
                              className="font-semibold"
                              style={{ color: ratingColor }}
                            >
                              {d.avg.toFixed(1)}
                            </span>
                          </span>
                          <span
                            className="rounded-full px-1.5 py-0.5 font-semibold"
                            style={{
                              backgroundColor: "hsl(var(--primary)/0.1)",
                              color: "hsl(var(--primary))",
                            }}
                          >
                            {d.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
