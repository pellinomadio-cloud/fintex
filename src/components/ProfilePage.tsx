import { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { 
  User as UserIcon, Mail, ShieldCheck, LogOut, PhoneCall, HelpCircle, 
  ChevronRight, ArrowRight, ShieldAlert, BadgeCheck, FileText, Check,
  Copy, ArrowLeft, Sparkles, Moon, Sun, Lock, Edit2
} from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onNavigateToUpgrade: () => void;
}

export default function ProfilePage({ user, onLogout, onUpdateUser, onNavigateToUpgrade }: ProfilePageProps) {
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(user.name);
  const [savingName, setSavingName] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string>('');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('uxtrade_dark_mode') === 'true';
  });

  // Sync dark mode class and localStorage
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('uxtrade_dark_mode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('uxtrade_dark_mode', 'false');
    }
  }, [darkMode]);

  // Keep name state synchronized if updated elsewhere
  useEffect(() => {
    setTempName(user.name);
  }, [user.name]);

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      setNameError("Name cannot be empty.");
      return;
    }
    setNameError('');
    setSavingName(true);
    try {
      const updatedUser = { ...user, name: tempName.trim() };
      await onUpdateUser(updatedUser);
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
      setNameError("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="space-y-6 pb-24" id="profile-tab-content">
      {/* Title */}
      <div id="profile-header-meta">
        <h2 className="text-xl font-bold text-brand-dark tracking-tight">Personal Account</h2>
        <p className="text-xs text-slate-500">Manage limits, security credentials & settings</p>
      </div>

      {/* Profile Overview Card (White, Light Blue, Dark Blue) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4" id="profile-hero-card">
        <div className="flex items-center gap-4" id="profile-hero-top">
          <div className="w-14 h-14 bg-sky-50 text-brand-primary border-2 border-brand-primary rounded-full flex items-center justify-center font-bold text-lg text-brand-dark" id="profile-avatar-giant">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5" id="profile-level-badge-row">
              <h3 className="font-display font-bold text-slate-800 text-sm">{user.name}</h3>
              <BadgeCheck className="w-4.5 h-4.5 text-brand-primary" />
            </div>
            <p className="text-xs text-slate-500">{user.email}</p>
            <p className="text-[10px] text-brand-primary font-mono tracking-wider mt-1 uppercase font-bold text-left">
              Account ID: F9J-{user.referralCode}
            </p>
          </div>
        </div>

        <div className="p-3 bg-sky-50/50 rounded-2xl border border-sky-100 flex flex-col gap-2.5" id="profile-meta-rewards-badge">
          <div className="flex items-center justify-between text-xs w-full">
            <div className="flex items-center gap-1.5 text-xs text-brand-dark font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
              <span>
                Tier {user.tier || 1} verified account limit: <strong>{(user.tier || 1) >= 2 ? (user.tier === 3 ? '$100,000.00' : '$10,000.00') : '$1,000.00'} / day</strong>
              </span>
            </div>
            {(user.tier || 1) < 2 ? (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded font-black uppercase text-center animate-pulse">
                STANDARD
              </span>
            ) : (
              <span className="text-[9px] text-brand-primary bg-sky-105 px-2.5 py-1 rounded font-bold flex items-center gap-1 shrink-0">
                <Check className="w-3 h-3 text-brand-primary" /> {user.tier === 3 ? 'PLATINUM' : 'VERIFIED'}
              </span>
            )}
          </div>
        </div>

        {(user.tier || 1) < 3 && (
          <button
            type="button"
            onClick={onNavigateToUpgrade}
            className="w-full py-3 px-4 bg-brand-dark hover:bg-brand-medium text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer duration-200"
            id="profile-upgrade-action-btn"
          >
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
            <span>Upgrade Account Verification (Unlock limits)</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>

      {/* Profile Settings (Edit Name, Locked Email, Persistent Dark Mode) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4" id="profile-settings-module">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
          Profile Settings
        </h3>

        {/* Name Input Section */}
        <div className="space-y-2" id="field-group-name-change">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
            Your Full Name
          </label>
          {isEditingName ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  id="profile-name-textbox"
                  placeholder="Enter full name"
                  disabled={savingName}
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-medium text-white text-xs font-bold rounded-xl cursor-pointer"
                  id="profile-save-name-btn"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempName(user.name);
                    setIsEditingName(false);
                    setNameError('');
                  }}
                  disabled={savingName}
                  className="px-3 py-2 bg-slate-100/80 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  id="profile-cancel-name-btn"
                >
                  Cancel
                </button>
              </div>
              {nameError && <p className="text-[10px] text-red-500 font-semibold">{nameError}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl" id="profile-display-name-row">
              <span className="text-xs font-medium text-slate-800">{user.name}</span>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-xs text-brand-primary hover:text-brand-medium font-bold flex items-center gap-1 cursor-pointer"
                id="profile-edit-name-toggle"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Name</span>
              </button>
            </div>
          )}
        </div>

        {/* Locked Email Section (KYC Locked) */}
        <div className="space-y-2" id="field-group-email-display">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Registered Email Address
            </label>
            <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 border border-amber-100/30">
              <Lock className="w-2.5 h-2.5" /> Identity Verified
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-slate-100/70 border border-slate-200/50 rounded-xl" id="profile-display-email-row">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400 select-none outline-none">{user.email}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal">
            For anti-money laundering (AML) protocols and security verification, email addresses cannot be modified.
          </p>
        </div>

        {/* Theme Preferences */}
        <div className="pt-2 border-t border-slate-100" id="field-group-theme-preference">
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="block text-xs font-bold text-slate-800">
                Application Theme
              </label>
              <span className="text-[10px] text-slate-400">Enable premium eye-safe dark theme</span>
            </div>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                darkMode ? 'bg-brand-primary' : 'bg-slate-200'
              }`}
              id="theme-toggle-switch"
            >
              <span
                className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {darkMode ? (
                  <Moon className="w-3" />
                ) : (
                  <Sun className="w-3 text-amber-500" />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer support desk links */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3" id="profile-helpdesk-module">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
          UX-trade Customer Help Desk
        </h3>

        <a 
          href="mailto:pellinomadio@gmail.com" 
          className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between text-xs transition-all border border-slate-100"
          id="help-btn-email"
        >
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-brand-primary" />
            <div>
              <strong className="font-bold text-slate-800 block">System Administrator</strong>
              <span className="text-[10px] text-slate-400">pellinomadio@gmail.com</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </a>

        <button 
          type="button"
          onClick={() => setAlertOpen(!alertOpen)}
          className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between text-xs text-left transition-all border border-slate-100"
          id="help-btn-faq"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <div>
              <strong className="font-bold text-slate-800 block">Frequently Asked Questions</strong>
              <span className="text-[10px] text-slate-400">Read policies & compliance requirements</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {alertOpen && (
          <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-xl text-[10px] text-slate-600 space-y-1" id="faq-alert-box">
            <p><strong>Is UX-trade safe?</strong> Yes. UX-trade is built on safe containerizations layers with real-time AES 256 backup structures.</p>
            <p><strong>What is the maximum card balance?</strong> $10,000 USD is the default Tier 2 card limit.</p>
          </div>
        )}
      </div>

      {/* Safety Policy document download */}
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs" id="regulatory-compliance-panel">
        <div className="flex items-center gap-2">
          <FileText className="w-4.5 h-4.5 text-slate-400" />
          <span className="text-slate-500 text-[11px]">Download consumer disclosure statement PDF</span>
        </div>
        <button 
          type="button" 
          onClick={() => alert("Regulatory PDF ready for download!")} 
          className="text-[10px] font-bold text-brand-dark bg-white border border-slate-200 px-2.5 py-1 rounded"
          id="doc-download-btn"
        >
          Download
        </button>
      </div>

      {/* Logout Row Action buttons */}
      <button
        id="btn-logout-auth"
        type="button"
        className="w-full py-4 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-2xl transition-all duration-300 inline-flex items-center justify-center gap-2"
        onClick={onLogout}
      >
        <LogOut className="w-4 h-4" />
        Secure Sign Out from Device
      </button>

      {/* Footer system diagnostics */}
      <div className="text-center font-mono text-[9px] text-slate-400" id="profile-diagnostics-bar">
        FIN_SYS_SECURE • LATENCY: 12ms • SERVER: CLOUD RUN • REVISION: c989
      </div>
    </div>
  );
}
