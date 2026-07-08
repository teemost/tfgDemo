import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '@workspace/api-client-react';

const SESSION_QUERY_KEY = ['session', 'me'];

async function fetchSession(): Promise<UserProfile | null> {
  const response = await fetch('/api/users/me/ensure', {
    method: 'POST',
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

/**
 * Tracks the current Replit Auth session. Calling the `/api/users/me/ensure`
 * endpoint both verifies the session cookie and creates the local user
 * record on first login.
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

export function login() {
  window.location.href = '/api/login';
}

export function logout() {
  window.location.href = '/api/logout';
}
