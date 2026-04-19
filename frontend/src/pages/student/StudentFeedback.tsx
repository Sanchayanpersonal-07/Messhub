import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Star,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  Info,
  Camera,
  X,
  ImageIcon,
} from "lucide-react";
import dayjs from "dayjs";

interface Meal {
  _id: string;
  meal_type: string;
  date: string;
}

interface Attendance {
  date: string;
  meal_type: string;
}

interface Feedback {
  _id: string;
  meal_id: Meal;
  rating: number;
  category: string;
  comment?: string;
  image_url?: string;
  priority?: "high" | "medium" | "low";
  status?: "reported" | "in_progress" | "resolved";
  action_taken?: string;
  createdAt?: string;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: "🌅 Breakfast",
  lunch: "☀️ Lunch",
  dinner: "🌙 Dinner",
};

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  taste: { label: "Taste", emoji: "😋" },
  hygiene: { label: "Hygiene", emoji: "🧹" },
  quantity: { label: "Quantity", emoji: "🍽️" },
  others: { label: "Others", emoji: "💬" },
};

const STATUS_CONFIG = {
  reported: {
    label: "Reported",
    icon: <Clock className="h-3 w-3" />,
    bg: "hsl(var(--muted))",
    text: "hsl(var(--muted-foreground))",
    dot: "#94a3b8",
    border: "hsl(var(--muted-foreground) / 0.3)",
    cardBorder: "hsl(var(--muted-foreground) / 0.25)",
  },
  in_progress: {
    label: "In Progress",
    icon: <AlertCircle className="h-3 w-3" />,
    bg: "rgba(245,158,11,0.1)",
    text: "hsl(38 92% 40%)",
    dot: "#f59e0b",
    border: "rgba(245,158,11,0.35)",
    cardBorder: "#f59e0b",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle2 className="h-3 w-3" />,
    bg: "hsl(var(--accent) / 0.1)",
    text: "hsl(var(--accent))",
    dot: "hsl(var(--accent))",
    border: "hsl(var(--accent) / 0.4)",
    cardBorder: "hsl(var(--accent))",
  },
};

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    emoji: "🔴",
    bg: "hsl(var(--destructive)/0.08)",
    text: "hsl(var(--destructive))",
    border: "hsl(var(--destructive)/0.3)",
  },
  medium: {
    label: "Medium",
    emoji: "🟡",
    bg: "rgba(245,158,11,0.08)",
    text: "hsl(38 92% 40%)",
    border: "rgba(245,158,11,0.3)",
  },
  low: {
    label: "Low",
    emoji: "🟢",
    bg: "hsl(var(--accent)/0.08)",
    text: "hsl(var(--accent))",
    border: "hsl(var(--accent)/0.3)",
  },
};

export default function StudentFeedback() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [history, setHistory] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    meal_id: "",
    rating: 0,
    category: "",
    comment: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mealRes, attendanceRes, feedbackRes] = await Promise.all([
          api.get<Meal[]>("/student/meals/today"),
          api.get<Attendance[]>("/student/attendance"),
          api.get<Feedback[]>("/student/feedback"),
        ]);
        setMeals(mealRes.data || []);
        setAttendance(attendanceRes.data || []);
        setHistory(feedbackRes.data || []);
      } catch {
        toast.error("Failed to load feedback data");
      }
    };
    fetchData();
  }, []);

  const eligibleMeals = meals.filter((m) =>
    attendance.some((a) => a.date === m.date && a.meal_type === m.meal_type),
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.meal_id || !form.category || form.rating === 0) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      setLoading(true);

      // Use FormData to support optional image upload
      const formData = new FormData();
      formData.append("meal_id", form.meal_id);
      formData.append(
        "meal_type",
        meals.find((m) => m._id === form.meal_id)?.meal_type || "",
      );
      formData.append("rating", String(form.rating));
      formData.append("category", form.category);
      if (form.comment) formData.append("comment", form.comment);
      if (imageFile) formData.append("image", imageFile);

      await api.post("/student/feedback", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Feedback submitted!");
      setForm({ meal_id: "", rating: 0, category: "", comment: "" });
      removeImage();
      const res = await api.get<Feedback[]>("/student/feedback");
      setHistory(res.data || []);
    } catch (err) {
      const msg = (err as AxiosError<{ msg?: string }>)?.response?.data?.msg;
      toast.error(msg || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Feedback
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          Share your meal experience with the mess team
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Submit Form ── */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-base">
              Submit Feedback
            </CardTitle>
            <CardDescription>
              Only meals you have attended are shown
            </CardDescription>
          </CardHeader>

          <CardContent>
            {eligibleMeals.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 py-8 rounded-xl"
                style={{ backgroundColor: "hsl(var(--muted)/0.4)" }}
              >
                <Info
                  className="h-8 w-8 opacity-40"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                />
                <p
                  className="text-sm text-center"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  No attended meals found.
                  <br />
                  Mark your attendance first to give feedback.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Meal select */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Meal <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={form.meal_id}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, meal_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleMeals.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {MEAL_LABELS[m.meal_type] || m.meal_type}
                          {" — "}
                          {dayjs(m.date).format("DD MMM")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Rating <span className="text-red-400">*</span>
                  </Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, rating: star }))}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className="h-9 w-9"
                          style={{
                            fill:
                              star <= form.rating ? "#f59e0b" : "transparent",
                            color:
                              star <= form.rating
                                ? "#f59e0b"
                                : "hsl(var(--muted-foreground)/0.3)",
                            filter:
                              star <= form.rating
                                ? "drop-shadow(0 0 3px #f59e0b66)"
                                : "none",
                            transition: "all 0.15s",
                          }}
                        />
                      </button>
                    ))}
                    {form.rating > 0 && (
                      <span
                        className="ml-2 text-sm font-semibold"
                        style={{ color: "#f59e0b" }}
                      >
                        {
                          ["", "Poor", "Fair", "Good", "Great", "Excellent"][
                            form.rating
                          ]
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Category <span className="text-red-400">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(CATEGORY_LABELS).map(
                      ([val, { label, emoji }]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            setForm((p) => ({ ...p, category: val }))
                          }
                          className="rounded-full px-3 py-1.5 text-sm font-medium transition-all"
                          style={{
                            backgroundColor:
                              form.category === val
                                ? "hsl(var(--primary))"
                                : "hsl(var(--muted))",
                            color:
                              form.category === val
                                ? "hsl(var(--primary-foreground))"
                                : "hsl(var(--muted-foreground))",
                            border: `1.5px solid ${form.category === val ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                          }}
                        >
                          {emoji} {label}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Comment{" "}
                    <span
                      className="font-normal"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    placeholder="Share your experience in detail..."
                    value={form.comment}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, comment: e.target.value }))
                    }
                    maxLength={500}
                    rows={3}
                    className="resize-none"
                  />
                  <p
                    className="text-right text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {form.comment.length}/500
                  </p>
                </div>

                {/* Image upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" />
                    Photo Proof{" "}
                    <span
                      className="font-normal"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      (optional · max 5MB)
                    </span>
                  </Label>

                  {/* Hint text */}
                  <p
                    className="text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Attach a photo if you found a hygiene issue, insect, or any
                    visual evidence.
                  </p>

                  {imagePreview ? (
                    /* Preview */
                    <div
                      className="relative rounded-xl overflow-hidden"
                      style={{ border: "1.5px solid hsl(var(--border))" }}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: "hsl(var(--destructive))",
                          color: "#fff",
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div
                        className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-xs"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.55)",
                          color: "#fff",
                        }}
                      >
                        📎 {imageFile?.name}
                      </div>
                    </div>
                  ) : (
                    /* Upload zone */
                    <label
                      className="flex flex-col items-center gap-2 rounded-xl px-4 py-5 cursor-pointer transition-all hover:opacity-80"
                      style={{
                        backgroundColor: "hsl(var(--muted)/0.4)",
                        border: "1.5px dashed hsl(var(--border))",
                      }}
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "hsl(var(--primary)/0.08)" }}
                      >
                        <ImageIcon
                          className="h-5 w-5"
                          style={{ color: "hsl(var(--primary))" }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          Click to upload photo
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          JPG, PNG, WebP · max 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>

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
                    <Send className="h-4 w-4" />
                  )}
                  {loading ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* ── History ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-display">
              My Feedback History
            </h2>
            {history.length > 0 && (
              <span
                className="text-xs rounded-full px-2.5 py-1 font-medium"
                style={{
                  backgroundColor: "hsl(var(--muted))",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {history.length} total
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <MessageSquare className="h-10 w-10 opacity-20" />
                <p
                  className="text-sm"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  No feedback submitted yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-155 overflow-y-auto pr-1">
              {history.map((fb) => {
                const s = fb.status
                  ? STATUS_CONFIG[fb.status]
                  : STATUS_CONFIG.reported;
                const p = fb.priority ? PRIORITY_CONFIG[fb.priority] : null;

                return (
                  <Card
                    key={fb._id}
                    className="glass-card overflow-hidden"
                    style={{ borderLeft: `3px solid ${s.cardBorder}` }}
                  >
                    <CardContent className="py-4 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Meal + date + category */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">
                              {MEAL_LABELS[fb.meal_id?.meal_type]
                                ?.split(" ")
                                .slice(1)
                                .join(" ") || "Meal"}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              {fb.meal_id?.date
                                ? dayjs(fb.meal_id.date).format("DD MMM YYYY")
                                : ""}
                            </span>
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                              style={{
                                backgroundColor: "hsl(var(--muted))",
                                color: "hsl(var(--muted-foreground))",
                              }}
                            >
                              {CATEGORY_LABELS[fb.category]?.emoji}{" "}
                              {fb.category}
                            </span>
                          </div>

                          {/* Stars */}
                          <div className="mt-2 flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className="h-4 w-4"
                                style={{
                                  fill:
                                    star <= fb.rating
                                      ? "#f59e0b"
                                      : "transparent",
                                  color:
                                    star <= fb.rating
                                      ? "#f59e0b"
                                      : "hsl(var(--muted-foreground)/0.2)",
                                  filter:
                                    star <= fb.rating
                                      ? "drop-shadow(0 0 2px #f59e0b55)"
                                      : "none",
                                }}
                              />
                            ))}
                            <span
                              className="ml-1.5 text-xs font-medium"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              {fb.rating}/5
                            </span>
                          </div>

                          {/* Comment */}
                          {fb.comment && (
                            <p
                              className="mt-2 text-sm italic leading-relaxed"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              &ldquo;{fb.comment}&rdquo;
                            </p>
                          )}

                          {/* Image proof */}
                          {fb.image_url && (
                            <div className="mt-3">
                              <p
                                className="text-xs font-semibold mb-1.5 flex items-center gap-1"
                                style={{
                                  color: "hsl(var(--muted-foreground))",
                                }}
                              >
                                <Camera className="h-3 w-3" />
                                Photo Evidence
                              </p>
                              <a
                                href={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}/${fb.image_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
                                style={{
                                  border: "1.5px solid hsl(var(--border))",
                                }}
                              >
                                <img
                                  src={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}/${fb.image_url}`}
                                  alt="Feedback evidence"
                                  className="w-full max-h-48 object-cover"
                                />
                              </a>
                              <p
                                className="text-xs mt-1"
                                style={{
                                  color: "hsl(var(--muted-foreground))",
                                }}
                              >
                                Click to view full image
                              </p>
                            </div>
                          )}

                          {/* Manager Response */}
                          {fb.action_taken && (
                            <div
                              className="mt-3 rounded-lg px-3 py-2.5"
                              style={{
                                backgroundColor: "hsl(var(--accent)/0.07)",
                                border: "1px solid hsl(var(--accent)/0.2)",
                                borderLeft: "3px solid hsl(var(--accent))",
                              }}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircle2
                                  className="h-3.5 w-3.5"
                                  style={{ color: "hsl(var(--accent))" }}
                                />
                                <p
                                  className="text-xs font-semibold uppercase tracking-wide"
                                  style={{ color: "hsl(var(--accent))" }}
                                >
                                  Manager Response
                                </p>
                              </div>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: "hsl(var(--foreground))" }}
                              >
                                {fb.action_taken}
                              </p>
                            </div>
                          )}

                          {/* Timestamp */}
                          {fb.createdAt && (
                            <p
                              className="mt-2.5 text-xs"
                              style={{
                                color: "hsl(var(--muted-foreground)/0.55)",
                              }}
                            >
                              Submitted{" "}
                              {dayjs(fb.createdAt).format(
                                "DD MMM YYYY, h:mm A",
                              )}
                            </p>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span
                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: s.bg,
                              color: s.text,
                              border: `1px solid ${s.border}`,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: s.dot }}
                            />
                            {s.icon}
                            {s.label}
                          </span>
                          {p && (
                            <span
                              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: p.bg,
                                color: p.text,
                                border: `1px solid ${p.border}`,
                              }}
                            >
                              <span>{p.emoji}</span>
                              {p.label}
                            </span>
                          )}
                        </div>
                      </div>
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
