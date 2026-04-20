import { useEffect, useState, useCallback } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import {
  startRegistration,
  startAuthentication,
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
} from "lucide-react";
import dayjs from "dayjs";

/* ── Types ── */
interface MarkedToday {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
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

/* ── Meal config ── */
const MEALS = [
  {
    key: "breakfast" as const,
    label: "Breakfast",
    icon: <Coffee className="h-5 w-5" />,
    time: "7:30 AM – 9:00 AM",
    color: "#f59e0b",
    bgColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.3)",
  },
  {
    key: "lunch" as const,
    label: "Lunch",
    icon: <Sun className="h-5 w-5" />,
    time: "12:30 PM – 2:00 PM",
    color: "hsl(var(--primary))",
    bgColor: "hsl(var(--primary) / 0.08)",
    borderColor: "hsl(var(--primary) / 0.3)",
  },
  {
    key: "dinner" as const,
    label: "Dinner",
    icon: <Moon className="h-5 w-5" />,
    time: "7:30 PM – 9:00 PM",
    color: "hsl(var(--accent))",
    bgColor: "hsl(var(--accent) / 0.08)",
    borderColor: "hsl(var(--accent) / 0.3)",
  },
];

type ScanState = "idle" | "scanning" | "success" | "already";

export default function StudentAttendance() {
  /* ── State ── */
  const [webAuthnStatus, setWebAuthnStatus] = useState<WebAuthnStatus | null>(
    null,
  );
  const [registering, setRegistering] = useState(false);
  const [scanState, setScanState] = useState<Record<string, ScanState>>({
    breakfast: "idle",
    lunch: "idle",
    dinner: "idle",
  });
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs().format("YYYY-MM"));
  const [loading, setLoading] = useState(true);

  /* ── Fetch WebAuthn registration status ── */
  const fetchWebAuthnStatus = useCallback(async () => {
    try {
      const res = await api.get<WebAuthnStatus>("/attendance/webauthn/status");
      setWebAuthnStatus(res.data);
    } catch {
      /* silent */
    }
  }, []);

  /* ── Fetch today's marked status ── */
  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await api.get<{ marked: MarkedToday }>("/attendance/check");
      const newState = {
        breakfast: "idle",
        lunch: "idle",
        dinner: "idle",
      } as Record<string, ScanState>;
      Object.entries(res.data.marked).forEach(([meal, marked]) => {
        if (marked) newState[meal] = "already";
      });
      setScanState(newState);
    } catch {
      /* silent */
    }
  }, []);

  /* ── Fetch monthly history ── */
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
    fetchHistory(currentMonth);
  }, [currentMonth, fetchHistory]);

  /* ════════════════════════════════════════════════════
     🖐️  FINGERPRINT REGISTRATION
     একবার করলেই হবে — পরে প্রতিটা scan এ use হবে
  ════════════════════════════════════════════════════ */
  const handleRegisterFingerprint = async () => {
    setRegistering(true);
    try {
      // Step 1: Server থেকে registration options নাও
      const optionsRes = await api.get("/attendance/webauthn/register-options");

      // Step 2: Browser এর fingerprint prompt দেখাও
      // এখানে phone/laptop এর biometric sensor activate হবে
      let registrationResponse;
      try {
        registrationResponse = await startRegistration({
          optionsJSON: optionsRes.data,
        });
      } catch (browserErr: unknown) {
        const err = browserErr as { name?: string; message?: string };
        if (err.name === "NotAllowedError") {
          toast.error("Fingerprint scan cancelled. Please try again.");
        } else if (err.name === "NotSupportedError") {
          toast.error(
            "Your device doesn't support fingerprint. Please use a device with biometric sensor.",
          );
        } else {
          toast.error(err.message || "Fingerprint registration failed.");
        }
        return;
      }

      // Step 3: Server এ verify করো + save করো
      await api.post(
        "/attendance/webauthn/register-verify",
        registrationResponse,
      );

      toast.success(
        "🎉 Fingerprint registered! You can now scan for attendance.",
      );
      await fetchWebAuthnStatus();
    } catch (err) {
      const msg = (err as AxiosError<{ msg?: string }>)?.response?.data?.msg;
      toast.error(msg || "Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  /* ════════════════════════════════════════════════════
     🖐️  FINGERPRINT SCAN FOR ATTENDANCE
     প্রতিটা meal এর সময় করতে হবে
  ════════════════════════════════════════════════════ */
  const handleScan = async (meal_type: string) => {
    const state = scanState[meal_type];
    if (state === "already" || state === "scanning" || state === "success")
      return;

    // Fingerprint register করা না থাকলে — register করতে বলো
    if (!webAuthnStatus?.registered) {
      toast.error("Please register your fingerprint first.");
      return;
    }

    setScanState((p) => ({ ...p, [meal_type]: "scanning" }));

    try {
      // Step 1: Server থেকে auth challenge নাও
      const optionsRes = await api.get("/attendance/webauthn/auth-options");

      // Step 2: Phone এর fingerprint prompt দেখাও
      let authResponse;
      try {
        authResponse = await startAuthentication({
          optionsJSON: optionsRes.data,
        });
      } catch (browserErr: unknown) {
        const err = browserErr as { name?: string; message?: string };
        if (err.name === "NotAllowedError") {
          toast.error("Fingerprint scan cancelled.");
        } else {
          toast.error(err.message || "Fingerprint scan failed.");
        }
        setScanState((p) => ({ ...p, [meal_type]: "idle" }));
        return;
      }

      // Step 3: Server এ verify করো + attendance mark করো
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
        toast.info("Attendance already marked for this meal.");
      } else {
        setScanState((p) => ({ ...p, [meal_type]: "idle" }));
        toast.error(msg || "Scan failed. Please try again.");
      }
    }
  };

  /* ── Month navigation ── */
  const prevMonth = () =>
    setCurrentMonth(dayjs(currentMonth).subtract(1, "month").format("YYYY-MM"));
  const nextMonth = () => {
    const next = dayjs(currentMonth).add(1, "month").format("YYYY-MM");
    if (next <= dayjs().format("YYYY-MM")) setCurrentMonth(next);
  };
  const isCurrentMonth = currentMonth === dayjs().format("YYYY-MM");

  /* ── Group history by date ── */
  const grouped = history.reduce<Record<string, AttendanceRecord[]>>(
    (acc, r) => {
      if (!acc[r.date]) acc[r.date] = [];
      acc[r.date].push(r);
      return acc;
    },
    {},
  );

  const mealColor = (type: string) => {
    if (type === "breakfast") return "#f59e0b";
    if (type === "lunch") return "hsl(var(--primary))";
    return "hsl(var(--accent))";
  };

  const mealIconSmall = (type: string) => {
    if (type === "breakfast") return <Coffee className="h-3.5 w-3.5" />;
    if (type === "lunch") return <Sun className="h-3.5 w-3.5" />;
    return <Moon className="h-3.5 w-3.5" />;
  };

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Fingerprint className="h-6 w-6" />
          Attendance
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          {dayjs().format("dddd, DD MMMM YYYY")}
        </p>
      </div>

      {/* ══════════════════════════════════════════════════
          🖐️  Fingerprint Registration Banner
          Register করা না থাকলে এই banner দেখাবে
      ══════════════════════════════════════════════════ */}
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
              Register your fingerprint once to mark attendance. Your actual
              fingerprint is never stored — only a secure cryptographic key.
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

      {/* ── Fingerprint registered badge ── */}
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
          {/* Re-register option */}
          <button
            onClick={handleRegisterFingerprint}
            disabled={registering}
            className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <RefreshCw className="h-3 w-3" />
            Re-register
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          Meal scan cards
      ══════════════════════════════════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {MEALS.map((meal) => {
          const state = scanState[meal.key];
          const isScanning = state === "scanning";
          const isDone = state === "already" || state === "success";
          const isDisabled =
            isDone || isScanning || !webAuthnStatus?.registered;

          return (
            <Card
              key={meal.key}
              className="glass-card overflow-hidden"
              style={{
                borderLeft: `3px solid ${isDone ? meal.color : "hsl(var(--border))"}`,
                transition: "border-color 0.4s ease",
              }}
            >
              <CardContent className="pt-5 pb-5">
                {/* Meal label row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        color: isDone
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
                  {isDone && (
                    <CheckCircle2
                      className="h-5 w-5"
                      style={{ color: meal.color }}
                    />
                  )}
                </div>

                {/* Fingerprint scan button */}
                <button
                  onClick={() => handleScan(meal.key)}
                  disabled={isDisabled}
                  className="w-full rounded-xl py-6 flex flex-col items-center gap-2 transition-all"
                  style={{
                    backgroundColor: isDone
                      ? meal.bgColor
                      : !webAuthnStatus?.registered
                        ? "hsl(var(--muted) / 0.3)"
                        : "hsl(var(--muted) / 0.5)",
                    border: `1.5px solid ${
                      isDone ? meal.borderColor : "hsl(var(--border))"
                    }`,
                    cursor: isDisabled ? "default" : "pointer",
                    opacity: !webAuthnStatus?.registered ? 0.5 : 1,
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      color: isDone
                        ? meal.color
                        : isScanning
                          ? meal.color
                          : "hsl(var(--muted-foreground))",
                      transition: "color 0.3s",
                    }}
                  >
                    {state === "success" ? (
                      <CheckCircle2 className="h-12 w-12" />
                    ) : (
                      <Fingerprint
                        className={`h-12 w-12 ${isScanning ? "animate-pulse" : ""}`}
                      />
                    )}
                  </div>

                  {/* Status text */}
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: isDone
                        ? meal.color
                        : isScanning
                          ? meal.color
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

      {/* ══════════════════════════════════════════════════
          Monthly summary + history (unchanged)
      ══════════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Summary */}
        <div className="space-y-3">
          <h2 className="text-base font-bold font-display">Monthly Summary</h2>

          {/* Month picker */}
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2"
            style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          >
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg transition-colors"
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
              className="p-1 rounded-lg transition-colors disabled:opacity-30"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Stat cards */}
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

        {/* History */}
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
                            {mealIconSmall(r.meal_type)}
                            <span className="capitalize">{r.meal_type}</span>
                            {r.source === "manual" && (
                              <span className="opacity-50 text-xs">
                                (manual)
                              </span>
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
