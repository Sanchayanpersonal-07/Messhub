import { useEffect, useState, useCallback } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Fingerprint,
  Loader2,
  CheckCircle2,
  Coffee,
  Sun,
  Moon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Lock,
} from "lucide-react";
import dayjs from "dayjs";

interface MarkedToday {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}
interface MealWindow {
  openAt: string;
  closeAt: string;
  isOpen: boolean;
}
interface WindowMap {
  breakfast: MealWindow;
  lunch: MealWindow;
  dinner: MealWindow;
}
interface AttendanceRecord {
  _id: string;
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  source: "fingerprint" | "manual";
  scan_time: string;
}
interface MonthlySummary {
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}
interface WebAuthnStatus {
  registered: boolean;
  registered_at: string | null;
}

const MEALS = [
  {
    key: "breakfast" as const,
    label: "Breakfast",
    icon: <Coffee className="h-5 w-5" />,
    iconSm: <Coffee className="h-3.5 w-3.5" />,
    time: "7:30 AM – 9:00 AM",
    color: "#f59e0b",
    bgColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.3)",
  },
  {
    key: "lunch" as const,
    label: "Lunch",
    icon: <Sun className="h-5 w-5" />,
    iconSm: <Sun className="h-3.5 w-3.5" />,
    time: "12:30 PM – 2:00 PM",
    color: "hsl(var(--primary))",
    bgColor: "hsl(var(--primary) / 0.08)",
    borderColor: "hsl(var(--primary) / 0.3)",
  },
  {
    key: "dinner" as const,
    label: "Dinner",
    icon: <Moon className="h-5 w-5" />,
    iconSm: <Moon className="h-3.5 w-3.5" />,
    time: "7:30 PM – 9:00 PM",
    color: "hsl(var(--accent))",
    bgColor: "hsl(var(--accent) / 0.08)",
    borderColor: "hsl(var(--accent) / 0.3)",
  },
];

type ScanState = "idle" | "scanning" | "success" | "already";

export default function StudentAttendance() {
  const [webAuthnStatus, setWebAuthnStatus] = useState<WebAuthnStatus | null>(
    null,
  );
  const [registering, setRegistering] = useState(false);
  const [scanState, setScanState] = useState<Record<string, ScanState>>({
    breakfast: "idle",
    lunch: "idle",
    dinner: "idle",
  });
  const [windows, setWindows] = useState<WindowMap | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs().format("YYYY-MM"));
  const [loading, setLoading] = useState(true);

  const fetchWebAuthnStatus = useCallback(async () => {
    try {
      const res = await api.get<WebAuthnStatus>("/attendance/webauthn/status");
      setWebAuthnStatus(res.data);
    } catch {
      /* silent */
    }
  }, []);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await api.get<{ marked: MarkedToday; windows: WindowMap }>(
        "/attendance/check",
      );
      const { marked, windows: w } = res.data;
      const newState = {
        breakfast: "idle",
        lunch: "idle",
        dinner: "idle",
      } as Record<string, ScanState>;
      Object.entries(marked).forEach(([meal, done]) => {
        if (done) newState[meal] = "already";
      });
      setScanState(newState);
      setWindows(w);
    } catch {
      /* silent */
    }
  }, []);

  const fetchHistory = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const res = await api.get<{
        summary: MonthlySummary;
        records: AttendanceRecord[];
      }>(`/attendance/my?month=${month}`);
      setSummary(res.data.summary);
      setHistory(res.data.records);
    } catch {
      toast.error("Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebAuthnStatus();
    fetchTodayStatus();
  }, [fetchWebAuthnStatus, fetchTodayStatus]);
  useEffect(() => {
    const t = setInterval(fetchTodayStatus, 60_000);
    return () => clearInterval(t);
  }, [fetchTodayStatus]);
  useEffect(() => {
    fetchHistory(currentMonth);
  }, [currentMonth, fetchHistory]);

  const handleRegisterFingerprint = async () => {
    setRegistering(true);
    try {
      const optionsRes = await api.get("/attendance/webauthn/register-options");
      let reg;
      try {
        reg = await startRegistration({ optionsJSON: optionsRes.data });
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string };
        toast.error(
          err.name === "NotAllowedError"
            ? "Fingerprint scan cancelled."
            : err.name === "NotSupportedError"
              ? "Device doesn't support fingerprint."
              : err.message || "Registration failed.",
        );
        return;
      }
      await api.post("/attendance/webauthn/register-verify", reg);
      toast.success(
        "🎉 Fingerprint registered! You can now scan for attendance.",
      );
      await fetchWebAuthnStatus();
    } catch (err) {
      toast.error(
        (err as AxiosError<{ msg?: string }>)?.response?.data?.msg ||
          "Registration failed.",
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleScan = async (meal_type: string) => {
    const state = scanState[meal_type];
    const winInfo = windows?.[meal_type as keyof WindowMap];
    if (state === "already" || state === "scanning" || state === "success")
      return;
    if (!webAuthnStatus?.registered) {
      toast.error("Please register your fingerprint first.");
      return;
    }
    if (!winInfo?.isOpen) {
      toast.error(
        `${meal_type.charAt(0).toUpperCase() + meal_type.slice(1)} window is closed. Opens at ${winInfo?.openAt}.`,
      );
      return;
    }

    setScanState((p) => ({ ...p, [meal_type]: "scanning" }));
    try {
      const optionsRes = await api.get("/attendance/webauthn/auth-options");
      let authResponse;
      try {
        authResponse = await startAuthentication({
          optionsJSON: optionsRes.data,
        });
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string };
        toast.error(
          err.name === "NotAllowedError"
            ? "Fingerprint scan cancelled."
            : err.message || "Scan failed.",
        );
        setScanState((p) => ({ ...p, [meal_type]: "idle" }));
        return;
      }
      await api.post("/attendance/webauthn/auth-verify", {
        meal_type,
        authResponse,
      });
      setScanState((p) => ({ ...p, [meal_type]: "success" }));
      toast.success(
        `✅ ${meal_type.charAt(0).toUpperCase() + meal_type.slice(1)} attendance marked!`,
      );
      setTimeout(() => {
        setScanState((p) => ({ ...p, [meal_type]: "already" }));
        fetchHistory(currentMonth);
      }, 2000);
    } catch (err) {
      const msg = (err as AxiosError<{ msg?: string }>)?.response?.data?.msg;
      if (msg?.includes("already marked")) {
        setScanState((p) => ({ ...p, [meal_type]: "already" }));
        toast.info("Attendance already marked.");
      } else {
        setScanState((p) => ({ ...p, [meal_type]: "idle" }));
        toast.error(msg || "Scan failed.");
      }
    }
  };

  const prevMonth = () =>
    setCurrentMonth(dayjs(currentMonth).subtract(1, "month").format("YYYY-MM"));
  const nextMonth = () => {
    const n = dayjs(currentMonth).add(1, "month").format("YYYY-MM");
    if (n <= dayjs().format("YYYY-MM")) setCurrentMonth(n);
  };
  const isCurrentMonth = currentMonth === dayjs().format("YYYY-MM");

  const grouped = history.reduce<Record<string, AttendanceRecord[]>>(
    (acc, r) => {
      if (!acc[r.date]) acc[r.date] = [];
      acc[r.date].push(r);
      return acc;
    },
    {},
  );

  const mealColor = (t: string) =>
    t === "breakfast"
      ? "#f59e0b"
      : t === "lunch"
        ? "hsl(var(--primary))"
        : "hsl(var(--accent))";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Fingerprint className="h-6 w-6" /> Attendance
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          {dayjs().format("dddd, DD MMMM YYYY")}
        </p>
      </div>

      {/* Not registered banner */}
      {webAuthnStatus !== null && !webAuthnStatus.registered && (
        <div
          className="mb-6 rounded-xl p-4 flex items-start gap-4"
          style={{
            backgroundColor: "rgba(245,158,11,0.08)",
            border: "1.5px solid rgba(245,158,11,0.3)",
          }}
        >
          <AlertTriangle
            className="h-5 w-5 mt-0.5 shrink-0"
            style={{ color: "#f59e0b" }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: "#f59e0b" }}>
              Fingerprint Not Registered
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Register once to mark attendance. Your actual fingerprint is never
              stored.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleRegisterFingerprint}
            disabled={registering}
            className="shrink-0 gap-2"
            style={{
              background: "linear-gradient(to right, #f59e0b, #d97706)",
              color: "#fff",
            }}
          >
            {registering ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Fingerprint className="h-3.5 w-3.5" />
            )}
            {registering ? "Scanning..." : "Register Fingerprint"}
          </Button>
        </div>
      )}

      {/* Registered badge */}
      {webAuthnStatus?.registered && (
        <div
          className="mb-6 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3"
          style={{
            backgroundColor: "hsl(var(--accent) / 0.08)",
            border: "1px solid hsl(var(--accent) / 0.25)",
          }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="h-4 w-4"
              style={{ color: "hsl(var(--accent))" }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "hsl(var(--accent))" }}
            >
              Fingerprint registered
              {webAuthnStatus.registered_at && (
                <span
                  className="ml-2 font-normal text-xs"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  since{" "}
                  {dayjs(webAuthnStatus.registered_at).format("DD MMM YYYY")}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRegisterFingerprint}
            disabled={registering}
            className="flex items-center gap-1 text-xs hover:opacity-70"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <RefreshCw className="h-3 w-3" /> Re-register
          </button>
        </div>
      )}

      {/* Meal scan cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {MEALS.map((meal) => {
          const state = scanState[meal.key];
          const winInfo = windows?.[meal.key];
          const isOpen = winInfo?.isOpen ?? false;
          const isScanning = state === "scanning";
          const isDone = state === "already" || state === "success";
          const isDisabled =
            isDone || isScanning || !webAuthnStatus?.registered || !isOpen;

          return (
            <Card
              key={meal.key}
              className="glass-card overflow-hidden"
              style={{
                borderLeft: `3px solid ${isDone ? meal.color : isOpen ? "hsl(var(--accent))" : "hsl(var(--border))"}`,
                transition: "border-color 0.4s ease",
              }}
            >
              <CardContent className="pt-5 pb-5">
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        color: isDone
                          ? meal.color
                          : isOpen
                            ? meal.color
                            : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {meal.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{meal.label}</p>
                      <p
                        className="text-xs"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {meal.time}
                      </p>
                    </div>
                  </div>
                  {isDone ? (
                    <CheckCircle2
                      className="h-5 w-5"
                      style={{ color: meal.color }}
                    />
                  ) : (
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={
                        isOpen
                          ? {
                              backgroundColor: "hsl(var(--accent) / 0.12)",
                              color: "hsl(var(--accent))",
                              border: "1px solid hsl(var(--accent) / 0.3)",
                            }
                          : {
                              backgroundColor: "hsl(var(--muted))",
                              color: "hsl(var(--muted-foreground))",
                            }
                      }
                    >
                      {isOpen ? (
                        <>
                          <Clock className="h-3 w-3" /> Open
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" /> Closed
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Opens/Closes info */}
                {winInfo && !isDone && (
                  <p
                    className="text-xs mb-3 flex items-center gap-1"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <Clock className="h-3 w-3 shrink-0" />
                    {isOpen
                      ? `Closes at ${winInfo.closeAt}`
                      : `Opens at ${winInfo.openAt}`}
                  </p>
                )}

                {/* Scan button */}
                <button
                  onClick={() => handleScan(meal.key)}
                  disabled={isDisabled}
                  className="w-full rounded-xl py-6 flex flex-col items-center gap-2 transition-all"
                  style={{
                    backgroundColor: isDone
                      ? meal.bgColor
                      : !isOpen
                        ? "hsl(var(--muted) / 0.3)"
                        : "hsl(var(--muted) / 0.5)",
                    border: `1.5px solid ${isDone ? meal.borderColor : isOpen ? "hsl(var(--accent) / 0.3)" : "hsl(var(--border))"}`,
                    cursor: isDisabled ? "default" : "pointer",
                    opacity:
                      !webAuthnStatus?.registered || (!isOpen && !isDone)
                        ? 0.55
                        : 1,
                  }}
                >
                  <div
                    style={{
                      color: isDone
                        ? meal.color
                        : isScanning
                          ? meal.color
                          : isOpen
                            ? "hsl(var(--accent))"
                            : "hsl(var(--muted-foreground))",
                      transition: "color 0.3s",
                    }}
                  >
                    {!isOpen && !isDone ? (
                      <Lock className="h-12 w-12" />
                    ) : state === "success" ? (
                      <CheckCircle2 className="h-12 w-12" />
                    ) : (
                      <Fingerprint
                        className={`h-12 w-12 ${isScanning ? "animate-pulse" : ""}`}
                      />
                    )}
                  </div>
                  <span
                    className="text-xs font-semibold text-center"
                    style={{
                      color: isDone
                        ? meal.color
                        : isScanning
                          ? meal.color
                          : isOpen
                            ? "hsl(var(--accent))"
                            : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {isScanning
                      ? "Place finger on sensor..."
                      : state === "success"
                        ? "✓ Verified!"
                        : isDone
                          ? "Already Marked"
                          : !webAuthnStatus?.registered
                            ? "Register fingerprint first"
                            : !isOpen
                              ? "Window closed"
                              : "Tap to Scan"}
                  </span>
                  {isScanning && (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      style={{ color: meal.color }}
                    />
                  )}
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly summary + history */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <h2 className="text-base font-bold font-display">Monthly Summary</h2>
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2"
            style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          >
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">
              {dayjs(currentMonth).format("MMMM YYYY")}
            </span>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="p-1 rounded-lg disabled:opacity-30"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {summary && (
            <div className="space-y-2">
              {MEALS.map((meal) => (
                <div
                  key={meal.key}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{
                    backgroundColor: meal.bgColor,
                    border: `1px solid ${meal.borderColor}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: meal.color }}>{meal.icon}</span>
                    <span className="text-sm font-medium">{meal.label}</span>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{ color: meal.color }}
                  >
                    {summary[meal.key]} days
                  </span>
                </div>
              ))}
              <div
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{ backgroundColor: "hsl(var(--muted))" }}
              >
                <span className="text-sm font-semibold">Total Meals</span>
                <span className="text-sm font-bold">{summary.total}</span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-base font-bold font-display mb-3">History</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <Card className="glass-card">
              <CardContent
                className="py-12 text-center"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No records for {dayjs(currentMonth).format("MMMM YYYY")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-110 overflow-y-auto pr-1">
              {Object.entries(grouped)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, records]) => (
                  <Card key={date} className="glass-card">
                    <CardContent className="py-3 px-4">
                      <p
                        className="text-xs font-semibold mb-2"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {dayjs(date).format("dddd, DD MMM YYYY")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {records.map((r) => (
                          <span
                            key={r._id}
                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${mealColor(r.meal_type)}18`,
                              color: mealColor(r.meal_type),
                              border: `1px solid ${mealColor(r.meal_type)}33`,
                            }}
                          >
                            {MEALS.find((m) => m.key === r.meal_type)?.iconSm}
                            <span className="capitalize">{r.meal_type}</span>
                            {r.source === "manual" && (
                              <span className="opacity-50">(manual)</span>
                            )}
                          </span>
                        ))}
                      </div>
                      <p
                        className="text-xs mt-1.5"
                        style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
                      >
                        {records.length} meal{records.length > 1 ? "s" : ""}
                        {records[0]?.scan_time &&
                          ` · ${dayjs(records[0].scan_time).format("h:mm A")}`}
                      </p>
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
