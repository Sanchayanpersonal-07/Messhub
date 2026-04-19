import { useEffect, useState, useCallback } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Search,
  Mail,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import dayjs from "dayjs";

/* ── Types ── */
interface UploadResult {
  msg: string;
  month: string;
  total_rows: number;
  saved: number;
  updated: number;
  skipped_unregistered: number;
  email_sent: number;
  email_failed: number;
  not_registered: string[];
}

interface MessBill {
  _id: string;
  roll_number: string;
  student_name: string;
  course: string;
  gender: string;
  month: string;
  month_key: string;
  days_of_month: number;
  sanctioned_leave: number;
  total_days_bill: number;
  total_with_gst: number;
  email_sent: boolean;
  remarks?: string;
}

interface BillIssue {
  _id: string;
  student_id: { name: string; email: string; roll_number?: string };
  bill_id: { month: string; roll_number: string; total_with_gst: number };
  issue_type: string;
  description: string;
  status: "open" | "under_review" | "resolved" | "rejected";
  warden_response?: string;
  createdAt: string;
}

const ISSUE_STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: <AlertCircle className="h-3 w-3" />,
    bg: "hsl(var(--destructive)/0.08)",
    text: "hsl(var(--destructive))",
    dot: "hsl(var(--destructive))",
    border: "hsl(var(--destructive)/0.3)",
  },
  under_review: {
    label: "Under Review",
    icon: <Clock className="h-3 w-3" />,
    bg: "rgba(245,158,11,0.08)",
    text: "hsl(38 92% 40%)",
    dot: "#f59e0b",
    border: "rgba(245,158,11,0.3)",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle2 className="h-3 w-3" />,
    bg: "hsl(var(--accent)/0.08)",
    text: "hsl(var(--accent))",
    dot: "hsl(var(--accent))",
    border: "hsl(var(--accent)/0.3)",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="h-3 w-3" />,
    bg: "hsl(var(--muted))",
    text: "hsl(var(--muted-foreground))",
    dot: "#94a3b8",
    border: "hsl(var(--muted-foreground)/0.3)",
  },
};

export default function WardenBills() {
  const [activeTab, setActiveTab] = useState<"upload" | "bills" | "issues">(
    "upload",
  );

  /* Upload state */
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [sendEmail, setSendEmail] = useState(true);

  /* Bills list */
  const [bills, setBills] = useState<MessBill[]>([]);
  const [monthKey, setMonthKey] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [loadingBills, setLoadingBills] = useState(false);

  /* Issues */
  const [issues, setIssues] = useState<BillIssue[]>([]);
  const [issueFilter, setIssueFilter] = useState("all");
  const [issueSearch, setIssueSearch] = useState("");
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseMap, setResponseMap] = useState<
    Record<string, { status: string; warden_response: string }>
  >({});
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  /* ── Fetch bills ── */
  const fetchBills = useCallback(async () => {
    setLoadingBills(true);
    try {
      const params = monthKey ? `?month_key=${monthKey}` : "";
      const res = await api.get<{ bills: MessBill[] }>(
        `/warden/bills${params}`,
      );
      setBills(res.data.bills || []);
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoadingBills(false);
    }
  }, [monthKey]);

  /* ── Fetch issues ── */
  const fetchIssues = useCallback(async () => {
    setLoadingIssues(true);
    try {
      const params = issueFilter !== "all" ? `?status=${issueFilter}` : "";
      const res = await api.get<BillIssue[]>(`/warden/bills/issues${params}`);
      const data = res.data || [];
      setIssues(data);
      const map: Record<string, { status: string; warden_response: string }> =
        {};
      data.forEach((i) => {
        map[i._id] = {
          status: i.status,
          warden_response: i.warden_response || "",
        };
      });
      setResponseMap(map);
    } catch {
      toast.error("Failed to load issues");
    } finally {
      setLoadingIssues(false);
    }
  }, [issueFilter]);

  useEffect(() => {
    if (activeTab === "bills") fetchBills();
  }, [activeTab, fetchBills]);
  useEffect(() => {
    if (activeTab === "issues") fetchIssues();
  }, [activeTab, fetchIssues]);

  /* ── Upload Excel ── */
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("bill", file);
      formData.append("send_email", String(sendEmail));
      const res = await api.post<UploadResult>(
        "/warden/bills/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setUploadResult(res.data);
      const msg = sendEmail
        ? `${res.data.month} — ${res.data.saved} bills saved, ${res.data.email_sent} emails sent`
        : `${res.data.month} — ${res.data.saved} bills saved (no emails sent)`;
      toast.success(msg);
      setFile(null);
    } catch (err) {
      toast.error(
        (err as AxiosError<{ msg?: string }>)?.response?.data?.msg ||
          "Upload failed",
      );
    } finally {
      setUploading(false);
    }
  };

  /* ── Respond to issue ── */
  const handleRespond = async (id: string) => {
    const data = responseMap[id];
    if (!data) return;
    try {
      setRespondingId(id);
      await api.put(`/warden/bills/issues/${id}`, {
        status: data.status,
        warden_response: data.warden_response || null,
      });
      toast.success("Response saved");
      fetchIssues();
    } catch {
      toast.error("Failed to save response");
    } finally {
      setRespondingId(null);
    }
  };

  /* Filtered bills */
  const filteredBills = bills.filter(
    (b) =>
      !billSearch ||
      b.student_name.toLowerCase().includes(billSearch.toLowerCase()) ||
      b.roll_number.includes(billSearch),
  );

  /* Filtered issues */
  const filteredIssues = issues.filter(
    (i) =>
      !issueSearch ||
      i.student_id?.name?.toLowerCase().includes(issueSearch.toLowerCase()) ||
      i.student_id?.roll_number?.includes(issueSearch),
  );

  const openCount = issues.filter((i) => i.status === "open").length;

  const TABS = [
    {
      key: "upload" as const,
      label: "Upload Bill",
      icon: <Upload className="h-3.5 w-3.5" />,
    },
    {
      key: "bills" as const,
      label: "View Bills",
      icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
    },
    {
      key: "issues" as const,
      label: `Issues${openCount > 0 ? ` (${openCount})` : ""}`,
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <IndianRupee className="h-6 w-6" />
          Mess Bills
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          Upload monthly bills and manage student disputes
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 rounded-xl p-1 w-fit"
        style={{ backgroundColor: "hsl(var(--muted)/0.5)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor:
                activeTab === tab.key
                  ? "hsl(var(--background))"
                  : "transparent",
              color:
                activeTab === tab.key
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--muted-foreground))",
              boxShadow:
                activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ UPLOAD TAB ══ */}
      {activeTab === "upload" && (
        <div className="max-w-lg">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <FileSpreadsheet
                  className="h-4 w-4"
                  style={{ color: "hsl(var(--primary))" }}
                />
                Upload Monthly Mess Bill
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="rounded-xl p-4 text-sm space-y-1"
                style={{
                  backgroundColor: "hsl(var(--primary)/0.05)",
                  border: "1px solid hsl(var(--primary)/0.15)",
                }}
              >
                <p
                  className="font-semibold text-xs"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  What happens when you upload:
                </p>
                <ul
                  className="space-y-0.5 text-xs"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <li>✅ Excel is parsed row by row</li>
                  <li>✅ Each student's bill is saved to database</li>
                  <li>✅ Email with bill details sent to each student</li>
                  <li>✅ Students can raise disputes from their dashboard</li>
                </ul>
              </div>

              {/* File drop zone */}
              {file ? (
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: "hsl(var(--accent)/0.08)",
                    border: "1.5px solid hsl(var(--accent)/0.3)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet
                      className="h-5 w-5"
                      style={{ color: "hsl(var(--accent))" }}
                    />
                    <div>
                      <p className="text-sm font-semibold">{file.name}</p>
                      <p
                        className="text-xs"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setFile(null)}>
                    <X
                      className="h-4 w-4"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    />
                  </button>
                </div>
              ) : (
                <label
                  className="flex flex-col items-center gap-2 rounded-xl py-8 cursor-pointer transition-all hover:opacity-80"
                  style={{
                    backgroundColor: "hsl(var(--muted)/0.4)",
                    border: "2px dashed hsl(var(--border))",
                  }}
                >
                  <Upload className="h-8 w-8 opacity-40" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Click to upload Excel file
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      .xlsx or .xls · max 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}

              {/* Send email toggle */}
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{
                  backgroundColor: sendEmail
                    ? "hsl(var(--primary)/0.05)"
                    : "hsl(var(--muted)/0.4)",
                  border: `1px solid ${sendEmail ? "hsl(var(--primary)/0.2)" : "hsl(var(--border))"}`,
                  transition: "all 0.2s",
                }}
              >
                <div className="flex items-center gap-2">
                  <Mail
                    className="h-4 w-4"
                    style={{
                      color: sendEmail
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground))",
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      Send email to students
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {sendEmail
                        ? "Each registered student will receive their bill by email"
                        : "Bills will be saved but no emails will be sent"}
                    </p>
                  </div>
                </div>
                <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full gap-2"
                style={{
                  background:
                    "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)/0.85))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {uploading
                  ? "Processing..."
                  : sendEmail
                    ? "Upload & Send Bills by Email"
                    : "Upload Bills (No Email)"}
              </Button>

              {/* Upload result */}
              {uploadResult && (
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{
                    backgroundColor: "hsl(var(--accent)/0.06)",
                    border: "1px solid hsl(var(--accent)/0.2)",
                  }}
                >
                  <p
                    className="font-semibold text-sm flex items-center gap-1.5"
                    style={{ color: "hsl(var(--accent))" }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {uploadResult.month} — Upload Complete
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Total Rows", value: uploadResult.total_rows },
                      { label: "Bills Saved", value: uploadResult.saved },
                      {
                        label: "Not Registered",
                        value: uploadResult.skipped_unregistered ?? 0,
                      },
                      { label: "Emails Sent", value: uploadResult.email_sent },
                      {
                        label: "Emails Failed",
                        value: uploadResult.email_failed,
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg px-2.5 py-1.5"
                        style={{ backgroundColor: "hsl(var(--muted)/0.5)" }}
                      >
                        <p style={{ color: "hsl(var(--muted-foreground))" }}>
                          {s.label}
                        </p>
                        <p className="font-bold text-base">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {uploadResult.not_registered?.length > 0 && (
                    <div
                      className="rounded-lg px-3 py-2 text-xs"
                      style={{
                        backgroundColor: "rgba(245,158,11,0.08)",
                        borderLeft: "3px solid #f59e0b",
                      }}
                    >
                      <p
                        className="font-semibold mb-0.5"
                        style={{ color: "#f59e0b" }}
                      >
                        Skipped (not registered in system):
                      </p>
                      <p style={{ color: "hsl(var(--muted-foreground))" }}>
                        {uploadResult.not_registered.join(", ")}
                        {(uploadResult.skipped_unregistered ?? 0) > 10 &&
                          ` ... and ${(uploadResult.skipped_unregistered ?? 0) - 10} more`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══ BILLS TAB ══ */}
      {activeTab === "bills" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Input
                placeholder="Search by name or roll..."
                className="pl-9 h-9 text-sm"
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
              />
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
              style={{
                backgroundColor: "hsl(var(--muted)/0.5)",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <IndianRupee
                className="h-3.5 w-3.5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <input
                type="month"
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="bg-transparent text-sm outline-none"
                placeholder="Filter by month"
              />
            </div>
          </div>

          {/* Summary */}
          {!loadingBills && filteredBills.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <Card
                className="glass-card"
                style={{ borderLeft: "3px solid hsl(var(--primary))" }}
              >
                <CardContent className="py-3 px-4">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    {filteredBills.length}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Total Students
                  </p>
                </CardContent>
              </Card>
              <Card
                className="glass-card"
                style={{ borderLeft: "3px solid hsl(var(--accent))" }}
              >
                <CardContent className="py-3 px-4">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "hsl(var(--accent))" }}
                  >
                    {filteredBills.filter((b) => b.email_sent).length}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Emails Sent
                  </p>
                </CardContent>
              </Card>
              <Card
                className="glass-card"
                style={{ borderLeft: "3px solid #f59e0b" }}
              >
                <CardContent className="py-3 px-4">
                  <p className="text-lg font-bold" style={{ color: "#f59e0b" }}>
                    ₹
                    {filteredBills
                      .reduce((s, b) => s + b.total_with_gst, 0)
                      .toFixed(0)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Total Billed
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {loadingBills ? (
            <div className="flex justify-center py-12">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
            </div>
          ) : filteredBills.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center gap-3 py-14">
                <FileSpreadsheet className="h-10 w-10 opacity-20" />
                <p style={{ color: "hsl(var(--muted-foreground))" }}>
                  No bills found. Upload a bill first.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-130 overflow-y-auto pr-1">
              {filteredBills.map((b) => (
                <Card key={b._id} className="glass-card">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            backgroundColor: "hsl(var(--primary)/0.08)",
                            color: "hsl(var(--primary))",
                          }}
                        >
                          {b.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {b.student_name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {b.roll_number} · {b.course} · {b.total_days_bill}{" "}
                            days
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="font-bold text-sm">
                          ₹{b.total_with_gst.toFixed(2)}
                        </p>
                        <span
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={
                            b.email_sent
                              ? {
                                  backgroundColor: "hsl(var(--accent)/0.1)",
                                  color: "hsl(var(--accent))",
                                }
                              : {
                                  backgroundColor: "hsl(var(--muted))",
                                  color: "hsl(var(--muted-foreground))",
                                }
                          }
                        >
                          <Mail className="h-3 w-3" />
                          {b.email_sent ? "Sent" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ ISSUES TAB ══ */}
      {activeTab === "issues" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Input
                placeholder="Search student..."
                className="pl-9 h-9 text-sm"
                value={issueSearch}
                onChange={(e) => setIssueSearch(e.target.value)}
              />
            </div>
            <Select value={issueFilter} onValueChange={setIssueFilter}>
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issues</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p
            className="text-xs"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {filteredIssues.length} issue
            {filteredIssues.length !== 1 ? "s" : ""}
          </p>

          {loadingIssues ? (
            <div className="flex justify-center py-12">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
            </div>
          ) : filteredIssues.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center gap-3 py-14">
                <CheckCircle2 className="h-10 w-10 opacity-20" />
                <p style={{ color: "hsl(var(--muted-foreground))" }}>
                  No bill issues found.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue) => {
                const sc = ISSUE_STATUS_CONFIG[issue.status];
                const edit = responseMap[issue._id] ?? {
                  status: issue.status,
                  warden_response: issue.warden_response || "",
                };
                const isExpanded = expandedIssue === issue._id;
                const isDirty =
                  edit.status !== issue.status ||
                  edit.warden_response !== (issue.warden_response || "");

                return (
                  <Card
                    key={issue._id}
                    className="glass-card overflow-hidden"
                    style={{ borderLeft: `3px solid ${sc.border}` }}
                  >
                    <CardContent className="py-4 px-4">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: sc.bg, color: sc.text }}
                          >
                            {issue.student_id?.name?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">
                              {issue.student_id?.name}
                            </p>
                            <p
                              className="text-xs truncate"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              {issue.bill_id?.month} ·{" "}
                              {issue.issue_type.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: sc.bg,
                              color: sc.text,
                              border: `1px solid ${sc.border}`,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: sc.dot }}
                            />
                            {sc.icon}
                            {sc.label}
                          </span>
                          <button
                            onClick={() =>
                              setExpandedIssue(isExpanded ? null : issue._id)
                            }
                            className="p-1 rounded-lg"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <p
                        className="mt-2 text-sm italic"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        &ldquo;{issue.description}&rdquo;
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "hsl(var(--muted-foreground)/0.6)" }}
                      >
                        {dayjs(issue.createdAt).format("DD MMM YYYY, h:mm A")}
                      </p>

                      {/* Expanded — respond panel */}
                      {isExpanded && (
                        <div
                          className="mt-3 rounded-xl p-3 space-y-3"
                          style={{
                            backgroundColor: "hsl(var(--muted)/0.4)",
                            border: "1px solid hsl(var(--border))",
                          }}
                        >
                          <p
                            className="text-xs font-semibold"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            Update Response
                          </p>
                          <Select
                            value={edit.status}
                            onValueChange={(v) =>
                              setResponseMap((p) => ({
                                ...p,
                                [issue._id]: { ...p[issue._id], status: v },
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="under_review">
                                Under Review
                              </SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea
                            rows={2}
                            placeholder="Write your response to the student..."
                            className="text-xs resize-none"
                            value={edit.warden_response}
                            onChange={(e) =>
                              setResponseMap((p) => ({
                                ...p,
                                [issue._id]: {
                                  ...p[issue._id],
                                  warden_response: e.target.value,
                                },
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            disabled={!isDirty || respondingId === issue._id}
                            onClick={() => handleRespond(issue._id)}
                            className="w-full gap-1.5 text-xs"
                            style={{
                              background: isDirty
                                ? "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)/0.85))"
                                : undefined,
                              color: isDirty
                                ? "hsl(var(--primary-foreground))"
                                : undefined,
                            }}
                          >
                            {respondingId === issue._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {isDirty ? "Save Response" : "Saved"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
