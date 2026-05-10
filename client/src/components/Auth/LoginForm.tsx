import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../UI/Button';
import toast from 'react-hot-toast';
import { LoginSchema } from 'shared';

export default function LoginForm() {
  const { handleLogin } = useAuth();
  const [email, setEmail] = useState('demo@familytree.app');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) { toast.error(result.error.issues[0].message); return; }
    setLoading(true);
    try {
      await handleLogin(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      // axios error
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error ?? msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
      </div>
      <div>
        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
      </div>
      <Button type="submit" disabled={loading} className="w-full justify-center">
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>
      <p className="text-center font-body text-sm text-[var(--color-text-muted)]">
        No account?{' '}
        <Link to="/register" className="text-forest dark:text-gold hover:underline">Register</Link>
      </p>
      <p className="text-center font-body text-xs text-[var(--color-text-muted)]">
        Demo: demo@familytree.app / demo1234
      </p>
    </form>
  );
}
