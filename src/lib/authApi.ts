'use client';

const AUTH_API_URL = (process.env.NEXT_PUBLIC_AUTH_API_URL as string) || 'http://localhost:8000';

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: string; // 'parent' | 'provider' — app-level role, stored as custom:role if the pool supports it
}

/**
 * Asks the auth backend to create the Cognito user (admin_create_user). Cognito then
 * emails the user a temporary password; on first sign-in they are forced to set a new one.
 */
export async function createUser(input: CreateUserInput): Promise<void> {
  const body = new FormData();
  body.append('email', input.email);
  body.append('name', `${input.firstName} ${input.lastName}`.trim());
  body.append('given_name', input.firstName);
  body.append('family_name', input.lastName);
  body.append('role', input.role);

  let res: Response;
  try {
    res = await fetch(`${AUTH_API_URL}/users`, { method: 'POST', body });
  } catch {
    throw new Error('Could not reach the account service. Please try again later.');
  }

  if (!res.ok) {
    let detail = 'Unable to create the account.';
    try {
      const data = await res.json();
      if (data?.detail) detail = String(data.detail);
    } catch {
      /* keep default */
    }
    if (/UsernameExistsException/i.test(detail) || /already exists/i.test(detail)) {
      detail = 'An account with that email address already exists.';
    }
    throw new Error(detail);
  }
}
