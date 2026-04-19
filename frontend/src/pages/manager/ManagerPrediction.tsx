import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  TrendingUp,
  Loader2,
  Coffee,
  Sun,
  Moon,
  RefreshCw,
  ShoppingBasket,
  CheckCircle2,
  AlertCircle,
  Info,
  BarChart2,
} from "lucide-react";
import dayjs from "dayjs";

/* ── Types ── */
interface MealPrediction {
  predicted_count: number;
  with_buffer: number;
  confidence: "high" | "medium" | "low" | "no_data";
  data_points: number;
  ingredients: Record<string, string>;
}

interface DayPrediction {
  date: string;
  day: string;
  short_day: string;
  meals: {
    breakfast: MealPrediction;
    lunch: MealPrediction;
    dinner: MealPrediction;
  };
}

interface PredictionResponse {
  generated_at: string;
  based_on_weeks: number;
  week_total_predicted: number;
  predictions: DayPrediction[];
}

interface AccuracyRow {
  date: string;
  day: string;
  meal_type: string;
  predicted: number;
  actual: number;
  diff: number;
  accuracy_pct: number | null;
}

interface AccuracyResponse {
  average_accuracy_pct: number | null;
  rows: AccuracyRow[];
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
    bg: "hsl(var(--primary) / 0.08)",
    border: "hsl(var(--primary) / 0.25)",
  },
  dinner: {
    label: "Dinner",
    icon: <Moon className="h-4 w-4" />,
    color: "hsl(var(--accent))",
    bg: "hsl(var(--accent) / 0.08)",
    border: "hsl(var(--accent) / 0.25)",
  },
};

const MEALS = ["breakfast", "lunch", "dinner"] as const;

/* ── Confidence badge ── */
function ConfidenceBadge({ level }: { level: string }) {
  const config = {
    high:    { label: "High Confidence",   color: "hsl(var(--accent))",       bg: "hsl(var(--accent)/0.1)",       icon: <CheckCircle2 className="h-3 w-3" /> },
    medium:  { label: "Medium Confidence", color: "hsl(38 92% 40%)",          bg: "rgba(245,158,11,0.1)",         icon: <AlertCircle  className="h-3 w-3" /> },
    low:     { label: "Low Confidence",    color: "hsl(var(--destructive))",   bg: "hsl(var(--destructive)/0.1)",  icon: <AlertCircle  className="h-3 w-3" /> },
    no_data: { label: "No Data",           color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))",         icon: <Info         className="h-3 w-3" /> },
  };
  const c = config[level as keyof typeof config] || config.no_data;
  return (
    <span
      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

export default function ManagerPrediction() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAccuracy, setLoadingAccuracy] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayPrediction | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<typeof MEALS[number]>("lunch");
  const [activeTab, setActiveTab] = useState<"prediction" | "accuracy">("prediction");

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const res = await api.get<PredictionResponse>("/prediction/next7days");
      setPrediction(res.data);
      if (res.data.predictions.length > 0) {
        setSelectedDay(res.data.predictions[0]);
      }
    } catch {
      toast.error("Failed to load prediction");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccuracy = async () => {
    setLoadingAccuracy(true);
    try {
      const res = await api.get<AccuracyResponse>("/prediction/accuracy");
      setAccuracy(res.data);
    } catch {
      // silently fail
    } finally {
      setLoadingAccuracy(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
    fetchAccuracy();
  }, []);

  const handleRefresh = () => {
    fetchPrediction();
    fetchAccuracy();
    toast.success("Prediction refreshed");
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Meal Prediction
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Next 7 days attendance forecast &amp; ingredient planning
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "hsl(var(--muted)/0.5)",
            color: "hsl(var(--muted-foreground))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Info banner */}
      <div
        className="mb-6 rounded-xl px-4 py-3 text-sm flex items-start gap-2"
        style={{
          backgroundColor: "hsl(var(--primary)/0.06)",
          border: "1px solid hsl(var(--primary)/0.2)",
        }}
      >
        <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          Predictions are based on last{" "}
          <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {prediction?.based_on_weeks || 8} weeks
          </span>{" "}
          of attendance data using weighted average — recent weeks have higher weight.
          A <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>10% buffer</span> is
          added to ingredient quantities to avoid shortage.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 rounded-xl p-1"
        style={{ backgroundColor: "hsl(var(--muted)/0.5)", width: "fit-content" }}
      >
        {(["prediction", "accuracy"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              backgroundColor: activeTab === tab ? "hsl(var(--background))" : "transparent",
              color: activeTab === tab ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tab === "prediction" ? "7-Day Forecast" : "Accuracy Report"}
          </button>
        ))}
      </div>

      {/* ══ PREDICTION TAB ══ */}
      {activeTab === "prediction" && (
        <>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
          ) : !prediction ? null : (
            <div className="grid gap-6 lg:grid-cols-3">

              {/* Left: 7-day list */}
              <div className="space-y-2">
                <h2 className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                  SELECT A DAY
                </h2>
                {prediction.predictions.map((day) => {
                  const isSelected = selectedDay?.date === day.date;
                  const totalPredicted = MEALS.reduce(
                    (s, m) => s + (day.meals[m]?.predicted_count || 0),
                    0
                  );
                  const isToday = day.date === dayjs().add(1, "day").format("YYYY-MM-DD");

                  return (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDay(day)}
                      className="w-full rounded-xl px-4 py-3 text-left transition-all"
                      style={{
                        backgroundColor: isSelected
                          ? "hsl(var(--primary)/0.1)"
                          : "hsl(var(--muted)/0.4)",
                        border: `1.5px solid ${isSelected ? "hsl(var(--primary)/0.4)" : "hsl(var(--border))"}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{day.day}</span>
                            {isToday && (
                              <span
                                className="text-xs rounded-full px-1.5 py-0.5 font-medium"
                                style={{
                                  backgroundColor: "hsl(var(--primary)/0.15)",
                                  color: "hsl(var(--primary))",
                                }}
                              >
                                Tomorrow
                              </span>
                            )}
                          </div>
                          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {dayjs(day.date).format("DD MMM YYYY")}
                          </span>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-lg font-bold"
                            style={{ color: isSelected ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
                          >
                            {totalPredicted}
                          </p>
                          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            total meals
                          </p>
                        </div>
                      </div>

                      {/* Mini meal bars */}
                      <div className="mt-2 flex gap-1.5">
                        {MEALS.map((meal) => {
                          const count = day.meals[meal]?.predicted_count || 0;
                          const m = MEAL_CONFIG[meal];
                          return (
                            <div key={meal} className="flex-1">
                              <div
                                className="h-1 rounded-full"
                                style={{ backgroundColor: count > 0 ? m.color : "hsl(var(--border))", opacity: count > 0 ? 0.7 : 1 }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}

                {/* Week total */}
                <div
                  className="rounded-xl px-4 py-3 mt-2"
                  style={{
                    backgroundColor: "hsl(var(--muted)/0.6)",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Week Total (predicted)
                  </p>
                  <p className="text-xl font-bold">{prediction.week_total_predicted} meals</p>
                </div>
              </div>

              {/* Right: Selected day detail */}
              {selectedDay && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold font-display">{selectedDay.day}</h2>
                      <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {dayjs(selectedDay.date).format("DD MMMM YYYY")}
                      </p>
                    </div>

                    {/* Meal tabs */}
                    <div
                      className="flex gap-1 rounded-xl p-1"
                      style={{ backgroundColor: "hsl(var(--muted)/0.5)" }}
                    >
                      {MEALS.map((meal) => {
                        const m = MEAL_CONFIG[meal];
                        return (
                          <button
                            key={meal}
                            onClick={() => setSelectedMeal(meal)}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                            style={{
                              backgroundColor: selectedMeal === meal ? m.bg : "transparent",
                              color: selectedMeal === meal ? m.color : "hsl(var(--muted-foreground))",
                              border: `1px solid ${selectedMeal === meal ? m.border : "transparent"}`,
                            }}
                          >
                            {m.icon}
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected meal detail */}
                  {(() => {
                    const mealData = selectedDay.meals[selectedMeal];
                    const m = MEAL_CONFIG[selectedMeal];
                    if (!mealData) return null;

                    return (
                      <div className="space-y-4">
                        {/* Count cards */}
                        <div className="grid grid-cols-2 gap-3">
                          <Card
                            className="glass-card"
                            style={{ borderLeft: `3px solid ${m.color}` }}
                          >
                            <CardContent className="py-4 px-4">
                              <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Predicted Students
                              </p>
                              <p className="text-3xl font-bold" style={{ color: m.color }}>
                                {mealData.predicted_count}
                              </p>
                              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Based on {mealData.data_points} week{mealData.data_points !== 1 ? "s" : ""} of data
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="glass-card">
                            <CardContent className="py-4 px-4">
                              <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Prepare For (with 10% buffer)
                              </p>
                              <p className="text-3xl font-bold">
                                {mealData.with_buffer}
                              </p>
                              <div className="mt-1">
                                <ConfidenceBadge level={mealData.confidence} />
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Ingredients */}
                        {Object.keys(mealData.ingredients).length > 0 ? (
                          <Card className="glass-card">
                            <CardHeader className="pb-2 pt-4">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <ShoppingBasket className="h-4 w-4" style={{ color: m.color }} />
                                Ingredient Requirements
                                <span
                                  className="text-xs font-normal rounded-full px-2 py-0.5"
                                  style={{
                                    backgroundColor: m.bg,
                                    color: m.color,
                                  }}
                                >
                                  for {mealData.with_buffer} students
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {Object.entries(mealData.ingredients).map(([item, qty]) => (
                                  <div
                                    key={item}
                                    className="rounded-lg px-3 py-2.5"
                                    style={{
                                      backgroundColor: m.bg,
                                      border: `1px solid ${m.border}`,
                                    }}
                                  >
                                    <p
                                      className="text-xs mb-0.5"
                                      style={{ color: "hsl(var(--muted-foreground))" }}
                                    >
                                      {item.replace(/\s*\(.*?\)/g, "")}
                                    </p>
                                    <p className="font-bold text-sm" style={{ color: m.color }}>
                                      {qty}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="glass-card">
                            <CardContent className="py-8 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                              <Info className="h-6 w-6 mx-auto mb-2 opacity-40" />
                              <p className="text-sm">Not enough historical data to predict ingredients.</p>
                            </CardContent>
                          </Card>
                        )}

                        {/* All 3 meals quick summary */}
                        <Card className="glass-card">
                          <CardHeader className="pb-2 pt-4">
                            <CardTitle className="text-sm font-semibold">
                              All Meals — {selectedDay.day}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <div className="space-y-2">
                              {MEALS.map((meal) => {
                                const md = selectedDay.meals[meal];
                                const mc = MEAL_CONFIG[meal];
                                return (
                                  <div
                                    key={meal}
                                    className="flex items-center justify-between rounded-lg px-3 py-2"
                                    style={{ backgroundColor: mc.bg, border: `1px solid ${mc.border}` }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span style={{ color: mc.color }}>{mc.icon}</span>
                                      <span className="text-sm font-medium">{mc.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-bold" style={{ color: mc.color }}>
                                        {md?.predicted_count || 0} students
                                      </span>
                                      <ConfidenceBadge level={md?.confidence || "no_data"} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ ACCURACY TAB ══ */}
      {activeTab === "accuracy" && (
        <div className="space-y-4">
          {loadingAccuracy ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
          ) : !accuracy ? null : (
            <>
              {/* Overall accuracy */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-2">
                <Card className="glass-card" style={{ borderLeft: "3px solid hsl(var(--accent))" }}>
                  <CardContent className="py-4 px-4">
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Overall Accuracy
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "hsl(var(--accent))" }}>
                      {accuracy.average_accuracy_pct !== null
                        ? `${accuracy.average_accuracy_pct}%`
                        : "—"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Last 4 weeks average
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardContent className="py-4 px-4">
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Records Checked
                    </p>
                    <p className="text-3xl font-bold">{accuracy.rows.length}</p>
                    <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      meal predictions
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardContent className="py-4 px-4">
                    <p className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Model Status
                    </p>
                    <p className="text-sm font-bold mt-1" style={{ color: "hsl(var(--accent))" }}>
                      {accuracy.average_accuracy_pct === null
                        ? "Not enough data"
                        : accuracy.average_accuracy_pct >= 80
                        ? "✓ Good"
                        : accuracy.average_accuracy_pct >= 60
                        ? "⚠ Improving"
                        : "↑ Learning"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      More data = better accuracy
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Accuracy table */}
              {accuracy.rows.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No historical data to compare yet.</p>
                    <p className="text-xs mt-1">Accuracy report will appear after the first week of usage.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Predicted vs Actual</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2 max-h-110 overflow-y-auto pr-1">
                      {accuracy.rows.map((row, i) => {
                        const m = MEAL_CONFIG[row.meal_type as keyof typeof MEAL_CONFIG];
                        const acc = row.accuracy_pct;
                        const accColor =
                          acc === null ? "hsl(var(--muted-foreground))"
                          : acc >= 80 ? "hsl(var(--accent))"
                          : acc >= 60 ? "hsl(38 92% 40%)"
                          : "hsl(var(--destructive))";

                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-lg px-3 py-2.5 gap-3"
                            style={{
                              backgroundColor: "hsl(var(--muted)/0.4)",
                              border: "1px solid hsl(var(--border))",
                            }}
                          >
                            {/* Date + meal */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div>
                                <p className="text-xs font-semibold">
                                  {row.day},{" "}
                                  <span style={{ color: "hsl(var(--muted-foreground))" }}>
                                    {dayjs(row.date).format("DD MMM")}
                                  </span>
                                </p>
                                <span
                                  className="flex items-center gap-1 text-xs"
                                  style={{ color: m?.color }}
                                >
                                  {m?.icon}
                                  {m?.label}
                                </span>
                              </div>
                            </div>

                            {/* Predicted → Actual */}
                            <div className="flex items-center gap-4 shrink-0 text-sm">
                              <div className="text-center">
                                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                                  Predicted
                                </p>
                                <p className="font-semibold">{row.predicted}</p>
                              </div>
                              <span style={{ color: "hsl(var(--muted-foreground))" }}>→</span>
                              <div className="text-center">
                                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                                  Actual
                                </p>
                                <p className="font-semibold">{row.actual}</p>
                              </div>
                              <div className="text-center min-w-16">
                                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                                  Accuracy
                                </p>
                                <p className="font-bold" style={{ color: accColor }}>
                                  {acc !== null ? `${acc}%` : "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}