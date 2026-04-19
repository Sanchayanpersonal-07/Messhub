import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  UtensilsCrossed,
  MessageSquare,
  CalendarCheck,
  Fingerprint,
  ArrowRight,
  Star,
} from "lucide-react";
import dayjs from "dayjs";

type Meal = {
  _id: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  items?: string[];
  is_special?: boolean;
  special_note?: string;
};

const MEAL_CONFIG = {
  breakfast: {
    label: "Breakfast",
    emoji: "🌅",
    time: "7:30 – 9:00 AM",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.35)",
    bg: "rgba(245,158,11,0.07)",
  },
  lunch: {
    label: "Lunch",
    emoji: "☀️",
    time: "12:30 – 2:00 PM",
    color: "hsl(var(--primary))",
    border: "hsl(var(--primary)/0.4)",
    bg: "hsl(var(--primary)/0.06)",
  },
  dinner: {
    label: "Dinner",
    emoji: "🌙",
    time: "7:30 – 9:00 PM",
    color: "hsl(var(--accent))",
    border: "hsl(var(--accent)/0.4)",
    bg: "hsl(var(--accent)/0.06)",
  },
};

const STAT_CONFIG = [
  {
    key: "meals",
    title: "Today's Meals",
    icon: <UtensilsCrossed className="h-5 w-5" />,
    color: "hsl(var(--primary))",
    border: "hsl(var(--primary))",
    href: "/student/menu",
  },
  {
    key: "attendance",
    title: "Meals Attended",
    icon: <Fingerprint className="h-5 w-5" />,
    color: "hsl(var(--accent))",
    border: "hsl(var(--accent))",
    href: "/student/attendance",
  },
  {
    key: "feedback",
    title: "Feedback Given",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "#f59e0b",
    border: "#f59e0b",
    href: "/student/feedback",
  },
  {
    key: "duties",
    title: "Duties Assigned",
    icon: <CalendarCheck className="h-5 w-5" />,
    color: "hsl(var(--destructive))",
    border: "hsl(var(--destructive))",
    href: "/student/duties",
  },
];

const QUICK_ACTIONS = [
  {
    label: "Mark Attendance",
    icon: <Fingerprint className="h-4 w-4" />,
    href: "/student/attendance",
    color: "hsl(var(--accent))",
    bg: "hsl(var(--accent)/0.1)",
  },
  {
    label: "Give Feedback",
    icon: <Star className="h-4 w-4" />,
    href: "/student/feedback",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  {
    label: "View Duties",
    icon: <CalendarCheck className="h-4 w-4" />,
    href: "/student/duties",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary)/0.1)",
  },
];

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    meals: 0,
    attendance: 0,
    feedback: 0,
    duties: 0,
  });
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/student")
      .then((res) => {
        setTodayMeals(res.data.todayMeals || []);
        setStats(res.data.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "there";
  const hour = dayjs().hour();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">
            {greeting}, {firstName}! 👋
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            {dayjs().format("dddd, DD MMMM YYYY")} · Here's your mess overview
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

      {/* Today's Menu */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-display">Today's Menu</h2>
        <Link
          to="/student/menu"
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70"
          style={{ color: "hsl(var(--primary))" }}
        >
          Full menu <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl"
              style={{ backgroundColor: "hsl(var(--muted)/0.5)" }}
            />
          ))}
        </div>
      ) : todayMeals.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <UtensilsCrossed className="h-10 w-10 opacity-20" />
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              No meals scheduled for today yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {todayMeals.map((meal) => {
            const mc = MEAL_CONFIG[meal.meal_type];
            return (
              <Card
                key={meal._id}
                className="glass-card overflow-hidden"
                style={{
                  borderLeft: `3px solid ${mc.border}`,
                  boxShadow: meal.is_special
                    ? `0 0 0 1.5px ${mc.color}55, 0 4px 20px ${mc.color}22`
                    : undefined,
                }}
              >
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{mc.emoji}</span>
                      <div>
                        <p className="font-semibold">{mc.label}</p>
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
                        className="rounded-full px-2 py-0.5 text-xs font-semibold animate-pulse"
                        style={{
                          backgroundColor: `${mc.color}22`,
                          color: mc.color,
                          border: `1px solid ${mc.color}55`,
                        }}
                      >
                        ✨ Special
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pb-4">
                  <ul className="space-y-1">
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
                    <p
                      className="mt-2.5 text-xs italic rounded-lg px-2.5 py-1.5"
                      style={{
                        backgroundColor: `${mc.color}10`,
                        color: mc.color,
                      }}
                    >
                      📝 {meal.special_note}
                    </p>
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
