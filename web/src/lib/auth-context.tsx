"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";

export type User = {
  id: string;
  email: string;
  business_name: string;
  account_slug: string;
  plan: string;
  trial_ends_at: string;
  effective_tier: string | null;
  is_admin?: boolean;
  has_billing_customer?: boolean;
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
};

const STORAGE_KEY = "kemisdisplay_token";

const AuthContext = createContext<{
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    loading: true,
  });

  const refreshUser = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    if (!token) {
      setState({ token: null, user: null, loading: false });
      return;
    }
    try {
      const res = await apiFetch("/auth/me", { token });
      if (!res.ok) {
        localStorage.removeItem(STORAGE_KEY);
        setState({ token: null, user: null, loading: false });
        return;
      }
      const user = (await res.json()) as User;
      setState({ token, user, loading: false });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setState({ token: null, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem(STORAGE_KEY);
    if (!t) {
      setState({ token: null, user: null, loading: false });
      return;
    }
    setState((s) => ({ ...s, token: t }));
    void (async () => {
      try {
        const res = await apiFetch("/auth/me", { token: t });
        if (!res.ok) {
          localStorage.removeItem(STORAGE_KEY);
          setState({ token: null, user: null, loading: false });
          return;
        }
        const user = (await res.json()) as User;
        setState({ token: t, user, loading: false });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState({ token: null, user: null, loading: false });
      }
    })();
  }, []);

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem(STORAGE_KEY, token);
    setState({ token, user, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ token: null, user: null, loading: false });
  }, []);

  const value = useMemo(
    () => ({
      token: state.token,
      user: state.user,
      loading: state.loading,
      login,
      logout,
      refreshUser,
    }),
    [state.token, state.user, state.loading, login, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
