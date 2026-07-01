import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { User } from '../types';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, User as UserIcon, Gift, Check } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType, cleanForFirestore } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

  // Extract referral code from URL on load and store perennially
  useEffect(() => {
    try {
      // 1. Check window.location.search (e.g. ?code=MYCODE or /invite?code=MYCODE)
      const searchParams = new URLSearchParams(window.location.search);
      let code = searchParams.get('code');

      // 2. Fallback to parsing window.location.href (in case parsed weirdly on custom hosting/iframes)
      if (!code) {
        const urlObj = new URL(window.location.href);
        code = urlObj.searchParams.get('code');
      }

      // 3. Fallback to checking hash path (e.g. #/invite?code=MYCODE)
      if (!code && window.location.hash) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          code = hashParams.get('code');
        }
      }

      if (code) {
        const sanitizedCode = code.trim().toUpperCase();
        setReferralCode(sanitizedCode);
        localStorage.setItem('uxtrade_stored_referral_code', sanitizedCode);
        setIsRegistering(true); // Force register view so they see the prefilled code
      } else {
        // Load the perennial code if previously saved
        const storedCode = localStorage.getItem('uxtrade_stored_referral_code');
        if (storedCode) {
          setReferralCode(storedCode);
          setIsRegistering(true);
        }
      }
    } catch (err) {
      console.error("Failed to parse referral code from URL", err);
    }
  }, []);

  // Pre-configured simulation accounts
  const demoAccounts = [
    { email: 'user@ux6trade.online', password: 'password123', name: 'Marvelous John', referralCode: 'MARVELOUS' }
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

  const handleAuth = async (e: FormEvent) => {
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

      setSuccess('Creating your UX-trade account...');

      try {
        // Real Firebase Auth registration
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        const firebaseUser = userCredential.user;

        // Create new user profile matching types.ts
        const newUser: User = {
          id: firebaseUser.uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          referralCode: generateReferralCode(name),
          referredBy: referralCode.trim() || undefined,
          balance: 0.00,
          savingsBalance: 0.00,
          createdAt: new Date().toISOString(),
          tier: 1
        };

        // Persist to Firestore
        const userPath = `users/${firebaseUser.uid}`;
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), cleanForFirestore(newUser));
          // Save the unique referral code lookup index securely
          await setDoc(doc(db, 'referralCodes', newUser.referralCode.toUpperCase()), {
            userId: firebaseUser.uid,
            name: newUser.name
          });
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.WRITE, userPath);
        }

        // If they had a referral code, persist the referral record to the referrer's referrals subcollection in Firestore
        if (referralCode.trim()) {
          try {
            const refDoc = await getDoc(doc(db, 'referralCodes', referralCode.trim().toUpperCase()));
            if (refDoc.exists()) {
              const refData = refDoc.data();
              const referrerId = refData.userId;
              
              // Add to the referrer's referrals subcollection
              const refId = 'ref_' + Math.random().toString(36).substr(2, 9);
              const referralRecord = {
                id: refId,
                refereeName: name.trim(),
                email: email.trim().toLowerCase(),
                date: new Date().toISOString(),
                rewardEarned: 5.00,
                status: 'completed'
              };
              
              await setDoc(doc(db, 'users', referrerId, 'referrals', refId), referralRecord);
            } else {
              console.warn("Invalid referral code provided:", referralCode);
            }
          } catch (refErr) {
            console.error("Failed to associate referrer reward in Firestore:", refErr);
          }
        }

        users.push(newUser);
        localStorage.setItem('fintex_users', JSON.stringify(users));
        localStorage.setItem('fintex_current_user', JSON.stringify(newUser));
        localStorage.removeItem('uxtrade_stored_referral_code');

        setSuccess('Registration successful! Launching your dashboard...');
        setTimeout(() => {
          onAuthSuccess(newUser);
        }, 1200);

      } catch (authErr: any) {
        let errMsg = 'Registration failed. Please make sure password is at least 6 characters.';
        if (authErr && authErr.code === 'auth/email-already-in-use') {
          errMsg = 'This email is already registered.';
        } else if (authErr && authErr.message) {
          errMsg = authErr.message;
        }
        setError(errMsg);
      }

    } else {
      // Login flow
      const matchingDemo = demoAccounts.find(
        (d) => d.email.toLowerCase() === email.toLowerCase() && d.password === password
      );

      if (matchingDemo) {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        const targetUser = user || {
          id: 'u_demo',
          name: matchingDemo.name,
          email: matchingDemo.email,
          referralCode: matchingDemo.referralCode,
          balance: 0.00,
          savingsBalance: 0.00,
          createdAt: new Date().toISOString()
        };

        if (!user) {
          users.push(targetUser);
          localStorage.setItem('fintex_users', JSON.stringify(users));
        }
        localStorage.setItem('fintex_current_user', JSON.stringify(targetUser));
        setSuccess('Logging in securely (Demo Mode)...');
        setTimeout(() => {
          onAuthSuccess(targetUser);
        }, 1000);
        return;
      }

      setSuccess('Verifying credentials...');
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        const firebaseUser = userCredential.user;

        let targetUser: User;
        const userPath = `users/${firebaseUser.uid}`;
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            targetUser = userDoc.data() as User;
          } else {
            const localUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
            targetUser = localUser || {
              id: firebaseUser.uid,
              name: email.split('@')[0],
              email: email.trim().toLowerCase(),
              referralCode: generateReferralCode(email.split('@')[0]),
              balance: 0.00,
              savingsBalance: 0.00,
              createdAt: new Date().toISOString(),
              tier: 1
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), cleanForFirestore(targetUser));
          }
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.GET, userPath);
          const localUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
          targetUser = localUser || {
            id: firebaseUser.uid,
            name: email.split('@')[0],
            email: email.trim().toLowerCase(),
            referralCode: generateReferralCode(email.split('@')[0]),
            balance: 0.00,
            savingsBalance: 0.00,
            createdAt: new Date().toISOString(),
            tier: 1
          };
        }

        localStorage.setItem('fintex_current_user', JSON.stringify(targetUser));
        setSuccess('Secure Login authorized!');
        setTimeout(() => {
          onAuthSuccess(targetUser);
        }, 1000);

      } catch (authErr: any) {
        // Fallback to local
        const localUser = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (localUser) {
          localStorage.setItem('fintex_current_user', JSON.stringify(localUser));
          setSuccess('Logging in securely (offline mode)...');
          setTimeout(() => {
            onAuthSuccess(localUser);
          }, 1000);
          return;
        }

        let errMsg = 'Invalid email or password.';
        if (authErr && authErr.message) {
          errMsg = authErr.message;
        }
        setError(errMsg);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080C14] p-4 sm:p-6 lg:p-8 relative overflow-hidden" id="uxtrade-auth-container">
      {/* Dynamic abstract grid overlay for modern visual depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Background gradients for premium login screen feel */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in" id="uxtrade-auth-card-wrapper">
        {/* Banner Logo */}
        <div className="flex flex-col items-center mb-8" id="uxtrade-brand-header">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-primary via-brand-medium to-slate-950 rounded-2xl flex items-center justify-center text-white font-display text-4xl font-black shadow-lg shadow-sky-950/20 mb-4 border border-white/10" id="uxtrade-logo-box">
            U
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white flex items-center gap-2" id="uxtrade-title">
            UX-trade
            <span className="text-emerald-400 font-sans font-extrabold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">Secure</span>
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-semibold tracking-wide uppercase" id="uxtrade-subtitle">
            Secure Wealth. Instant Global Cash Out.
          </p>
        </div>

        {/* main Form Card */}
        <div className="bg-[#111827] rounded-[32px] border border-white/5 shadow-2xl shadow-black/45 overflow-hidden" id="auth-main-card">
          {/* Tabs */}
          <div className="flex border-b border-white/5 bg-[#0C111D] p-1.5" id="auth-tab-bar">
            <button
              id="tab-btn-register"
              type="button"
              className={`flex-1 py-3 text-center text-xs font-black tracking-wider uppercase transition-all duration-300 rounded-2xl cursor-pointer ${
                isRegistering
                  ? 'bg-[#1F2937] text-white border border-white/10 shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
              className={`flex-1 py-3 text-center text-xs font-black tracking-wider uppercase transition-all duration-300 rounded-2xl cursor-pointer ${
                !isRegistering
                  ? 'bg-[#1F2937] text-white border border-white/10 shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
                className="p-3 mb-5 text-xs font-semibold text-red-400 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-center gap-2.5"
                id="auth-error-alert"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            {success && (
              <div
                className="p-3 mb-5 text-xs font-semibold text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5"
                id="auth-success-alert"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                {success}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5" id="auth-system-form">
              {isRegistering && (
                <div id="field-group-name">
                  <label htmlFor="auth-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      placeholder="e.g. Marvelous John"
                      className="w-full pl-10 pr-4 py-3 bg-[#0C111D] border border-white/5 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-[#0C111D] transition-all text-white placeholder-slate-600 font-medium"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div id="field-group-email">
                <label htmlFor="auth-email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    placeholder="name@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#0C111D] border border-white/5 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-[#0C111D] transition-all text-white placeholder-slate-600 font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div id="field-group-password">
                <label htmlFor="auth-password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#0C111D] border border-white/5 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-[#0C111D] transition-all text-white placeholder-slate-600 font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div id="field-group-referral">
                  <label htmlFor="auth-referral" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Referral Code</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Optional</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Gift className="w-4 h-4" />
                    </div>
                    <input
                      id="auth-referral"
                      type="text"
                      placeholder="e.g. WELCOME10"
                      className="w-full pl-10 pr-4 py-3 bg-[#0C111D] border border-white/5 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-[#0C111D] tracking-widest uppercase transition-all text-white placeholder-slate-600 font-bold"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                id="submit-auth-btn"
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-medium text-white font-extrabold text-xs tracking-widest uppercase rounded-2xl hover:brightness-110 active:scale-98 transition-all inline-flex items-center justify-center gap-2 mt-2 shadow-lg shadow-brand-primary/10 cursor-pointer"
              >
                {isRegistering ? 'Register & Open Account' : 'Secure Log In'}
              </button>
            </form>

            {/* Quick Demo Accounts */}
            {!isRegistering && (
              <div className="mt-6 pt-5 border-t border-white/5" id="auth-demo-section">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3">
                  Quick Demo Accounts (Instant Test)
                </span>
                <div className="space-y-2.5" id="demo-buttons-list">
                  {demoAccounts.map((d, index) => (
                    <button
                      key={index}
                      id={`demo-btn-${index}`}
                      type="button"
                      onClick={() => handleDemoLogin(d)}
                      className="w-full p-3 bg-[#0C111D] border border-dashed border-white/10 hover:border-brand-primary hover:bg-[#111827] rounded-2xl text-left text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{d.name}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">{d.email}</span>
                      </div>
                      <span className="text-[9px] font-black tracking-wider uppercase text-brand-light bg-brand-primary/10 border border-brand-primary/20 px-2 py-1 rounded-md">
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
        <div className="flex items-center justify-center gap-2 mt-6 text-slate-500 text-[11px] font-semibold" id="auth-guard-notice">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>PCI-DSS compliant encryptions protect your session</span>
        </div>
      </div>
    </div>
  );
}
