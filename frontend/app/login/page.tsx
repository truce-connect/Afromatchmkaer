"use client";

import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Unable to login. Please try again.');
    }
  };

  return (
    <section className="bg-[#F7F4EF]">
      <div className="mx-auto flex max-w-md flex-col gap-6 rounded-3xl bg-white p-8 shadow-card">
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <h1 className="font-display text-3xl text-[#2B2B2B]">Welcome back</h1>
          <label className="text-sm text-[#2B2B2B]">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-1 w-full rounded-2xl border border-[#C65D3B]/20 px-4 py-3" />
          </label>
          <label className="text-sm text-[#2B2B2B]">
            Password
            <div className="mt-1 flex items-center rounded-2xl border border-[#C65D3B]/20 px-4">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={passwordVisible ? 'text' : 'password'}
                minLength={8}
                required
                className="w-full border-none bg-transparent py-3 outline-none"
              />
              <button type="button" onClick={() => setPasswordVisible((prev) => !prev)} className="text-sm font-semibold text-[#C65D3B]">
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="rounded-full bg-[#C65D3B] px-6 py-3 font-semibold text-white">
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </motion.form>
        <p className="text-center text-sm text-[#2B2B2B]/70">
          New here? <Link href="/join" className="text-[#C65D3B]">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
