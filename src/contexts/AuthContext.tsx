import { createContext, useContext, type ReactNode } from "react";
import type { UserRole } from "@/types";

/**
 * Authentication was removed from this application: the system is used
 * directly on the shop floor without login. This context keeps a single
 * virtual operator with full (manager) access so existing screens keep
 * working without an account.
 */
interface AuthContextValue {
  profile: { name: string };
  role: UserRole;
  loading: boolean;
}

const VALUE: AuthContextValue = {
  profile: { name: "Operador" },
  role: "manager",
  loading: false,
};

const AuthContext = createContext<AuthContextValue>(VALUE);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={VALUE}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
