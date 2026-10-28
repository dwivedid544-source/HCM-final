import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Cpu,
  ShieldCheck,
  Sparkles,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { authAPI } from '../../utils/apiService';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-slate-200', text: 'text-slate-400' };
    }
  };

  const strength = getPasswordStrength(password);
  const isMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter a valid work or personal email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        email: email.trim(),
        password,
        role: 'CANDIDATE'
      });

      const resData = response.data?.data || response.data;
      if (resData?.token) {
        // Automatically save session for instant authentication
        sessionStorage.setItem('hcm_token', resData.token);
        sessionStorage.setItem('hcm_user', JSON.stringify(resData.user || { email, role: 'CANDIDATE' }));
        localStorage.setItem('hcm_token', resData.token);
        localStorage.setItem('hcm_user', JSON.stringify(resData.user || { email, role: 'CANDIDATE' }));
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/candidate/dashboard', { replace: true });
      }, 1200);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950 selection:bg-primary-100 dark:selection:bg-primary-900/30">
      {/* Left Side: Visual / Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 relative overflow-hidden text-white">
        {/* Abstract Background Lights */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl opacity-50" />

        <div className="z-10">
          <Link to="/" className="flex items-center gap-3 mb-12 group cursor-pointer w-fit">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl group-hover:bg-white/20 transition-all">
              <Cpu className="text-white" size={28} />
            </div>
            <span className="text-white text-3xl font-black tracking-tight group-hover:text-primary-200 transition-colors">
              HCM.ai
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
              Join the Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-accent-300 to-indigo-200">
                Talent & Careers.
              </span>
            </h1>
            <p className="text-primary-100/80 text-lg xl:text-xl max-w-md leading-relaxed mb-10">
              Create your verified candidate profile to unlock AI-powered job matching, direct employer connections, and real-time interview tracking.
            </p>
          </motion.div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: Sparkles, title: "AI Matchmaking", desc: "Smart skill scoring" },
              { icon: Briefcase, title: "Top Openings", desc: "Direct enterprise jobs" },
              { icon: TrendingUp, title: "Live Tracking", desc: "Real-time updates" },
              { icon: ShieldCheck, title: "Verified Data", desc: "Strict privacy & RBAC" }
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm text-white hover:bg-white/15 transition-all"
              >
                <div className="p-2 rounded-xl bg-white/10 text-primary-300 flex items-center justify-center shrink-0">
                  <f.icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight leading-none mb-1">{f.title}</h4>
                  <p className="text-[11px] text-primary-200/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="z-10 mt-8">
          <p className="text-white/50 text-sm font-medium">© 2026 HCM.ai Global Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-50/40 lg:bg-white dark:bg-slate-950 min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto py-8"
        >
          {/* Mobile Header */}
          <Link to="/" className="mb-8 lg:hidden flex items-center gap-2.5 group cursor-pointer w-fit">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:rotate-6 transition-transform">
              <Cpu className="text-white" size={22} />
            </div>
            <span className="text-slate-900 dark:text-white text-2xl font-black tracking-tight group-hover:text-primary-600 transition-colors">
              HCM.ai
            </span>
          </Link>

          <div className="text-left mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2 dark:text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Sign up as a candidate to explore and apply for jobs.
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-start gap-2.5 shadow-xs"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs"
                >
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  <span>Account registered successfully! Redirecting to dashboard...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Work or Personal Email
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none"
                  size={19}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full pl-11 pr-4 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {strength.label && (
                  <span className={cn('text-[11px] font-bold uppercase tracking-wider', strength.text)}>
                    {strength.label}
                  </span>
                )}
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none"
                  size={19}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus:outline-none"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          strength.score >= step ? strength.color : 'bg-slate-100 dark:bg-slate-800'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Use 6+ characters with a mix of letters, numbers, and symbols.
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Confirm Password
                </label>
                {confirmPassword && (
                  <span
                    className={cn(
                      'text-[11px] font-bold flex items-center gap-1',
                      isMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {isMatch ? (
                      <>
                        <Check size={12} strokeWidth={3} />
                        Passwords match
                      </>
                    ) : (
                      'Mismatch'
                    )}
                  </span>
                )}
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none"
                  size={19}
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'w-full pl-11 pr-12 h-12 bg-white dark:bg-slate-900 border rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
                    confirmPassword && isMatch
                      ? 'border-emerald-300 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-primary-500/20'
                  )}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="flex items-start pt-1">
              <input
                id="agreeTerms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-primary-600 border-slate-300 dark:border-slate-700 rounded focus:ring-primary-500 cursor-pointer accent-primary-600"
              />
              <label
                htmlFor="agreeTerms"
                className="ml-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none leading-relaxed"
              >
                I agree to the{' '}
                <span className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
                  Privacy Policy
                </span>
                .
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Candidate Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Sign In Link */}
            <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 font-bold hover:text-primary-700 dark:text-primary-400 hover:underline transition-all ml-1"
              >
                Sign In
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
