import { useCallback, useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Fingerprint,
  Loader2,
  Coffee,
  Sun,
  Moon,
  Users,
  Search,
  CheckCircle2,
  PenLine,
  Calendar,
} from "lucide-react";
import dayjs from "dayjs";

/* ── Types ── */
interface AttendanceRecord {
  _id: string;
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  source: "fingerprint" | "manual";
  scan_time: string;
  fingerprint_verified: boolean;
  student_id: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface TodayCounts {
  breakfast: number;
  lunch: number;
  dinner: number;
}

/* ── Meal config ── */
const MEAL_CONFIG = {
  breakfast: {
    label: "Breakfast",
    icon: <Coffee className="h-4 w-4" />,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
  },
  lunch: {
    label: "Lunch",
    icon: <Sun className="h-4 w-4" />,
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary)/0.08)",
    border: "hsl(var(--primary)/0.25)",
  },
  dinner: {
    label: "Dinner",
    icon: <Moon className="h-4 w-4" />,
    color: "hsl(var(--accent))",
    bg: "hsl(var(--accent)/0.08)",
    border: "hsl(var(--accent)/0.25)",
  },
};

export default function ManagerAttendance() {
  /* today view */
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [counts, setCounts] = useState<TodayCounts>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });
  const [filterMeal, setFilterMeal] = useState("all");
  const [search, setSearch] = useState("");
  const [viewDate, setViewDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [loadingRecords, setLoadingRecords] = useState(true);

  /* manual mark */
  const [students, setStudents] = useState<Student[]>([]);
  const [manualStudent, setManualStudent] = useState("");
  const [manualMeal, setManualMeal] = useState("");
  const [manualDate, setManualDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [marking, setMarking] = useState(false);

  /* ── fetch attendance for selected date ── */
  const fetchAttendance = useCallback(
    async (date: string) => {
      setLoadingRecords(true);
      try {
        const params = new URLSearchParams();
        params.set("date", date);
        if (filterMeal !== "all") params.set("meal_type", filterMeal);

        const res = await api.get<{
          date: string;
          counts: TodayCounts;
          total: number;
          records: AttendanceRecord[];
        }>(`/attendance/today?${params.toString()}`);

        setRecords(res.data.records);
        setCounts(res.data.counts);
      } catch {
        toast.error("Failed to load attendance");
      } finally {
        setLoadingRecords(false);
      }
    },
    [filterMeal],
  );

  /* ── fetch all students for manual mark dropdown ── */
  const fetchStudents = async () => {
    try {
      const res = await api.get<Student[]>("/manager/students");
      setStudents(res.data);
    } catch {
      // silently fail — students list optional
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAttendance(viewDate);
  }, [fetchAttendance, viewDate]);

  /* ── manual mark submit ── */
  const handleManualMark = async () => {
    if (!manualStudent || !manualMeal) {
      toast.error("Please select student and meal type");
      return;
    }
    setMarking(true);
    try {
      await api.post("/attendance/manual", {
        student_id: manualStudent,
        meal_type: manualMeal,
        date: manualDate,
      });
      toast.success("Attendance marked manually");
      setManualStudent("");
      setManualMeal("");
      fetchAttendance(viewDate);
    } catch (err) {
      const msg = (err as AxiosError<{ msg?: string }>)?.response?.data?.msg;
      toast.error(msg || "Failed to mark attendance");
    } finally {
      setMarking(false);
    }
  };

  /* ── filter records by search + meal ── */
  const filtered = records.filter((r) => {
    const matchSearch = r.student_id?.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchMeal = filterMeal === "all" || r.meal_type === filterMeal;
    return matchSearch && matchMeal;
  });

  const totalToday = counts.breakfast + counts.lunch + counts.dinner;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Fingerprint className="h-6 w-6" />
          Attendance Management
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          View and manage student meal attendance
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {/* Total */}
        <Card className="glass-card">
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Users
                className="h-4 w-4"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <span
                className="text-xs"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Total Today
              </span>
            </div>
            <p className="text-2xl font-bold">{totalToday}</p>
          </CardContent>
        </Card>

        {/* Per meal */}
        {(["breakfast", "lunch", "dinner"] as const).map((meal) => {
          const m = MEAL_CONFIG[meal];
          return (
            <Card
              key={meal}
              className="glass-card"
              style={{ borderLeft: `3px solid ${m.color}` }}
            >
              <CardContent className="py-4 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: m.color }}>{m.icon}</span>
                  <span
                    className="text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {m.label}
                  </span>
                </div>
                <p className="text-2xl font-bold" style={{ color: m.color }}>
                  {counts[meal]}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: Manual Mark ── */}
        <div>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <PenLine className="h-4 w-4" />
                Manual Mark
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p
                className="text-xs"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Use when a student cannot scan their fingerprint.
              </p>

              {/* Student select */}
              <div className="space-y-1.5">
                <Label className="text-xs">Student</Label>
                <Select value={manualStudent} onValueChange={setManualStudent}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No students found
                      </SelectItem>
                    ) : (
                      students.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Meal type */}
              <div className="space-y-1.5">
                <Label className="text-xs">Meal Type</Label>
                <Select value={manualMeal} onValueChange={setManualMeal}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select meal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                    <SelectItem value="lunch">☀️ Lunch</SelectItem>
                    <SelectItem value="dinner">🌙 Dinner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={manualDate}
                  max={dayjs().format("YYYY-MM-DD")}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <Button
                onClick={handleManualMark}
                disabled={marking || !manualStudent || !manualMeal}
                className="w-full"
                style={{
                  background:
                    "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)/0.85))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                {marking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Attendance list ── */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filters row */}
          <div className="flex gap-2 flex-wrap">
            {/* Date picker */}
            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm"
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
                value={viewDate}
                max={dayjs().format("YYYY-MM-DD")}
                onChange={(e) => setViewDate(e.target.value)}
                className="bg-transparent text-xs outline-none"
              />
            </div>

            {/* Meal filter */}
            <Select value={filterMeal} onValueChange={setFilterMeal}>
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meals</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative flex-1 min-w-40">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Input
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>

          {/* Records */}
          {loadingRecords ? (
            <div className="flex justify-center py-12">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="glass-card">
              <CardContent
                className="py-12 text-center"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                <Fingerprint className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No attendance records found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-120 overflow-y-auto pr-1">
              {filtered.map((r) => {
                const m = MEAL_CONFIG[r.meal_type];
                return (
                  <Card
                    key={r._id}
                    className="glass-card"
                    style={{ borderLeft: `3px solid ${m.color}` }}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar circle */}
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: m.bg, color: m.color }}
                          >
                            {r.student_id?.name?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {r.student_id?.name || "Unknown"}
                            </p>
                            <p
                              className="text-xs truncate"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              {r.student_id?.email || ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {/* Meal badge */}
                          <span
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{
                              backgroundColor: m.bg,
                              color: m.color,
                              border: `1px solid ${m.border}`,
                            }}
                          >
                            {m.icon}
                            {m.label}
                          </span>

                          {/* Source + time */}
                          <span
                            className="text-xs"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {r.source === "manual" ? (
                              <span className="flex items-center gap-1">
                                <PenLine className="h-3 w-3" /> Manual
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Fingerprint className="h-3 w-3" />
                                {dayjs(r.scan_time).format("h:mm A")}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Count */}
          {!loadingRecords && filtered.length > 0 && (
            <p
              className="text-xs text-right"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Showing {filtered.length} record{filtered.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
