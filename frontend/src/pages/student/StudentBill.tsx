import { useEffect, useState } from "react";
import api from "@/services/axiosInstance";
import { AxiosError } from "axios";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  IndianRupee,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Send,
} from "lucide-react";

/* ── Types ── */
interface MessBill {
  _id: string;
  roll_number: string;
  student_name: string;
  month: string;
  month_key: string;
  days_of_month: number;
  sanctioned_leave: number;
  total_days_bill: number;
  rate_without_gst: number;
  amount_without_adjustment: number;
  waive_100_percent: number;
  waive_80_percent: number;
  total_without_gst: number;
  gst_amount: number;
  total_with_gst: number;
  remarks?: string;
  email_sent: boolean;
  createdAt: string;
}

interface BillIssue {
  _id: string;
  bill_id: { month: string; total_with_gst: number };
  issue_type: string;
  description: string;
  status: "open" | "under_review" | "resolved" | "rejected";
  warden_response?: string;
  createdAt: string;
}

const ISSUE_TYPES = [
  { value: "wrong_amount", label: "Wrong Amount Charged" },
  { value: "leave_not_applied", label: "Leave Not Applied" },
  { value: "extra_charge", label: "Extra / Duplicate Charge" },
  { value: "other", label: "Other Issue" },
];

const ISSUE_STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: <AlertCircle className="h-3 w-3" />,
    bg: "hsl(var(--destructive)/0.08)",
    text: "hsl(var(--destructive))",
    border: "hsl(var(--destructive)/0.3)",
  },
  under_review: {
    label: "Under Review",
    icon: <Clock className="h-3 w-3" />,
    bg: "rgba(245,158,11,0.08)",
    text: "hsl(38 92% 40%)",
    border: "rgba(245,158,11,0.3)",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle2 className="h-3 w-3" />,
    bg: "hsl(var(--accent)/0.08)",
    text: "hsl(var(--accent))",
    border: "hsl(var(--accent)/0.3)",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="h-3 w-3" />,
    bg: "hsl(var(--muted))",
    text: "hsl(var(--muted-foreground))",
    border: "hsl(var(--muted-foreground)/0.3)",
  },
};

export default function StudentBill() {
  const [bills, setBills] = useState<MessBill[]>([]);
  const [issues, setIssues] = useState<BillIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [raisingFor, setRaisingFor] = useState<string | null>(null); // bill_id
  const [submitting, setSubmitting] = useState(false);
  const [issueForm, setIssueForm] = useState({
    issue_type: "",
    description: "",
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [billRes, issueRes] = await Promise.all([
          api.get<MessBill[]>("/student/bill"),
          api.get<BillIssue[]>("/student/bill/issues"),
        ]);
        setBills(billRes.data || []);
        setIssues(issueRes.data || []);
      } catch {
        toast.error("Failed to load bills");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleRaiseIssue = async (bill_id: string) => {
    if (!issueForm.issue_type || !issueForm.description.trim()) {
      toast.error("Please fill both issue type and description");
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.post<{ issue: BillIssue }>("/student/bill/issue", {
        bill_id,
        issue_type: issueForm.issue_type,
        description: issueForm.description,
      });
      setIssues((p) => [res.data.issue, ...p]);
      toast.success("Issue raised! The warden will review it soon.");
      setRaisingFor(null);
      setIssueForm({ issue_type: "", description: "" });
    } catch (err) {
      toast.error(
        (err as AxiosError<{ msg?: string }>)?.response?.data?.msg ||
          "Failed to raise issue",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getIssueForBill = (bill_id: string) =>
    issues.find(
      (i) =>
        (i.bill_id as unknown as string) === bill_id ||
        (i.bill_id as MessBill)?._id === bill_id,
    );

  const fmt = (n: number) => `₹${n.toFixed(2)}`;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <IndianRupee className="h-6 w-6" />
          My Mess Bills
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          View your monthly mess bills and raise any discrepancies
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2
            className="h-7 w-7 animate-spin"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
        </div>
      ) : bills.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-3 py-14">
            <IndianRupee className="h-10 w-10 opacity-20" />
            <p style={{ color: "hsl(var(--muted-foreground))" }}>
              No bills uploaded yet.
            </p>
            <p
              className="text-xs text-center"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Your warden will upload the monthly bill and you'll receive an
              email.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => {
            const isExpanded = expandedBill === bill._id;
            const existingIssue = getIssueForBill(bill._id);
            const isRaising = raisingFor === bill._id;

            return (
              <Card
                key={bill._id}
                className="glass-card overflow-hidden"
                style={{ borderLeft: "3px solid hsl(var(--primary)/0.4)" }}
              >
                <CardContent className="py-4 px-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "hsl(var(--primary)/0.08)" }}
                      >
                        <Calendar
                          className="h-5 w-5"
                          style={{ color: "hsl(var(--primary))" }}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-base">{bill.month}</p>
                        <p
                          className="text-xs"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {bill.total_days_bill} billable days ·{" "}
                          {bill.sanctioned_leave} leave days
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p
                          className="text-xl font-bold"
                          style={{ color: "hsl(var(--primary))" }}
                        >
                          {fmt(bill.total_with_gst)}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          total payable
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setExpandedBill(isExpanded ? null : bill._id)
                        }
                        className="p-1.5 rounded-lg transition-colors"
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

                  {/* Expanded bill breakdown */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      {/* Bill table */}
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid hsl(var(--border))" }}
                      >
                        {[
                          {
                            label: "Days of Month",
                            value: `${bill.days_of_month} days`,
                          },
                          {
                            label: "Sanctioned Leave",
                            value: `${bill.sanctioned_leave} days`,
                          },
                          {
                            label: "Billable Days",
                            value: `${bill.total_days_bill} days`,
                          },
                          {
                            label: "Rate (excl. GST)",
                            value: `₹${bill.rate_without_gst.toFixed(4)}/day`,
                          },
                          {
                            label: "Amount (excl. GST)",
                            value: fmt(bill.amount_without_adjustment),
                          },
                          ...(bill.waive_100_percent > 0
                            ? [
                                {
                                  label: "100% Leave Waiver",
                                  value: `− ${fmt(bill.waive_100_percent)}`,
                                  green: true,
                                },
                              ]
                            : []),
                          ...(bill.waive_80_percent > 0
                            ? [
                                {
                                  label: "80% Leave Waiver",
                                  value: `− ${fmt(bill.waive_80_percent)}`,
                                  green: true,
                                },
                              ]
                            : []),
                          {
                            label: "Subtotal (excl. GST)",
                            value: fmt(bill.total_without_gst),
                          },
                          { label: "GST @ 5%", value: fmt(bill.gst_amount) },
                        ].map((row, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-3 py-2 text-sm"
                            style={{
                              borderBottom: "1px solid hsl(var(--border))",
                              color: (row as { green?: boolean }).green
                                ? "#16a34a"
                                : undefined,
                            }}
                          >
                            <span
                              style={{
                                color: (row as { green?: boolean }).green
                                  ? "#16a34a"
                                  : "hsl(var(--muted-foreground))",
                              }}
                            >
                              {row.label}
                            </span>
                            <span className="font-medium">{row.value}</span>
                          </div>
                        ))}
                        <div
                          className="flex items-center justify-between px-3 py-2.5"
                          style={{
                            backgroundColor: "hsl(var(--primary)/0.08)",
                          }}
                        >
                          <span className="font-bold">TOTAL PAYABLE</span>
                          <span
                            className="font-bold text-base"
                            style={{ color: "hsl(var(--primary))" }}
                          >
                            {fmt(bill.total_with_gst)}
                          </span>
                        </div>
                      </div>

                      {/* Remarks */}
                      {bill.remarks && (
                        <div
                          className="rounded-lg px-3 py-2 text-sm"
                          style={{
                            backgroundColor: "rgba(245,158,11,0.08)",
                            borderLeft: "3px solid #f59e0b",
                          }}
                        >
                          <p
                            className="text-xs font-semibold mb-0.5"
                            style={{ color: "#f59e0b" }}
                          >
                            Note from Warden
                          </p>
                          <p>{bill.remarks}</p>
                        </div>
                      )}

                      {/* Issue section */}
                      {existingIssue ? (
                        <div>
                          <p
                            className="text-xs font-semibold mb-2"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            YOUR RAISED ISSUE
                          </p>
                          <div
                            className="rounded-xl p-3"
                            style={{
                              backgroundColor:
                                ISSUE_STATUS_CONFIG[existingIssue.status].bg,
                              border: `1px solid ${ISSUE_STATUS_CONFIG[existingIssue.status].border}`,
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium capitalize">
                                {existingIssue.issue_type.replace(/_/g, " ")}
                              </span>
                              <span
                                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                                style={{
                                  backgroundColor:
                                    ISSUE_STATUS_CONFIG[existingIssue.status]
                                      .bg,
                                  color:
                                    ISSUE_STATUS_CONFIG[existingIssue.status]
                                      .text,
                                  border: `1px solid ${ISSUE_STATUS_CONFIG[existingIssue.status].border}`,
                                }}
                              >
                                {ISSUE_STATUS_CONFIG[existingIssue.status].icon}
                                {
                                  ISSUE_STATUS_CONFIG[existingIssue.status]
                                    .label
                                }
                              </span>
                            </div>
                            <p
                              className="text-sm italic"
                              style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              &ldquo;{existingIssue.description}&rdquo;
                            </p>
                            {existingIssue.warden_response && (
                              <div
                                className="mt-2 rounded-lg px-3 py-2"
                                style={{
                                  backgroundColor: "hsl(var(--accent)/0.08)",
                                  borderLeft: "2px solid hsl(var(--accent))",
                                }}
                              >
                                <p
                                  className="text-xs font-semibold mb-0.5"
                                  style={{ color: "hsl(var(--accent))" }}
                                >
                                  Warden Response
                                </p>
                                <p className="text-sm">
                                  {existingIssue.warden_response}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {isRaising ? (
                            <div
                              className="rounded-xl p-3 space-y-3"
                              style={{
                                backgroundColor: "hsl(var(--muted)/0.4)",
                                border: "1px solid hsl(var(--border))",
                              }}
                            >
                              <p
                                className="text-xs font-semibold"
                                style={{
                                  color: "hsl(var(--muted-foreground))",
                                }}
                              >
                                RAISE A BILL DISPUTE
                              </p>
                              <Select
                                value={issueForm.issue_type}
                                onValueChange={(v) =>
                                  setIssueForm((p) => ({ ...p, issue_type: v }))
                                }
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Select issue type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ISSUE_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                      {t.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Textarea
                                rows={3}
                                placeholder="Describe your issue in detail..."
                                className="resize-none text-sm"
                                value={issueForm.description}
                                onChange={(e) =>
                                  setIssueForm((p) => ({
                                    ...p,
                                    description: e.target.value,
                                  }))
                                }
                                maxLength={500}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={submitting}
                                  onClick={() => handleRaiseIssue(bill._id)}
                                  className="flex-1 gap-1.5 text-xs"
                                  style={{
                                    background:
                                      "linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary)/0.85))",
                                    color: "hsl(var(--primary-foreground))",
                                  }}
                                >
                                  {submitting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Send className="h-3.5 w-3.5" />
                                  )}
                                  Submit Issue
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRaisingFor(null);
                                    setIssueForm({
                                      issue_type: "",
                                      description: "",
                                    });
                                  }}
                                  className="text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRaisingFor(bill._id)}
                              className="gap-1.5 text-xs"
                              style={{
                                borderColor: "hsl(var(--destructive)/0.4)",
                                color: "hsl(var(--destructive))",
                              }}
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              Raise a Dispute
                            </Button>
                          )}
                        </div>
                      )}
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
