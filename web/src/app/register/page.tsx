import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account — SATHUN',
};

/** Sign-up — port of mobile `app/(auth)/register.tsx`. */
export default function RegisterPage() {
  return <RegisterForm />;
}
