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
    return localStorage.getItem('uxtrade_dark_mode') !== 'false';
  });

  // Sync dark mode class and localStorage
  useEffect(() => {
    document.body.classList.add('dark');
    localStorage.setItem('uxtrade_dark_mode', 'true');
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
    <div className="space-y-5 pb-28 text-white font-sans max-w-md mx-auto" id="profile-tab-content">
      {/* Title */}
      <div id="profile-header-meta" className="px-1 pt-1">
        <h2 className="text-xl font-black text-white tracking-tight">Personal Account</h2>
        <p className="text-xs text-slate-400">Manage limits, security credentials & settings</p>
      </div>

      {/* Profile Overview Card (#131926 Dark Dashboard Theme) */}
      <div className="bg-[#131926] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4" id="profile-hero-card">
        <div className="flex items-center gap-4" id="profile-hero-top">
          <div className="w-14 h-14 bg-[#1C2436] text-sky-400 border-2 border-sky-500/80 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md shrink-0" id="profile-avatar-giant">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5" id="profile-level-badge-row">
              <h3 className="font-bold text-white text-base">{user.name}</h3>
              <BadgeCheck className="w-4.5 h-4.5 text-sky-400" />
            </div>
            <p className="text-xs text-slate-400">{user.email}</p>
            <p className="text-[10px] text-sky-400 font-mono tracking-wider mt-1 uppercase font-bold text-left">
              Account ID: F9J-{user.referralCode}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-[#181F2E] rounded-2xl border border-slate-800 flex flex-col gap-2.5" id="profile-meta-rewards-badge">
          <div className="flex items-center justify-between text-xs w-full">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Tier {user.tier || 1} verified limit: <strong className="text-white font-bold font-mono">{(user.tier || 1) >= 2 ? (user.tier === 3 ? '$100,000.00' : '$10,000.00') : '$1,000.00'} / day</strong>
              </span>
            </div>
            {(user.tier || 1) < 2 ? (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded font-black uppercase text-center animate-pulse shrink-0">
                STANDARD
              </span>
            ) : (
              <span className="text-[9px] text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-0.5 rounded font-bold flex items-center gap-1 shrink-0">
                <Check className="w-3 h-3 text-sky-400" /> {user.tier === 3 ? 'PLATINUM' : 'VERIFIED'}
              </span>
            )}
          </div>
        </div>

        {(user.tier || 1) < 3 && (
          <button
            type="button"
            onClick={onNavigateToUpgrade}
            className="w-full py-3.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95"
            id="profile-upgrade-action-btn"
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
            <span>Upgrade Account Limits</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>

      {/* Profile Settings */}
      <div className="bg-[#131926] rounded-3xl p-5 border border-slate-800/90 shadow-xl space-y-4" id="profile-settings-module">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
          Profile Settings
        </h3>

        {/* Name Input Section */}
        <div className="space-y-2" id="field-group-name-change">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Your Full Name
          </label>
          {isEditingName ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#181F2E] border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-white font-bold"
                  id="profile-name-textbox"
                  placeholder="Enter full name"
                  disabled={savingName}
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold rounded-xl cursor-pointer transition-colors"
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
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  id="profile-cancel-name-btn"
                >
                  Cancel
                </button>
              </div>
              {nameError && <p className="text-[10px] text-rose-400 font-semibold">{nameError}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 bg-[#181F2E] border border-slate-800 rounded-2xl" id="profile-display-name-row">
              <span className="text-xs font-bold text-white">{user.name}</span>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-xs text-sky-400 hover:text-sky-300 font-extrabold flex items-center gap-1 cursor-pointer"
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
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Registered Email Address
            </label>
            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Identity Verified
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3.5 bg-[#181F2E] border border-slate-800 rounded-2xl" id="profile-display-email-row">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300 font-mono select-none outline-none">{user.email}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 leading-normal">
            For anti-money laundering (AML) protocols and security verification, email addresses cannot be modified.
          </p>
        </div>

        {/* Theme Preferences */}
        <div className="pt-2 border-t border-slate-800" id="field-group-theme-preference">
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="block text-xs font-bold text-white">
                Application Theme
              </label>
              <span className="text-[10px] text-slate-400">Eye-safe dark theme active</span>
            </div>
            <div className="p-1 bg-[#181F2E] border border-slate-700/80 rounded-full flex items-center gap-1">
              <Moon className="w-4 h-4 text-sky-400 p-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Customer support desk links */}
      <div className="bg-[#131926] rounded-3xl p-5 border border-slate-800/90 shadow-xl space-y-3" id="profile-helpdesk-module">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
          UXtrade Customer Desk
        </h3>

        <a 
          href="mailto:pellinomadio@gmail.com" 
          className="p-3.5 bg-[#181F2E] hover:bg-[#1C2538] rounded-2xl flex items-center justify-between text-xs transition-all border border-slate-800"
          id="help-btn-email"
        >
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-sky-400" />
            <div>
              <strong className="font-bold text-white block">System Administrator</strong>
              <span className="text-[10px] text-slate-400 font-mono">pellinomadio@gmail.com</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </a>

        <button 
          type="button"
          onClick={() => setAlertOpen(!alertOpen)}
          className="w-full p-3.5 bg-[#181F2E] hover:bg-[#1C2538] rounded-2xl flex items-center justify-between text-xs text-left transition-all border border-slate-800"
          id="help-btn-faq"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <div>
              <strong className="font-bold text-white block">Frequently Asked Questions</strong>
              <span className="text-[10px] text-slate-400">Read policies & compliance requirements</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {alertOpen && (
          <div className="p-3.5 bg-[#181F2E] border border-slate-800 rounded-2xl text-[10.5px] text-slate-300 space-y-1.5" id="faq-alert-box">
            <p><strong className="text-white">Is UXtrade safe?</strong> Yes. UXtrade is built on safe containerization layers with real-time AES 256 encryption.</p>
            <p><strong className="text-white">What is the daily withdrawal limit?</strong> Tier 1: $1,000 / Day • Tier 2: $10,000 / Day • Tier 3: $100,000 / Day.</p>
          </div>
        )}
      </div>

      {/* Regulatory Compliance PDF */}
      <div className="p-4 bg-[#131926] border border-slate-800/90 rounded-2xl flex items-center justify-between text-xs" id="regulatory-compliance-panel">
        <div className="flex items-center gap-2">
          <FileText className="w-4.5 h-4.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">Download consumer disclosure statement</span>
        </div>
        <button 
          type="button" 
          onClick={() => alert("Regulatory PDF ready for download!")} 
          className="text-[10px] font-extrabold text-white bg-[#181F2E] border border-slate-700 px-3 py-1.5 rounded-xl hover:bg-[#1C2538] cursor-pointer transition-colors"
          id="doc-download-btn"
        >
          Download
        </button>
      </div>

      {/* Logout Row */}
      <button
        id="btn-logout-auth"
        type="button"
        className="w-full py-4 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 font-extrabold text-xs rounded-2xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
        onClick={onLogout}
      >
        <LogOut className="w-4 h-4" />
        Secure Sign Out from Device
      </button>

      {/* Diagnostics */}
      <div className="text-center font-mono text-[9px] text-slate-500 pt-2" id="profile-diagnostics-bar">
        FIN_SYS_SECURE • LATENCY: 12ms • SERVER: CLOUD RUN • REVISION: c989
      </div>
    </div>
  );
}
