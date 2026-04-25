import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  ClipboardCheck,
  Calendar,
  Droplets,
  Package,
  Search,
  Star,
} from "lucide-react";
import dayjs from "dayjs";

interface Student {
  _id: string;
  name: string;
  department: string;
}

interface DutyAssignment {
  _id: string;
  duty_date: string;
  student_id: Student;
}

interface DutyReport {
  _id: string;
  hygiene_score: number;
  quantity_score: number;
  remarks?: string;
  status: "pending" | "verified";
  assignment_id: DutyAssignment;
  createdAt: string;
}

/* ── Score bar with label ── */
function ScoreBar({
  label,
  icon,
  score,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  score: number;
  color: string;
}) {
  const pct = (score / 10) * 100;
  const grade =
    score >= 9
      ? "Excellent"
      : score >= 7
        ? "Good"
        : score >= 5
          ? "Average"
          : "Poor";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{icon}</span>
          <span className="text-xs font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {grade}
          </span>
          <span className="text-sm font-bold" style={{ color }}>
            {score}/10
          </span>
        </div>
      </div>
      <div
        className="h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "hsl(var(--muted))" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, ${color}99, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Average score ring ── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 20;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 10) * circ;

  return (
    <svg width="52" height="52" className="shrink-0">
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth="4"
      />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <text
        x="26"
        y="30"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
}

export default function WardenDutyReports() {
  const [reports, setReports] = useState<DutyReport[]>([]);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get<DutyReport[]>(
          `/warden/duty-reports?date=${date}`,
        );
        setReports(res.data || []);
      } catch {
        toast.error("Failed to load duty reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [date]);

  const filtered = reports.filter(
    (r) =>
      !search ||
      r.assignment_id?.student_id?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      r.assignment_id?.student_id?.department
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  // ✅ FIX: hygiene_score and quantity_score are optional in model — guard against undefined/NaN
  const avgHygiene =
    reports.length > 0
      ? reports.reduce((s, r) => s + (r.hygiene_score ?? 0), 0) / reports.length
      : 0;
  const avgQuantity =
    reports.length > 0
      ? reports.reduce((s, r) => s + (r.quantity_score ?? 0), 0) /
        reports.length
      : 0;
  const avgOverall = reports.length > 0 ? (avgHygiene + avgQuantity) / 2 : 0;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Duty Reports
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Review student duty performance reports
          </p>
        </div>

        {/* Date picker */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
          style={{
            backgroundColor: "hsl(var(--muted)/0.5)",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <Calendar
            className="h-3.5 w-3.5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Summary cards */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "Reports",
              value: reports.length,
              color: "hsl(var(--primary))",
              border: "hsl(var(--primary))",
              isNum: true,
            },
            {
              label: "Avg Hygiene",
              value: avgHygiene.toFixed(1),
              color: "hsl(var(--primary))",
              border: "hsl(var(--primary))",
              isNum: false,
            },
            {
              label: "Avg Quantity",
              value: avgQuantity.toFixed(1),
              color: "hsl(var(--accent))",
              border: "hsl(var(--accent))",
              isNum: false,
            },
            {
              label: "Overall Avg",
              value: avgOverall.toFixed(1),
              color: "#f59e0b",
              border: "#f59e0b",
              isNum: false,
            },
          ].map((s) => (
            <Card
              key={s.label}
              className="glass-card"
              style={{ borderLeft: `3px solid ${s.border}` }}
            >
              <CardContent className="py-4 px-4">
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  {!s.isNum && (
                    <span
                      className="text-sm font-medium mt-1"
                      style={{ color: s.color }}
                    >
                      /10
                    </span>
                  )}
                </div>
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
      )}

      {/* Search */}
      {!loading && reports.length > 0 && (
        <div className="relative mb-5 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Input
            placeholder="Search by student or department..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2
            className="h-7 w-7 animate-spin"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-3 py-14">
            <ClipboardCheck className="h-10 w-10 opacity-20" />
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              {reports.length === 0
                ? `No duty reports for ${dayjs(date).format("DD MMM YYYY")}.`
                : "No reports match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const overallAvg = (r.hygiene_score + r.quantity_score) / 2;
            const overallColor =
              overallAvg >= 8
                ? "hsl(var(--accent))"
                : overallAvg >= 5
                  ? "#f59e0b"
                  : "hsl(var(--destructive))";

            return (
              <Card
                key={r._id}
                className="glass-card overflow-hidden"
                style={{ borderLeft: `3px solid ${overallColor}` }}
              >
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-4">
                    {/* Overall ring */}
                    <ScoreRing
                      score={Math.round(overallAvg * 10) / 10}
                      color={overallColor}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Student info row */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-sm">
                            {r.assignment_id?.student_id?.name || "Student"}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {r.assignment_id?.student_id?.department || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Overall star rating */}
                          <div className="flex items-center gap-1">
                            <Star
                              className="h-3.5 w-3.5"
                              style={{
                                fill: overallColor,
                                color: overallColor,
                              }}
                            />
                            <span
                              className="text-xs font-semibold"
                              style={{ color: overallColor }}
                            >
                              {overallAvg.toFixed(1)}/10
                            </span>
                          </div>
                          <span
                            className="text-xs rounded-full px-2 py-0.5 font-medium"
                            style={{
                              backgroundColor: "hsl(var(--muted))",
                              color: "hsl(var(--muted-foreground))",
                            }}
                          >
                            {dayjs(r.createdAt).format("h:mm A")}
                          </span>
                        </div>
                      </div>

                      {/* Score bars */}
                      <div className="space-y-2">
                        <ScoreBar
                          label="Hygiene"
                          icon={<Droplets className="h-3.5 w-3.5" />}
                          score={r.hygiene_score}
                          color="hsl(var(--primary))"
                        />
                        <ScoreBar
                          label="Quantity"
                          icon={<Package className="h-3.5 w-3.5" />}
                          score={r.quantity_score}
                          color="hsl(var(--accent))"
                        />
                      </div>

                      {/* Remarks */}
                      {r.remarks && (
                        <div
                          className="rounded-lg px-3 py-2 text-sm"
                          style={{
                            backgroundColor: "hsl(var(--muted)/0.5)",
                            borderLeft:
                              "3px solid hsl(var(--muted-foreground)/0.3)",
                          }}
                        >
                          <p
                            className="text-xs font-semibold mb-0.5"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            Remarks
                          </p>
                          <p style={{ color: "hsl(var(--foreground))" }}>
                            {r.remarks}
                          </p>
                        </div>
                      )}
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
