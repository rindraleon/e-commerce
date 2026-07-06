import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '@/components/routes/ProtectedRoute';
import AdminRoute from '@/components/routes/AdminRoute';
import { AuthContext } from '@/contexts/AuthContext';
import { AuthUser, UserProfile } from '@/types/domain';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  profile: UserProfile | null;
  signOut: () => Promise<void>;
  login: (userData: AuthUser) => void;
  refreshProfile: () => Promise<void>;
}

function renderWithAuth(contextValue: AuthContextValue, initialEntries: string[]) {
  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/" element={<div>Home page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/orders" element={<div>Orders page</div>} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div>Admin page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

const baseContext: AuthContextValue = {
  user: null,
  loading: false,
  isAdmin: false,
  profile: null,
  signOut: async () => undefined,
  login: () => undefined,
  refreshProfile: async () => undefined,
};

describe('route guards', () => {
  it('redirects unauthenticated users to login for protected routes', () => {
    renderWithAuth(baseContext, ['/orders']);
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders protected route for authenticated client', () => {
    renderWithAuth(
      {
        ...baseContext,
        user: { id: '1', email: 'client@example.com', role: 'client' },
      },
      ['/orders'],
    );

    expect(screen.getByText('Orders page')).toBeInTheDocument();
  });

  it('blocks client users from admin routes', () => {
    renderWithAuth(
      {
        ...baseContext,
        user: { id: '1', email: 'client@example.com', role: 'client' },
      },
      ['/admin'],
    );

    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('renders admin route for administrators', () => {
    renderWithAuth(
      {
        ...baseContext,
        user: { id: '1', email: 'admin@example.com', role: 'admin' },
        isAdmin: true,
      },
      ['/admin'],
    );

    expect(screen.getByText('Admin page')).toBeInTheDocument();
  });
});
