import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { forgotPasswordMock, resetPasswordMock, toastMock, navigateMock } = vi.hoisted(() => ({
  forgotPasswordMock: vi.fn(),
  resetPasswordMock: vi.fn(),
  toastMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('@/api/api-service', () => ({
  default: {
    auth: {
      forgotPassword: forgotPasswordMock,
      resetPassword: resetPasswordMock,
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

describe('auth pages', () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset();
    resetPasswordMock.mockReset();
    toastMock.mockReset();
    navigateMock.mockReset();
  });

  it('submits forgot password form', async () => {
    forgotPasswordMock.mockResolvedValue({
      message: 'If this email exists in our system, a password reset message has been sent.',
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'client@example.com' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: /Envoyer le lien de réinitialisation/i,
      }),
    );

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith('client@example.com');
      expect(toastMock).toHaveBeenCalled();
    });
  });

  it('submits reset password form', async () => {
    resetPasswordMock.mockResolvedValue({
      message: 'Password updated successfully',
    });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=test-token']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Mettre à jour le mot de passe/i }),
    );

    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith('test-token', 'secret123');
      expect(navigateMock).toHaveBeenCalledWith('/login');
    });
  });
});
