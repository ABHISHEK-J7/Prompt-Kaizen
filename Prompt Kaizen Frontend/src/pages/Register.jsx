import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Loader2, UserPlus, Eye, EyeOff, Sparkles, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const passRules = [
    { label: 'At least 6 characters', valid: form.password.length >= 6 },
    { label: 'Matches confirmation',  valid: form.password && form.password === form.confirmPassword },
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      return toast.error('Please fill in all fields.');
    }
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');

    try {
      setSubmitting(true);
      const result = await register(form);
      // Server now requires an OTP step before issuing a token. Send the
      // user to the dedicated verify-email page with their email + TTL in
      // route state.
      toast.success('We sent a verification code to your email.');
      navigate('/verify-email', {
        replace: true,
        state: { email: result.email || form.email.toLowerCase().trim(), otpTtlMinutes: result.otpTtlMinutes },
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex relative items-center justify-center bg-flame-900 text-cream-100 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-md p-10"
        >
          <Logo size="lg" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-balance">
            Start writing prompts the model actually understands.
          </h2>
          <p className="mt-3 text-cream-200/70 leading-relaxed">
            Sign up free — no credit card. Get instant scoring, a heatmap, suggestions, and
            a one-click improved prompt for every situation.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {[
              'Free forever for the rule-based analyzer',
              'Privacy-first — your prompts stay yours',
              'A growing library of real-world scenarios',
            ].map((t, i) => (
              <motion.li
                key={t}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 w-5 h-5 rounded-full bg-cream-300 text-flame-900 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </span>
                <span className="text-cream-100/90">{t}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-4 py-10 bg-cream-50/40">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="card p-8">
            <div className="flex items-center gap-2 text-flame-700">
              <Sparkles className="w-4 h-4 text-cream-500" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Get started</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-flame-900">Create your account</h1>
            <p className="text-sm text-flame-500 mt-1">Start analyzing your prompts in seconds.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Name" icon={User} name="name" value={form.name} onChange={onChange} placeholder="Your full name" />
              <Field label="Email" icon={Mail} name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Password"
                  icon={Lock}
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={onChange}
                  placeholder="At least 6 characters"
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="text-flame-400 hover:text-flame-900 transition"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <Field
                  label="Confirm password"
                  icon={Lock}
                  name="confirmPassword"
                  type={showPass ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={onChange}
                />
              </div>

              <ul className="text-xs text-flame-500 space-y-1 pt-1">
                {passRules.map((r) => (
                  <li key={r.label} className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        r.valid ? 'bg-cream-300 text-flame-900' : 'bg-flame-50 text-flame-300'
                      }`}
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    <span className={r.valid ? 'text-flame-900' : ''}>{r.label}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-2.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin-slow" /> Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Create account
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-sm text-flame-500 text-center">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-flame-900 underline-offset-4 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, trailing, ...inputProps }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {Icon ? (
          <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-flame-300" />
        ) : null}
        <input {...inputProps} className={`input ${Icon ? 'pl-9' : ''} ${trailing ? 'pr-9' : ''}`} />
        {trailing ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </div>
    </div>
  );
}
