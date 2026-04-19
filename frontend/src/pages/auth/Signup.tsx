import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ChefHat, Loader2 } from "lucide-react";
import axios from "axios";

type Role = "student" | "manager" | "warden";

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "student" | "manager" | "warden",
    roll_number: "",
    department: "",
    year: "",
    room_number: "",
    phone: "",
  });

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSignup = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        roll_number: form.role === "student" ? form.roll_number : undefined,
        department: form.department,
        year: form.year ? Number(form.year) : undefined,
        room_number: form.room_number,
        phone: form.phone,
      });

      toast.success("Account created successfully");
      navigate("/login");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.msg || "Signup failed");
      } else {
        toast.error("Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <ChefHat
              className="h-7 w-7"
              style={{ color: "hsl(var(--primary-foreground))" }}
            />
          </div>
          <h1 className="text-3xl font-bold font-display">MessHub</h1>
          <p className="mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            Create your account
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="font-display">Sign Up</CardTitle>
            <CardDescription>Join the mess management system</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Institute Email</Label>
                <Input
                  type="email"
                  placeholder="you@iiitg.ac.in"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v: Role) => update("role", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="manager">Mess Manager</SelectItem>
                    <SelectItem value="warden">Warden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.role === "student" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Roll Number</Label>
                    <Input
                      placeholder="e.g. 2201175"
                      value={form.roll_number}
                      onChange={(e) => update("roll_number", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Department</Label>
                      <Input
                        placeholder="CSE"
                        value={form.department}
                        onChange={(e) => update("department", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Year</Label>
                      <Input
                        type="number"
                        placeholder="2"
                        min={1}
                        max={5}
                        value={form.year}
                        onChange={(e) => update("year", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Room No.</Label>
                      <Input
                        placeholder="329"
                        value={form.room_number}
                        onChange={(e) => update("room_number", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input
                        placeholder="9876543210"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary"
                style={{ color: "hsl(var(--primary-foreground))" }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Account
              </Button>
            </form>

            <p
              className="mt-4 text-center text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
