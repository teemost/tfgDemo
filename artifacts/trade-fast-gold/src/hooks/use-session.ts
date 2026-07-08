import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '@workspace/api-client-react';

const SESSION_QUERY_KEY = ['session', 'me'];

async function fetchSession(): Promise<UserProfile | null> {
  const response = await fetch('/api/users/me', {
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function parseJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `${response.status}: ${response.statusText}`);
  }
  return data;
}

/**
 * Tracks the current email/password session via the `/api/users/me`
 * endpoint, which returns 401 when there is no valid session cookie.
 */
export function useSession() {
  const { data: user, isLoading, isFetching } = useQuery<UserProfile | null>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  return {
    user: user ?? null,
    isLoading,
    isFetching,
    isAuthenticated: !!user,
  };
}

export function useInvalidateSession() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
}

export interface LoginValues {
  email: string;
  password: string;
}

export interface RegisterValues {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: LoginValues): Promise<UserProfile> => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });
      return parseJsonOrThrow(response);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: RegisterValues): Promise<UserProfile> => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });
      return parseJsonOrThrow(response);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, user);
    },
  });
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
}
