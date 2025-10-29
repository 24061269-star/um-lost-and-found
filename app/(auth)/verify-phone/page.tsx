'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function VerifyPhonePage() {
  const params = useSearchParams();
  const router = useRouter();
  const phoneParam = params.get('phone') ?? '';
  const [token, setToken] = useState('');
  const [phone] = useState(phoneParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      if (verifyErr) throw verifyErr;
      setInfo('Phone verified successfully.');
      router.push('/');
    } catch (err: any) {
      setError(err?.message ?? 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      // Updating with same phone re-triggers OTP in many setups
      const { error: updateErr } = await supabase.auth.updateUser({ phone });
      if (updateErr) throw updateErr;
      setInfo('OTP re-sent. Please check your phone.');
    } catch (err: any) {
      setError(err?.message ?? 'Could not resend OTP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-umblue">Verify your phone</h1>
      <p className="mt-2 text-sm text-gray-600">We sent a 6-digit code to {phone || 'your phone'}.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">OTP Code</label>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
            placeholder="123456"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-600">{info}</p>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-umblue px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={loading}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            Resend
          </button>
        </div>
      </form>
    </div>
  );
}

