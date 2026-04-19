import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Calendar,
} from "lucide-react";
import dayjs from "dayjs";

type Meal = {
  _id: string;
  meal_type: string;
  items?: string[];
  is_special?: boolean;
  special_note?: string;
};

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

export default function StudentMenu() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/student/meals?date=${selectedDate}`);
        setMeals(res.data || []);
      } catch {
        setMeals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, [selectedDate]);

  const prevDay = () =>
    setSelectedDate(
      dayjs(selectedDate).subtract(1, "day").format("YYYY-MM-DD"),
    );
  const nextDay = () =>
    setSelectedDate(dayjs(selectedDate).add(1, "day").format("YYYY-MM-DD"));
  const isToday = selectedDate === dayjs().format("YYYY-MM-DD");

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6" />
          Meal Menu
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          View today's and upcoming meal schedules
        </p>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={prevDay}
          className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
          style={{
            backgroundColor: "hsl(var(--muted))",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2 flex-1 max-w-xs"
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
            className="bg-transparent text-sm outline-none flex-1"
          />
        </div>

        <button
          onClick={nextDay}
          className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
          style={{
            backgroundColor: "hsl(var(--muted))",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {dayjs(selectedDate).format("dddd")}
          </span>
          <span
            className="text-xs"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {dayjs(selectedDate).format("DD MMMM YYYY")}
            {isToday && (
              <span
                className="ml-1.5 text-xs font-medium"
                style={{ color: "hsl(var(--primary))" }}
              >
                · Today
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-xl"
              style={{ backgroundColor: "hsl(var(--muted)/0.5)" }}
            />
          ))}
        </div>
      ) : meals.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-3 py-14">
            <UtensilsCrossed className="h-10 w-10 opacity-20" />
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              No meals scheduled for {dayjs(selectedDate).format("DD MMM YYYY")}
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {meals.map((meal) => {
            const mc = MEAL_CONFIG[meal.meal_type] ?? {
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
                  borderLeft: `3px solid ${mc.border}`,
                  boxShadow: meal.is_special
                    ? `0 0 0 1.5px ${mc.color}55, 0 4px 24px ${mc.color}18`
                    : undefined,
                }}
              >
                <CardHeader
                  className="pb-2 pt-4"
                  style={{ backgroundColor: `${mc.bg}` }}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{mc.emoji}</span>
                      <div>
                        <p className="text-sm font-bold">{mc.label}</p>
                        <p
                          className="text-xs font-normal"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {mc.time}
                        </p>
                      </div>
                    </div>
                    {meal.is_special && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: `${mc.color}18`,
                          color: mc.color,
                          border: `1px solid ${mc.color}44`,
                        }}
                      >
                        ✨ Special
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-3 pb-4">
                  <ul className="space-y-1.5">
                    {meal.items?.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: mc.color }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {meal.special_note && (
                    <div
                      className="mt-3 rounded-lg px-3 py-2 text-xs"
                      style={{
                        backgroundColor: `${mc.color}10`,
                        color: mc.color,
                        border: `1px solid ${mc.color}22`,
                      }}
                    >
                      📝 {meal.special_note}
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
