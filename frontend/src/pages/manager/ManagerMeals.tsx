import { useEffect, useState, useCallback } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  UtensilsCrossed,
  Calendar,
  Save,
  Star,
  Info,
} from "lucide-react";
import dayjs from "dayjs";

type MealType = "breakfast" | "lunch" | "dinner";

type Meal = {
  _id: string;
  meal_type: string;
  items: string[];
  is_special?: boolean;
  special_note?: string;
};

const MEAL_OPTIONS: MealType[] = ["breakfast", "lunch", "dinner"];

const MEAL_CONFIG: Record<
  string,
  {
    label: string;
    emoji: string;
    time: string;
    color: string;
    border: string;
    bg: string;
  }
> = {
  breakfast: {
    label: "Breakfast",
    emoji: "🌅",
    time: "7:30 – 9:00 AM",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.4)",
    bg: "rgba(245,158,11,0.06)",
  },
  lunch: {
    label: "Lunch",
    emoji: "☀️",
    time: "12:30 – 2:00 PM",
    color: "hsl(var(--primary))",
    border: "hsl(var(--primary)/0.4)",
    bg: "hsl(var(--primary)/0.05)",
  },
  dinner: {
    label: "Dinner",
    emoji: "🌙",
    time: "7:30 – 9:00 PM",
    color: "hsl(var(--accent))",
    border: "hsl(var(--accent)/0.4)",
    bg: "hsl(var(--accent)/0.05)",
  },
};

export default function ManagerMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<{
    meal_type: MealType;
    items: string[];
    is_special: boolean;
    special_note: string;
  }>({
    meal_type: "breakfast",
    items: [""],
    is_special: false,
    special_note: "",
  });

  const fetchMeals = useCallback(async () => {
    try {
      const res = await api.get<Meal[]>(`/menu/meals?date=${selectedDate}`);
      setMeals(res.data || []);
    } catch {
      // silently fail
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, ""] }));
  const removeItem = (i: number) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, v: string) =>
    setForm((p) => ({
      ...p,
      items: p.items.map((item, idx) => (idx === i ? v : item)),
    }));

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const items = form.items.filter((i) => i.trim());
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    try {
      setLoading(true);
      await api.post("/manager/meals", {
        date: selectedDate,
        meal_type: form.meal_type,
        items,
        is_special: form.is_special,
        special_note: form.is_special ? form.special_note || null : null,
      });
      toast.success("Meal saved!");
      setForm({
        meal_type: "breakfast",
        items: [""],
        is_special: false,
        special_note: "",
      });
      fetchMeals();
    } catch (err) {
      toast.error(
        (err as AxiosError<{ msg?: string }>)?.response?.data?.msg ||
          "Meal save failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const mc = MEAL_CONFIG[form.meal_type];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6" />
            Manage Meals
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Add daily meal menus · Fixed menu policy applies
          </p>
        </div>

        {/* Date picker */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{
            backgroundColor: "hsl(var(--muted)/0.5)",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <Calendar
            className="h-4 w-4 shrink-0"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Fixed menu policy notice */}
      <div
        className="flex items-start gap-2 rounded-xl px-4 py-3 mb-6 text-sm"
        style={{
          backgroundColor: "rgba(245,158,11,0.07)",
          border: "1px solid rgba(245,158,11,0.25)",
        }}
      >
        <Info
          className="h-4 w-4 mt-0.5 shrink-0"
          style={{ color: "#f59e0b" }}
        />
        <div>
          <p className="font-semibold text-xs" style={{ color: "#f59e0b" }}>
            Fixed Menu Policy
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Once a meal is added, it cannot be edited or deleted. If today's
            menu has changed, use the <strong>Notifications</strong> feature to
            inform students.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Form ── */}
        <Card
          className="glass-card"
          style={{ borderLeft: `3px solid ${mc.border}` }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <span className="text-lg">{mc.emoji}</span>
              Add Meal
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Meal type */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Meal Type</Label>
                <div className="flex gap-2">
                  {MEAL_OPTIONS.map((type) => {
                    const m = MEAL_CONFIG[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, meal_type: type }))
                        }
                        className="flex-1 rounded-xl py-2 text-xs font-semibold transition-all"
                        style={{
                          backgroundColor:
                            form.meal_type === type
                              ? m.bg
                              : "hsl(var(--muted)/0.5)",
                          color:
                            form.meal_type === type
                              ? m.color
                              : "hsl(var(--muted-foreground))",
                          border: `1.5px solid ${form.meal_type === type ? m.border : "hsl(var(--border))"}`,
                        }}
                      >
                        {m.emoji} {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Menu Items</Label>
                  <span
                    className="text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {form.items.filter((i) => i.trim()).length} item
                    {form.items.filter((i) => i.trim()).length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <div
                        className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: mc.bg, color: mc.color }}
                      >
                        {i + 1}
                      </div>
                      <Input
                        placeholder="e.g. Rice, Dal, Sabzi..."
                        value={item}
                        onChange={(e) => updateItem(i, e.target.value)}
                        className="flex-1"
                      />
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                          style={{
                            backgroundColor: "hsl(var(--destructive)/0.08)",
                            color: "hsl(var(--destructive))",
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>

              {/* Special toggle */}
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{
                  backgroundColor: form.is_special
                    ? "rgba(245,158,11,0.06)"
                    : "hsl(var(--muted)/0.4)",
                  border: `1px solid ${form.is_special ? "rgba(245,158,11,0.3)" : "hsl(var(--border))"}`,
                  transition: "all 0.2s",
                }}
              >
                <div className="flex items-center gap-2">
                  <Star
                    className="h-4 w-4"
                    style={{
                      color: form.is_special
                        ? "#f59e0b"
                        : "hsl(var(--muted-foreground))",
                      fill: form.is_special ? "#f59e0b" : "transparent",
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">Mark as Special Meal</p>
                    <p
                      className="text-xs"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      Students will be auto-notified
                    </p>
                  </div>
                </div>
                <Switch
                  checked={form.is_special}
                  onCheckedChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      is_special: v,
                      special_note: v ? p.special_note : "",
                    }))
                  }
                />
              </div>

              {/* Special note */}
              {form.is_special && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Special Note</Label>
                  <Textarea
                    placeholder="e.g. Festival special, Extra dessert today..."
                    value={form.special_note}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, special_note: e.target.value }))
                    }
                    rows={2}
                    className="resize-none"
                  />
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2"
                style={{
                  background:
                    "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)/0.85))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? "Saving..." : "Save Meal"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Meal list (read-only) ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold font-display">
              Meals for {dayjs(selectedDate).format("DD MMM YYYY")}
            </h2>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              {meals.length} / 3
            </span>
          </div>

          {meals.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <UtensilsCrossed className="h-10 w-10 opacity-20" />
                <p
                  className="text-sm"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  No meals added for this date yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => {
                const m = MEAL_CONFIG[meal.meal_type] ?? {
                  label: meal.meal_type,
                  emoji: "🍽️",
                  time: "",
                  color: "hsl(var(--primary))",
                  border: "hsl(var(--primary)/0.4)",
                  bg: "hsl(var(--primary)/0.05)",
                };
                return (
                  <Card
                    key={meal._id}
                    className="glass-card overflow-hidden"
                    style={{
                      borderLeft: `3px solid ${m.border}`,
                      boxShadow: meal.is_special
                        ? `0 0 0 1.5px ${m.color}44, 0 4px 16px ${m.color}14`
                        : undefined,
                    }}
                  >
                    <CardContent className="py-4 px-4">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-base">{m.emoji}</span>
                        <p className="font-semibold text-sm">{m.label}</p>
                        <span
                          className="text-xs"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {m.time}
                        </span>
                        {meal.is_special && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{
                              backgroundColor: `${m.color}15`,
                              color: m.color,
                              border: `1px solid ${m.color}44`,
                            }}
                          >
                            ✨ Special
                          </span>
                        )}
                      </div>

                      {/* Items */}
                      <ul className="space-y-1">
                        {meal.items.map((it, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: m.color }}
                            />
                            {it}
                          </li>
                        ))}
                      </ul>

                      {/* Special note */}
                      {meal.special_note && (
                        <div
                          className="mt-2 rounded-lg px-2.5 py-1.5 text-xs"
                          style={{
                            backgroundColor: `${m.color}10`,
                            color: m.color,
                          }}
                        >
                          📝 {meal.special_note}
                        </div>
                      )}

                      {/* Fixed menu note */}
                      <p
                        className="mt-2 text-xs"
                        style={{ color: "hsl(var(--muted-foreground)/0.5)" }}
                      >
                        🔒 Fixed — use Notifications if menu changes
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
