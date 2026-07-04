import React, { createContext, useEffect, useState } from "react";
import apiService from "@/api/api-service";

interface AuthUser {
  id: string;
  email: string;
  profile?: any;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  profile: any | null;
  signOut: () => Promise<void>;
  login: (userData: AuthUser) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    let initialUser: AuthUser | null = null;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        initialUser = userData;
        setUser(userData);
        setIsAdmin(userData.role === "admin");
        setProfile(userData.profile || null);
      } catch {
        localStorage.removeItem("user");
      }
    }

    async function validateSession() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data: any = await apiService.auth.profile();
        if (!data) {
          setUser(null);
          setIsAdmin(false);
          setProfile(null);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        } else {
          const mergedUser = {
            ...(initialUser || {}),
            id: (initialUser as any)?.id || data.userId || "",
            email: (initialUser as any)?.email || data.email || "",
            profile: data,
            role: data.role,
          } as AuthUser;
          setUser(mergedUser);
          setIsAdmin(mergedUser.role === "admin");
          setProfile(data);
          localStorage.setItem("user", JSON.stringify(mergedUser));
        }
      } catch {
        // token invalid or expired
        setUser(null);
        setIsAdmin(false);
        setProfile(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }

      setLoading(false);
    }

    validateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
    setIsAdmin(userData.role === "admin");
    setProfile(userData.profile || null);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const signOut = async () => {
    setUser(null);
    setIsAdmin(false);
    setProfile(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, profile, signOut, login }}>
      {children}
    </AuthContext.Provider>
  );
};
