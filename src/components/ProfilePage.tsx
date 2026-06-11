import { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { 
  User as UserIcon, Mail, ShieldCheck, LogOut, PhoneCall, HelpCircle, 
  ChevronRight, ArrowRight, ShieldAlert, BadgeCheck, FileText, Check,
  Copy, ArrowLeft
} from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export default function ProfilePage({ user, onLogout, onUpdateUser }: ProfilePageProps) {
  const [alertOpen, setAlertOpen] = useState<boolean>(false);

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
              Account ID: FTX-{user.referralCode}
            </p>
          </div>
        </div>

        <div className="p-3 bg-sky-50/50 rounded-2xl border border-sky-100 flex flex-col gap-2.5" id="profile-meta-rewards-badge">
          <div className="flex items-center justify-between text-xs w-full">
            <div className="flex items-center gap-1.5 text-xs text-brand-dark font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
              <span>
                Tier {user.tier || 1} verified account limit: <strong>{(user.tier || 1) >= 2 ? '$10,000.00' : '$1,000.00'} / day</strong>
              </span>
            </div>
            {(user.tier || 1) < 2 ? (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded font-black uppercase text-center">
                STANDARD
              </span>
            ) : (
              <span className="text-[9px] text-brand-primary bg-sky-105 px-2.5 py-1 rounded font-bold flex items-center gap-1 shrink-0">
                <Check className="w-3 h-3 text-brand-primary" /> VERIFIED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Customer support desk links */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3" id="profile-helpdesk-module">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
          Fintex Customer Help Desk
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
            <p><strong>Is Fintex safe?</strong> Yes. Fintex is built on safe containerizations layers with real-time AES 256 backup structures.</p>
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
