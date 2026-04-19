import { useEffect, useState, useCallback } from "react";
import api from "@/services/axiosInstance";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Shuffle, ClipboardList, Calendar, Users } from "lucide-react";
import dayjs from "dayjs";

interface Student {
  _id: string;
  name: string;
  department: string;
  room_number: string;
}

interface Duty {
  _id: string;
  duty_date: string;
  student_id: Student;
}

export default function WardenDuties() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [duties, setDuties] = useState<Duty[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDuties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Duty[]>(`/warden/duties?date=${date}`);
      setDuties(res.data || []);
    } catch {
      toast.error("Failed to load duties");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDuties();
  }, [fetchDuties]);

  const assignRandomDuties = async () => {
    try {
      setAssigning(true);
      await api.post("/warden/duties/random", { date });
      toast.success("Random duties assigned!");
      fetchDuties();
    } catch {
      toast.error("Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  // department → color mapping for avatar variety
  const deptColor = (dept: string) => {
    const colors = [
      "hsl(var(--primary))",
      "hsl(var(--accent))",
      "#f59e0b",
      "#8b5cf6",
      "#06b6d4",
    ];
    let hash = 0;
    for (let i = 0; i < (dept || "").length; i++) hash += dept.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Duty Management
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Assign and view mess duty schedules
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date picker */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
            style={{
              backgroundColor: "hsl(var(--muted)/0.5)",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <Calendar
              className="h-3.5 w-3.5"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm outline-none"
            />
          </div>

          <Button
            onClick={assignRandomDuties}
            disabled={assigning}
            className="gap-2"
            style={{
              background:
                "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)/0.85))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            {assigning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4" />
            )}
            Assign Random
          </Button>
        </div>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3">
          <Card
            className="glass-card"
            style={{ borderLeft: "3px solid hsl(var(--primary))" }}
          >
            <CardContent className="py-4 px-4">
              <p
                className="text-2xl font-bold"
                style={{ color: "hsl(var(--primary))" }}
              >
                {duties.length}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Students on Duty
              </p>
            </CardContent>
          </Card>
          <Card
            className="glass-card"
            style={{ borderLeft: "3px solid hsl(var(--accent))" }}
          >
            <CardContent className="py-4 px-4">
              <p
                className="text-lg font-bold"
                style={{ color: "hsl(var(--accent))" }}
              >
                {dayjs(date).format("ddd, DD MMM")}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Selected Date
              </p>
            </CardContent>
          </Card>
          <Card
            className="glass-card hidden sm:block"
            style={{ borderLeft: "3px solid #f59e0b" }}
          >
            <CardContent className="py-4 px-4">
              <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
                {new Set(duties.map((d) => d.student_id?.department)).size}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Departments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2
            className="h-7 w-7 animate-spin"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
        </div>
      ) : duties.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-3 py-14">
            <Users className="h-10 w-10 opacity-20" />
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              No duties assigned for {dayjs(date).format("DD MMM YYYY")}.
            </p>
            <Button
              onClick={assignRandomDuties}
              disabled={assigning}
              size="sm"
              className="gap-2 mt-1"
              style={{
                background:
                  "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)/0.85))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              {assigning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Shuffle className="h-3.5 w-3.5" />
              )}
              Assign Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {duties.map((d, i) => {
            const color = deptColor(d.student_id?.department || "");
            return (
              <Card
                key={d._id}
                className="glass-card overflow-hidden"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <CardContent className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {d.student_id?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate">
                          {d.student_id?.name || "—"}
                        </p>
                        <span
                          className="text-xs shrink-0 rounded-full px-2 py-0.5 font-medium"
                          style={{
                            backgroundColor: "hsl(var(--muted))",
                            color: "hsl(var(--muted-foreground))",
                          }}
                        >
                          #{i + 1}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {d.student_id?.department || "—"}
                      </p>
                      {d.student_id?.room_number && (
                        <p
                          className="text-xs"
                          style={{ color: "hsl(var(--muted-foreground)/0.7)" }}
                        >
                          Room {d.student_id.room_number}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
