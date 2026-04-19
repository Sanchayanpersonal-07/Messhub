import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: string;
  role: "student" | "manager" | "warden";
  exp: number;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshAuth } = useAuth();

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login({ email, password });
      const { token } = res.data;
      // Save token
      localStorage.setItem("token", token);

      refreshAuth();

      const decoded = jwtDecode<DecodedToken>(token);

      navigate(`/${decoded.role}`, { replace: true });
      
      toast.success("Login successful");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.msg || "Login failed");
      } else {
        toast.error("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <ChefHat
              className="h-7 w-7"
              style={{ color: "hsl(var(--primary-foreground))" }}
            />
          </div>
          <h1 className="text-3xl font-bold font-display">MessHub</h1>
          <p className="mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            Mess Food Feedback & Management
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="font-display">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@iiitg.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary"
                style={{ color: "hsl(var(--primary-foreground))" }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Sign In
              </Button>
            </form>

            <p
              className="mt-4 text-center text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
