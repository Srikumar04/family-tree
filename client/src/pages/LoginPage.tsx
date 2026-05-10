import { motion } from 'framer-motion';
import LoginForm from '../components/Auth/LoginForm';

export default function LoginPage() {
  return (
    <motion.div
      className="min-h-screen bg-[var(--color-bg)] flex"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="font-heading text-4xl text-forest dark:text-gold mb-2">Family Tree</h1>
          <p className="font-body text-[var(--color-text-muted)] mb-8">Preserve your family's legacy</p>
          <div className="card">
            <h2 className="font-heading text-2xl text-forest dark:text-gold mb-6">Welcome back</h2>
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-forest items-center justify-center p-12">
        <div className="text-center text-parchment">
          <div className="text-8xl mb-6">🌳</div>
          <h2 className="font-heading text-3xl mb-4">Your Family Story</h2>
          <p className="font-body text-parchment/80 max-w-xs">
            Visualise, explore, and share your family history across generations.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
