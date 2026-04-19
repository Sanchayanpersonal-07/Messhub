import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/** Route guard that redirects unauthenticated users to login */
export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { userId, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: "hsl(var(--primary))" }}
        />
      </div>
    );
  }

  if (!userId) return <Navigate to="/login" replace />;

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={`/${role ?? ""}`} replace />;
  }

  return <>{children}</>;
}
