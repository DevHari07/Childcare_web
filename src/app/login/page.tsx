import React from 'react';
import { isLocalAuth } from '@/lib/authProvider';
import LoginForm from '@components/LoginForm';
import LocalLoginForm from '@components/LocalLoginForm';

export default function LoginPage() {
  return isLocalAuth ? <LocalLoginForm /> : <LoginForm />;
}
