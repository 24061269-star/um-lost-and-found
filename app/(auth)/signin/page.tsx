'use client';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from "next";

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure we only navigate to internal paths and satisfy typedRoutes
  function toRoute(url?: string | null): Route {
    const u = typeof url === "string" ? url : "/";
    // Block external redirects; only allow internal app paths
    if (!u.startsWith("/")) return "/" as Route;
    return u as Route;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // Lightweight route protection cookie (middleware reads this)
      document.cookie = `umlf_authed=1; path=/; max-age=${7 * 24 * 60 * 60}`;

      // Fetch role and set role cookie for middleware (/admin)
      try {
        const userId = signInData.user?.id;
        if (userId) {
          const { data: prof } = await supabase.from('profiles').select('role').eq('id', userId).single();
          const role = prof?.role || 'student';
          document.cookie = `umlf_role=${role}; path=/; max-age=${7 * 24 * 60 * 60}`;
        }
      } catch {}

      router.push("/");


    } catch (err: any) {
      setError(err?.message ?? 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-umblue">Sign in</h1>
      <p className="mt-2 text-sm text-gray-600">Use your UM email and password.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-umblue focus:outline-none"
            placeholder="name@um.edu.my"
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-umblue px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 text-sm">
        <a className="text-umblue underline" href="/signup">Create an account</a>
      </div>
    </div>
  );
}

