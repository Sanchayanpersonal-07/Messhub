import { useState } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Loader2, CalendarDays, CheckCircle2, Calendar } from "lucide-react";
import dayjs from "dayjs";

interface DayRow {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

interface UploadResult {
  msg: string;
  weekStartDate: string;
  weekEndDate: string;
  weeksCount: number;
  weeksApplied: string[];
  totalInserted: number;
  extracted: DayRow[];
}

function getCurrentMonday(): string {
  const today = dayjs();
  const day = today.day();
  const diff = day === 0 ? -6 : 1 - day;
  return today.add(diff, "day").format("YYYY-MM-DD");
}

function isMonday(dateStr: string): boolean {
  return !!dateStr && dayjs(dateStr).day() === 1;
}

function countWeeks(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = dayjs(start);
  const e = dayjs(end);
  if (e.isBefore(s)) return 0;
  let count = 0;
  let cur = s;
  while (cur.isBefore(e) || cur.isSame(e, "day")) {
    count++;
    cur = cur.add(7, "day");
  }
  return count;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export default function MenuUpload() {
  const defaultMonday = getCurrentMonday();
  const defaultEnd = dayjs(defaultMonday).add(6, "day").format("YYYY-MM-DD");

  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState(defaultMonday);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const weeksCount = countWeeks(startDate, endDate);
  const startValid = isMonday(startDate);
  const endValid = !!endDate && !dayjs(endDate).isBefore(dayjs(startDate));
  const canSubmit = !!file && startValid && endValid && !loading;

  const handleUpload = async () => {
    if (!file || !startValid || !endValid) return;

    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("weekStartDate", startDate);
      formData.append("weekEndDate", endDate);

      const res = await api.post<UploadResult>("/menu/upload-chart", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data);
      toast.success(res.data.msg);
    } catch (err) {
      const msg = (err as AxiosError<{ msg?: string }>)?.response?.data?.msg;
      toast.error(msg || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display">Upload Mess Menu Chart</h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          Upload once — apply to any number of weeks in advance
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Menu Image &amp; Date Range
            </CardTitle>
            <CardDescription>
              The extracted menu will be saved for every week between start and end date
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Start Date */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Start Date <span className="text-xs opacity-60">(must be a Monday)</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {startDate && !startValid && (
                <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>
                  ✗ This is not a Monday — please pick a Monday
                </p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Week count preview */}
            {startValid && endValid && weeksCount > 0 && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  backgroundColor: "hsl(var(--accent) / 0.08)",
                  border: "1px solid hsl(var(--accent) / 0.2)",
                  color: "hsl(var(--accent))",
                }}
              >
                ✓ This menu will be applied to{" "}
                <strong>{weeksCount} week{weeksCount > 1 ? "s" : ""}</strong>
                {" "}({startDate} → {endDate})
              </div>
            )}

            {/* File Picker */}
            <div className="space-y-1.5">
              <Label>Menu Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setResult(null);
                }}
              />
              {file && (
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!canSubmit}
              className="w-full"
              style={{
                background: "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting &amp; saving {weeksCount} week{weeksCount > 1 ? "s" : ""}...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Extract &amp; Save Menu
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Card */}
        {result && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(var(--accent))" }} />
                Saved Successfully
              </CardTitle>
              <CardDescription>
                {result.totalInserted} meal slots saved across{" "}
                <strong>{result.weeksCount} week{result.weeksCount > 1 ? "s" : ""}</strong>
                {" "}({result.weekStartDate} → {result.weekEndDate})
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Weeks Applied */}
              {result.weeksCount > 1 && (
                <div
                  className="rounded-lg p-3 text-xs space-y-1"
                  style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
                >
                  <p className="font-semibold mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Weeks applied:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.weeksApplied.map((monday) => (
                      <span
                        key={monday}
                        className="rounded px-2 py-0.5"
                        style={{
                          backgroundColor: "hsl(var(--accent) / 0.1)",
                          color: "hsl(var(--accent))",
                        }}
                      >
                        {monday}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Menu Preview */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {result.extracted.map((row) => (
                  <div
                    key={row.day}
                    className="rounded-lg p-3 text-sm"
                    style={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
                  >
                    <p className="font-semibold mb-1 capitalize">{DAY_LABELS[row.day]}</p>
                    <div className="space-y-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <p>
                        <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          Breakfast:{" "}
                        </span>
                        {row.breakfast || "—"}
                      </p>
                      <p>
                        <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          Lunch:{" "}
                        </span>
                        {row.lunch || "—"}
                      </p>
                      <p>
                        <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          Dinner:{" "}
                        </span>
                        {row.dinner || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}