import type { ReactNode } from "react";

/** Reusable stat card for dashboards */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  variant?: "default" | "primary" | "accent" | "warning" | "destructive";
}

const variantStyles = {
  default: {
    backgroundColor: "hsl(var(--card))",
    borderColor: "hsl(var(--border))",
  },
  primary: {
    backgroundColor: "hsl(var(--primary) / 0.1)",
    borderColor: "hsl(var(--primary) / 0.2)",
  },
  accent: {
    backgroundColor: "hsl(var(--accent) / 0.1)",
    borderColor: "hsl(var(--accent) / 0.2)",
  },
  warning: {
    backgroundColor: "hsl(var(--warning) / 0.1)",
    borderColor: "hsl(var(--warning) / 0.2)",
  },
  destructive: {
    backgroundColor: "hsl(var(--destructive) / 0.1)",
    borderColor: "hsl(var(--destructive) / 0.2)",
  },
};

const iconStyles = {
  default: {
    backgroundColor: "hsl(var(--muted))",
    color: "hsl(var(--muted-foreground))",
  },
  primary: {
    backgroundColor: "hsl(var(--primary) / 0.2)",
    color: "hsl(var(--primary))",
  },
  accent: {
    backgroundColor: "hsl(var(--accent) / 0.2)",
    color: "hsl(var(--accent))",
  },
  warning: {
    backgroundColor: "hsl(var(--warning) / 0.2)",
    color: "hsl(var(--warning))",
  },
  destructive: {
    backgroundColor: "hsl(var(--destructive) / 0.2)",
    color: "hsl(var(--destructive))",
  },
};


export function StatCard({ title, value, icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border p-5 animate-slide-up" style={variantStyles[variant]}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{title}</p>
          <p className="mt-1 text-2xl font-bold font-display">{value}</p>
          {trend && <p className="mt-1 text-xs" style={{ color: "hsl(var(--accent))" }}>{trend}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={iconStyles[variant]}>
          {icon}
        </div>
      </div>
    </div>
  );
}
