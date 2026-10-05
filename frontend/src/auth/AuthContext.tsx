import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { api, extractErrorMessage, getCsrfCookie } from '@/api/client';
import type {
  Company,
  LoginSpaResponse,
  MeResponse,
  Permission,
  Role,
  User,
} from '@/types/auth';

export interface AuthContextValue {
  user: User | null;
  roles: Role[];
  permissions: Permission[];
  companies: Company[];
  activeCompany: Company | null;
  isSuperAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setCompanies([]);
    setActiveCompany(null);
    setIsSuperAdmin(false);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get<MeResponse>('/me');
      setUser(data.user);
      setRoles(data.roles);
      setPermissions(data.permissions);
      setActiveCompany(data.active_company);
      setIsSuperAdmin(Boolean(data.user.is_super_admin));
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    (async () => {
      await refreshMe();
      setLoading(false);
    })();
  }, [refreshMe]);

  useEffect(() => {
    const handler = () => clearAuth();
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [clearAuth]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        await getCsrfCookie();
        const { data } = await api.post<LoginSpaResponse>('/login', {
          username,
          password,
          client_type: 'spa',
        });
        setUser(data.user);
        setRoles(data.roles);
        setCompanies(data.companies);
        await refreshMe();
      } catch (error) {
        throw new Error(extractErrorMessage(error));
      }
    },
    [refreshMe],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // ignore
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        companies,
        activeCompany,
        isSuperAdmin,
        loading,
        login,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}