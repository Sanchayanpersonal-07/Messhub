import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  ClipboardList,
  CheckCircle2,
  Clock,
  Calendar,
  Send,
  Droplets,
  Package,
} from "lucide-react";
import dayjs from "dayjs";

interface Duty {
  _id: string;
  duty_date: string;
}

interface DutyReport {
  assignment_id: string;
  hygiene_score: number;
  quantity_score: number;
  remarks?: string;
}

interface ReportForm {
  hygiene: number;
  quantity: number;
  remarks: string;
}

/* ── Score selector — 1 to 10 clickable pills ── */
function ScoreSelector({
  label,
  icon,
  value,
  onChange,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span style={{ color }}>{icon}</span>
        <Label className="text-sm font-medium">{label}</Label>
        {value > 0 && (
          <span className="ml-auto text-sm font-bold" style={{ color }}>
            {value}/10
          </span>
        )}
      </div>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="h-8 w-8 rounded-lg text-xs font-semibold transition-all"
            style={{
              backgroundColor: n <= value ? color : "hsl(var(--muted))",
              color: n <= value ? "#fff" : "hsl(var(--muted-foreground))",
              transform: n === value ? "scale(1.15)" : "scale(1)",
              boxShadow: n === value ? `0 0 8px ${color}55` : "none",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Score display bar (read-only) ── */
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
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{icon}</span>
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {score}/10
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "hsl(var(--muted))" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function StudentDuties() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [reports, setReports] = useState<Record<string, DutyReport>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, ReportForm>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dutyRes, reportRes] = await Promise.all([
          api.get<Duty[]>("/student/duties"),
          api.get<DutyReport[]>("/student/duty-reports"),
        ]);
        setDuties(dutyRes.data || []);
        const map: Record<string, DutyReport> = {};
        reportRes.data?.forEach((r) => {
          map[r.assignment_id] = r;
        });
        setReports(map);
      } catch {
        toast.error("Failed to load duties");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const setScore = (
    dutyId: string,
    field: "hygiene" | "quantity",
    val: number,
  ) =>
    setForm((p) => ({
      ...p,
      [dutyId]: {
        ...p[dutyId],
        [field]: val,
        remarks: p[dutyId]?.remarks || "",
      },
    }));

  const setRemarks = (dutyId: string, val: string) =>
    setForm((p) => ({
      ...p,
      [dutyId]: {
        ...p[dutyId],
        remarks: val,
        hygiene: p[dutyId]?.hygiene || 0,
        quantity: p[dutyId]?.quantity || 0,
      },
    }));

  const submitReport = async (dutyId: string) => {
    const f = form[dutyId];
    if (!f?.hygiene || !f?.quantity) {
      toast.error("Please select both hygiene and quantity scores");
      return;
    }
    try {
      setSubmitting(dutyId);
      const res = await api.post("/student/duty-reports", {
        assignment_id: dutyId,
        hygiene_score: f.hygiene,
        quantity_score: f.quantity,
        remarks: f.remarks || null,
      });
      setReports((p) => ({ ...p, [dutyId]: res.data }));
      toast.success("Report submitted!");
    } catch (error) {
      toast.error(
        (error as AxiosError<{ msg?: string }>)?.response?.data?.msg ||
          "Submission failed",
      );
    } finally {
      setSubmitting(null);
    }
  };

  const reportedCount = Object.keys(reports).length;
  const pendingCount = duties.length - reportedCount;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          My Duties
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          View your assigned mess duties and submit reports
        </p>
      </div>

      {/* Summary */}
      {!loading && duties.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "Total Duties",
              value: duties.length,
              color: "hsl(var(--primary))",
              border: "hsl(var(--primary))",
            },
            {
              label: "Reports Pending",
              value: pendingCount,
              color: "hsl(38 92% 40%)",
              border: "#f59e0b",
            },
            {
              label: "Completed",
              value: reportedCount,
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
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2
            className="h-7 w-7 animate-spin"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
        </div>
      ) : duties.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-3 py-14">
            <ClipboardList className="h-10 w-10 opacity-20" />
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              No duties assigned yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duties.map((duty) => {
            const report = reports[duty._id];
            const isReported = !!report;
            const f = form[duty._id];

            return (
              <Card
                key={duty._id}
                className="glass-card overflow-hidden"
                style={{
                  borderLeft: `3px solid ${isReported ? "hsl(var(--accent))" : "#f59e0b"}`,
                }}
              >
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Calendar
                        className="h-4 w-4"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      />
                      <span className="font-semibold">
                        {dayjs(duty.duty_date).format("dddd, DD MMM YYYY")}
                      </span>
                    </div>

                    {isReported ? (
                      <span
                        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: "hsl(var(--accent)/0.1)",
                          color: "hsl(var(--accent))",
                          border: "1px solid hsl(var(--accent)/0.3)",
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Reported
                      </span>
                    ) : (
                      <span
                        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: "rgba(245,158,11,0.1)",
                          color: "hsl(38 92% 40%)",
                          border: "1px solid rgba(245,158,11,0.3)",
                        }}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Pending Report
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pb-5">
                  {isReported ? (
                    /* ── Submitted report view ── */
                    <div className="space-y-3">
                      <ScoreBar
                        label="Hygiene Score"
                        icon={<Droplets className="h-3.5 w-3.5" />}
                        score={report.hygiene_score}
                        color="hsl(var(--primary))"
                      />
                      <ScoreBar
                        label="Quantity Score"
                        icon={<Package className="h-3.5 w-3.5" />}
                        score={report.quantity_score}
                        color="hsl(var(--accent))"
                      />
                      {report.remarks && (
                        <div
                          className="mt-2 rounded-lg px-3 py-2.5 text-sm"
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
                            {report.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Submit form ── */
                    <div className="space-y-5">
                      <ScoreSelector
                        label="Hygiene Score"
                        icon={<Droplets className="h-3.5 w-3.5" />}
                        value={f?.hygiene || 0}
                        onChange={(v) => setScore(duty._id, "hygiene", v)}
                        color="hsl(var(--primary))"
                      />
                      <ScoreSelector
                        label="Quantity Score"
                        icon={<Package className="h-3.5 w-3.5" />}
                        value={f?.quantity || 0}
                        onChange={(v) => setScore(duty._id, "quantity", v)}
                        color="hsl(var(--accent))"
                      />
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">
                          Remarks{" "}
                          <span
                            className="font-normal"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            (optional)
                          </span>
                        </Label>
                        <Textarea
                          placeholder="Any observations about mess cleanliness, food quantity..."
                          rows={2}
                          className="resize-none"
                          value={f?.remarks || ""}
                          onChange={(e) => setRemarks(duty._id, e.target.value)}
                        />
                      </div>

                      <Button
                        onClick={() => submitReport(duty._id)}
                        disabled={
                          submitting === duty._id || !f?.hygiene || !f?.quantity
                        }
                        className="w-full gap-2"
                        style={{
                          background:
                            "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)/0.85))",
                          color: "hsl(var(--primary-foreground))",
                        }}
                      >
                        {submitting === duty._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {submitting === duty._id
                          ? "Submitting..."
                          : "Submit Report"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
