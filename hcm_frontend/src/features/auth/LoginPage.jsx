import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Clock
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import axios from 'axios';
import { authAPI } from '../../utils/apiService';

const ROLE_ROUTES = {
  SUPERADMIN: '/superadmin/dashboard',
  ADMIN: '/admin/dashboard',
  HR: '/hr/dashboard',
  MANAGER: '/manager/dashboard',
  EMPLOYEE: '/employee/dashboard',
  CANDIDATE: '/candidate/dashboard',
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const { login, authError, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const isIdleLogout = searchParams.get('reason') === 'idle' || sessionStorage.getItem('logout_reason') === 'idle';

  // Forgot password flow states
  const [step, setStep] = useState('login'); // 'login' | 'forgot-password' | 'verify-otp' | 'reset-password'
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);

  React.useEffect(() => {
    const activeToken = sessionStorage.getItem('hcm_token') || localStorage.getItem('hcm_token');
    if (activeToken && isAuthenticated && user) {
      const normalizedRole = user.role?.toUpperCase();
      // Only trust landingPage if it's a valid absolute path — avoids bad DB values like "htdgfnb"
      const safeLandingPage = user.landingPage?.startsWith('/') ? user.landingPage : null;
      const route = safeLandingPage || ROLE_ROUTES[normalizedRole] || '/employee/dashboard';
      navigate(route, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const demoCredentials = {
    superadmin: { email: 'superadmin@hcm.ai', password: 'password123' },
    admin: { email: 'admin@hcm.ai', password: 'password123' },
    hr: { email: 'hr@hcm.ai', password: 'password123' },
    manager: { email: 'manager@hcm.ai', password: 'password123' },
    employee: { email: 'employee@hcm.ai', password: 'password123' },
    candidate: { email: 'candidate@hcm.ai', password: 'password123' },
  };

  const handleRoleSelect = (roleId) => {
    setRole(roleId);
    const creds = demoCredentials[roleId];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  // Pre‑fill default role values on mount (Super Admin demo)
  React.useEffect(() => {
    handleRoleSelect('superadmin');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password, role);
    setLoading(false);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      alert('Please enter your email.');
      return;
    }
    setLoadingOtp(true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    // EmailJS keys from env or default
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_hcm';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_otp';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'user_public_key';

    try {
      await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: forgotEmail,
          otp: otp,
          app_name: 'HCM.ai'
        }
      });
      alert(`OTP sent successfully to ${forgotEmail}!`);
    } catch (err) {
      console.log(`[EmailJS Fallback] Failed to send email via service. OTP is: ${otp}`);
      alert(`[Demo Mode] OTP sent to email! (OTP printed to console for security reasons: ${otp})`);
    } finally {
      setLoadingOtp(false);
      setStep('verify-otp');
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode === generatedOtp) {
      alert('OTP verified successfully!');
      setStep('reset-password');
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetForgottenPassword({ email: forgotEmail, newPassword });
      alert('Password reset successfully! Please sign in with your new password.');
      setStep('login');
      setForgotEmail('');
      setOtpCode('');
      setGeneratedOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'superadmin', label: 'Super Admin', color: 'bg-gray-800' },
    { id: 'admin', label: 'Admin', color: 'bg-red-500' },
    { id: 'hr', label: 'HR', color: 'bg-blue-500' },
    { id: 'manager', label: 'Manager', color: 'bg-purple-500' },
    { id: 'employee', label: 'Employee', color: 'bg-green-500' },
    { id: 'candidate', label: 'Candidate', color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950 selection:bg-primary-100 dark:selection:bg-primary-900/30">

      {/* Left Side: Visual/Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 relative overflow-hidden text-white">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl opacity-50"></div>

        <div className="z-10">
          <Link to="/" className="flex items-center gap-3 mb-12 group cursor-pointer w-fit">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl group-hover:bg-white/20 transition-colors">
              <Cpu className="text-white" size={28} />
            </div>
            <span className="text-white text-3xl font-bold tracking-tight group-hover:text-primary-200 transition-colors">HCM.ai</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
              Empower Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-accent-300 to-indigo-200">Human Capital</span> <br />
              with Artificial Intelligence.
            </h1>
            <p className="text-primary-100/80 text-lg xl:text-xl max-w-md leading-relaxed mb-12">
              The next generation HR platform for modern teams. Secure, intelligent, and human-centric.
            </p>
          </motion.div>

          {/* Social Proof/Features */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: ShieldCheck, text: "Enterprise Security" },
              { icon: Zap, text: "AI Automation" },
              { icon: Globe, text: "Global Payroll" },
              { icon: Mail, text: "Smart Hiring" }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm text-white hover:bg-white/15 transition-all">
                <div className="p-2 rounded-xl bg-white/10 text-primary-300 flex items-center justify-center shrink-0">
                  <f.icon size={18} />
                </div>
                <span className="text-sm font-semibold text-white tracking-tight">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="z-10">
          <p className="text-white/60 text-sm font-medium">© 2026 HCM.ai Global Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side: Login / Forgot Password form */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-50/40 lg:bg-white dark:bg-slate-950 min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto py-8"
        >
          <Link to="/" className="mb-8 lg:hidden flex items-center gap-2.5 group cursor-pointer w-fit">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:rotate-6 transition-transform">
              <Cpu className="text-white" size={22} />
            </div>
            <span className="text-slate-900 dark:text-white text-2xl font-black tracking-tight group-hover:text-primary-600 transition-colors">HCM.ai</span>
          </Link>

          {step === 'login' && (
            <>
              <div className="text-left mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2 dark:text-white tracking-tight">Welcome back</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Please enter your details to sign in.</p>
                {isIdleLogout && (
                  <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3 text-xs font-medium shadow-sm animate-in fade-in duration-300">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-950">Session Timed Out</span>
                      Your session was automatically logged out due to inactivity for security. Please sign in again.
                    </div>
                  </div>
                )}
                {authError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                    {authError}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Role Selector for Demo */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Demo Role</p>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-md">Quick Fill</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {roles.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleSelect(r.id)}
                        className={cn(
                          "py-2 px-1 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer",
                          role === r.id
                            ? "bg-primary-600 text-white shadow-md shadow-primary-500/25 ring-2 ring-primary-500/20"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:text-primary-600 dark:hover:text-white"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Work Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none" size={19} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-11 pr-4 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setStep('forgot-password')}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none" size={19} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-slate-300 dark:border-slate-700 rounded focus:ring-primary-500 cursor-pointer accent-primary-600"
                  />
                  <label htmlFor="remember" className="ml-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    Remember for 30 days
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {step === 'forgot-password' && (
            <>
              <div className="text-left mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2 dark:text-white tracking-tight">Reset password</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Enter your work email to receive a verification OTP code.</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Work Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none" size={19} />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-11 pr-4 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingOtp}
                  className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
                >
                  {loadingOtp ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full py-3 text-center text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </form>
            </>
          )}

          {step === 'verify-otp' && (
            <>
              <div className="text-left mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2 dark:text-white tracking-tight">Verify OTP</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Enter the 6-digit verification code sent to your email.</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Verification Code</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none" size={19} />
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full pl-11 pr-4 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white tracking-[0.25em] text-center placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer mt-2"
                >
                  <span>Verify OTP</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('forgot-password')}
                  className="w-full py-3 text-center text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
                >
                  Resend Verification Code
                </button>
              </form>
            </>
          )}

          {step === 'reset-password' && (
            <>
              <div className="text-left mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2 dark:text-white tracking-tight">New password</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Choose a strong, secure new password.</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none" size={19} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none" size={19} />
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full py-3 text-center text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 font-bold hover:text-primary-700 dark:text-primary-400 hover:underline transition-all ml-1">
              Sign up as Candidate
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
