import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ChefHat,
  ArrowRight,
  Star,
  ClipboardCheck,
  BarChart3,
} from "lucide-react";

/** Landing page — redirects logged-in users to their dashboard */
export default function Index() {
  const { userId, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userId && role) {
      navigate(`/${role}`, { replace: true });
    }
  }, [loading, userId, role, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: "hsl(var(--border) / 0.5)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <ChefHat
              className="h-5 w-5"
              style={{ color: "hsl(var(--primary-foreground))" }}
            />
          </div>
          <span className="text-lg font-bold font-display">MessHub</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button
            className="gradient-primary"
            style={{ color: "hsl(var(--primary-foreground))" }}
            onClick={() => navigate("/signup")}
          >
            Get Started
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero section */}
        <section className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-primary"
            style={{
              borderColor: "hsl(var(--primary) / 0.2)",
              backgroundColor: "hsl(var(--primary) / 0.05)",
            }}
          >
            <Star
              className="h-3.5 w-3.5"
              style={{ fill: "hsl(var(--primary))" }}
            />
            Smart Mess Management
          </div>
          <h1 className="max-w-3xl text-4xl font-bold font-display leading-tight md:text-6xl">
            Elevate Your
            <span className="gradient-primary bg-clip-text text-transparent inline-block">
              {" "}
              Mess Experience
            </span>
          </h1>
          <p
            className="mt-6 max-w-xl text-lg"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            A comprehensive feedback and management system for students, mess
            managers, and wardens. Track meals, mark attendance, submit
            feedback, and analyze trends — all in one place.
          </p>
          <div className="mt-8 flex gap-3">
            <Button
              size="lg"
              className="gradient-primary"
              style={{ color: "hsl(var(--primary-foreground))" }}
              onClick={() => navigate("/signup")}
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="hover-accent"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ClipboardCheck,
                title: "Smart Attendance",
                desc: "Fingerprint simulation for quick meal attendance marking",
              },
              {
                icon: Star,
                title: "Meal Feedback",
                desc: "Rate meals, categorize issues, and track resolution status",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                desc: "Real-time trends, priority sorting, and performance metrics",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-6 text-center animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: "hsl(var(--primary) / 0.1)",
                  }}
                >
                  <f.icon
                    className="h-6 w-6"
                    style={{ color: "hsl(var(--primary))" }}
                  />
                </div>
                <h3 className="text-lg font-bold font-display">{f.title}</h3>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer
        className="border-t py-6 text-center text-sm"
        style={{
          color: "hsl(var(--muted-foreground))",
          borderColor: "hsl(var(--border) / 0.5)",
        }}
      >
        © 2026 MessHub — Mess Food Feedback & Management System
      </footer>
    </div>
  );
}
