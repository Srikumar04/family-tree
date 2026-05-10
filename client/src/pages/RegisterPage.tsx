import { motion } from 'framer-motion';
import RegisterForm from '../components/Auth/RegisterForm';

export default function RegisterPage() {
  return (
    <motion.div
      className="min-h-screen bg-[var(--color-bg)] flex"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="font-heading text-4xl text-forest dark:text-gold mb-2">Family Tree</h1>
          <p className="font-body text-[var(--color-text-muted)] mb-8">Begin your family's journey</p>
          <div className="card">
            <h2 className="font-heading text-2xl text-forest dark:text-gold mb-6">Create your account</h2>
            <RegisterForm />
          </div>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-forest items-center justify-center p-12">
        <div className="text-center text-parchment">
          <div className="text-8xl mb-6">🌿</div>
          <h2 className="font-heading text-3xl mb-4">Start Your Tree</h2>
          <p className="font-body text-parchment/80 max-w-xs">
            Add family members, define relationships, and explore your heritage interactively.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
