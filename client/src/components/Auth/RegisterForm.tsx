import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../UI/Button';
import toast from 'react-hot-toast';
import { RegisterSchema } from 'shared';

export default function RegisterForm() {
  const { handleRegister } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = RegisterSchema.safeParse({ email, password });
    if (!result.success) { toast.error(result.error.issues[0].message); return; }
    setLoading(true);
    try {
      await handleRegister(email, password);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error ?? 'Registration failed');
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
        <label className="label">Password <span className="text-xs">(min 8 chars)</span></label>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={8} />
      </div>
      <Button type="submit" disabled={loading} className="w-full justify-center">
        {loading ? 'Creating account…' : 'Create Account'}
      </Button>
      <p className="text-center font-body text-sm text-[var(--color-text-muted)]">
        Have an account?{' '}
        <Link to="/login" className="text-forest dark:text-gold hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
