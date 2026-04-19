import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/axiosInstance";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  UtensilsCrossed,
  MessageSquare,
  CalendarCheck,
  LogOut,
  Menu,
  ChefHat,
  Bell,
  Fingerprint,
  TrendingUp,
  IndianRupee,
  Sun,
  Moon,
  BarChart2,
} from "lucide-react";

/* ── Dark mode helpers ── */
function getInitialDark(): boolean {
  try {
    const saved = localStorage.getItem("messhub-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function applyDark(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  try {
    localStorage.setItem("messhub-theme", dark ? "dark" : "light");
  } catch {
    /* localStorage unavailable — ignore */
  }
}

/* ── NavItem type — explicit so TypeScript knows icon is a React component ── */
interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  showBadge?: boolean;
}

/** Sidebar navigation items per role */
const navItems: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/student" },
    { label: "Menu", icon: UtensilsCrossed, path: "/student/menu" },
    { label: "Feedback", icon: MessageSquare, path: "/student/feedback" },
    { label: "My Duties", icon: CalendarCheck, path: "/student/duties" },
    {
      label: "Notifications",
      icon: Bell,
      path: "/student/notifications",
      showBadge: true,
    },
    { label: "Attendance", icon: Fingerprint, path: "/student/attendance" },
    { label: "My Bill", icon: IndianRupee, path: "/student/bill" },
  ],
  manager: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/manager" },
    { label: "Meal Menu", icon: UtensilsCrossed, path: "/manager/meals" },
    { label: "Feedback", icon: MessageSquare, path: "/manager/feedback" },
    { label: "Menu Upload", icon: CalendarCheck, path: "/manager/menu-upload" },
    { label: "Notifications", icon: Bell, path: "/manager/notifications" },
    { label: "Attendance", icon: Fingerprint, path: "/manager/attendance" },
    { label: "Prediction", icon: TrendingUp, path: "/manager/prediction" },
  ],
  warden: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/warden" },
    { label: "Analytics", icon: BarChart2, path: "/warden/analytics" },
    { label: "Feedback", icon: MessageSquare, path: "/warden/feedback" },
    {
      label: "Duty Reports",
      icon: CalendarCheck,
      path: "/warden/duty-reports",
    },
    {
      label: "Duty Management",
      icon: CalendarCheck,
      path: "/warden/duty-management",
    },
    { label: "Mess Bills", icon: IndianRupee, path: "/warden/bills" },
  ],
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Dark mode state ── */
  const [isDark, setIsDark] = useState<boolean>(() => {
    const dark = getInitialDark();
    applyDark(dark);
    return dark;
  });

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyDark(next);
      return next;
    });
  }, []);

  /* ── Unread notification count (student only) ── */
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (role !== "student") return;

    const fetchUnread = async () => {
      try {
        const res = await api.get<{ isRead: boolean }[]>(
          "/notifications/student",
        );
        const count = (res.data || []).filter((n) => !n.isRead).length;
        setUnreadCount(count);
      } catch {
        /* silent — badge stays as-is on network error */
      }
    };

    fetchUnread();

    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [role]);

  // Derive displayed count — hide badge when already on notifications page
  // (no setState needed — avoids synchronous setState-in-effect warning)
  const displayedUnread =
    location.pathname === "/student/notifications" ? 0 : unreadCount;

  const items = role ? navItems[role] : [];

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: "hsl(var(--foreground) / 0.3)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 gradient-sidebar 
          transform transition-transform duration-300 lg:translate-x-0 lg:static
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ color: "hsl(var(--sidebar-foreground))" }}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className="flex items-center gap-3 border-b px-6 py-5"
            style={{ borderColor: "hsl(var(--sidebar-border))" }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <ChefHat
                className="h-5 w-5"
                style={{ color: "hsl(var(--primary-foreground))" }}
              />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display">MessHub</h1>
              <p
                className="text-xs capitalize"
                style={{ color: "hsl(var(--sidebar-foreground) / 0.6)" }}
              >
                {role} Panel
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {items.map((item) => {
              const isActive =
                item.path === "/student" ||
                item.path === "/manager" ||
                item.path === "/warden"
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

              // Show badge only for the Notifications item (student)
              const showBadge =
                "showBadge" in item && item.showBadge && unreadCount > 0;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  style={
                    isActive
                      ? {
                          backgroundColor: "hsl(var(--sidebar-primary))",
                          color: "hsl(var(--sidebar-primary-foreground))",
                        }
                      : { color: "hsl(var(--sidebar-foreground) / 0.7)" }
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover-accent"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>

                  {/* 🔴 Unread badge */}
                  {showBadge && displayedUnread > 0 && (
                    <span
                      className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                      style={{
                        backgroundColor: "hsl(var(--destructive))",
                        color: "#fff",
                        animation:
                          "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                      }}
                    >
                      {displayedUnread > 99 ? "99+" : displayedUnread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info + dark mode toggle + logout */}
          <div
            className="border-t p-4 space-y-3"
            style={{ borderColor: "hsl(var(--sidebar-border))" }}
          >
            {/* User info */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shrink-0"
                style={{
                  backgroundColor: "hsl(var(--sidebar-accent))",
                  color: "hsl(var(--sidebar-foreground))",
                }}
              >
                {profile?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {profile?.name || "User"}
                </p>
                <p
                  className="truncate text-xs"
                  style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}
                >
                  {profile?.email}
                </p>
              </div>
            </div>

            {/* Dark mode toggle + Logout row */}
            <div className="flex items-center gap-2">
              {/* 🌙 Dark mode toggle */}
              <button
                onClick={toggleDark}
                className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "hsl(var(--sidebar-accent))",
                  color: "hsl(var(--sidebar-foreground) / 0.8)",
                }}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <>
                    <Sun
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: "#f59e0b" }}
                    />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: "hsl(var(--sidebar-foreground) / 0.7)" }}
                    />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              {/* Logout */}
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:bg-sidebar-accent hover:text-destructive"
                style={{ color: "hsl(var(--sidebar-foreground) / 0.7)" }}
                onClick={signOut}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <header
          className="sticky top-0 z-30 flex items-center gap-4 border-b backdrop-blur-md px-4 py-3 lg:hidden"
          style={{
            backgroundColor: "hsl(var(--background) / 0.8)",
            borderColor: "hsl(var(--border))",
          }}
        >
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="text-lg font-display font-bold flex-1">MessHub</h1>

          {/* Dark mode toggle (mobile header) */}
          <button
            onClick={toggleDark}
            className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ backgroundColor: "hsl(var(--muted))" }}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? (
              <Sun className="h-4 w-4" style={{ color: "#f59e0b" }} />
            ) : (
              <Moon
                className="h-4 w-4"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
            )}
          </button>

          {/* Notification bell (mobile, student only) */}
          {role === "student" && (
            <Link
              to="/student/notifications"
              className="relative h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <Bell
                className="h-4 w-4"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              {displayedUnread > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold"
                  style={{
                    backgroundColor: "hsl(var(--destructive))",
                    color: "#fff",
                    fontSize: "10px",
                  }}
                >
                  {displayedUnread > 99 ? "99+" : displayedUnread}
                </span>
              )}
            </Link>
          )}
        </header>

        <div className="p-4 md:p-6 lg:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
