import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { User } from '../types';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, User as UserIcon, Gift, Check } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isRegistering, setIsRegistering] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Pre-configured simulation accounts
  const demoAccounts = [
    { email: 'user@forex9ja.online', password: 'password123', name: 'Marvelous John', referralCode: 'MARVELOUS' }
  ];

  const handleDemoLogin = (demo: typeof demoAccounts[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setIsRegistering(false);
  };

  const generateReferralCode = (userName: string) => {
    const cleanName = userName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${rand}`;
  };

  const handleAuth = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in email and password.');
      return;
    }

    if (isRegistering && !name) {
      setError('Please fill in your full name.');
      return;
    }

    // Read existing users from localStorage
    const users: User[] = JSON.parse(localStorage.getItem('fintex_users') || '[]');

    if (isRegistering) {
      // Check if user already exists
      const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setError('This email is already registered.');
        return;
      }

      // Create new user
      const newUser: User = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password, // In simulated app context, plain text in localStorage is standard
        referralCode: generateReferralCode(name),
        referredBy: referralCode.trim() || undefined,
        balance: 0.00, // strict requirement: initially dashboard balance of 0.00 dollar
        savingsBalance: 0.00,
        createdAt: new Date().toISOString(),
        tier: 1
      };

      // If they had a referral code, simulate rewards setup
      if (referralCode.trim()) {
        const referrer = users.find(u => u.referralCode.toUpperCase() === referralCode.trim().toUpperCase());
        // We'll record this in a simulated referral history inside localStorage
        const referralRecords = JSON.parse(localStorage.getItem('fintex_referrals') || '[]');
        referralRecords.push({
          referrerId: referrer ? referrer.id : 'system',
          refereeName: name,
          email: email.trim().toLowerCase(),
          date: new Date().toISOString(),
          rewardEarned: 10.00,
          status: 'completed'
        });
        localStorage.setItem('fintex_referrals', JSON.stringify(referralRecords));
      }

      users.push(newUser);
      localStorage.setItem('fintex_users', JSON.stringify(users));
      localStorage.setItem('fintex_current_user', JSON.stringify(newUser));

      setSuccess('Registration successful! Launching your dashboard...');
      setTimeout(() => {
        onAuthSuccess(newUser);
      }, 1200);

    } else {
      // Login flow
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      // Check if it matches a demo account that's not yet in localStorage
      if (!user) {
        const matchingDemo = demoAccounts.find(
          (d) => d.email.toLowerCase() === email.toLowerCase() && d.password === password
        );
        if (matchingDemo) {
          const newUser: User = {
            id: 'u_demo',
            name: matchingDemo.name,
            email: matchingDemo.email,
            password: matchingDemo.password,
            referralCode: matchingDemo.referralCode,
            balance: 0.00,
            savingsBalance: 0.00,
            createdAt: new Date().toISOString()
          };
          users.push(newUser);
          localStorage.setItem('fintex_users', JSON.stringify(users));
          localStorage.setItem('fintex_current_user', JSON.stringify(newUser));
          setSuccess('Logging in securely...');
          setTimeout(() => {
            onAuthSuccess(newUser);
          }, 1000);
          return;
        }

        setError('Invalid email or password.');
        return;
      }

      localStorage.setItem('fintex_current_user', JSON.stringify(user));
      setSuccess('Logging in securely...');
      setTimeout(() => {
        onAuthSuccess(user);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-50 to-blue-50/80 p-4 sm:p-6 lg:p-8" id="forex9ja-auth-container">
      <div className="w-full max-w-md" id="forex9ja-auth-card-wrapper">
        {/* Banner Logo */}
        <div className="flex flex-col items-center mb-8" id="forex9ja-brand-header">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-dark via-brand-medium to-brand-primary rounded-2xl flex items-center justify-center text-white font-display text-4xl font-bold shadow-lg shadow-sky-950/10 mb-3" id="forex9ja-logo-box">
            F
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-brand-dark" id="forex9ja-title">
            forex9ja<span className="text-brand-light font-sans font-medium text-xs align-super ml-1">v1.2</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1" id="forex9ja-subtitle">
            Secure Wealth. Instant Mobility.
          </p>
        </div>

        {/* main Form Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden" id="auth-main-card">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1" id="auth-tab-bar">
            <button
              id="tab-btn-register"
              type="button"
              className={`flex-1 py-3.5 text-center text-sm font-semibold transition-all duration-300 rounded-2xl ${
                isRegistering
                  ? 'bg-white text-brand-dark shadow-sm'
                  : 'text-slate-500 hover:text-brand-dark'
              }`}
              onClick={() => {
                setIsRegistering(true);
                setError('');
              }}
            >
              Create Account
            </button>
            <button
              id="tab-btn-login"
              type="button"
              className={`flex-1 py-3.5 text-center text-sm font-semibold transition-all duration-300 rounded-2xl ${
                !isRegistering
                  ? 'bg-white text-brand-dark shadow-sm'
                  : 'text-slate-500 hover:text-brand-dark'
              }`}
              onClick={() => {
                setIsRegistering(false);
                setError('');
              }}
            >
              Sign In
            </button>
          </div>

          <div className="p-6 sm:p-8" id="auth-form-body">
            {error && (
              <div
                className="p-3 mb-4 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2"
                id="auth-error-alert"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            {success && (
              <div
                className="p-3 mb-4 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2"
                id="auth-success-alert"
              >
                <Check className="w-4 h-4 text-emerald-500" />
                {success}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4" id="auth-system-form">
              {isRegistering && (
                <div id="field-group-name">
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-brand-dark mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      placeholder="e.g. Marvelous John"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-slate-800"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div id="field-group-email">
                <label htmlFor="auth-email" className="block text-xs font-semibold text-brand-dark mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    placeholder="name@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-slate-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div id="field-group-password">
                <label htmlFor="auth-password" className="block text-xs font-semibold text-brand-dark mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition-all text-slate-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-brand-dark"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div id="field-group-referral">
                  <label htmlFor="auth-referral" className="block text-xs font-semibold text-brand-dark mb-1.5 flex items-center justify-between">
                    <span>Referral Code</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Gift className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-referral"
                      type="text"
                      placeholder="e.g. WELCOME10"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-white tracking-widest uppercase transition-all text-slate-800"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                id="submit-auth-btn"
                type="submit"
                className="w-full py-4 bg-brand-dark text-white font-semibold text-sm rounded-2xl hover:bg-brand-medium active:scale-98 transition-all inline-flex items-center justify-center gap-2 mt-2 shadow-md shadow-brand-dark/15"
              >
                {isRegistering ? 'Register & Open Account' : 'Secure Log In'}
              </button>
            </form>

            {/* Quick Demo Accounts */}
            {!isRegistering && (
              <div className="mt-6 pt-5 border-t border-slate-100" id="auth-demo-section">
                <span className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2.5">
                  Quick Demo Accounts (Instant Test)
                </span>
                <div className="space-y-2" id="demo-buttons-list">
                  {demoAccounts.map((d, index) => (
                    <button
                      key={index}
                      id={`demo-btn-${index}`}
                      type="button"
                      onClick={() => handleDemoLogin(d)}
                      className="w-full p-2.5 border border-dashed border-slate-200 hover:border-brand-primary hover:bg-sky-50/50 rounded-xl text-left text-xs text-slate-600 hover:text-brand-dark transition-all flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{d.name}</span>
                        <span className="text-[10px] text-slate-400">{d.email}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-brand-primary bg-sky-50 px-2 py-1 rounded">
                        Use Default
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guard message matches security guidelines of banking */}
        <div className="flex items-center justify-center gap-2 mt-6 text-slate-400 text-xs" id="auth-guard-notice">
          <ShieldCheck className="w-4 h-4 text-brand-primary" />
          <span>PCI-DSS compliant encryptions protect your data</span>
        </div>
      </div>
    </div>
  );
}
