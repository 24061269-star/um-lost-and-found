'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isUmEmail, isValidPhone } from '@/lib/validators';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isUmEmail(email)) {
      setError('Please use your @um.edu.my email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!isValidPhone(phone)) {
      setError('Enter a valid phone number (e.g., +60123456789).');
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: 'student', phone },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (signUpError) throw signUpError;

      // Add phone to the profile and trigger SMS OTP
      const { error: updateErr } = await supabase.auth.updateUser({ phone });
      if (updateErr) throw updateErr;

      setInfo('Signup successful. We sent an OTP to your phone.');
      router.push(`/verify-phone?phone=${encodeURIComponent(phone)}`);
    } catch (err: any) {
      setError(err?.message ?? 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-umblue">Create your account</h1>
      <p className="mt-2 text-sm text-gray-600">Use your University Malaya email and verify your phone.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">UM Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@um.edu.my"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone number</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+60123456789"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-600">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-umblue px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </div>
  );
}

