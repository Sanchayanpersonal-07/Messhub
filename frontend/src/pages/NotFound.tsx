import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, ArrowLeft, Utensils } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
    setTimeout(() => setMounted(true), 50);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* Subtle background blobs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: "hsl(var(--primary))" }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full blur-3xl opacity-15"
          style={{ backgroundColor: "hsl(var(--accent))" }}
        />
      </div>

      <div
        className="relative z-10 text-center"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-3xl"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.08)",
              border: "1.5px solid hsl(var(--primary) / 0.2)",
              boxShadow: "0 0 40px hsl(var(--primary) / 0.15)",
            }}
          >
            <Utensils
              className="h-10 w-10"
              style={{ color: "hsl(var(--primary))" }}
            />
            {/* Badge */}
            <span
              className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: "hsl(var(--destructive))",
                color: "#fff",
                boxShadow: "0 2px 8px hsl(var(--destructive) / 0.4)",
              }}
            >
              !
            </span>
          </div>
        </div>

        {/* 404 number */}
        <div className="relative mb-4">
          <p
            className="absolute inset-0 flex items-center justify-center select-none font-black"
            style={{
              fontSize: "clamp(120px, 20vw, 180px)",
              color: "hsl(var(--muted-foreground) / 0.06)",
              lineHeight: 1,
            }}
          >
            404
          </p>
          <h1
            className="relative font-black tracking-tight"
            style={{
              fontSize: "clamp(72px, 14vw, 120px)",
              lineHeight: 1,
              background:
                "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </h1>
        </div>

        {/* Message */}
        <h2 className="mb-2 text-xl font-bold font-display">Page Not Found</h2>
        <p
          className="mb-1 text-sm"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Looks like this page went missing — just like food from the mess!
        </p>
        <p
          className="mb-8 text-xs font-mono px-3 py-1.5 rounded-lg inline-block"
          style={{
            backgroundColor: "hsl(var(--muted))",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {location.pathname}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background:
                "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
              color: "hsl(var(--primary-foreground))",
              boxShadow: "0 4px 14px hsl(var(--primary) / 0.3)",
            }}
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
            style={{
              backgroundColor: "hsl(var(--muted))",
              color: "hsl(var(--muted-foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>

        {/* Branding */}
        <p
          className="mt-10 text-xs"
          style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
        >
          MessHub · IIITG
        </p>
      </div>
    </div>
  );
};

export default NotFound;
