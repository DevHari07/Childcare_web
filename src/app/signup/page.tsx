import React, { Suspense } from 'react';
import { isLocalAuth } from '@/lib/authProvider';
import SignupForm from '@components/SignupForm';
import LocalSignupForm from '@components/LocalSignupForm';

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="auth-container">
        <div className="auth-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div className="spinner" style={{ borderColor: 'rgba(17,46,81,0.2)', borderTopColor: '#112e51', margin: '0 auto 16px auto', width: '32px', height: '32px' }} />
          <p>Loading Registration Interface...</p>
        </div>
      </div>
    }>
      {isLocalAuth ? <LocalSignupForm /> : <SignupForm />}
    </Suspense>
  );
}
