/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { getCurrentUser } from "@/services/userService";

type AppRole = "student" | "manager" | "warden";

interface DecodedToken {
  id: string;
  role: AppRole;
  exp: number;
}

interface UserProfile {
  name?: string;
  email?: string;
}

interface AuthContextType {
  userId: string | null;
  role: AppRole | null;
  loading: boolean;
  profile: UserProfile | null;
  signOut: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  role: null,
  loading: true,
  profile: null,
  signOut: () => {},
  refreshAuth: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const getInitialAuth = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        userId: null,
        role: null,
        profile: null,
        loading: false,
      };
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);

      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return {
          userId: null,
          role: null,
          profile: null,
          loading: false,
        };
      }

      return {
        userId: decoded.id,
        role: decoded.role,
        profile: null, // will be fetched
        loading: true, // 🔥 important change
      };
    } catch {
      localStorage.removeItem("token");
      return {
        userId: null,
        role: null,
        profile: null,
        loading: false,
      };
    }
  };

  const [auth, setAuth] = useState(getInitialAuth);

  // 🔥 Fetch profile only if user exists
  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.userId) return;

      try {
        const { data } = await getCurrentUser();

        setAuth((prev) => ({
          ...prev,
          profile: data,
          loading: false,
        }));
      } catch {
        setAuth((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    };

    fetchProfile();
  }, [auth.userId]);

  const signOut = () => {
    localStorage.removeItem("token");
    setAuth({
      userId: null,
      role: null,
      profile: null,
      loading: false,
    });
  };
  const refreshAuth = () => {
    setAuth(getInitialAuth());
  };
  
  return (
    <AuthContext.Provider
      value={{
        userId: auth.userId,
        role: auth.role,
        profile: auth.profile,
        loading: auth.loading,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
