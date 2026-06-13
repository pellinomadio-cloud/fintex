import { useState, useEffect, FormEvent } from 'react';
import { User, Transaction, ReferralHistory } from '../types';
import { 
  Users, Gift, Award, ArrowUpRight, Copy, Share2, Sparkles, Check, 
  Plus, Calendar, ArrowDownLeft, BadgeAlert, Sparkle, ShieldAlert
} from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';

interface RewardsPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onAddTransaction: (tx: Transaction) => void;
}

export default function RewardsPage({ user, onUpdateUser, onAddTransaction }: RewardsPageProps) {
  const [copyCodeSuccess, setCopyCodeSuccess] = useState<boolean>(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState<boolean>(false);
  const [referrals, setReferrals] = useState<ReferralHistory[]>([]);
  
  // Safebox form state
  const [safeboxAmount, setSafeboxAmount] = useState<string>('');

  // Daily claiming checkin state
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false);
  const [claimingStatus, setClaimingStatus] = useState<string>('');

  useEffect(() => {
    if (!user?.id) return;

    // Load actual referrals from Firestore subcollection
    const referralsColRef = collection(db, 'users', user.id, 'referrals');
    const unsubscribe = onSnapshot(referralsColRef, (snap) => {
      const fbReferrals: ReferralHistory[] = [];
      snap.forEach(docSnap => {
        const item = docSnap.data() as ReferralHistory;
        if (!item.id) {
          item.id = docSnap.id;
        }
        fbReferrals.push(item);
      });

      // Handle real-time referral reward auto-reconciliation
      const pending = fbReferrals.filter(r => r.status === 'completed');
      if (pending.length > 0 && user.id !== 'u_demo') {
        let addedBalance = 0;
        const newTxs: Transaction[] = [];

        pending.forEach(ref => {
          const refDocId = ref.id || 'david_miller';
          addedBalance += ref.rewardEarned;

          // Build reward transaction
          const rTxId = 'tx_reward_' + Math.random().toString(36).substr(2, 9);
          const tx: Transaction = {
            id: rTxId,
            userId: user.id,
            type: 'reward',
            amount: ref.rewardEarned,
            description: `Referral signup reward for inviting ${ref.refereeName}`,
            date: new Date().toISOString(),
            status: 'completed',
            reference: 'FTX-REF-' + Math.floor(100000 + Math.random() * 900000)
          };
          newTxs.push(tx);

          // Update status to 'credited' in Firestore to prevent multiple rewards
          updateDoc(doc(db, 'users', user.id, 'referrals', refDocId), { status: 'credited' })
            .catch(e => console.error("Error crediting referral:", e));
        });

        if (addedBalance > 0) {
          const updatedUser: User = {
            ...user,
            balance: parseFloat((user.balance + addedBalance).toFixed(2))
          };
          onUpdateUser(updatedUser);
          newTxs.forEach(tx => onAddTransaction(tx));
        }
      }

      if (fbReferrals.length > 0) {
        setReferrals(fbReferrals);
        localStorage.setItem(`fintex_referrals_${user.id}`, JSON.stringify(fbReferrals));
      } else if (user.id === 'u_demo') {
        const seed: ReferralHistory = {
          refereeName: 'David Miller',
          email: 'david.miller@gmail.com',
          date: new Date(Date.now() - 3600000 * 48).toISOString(),
          rewardEarned: 10.00,
          status: 'completed'
        };
        setDoc(doc(db, 'users', user.id, 'referrals', 'david_miller'), seed)
          .catch(err => console.error("Failed to seed default referral in Firestore:", err));
        setReferrals([seed]);
        localStorage.setItem(`fintex_referrals_${user.id}`, JSON.stringify([seed]));
      } else {
        setReferrals([]);
      }
    }, (err) => {
      console.error("Error fetching referrals from Firestore:", err);
      const saved = JSON.parse(localStorage.getItem(`fintex_referrals_${user.id}`) || '[]');
      setReferrals(saved);
    });

    // Check check-in status from user's lastCheckInDate field in real-time or local storage
    const userRef = doc(db, 'users', user.id);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.lastCheckInDate === new Date().toDateString()) {
          setHasCheckedInToday(true);
        } else {
          // Check local storage fallback too
          const checked = localStorage.getItem(`fintex_checked_in_${user.id}_${new Date().toDateString()}`);
          if (checked) {
            setHasCheckedInToday(true);
          } else {
            setHasCheckedInToday(false);
          }
        }
      }
    }, (err) => {
      console.warn("Error subscribing to user profile check-in date:", err);
      const checked = localStorage.getItem(`fintex_checked_in_${user.id}_${new Date().toDateString()}`);
      if (checked) {
        setHasCheckedInToday(true);
      }
    });

    return () => {
      unsubscribe();
      unsubUser();
    };
  }, [user.id, user.name]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopyCodeSuccess(true);
    setTimeout(() => setCopyCodeSuccess(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://ux6trade.online/?code=${user.referralCode}`);
    setCopyLinkSuccess(true);
    setTimeout(() => setCopyLinkSuccess(false), 2000);
  };

  const handleCheckInClaim = () => {
    if (hasCheckedInToday) return;

    setClaimingStatus('Processing checkin...');
    const rewardAmt = 0.50; // daily 50 cents

    setTimeout(() => {
      const updatedUser: User = {
        ...user,
        balance: parseFloat((user.balance + rewardAmt).toFixed(2)),
        lastCheckInDate: new Date().toDateString()
      };

      const tx: Transaction = {
        id: 'tx_checkin_' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        type: 'reward',
        amount: rewardAmt,
        description: 'Daily Check-in Loyalty Reward',
        date: new Date().toISOString(),
        status: 'completed',
        reference: 'FTX-DLY-' + Math.floor(100000 + Math.random() * 900000)
      };

      onUpdateUser(updatedUser);
      onAddTransaction(tx);
      setHasCheckedInToday(true);
      localStorage.setItem(`fintex_checked_in_${user.id}_${new Date().toDateString()}`, 'true');
      setClaimingStatus('');
      alert(`Success! Daily check-in complete. You earned +$0.50 cash reward!`);
    }, 800);
  };

  // Safebox deposit action
  const handleSafeboxDeposit = (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(safeboxAmount);
    if (!amt || amt <= 0) return;
    if (amt > user.balance) {
      alert("Insufficient free balance to transfer to Safebox Account.");
      return;
    }

    const updatedUser: User = {
      ...user,
      balance: parseFloat((user.balance - amt).toFixed(2)),
      savingsBalance: parseFloat((user.savingsBalance + amt).toFixed(2))
    };

    const tx: Transaction = {
      id: 'tx_savings_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'savings_deposit',
      amount: amt,
      description: 'Locker Deposit to Safebox vault',
      date: new Date().toISOString(),
      status: 'completed',
      reference: 'FTX-SFD-' + Math.floor(100000 + Math.random() * 900000)
    };

    onUpdateUser(updatedUser);
    onAddTransaction(tx);
    setSafeboxAmount('');
    alert(`Success! Locked $${amt.toFixed(2)} in your Safebox vault at 15% APY.`);
  };

  // Safebox withdraw action
  const handleSafeboxWithdraw = () => {
    if (user.savingsBalance <= 0) {
      alert("Safebox Vault balance is $0.00. Fund it first to earn interest!");
      return;
    }
    const amt = user.savingsBalance;

    const updatedUser: User = {
      ...user,
      balance: parseFloat((user.balance + amt).toFixed(2)),
      savingsBalance: 0.00
    };

    const tx: Transaction = {
      id: 'tx_savings_w_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'savings_withdrawal',
      amount: amt,
      description: 'Returned all funds from Safebox to Balance',
      date: new Date().toISOString(),
      status: 'completed',
      reference: 'FTX-SFW-' + Math.floor(100000 + Math.random() * 900000)
    };

    onUpdateUser(updatedUser);
    onAddTransaction(tx);
    alert(`Success! Redeemed $${amt.toFixed(2)} principal & unlocked interest instantly.`);
  };

  const totalRewards = referrals.reduce((sum, item) => sum + item.rewardEarned, 0) + (hasCheckedInToday ? 0.50 : 0);

  return (
    <div className="space-y-6 pb-24" id="rewards-tab-content">
      {/* Title Header */}
      <div id="rewards-header-row">
        <h2 className="text-xl font-bold text-brand-dark tracking-tight">Referrals & Safebox</h2>
        <p className="text-xs text-slate-500">Earn daily cashbacks, lock savings, and build wealth</p>
      </div>

      {/* Stats row list */}
      <div className="grid grid-cols-2 gap-4" id="rewards-scoreboard">
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm text-center" id="reward-stats-box1">
          <Award className="w-6 h-6 text-brand-primary mx-auto mb-1.5" />
          <span className="text-[11px] font-semibold text-slate-500 block">Rewards Balance</span>
          <span className="font-mono text-xl font-black text-slate-800">${totalRewards.toFixed(2)}</span>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm text-center" id="reward-stats-box2">
          <Users className="w-6 h-6 text-indigo-500 mx-auto mb-1.5" />
          <span className="text-[11px] font-semibold text-slate-500 block">Invites Approved</span>
          <span className="font-mono text-xl font-black text-slate-800">{referrals.length} friends</span>
        </div>
      </div>

      {/* Safebox Vault Section - High interest earner (White, Light Blue, Dark Blue) */}
      <div className="bg-gradient-to-br from-brand-dark to-brand-medium rounded-3xl p-5 text-white shadow-xl shadow-brand-dark/15 space-y-4" id="safebox-wealth-vault">
        <div className="flex justify-between items-start" id="safebox-header">
          <div>
            <span className="text-[10px] font-bold text-sky-200 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full inline-block mb-1.5">
              🚀 Premium Savings Account
            </span>
            <h3 className="text-lg font-bold font-display">Safebox Interest Vault</h3>
            <p className="text-xs text-sky-100/80 mt-0.5">Fund Safebox to earn 15.0% APY compounded hourly.</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-sky-200 block">Vault Active</span>
            <span className="font-mono text-lg font-black" id="safebox-balance-text">
              ${user.savingsBalance.toFixed(2)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSafeboxDeposit} className="flex gap-2" id="safebox-action-form">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-700">$</span>
            <input 
              id="safebox-deposit-input"
              type="number"
              step="1"
              min="1"
              required
              placeholder="Lock amount (e.g. 10)"
              className="w-full pl-6 pr-3 py-2.5 bg-white text-brand-dark border border-white/20 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-light"
              value={safeboxAmount}
              onChange={(e) => setSafeboxAmount(e.target.value)}
            />
          </div>
          <button 
            id="btn-lock-safebox"
            type="submit" 
            className="px-4 py-2.5 bg-white text-brand-dark font-bold text-xs rounded-xl hover:bg-sky-50 active:scale-98 transition-all"
          >
            Lock Savings
          </button>
        </form>

        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs" id="safebox-footer-actions">
          <span className="text-sky-200 font-semibold">✔ No time lock - pull cash out instantly</span>
          <button 
            type="button" 
            onClick={handleSafeboxWithdraw}
            className="text-white hover:text-sky-250 hover:underline font-bold text-xs"
            id="btn-withdraw-safebox"
          >
            Withdraw All Principal ↩
          </button>
        </div>
      </div>

      {/* Daily loyalty check in card */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center justify-between" id="daily-check-in-module">
        <div>
          <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkle className="w-4.5 h-4.5 text-brand-primary" />
            Daily Loyalty Cash Check-In
          </h3>
          <p className="text-xs text-slate-500">Claim $0.50 cash directly into balance every 24 hours.</p>
        </div>
        <button
          type="button"
          disabled={hasCheckedInToday || claimingStatus !== ''}
          onClick={handleCheckInClaim}
          className={`px-4.5 py-3 rounded-2xl font-bold text-xs transition-all ${
            hasCheckedInToday 
              ? 'bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200' 
              : 'bg-brand-dark text-white hover:bg-brand-medium shadow-sm'
          }`}
          id="btn-daily-claim"
        >
          {claimingStatus ? claimingStatus : hasCheckedInToday ? 'Claimed ✓' : 'Claim $0.50'}
        </button>
      </div>

      {/* Share to Invite Code container */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4" id="invite-sharer-section">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-4.5 h-4.5 text-brand-primary" />
          Your Referral Statistics
        </h3>

        {/* Action clipboard */}
        <div className="grid grid-cols-2 gap-3" id="share-block-clips">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl relative" id="clip-ref-code">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">REFERRAL CODE</span>
            <span className="font-mono text-sm font-black text-brand-dark tracking-widest">{user.referralCode}</span>
            <button 
              type="button" 
              onClick={handleCopyCode} 
              className="absolute right-2.5 top-2.5 p-1.5 text-slate-400 hover:text-brand-dark bg-white rounded-lg border border-slate-100 transition-all"
              id="copy-code-btn"
            >
              {copyCodeSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl relative" id="clip-ref-link">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">REFERRAL LINK</span>
            <span className="text-xs text-brand-dark truncate font-medium block pr-6">ux6trade.online/?code={user.referralCode}</span>
            <button 
              type="button" 
              onClick={handleCopyLink} 
              className="absolute right-2.5 top-2.5 p-1.5 text-slate-400 hover:text-brand-dark bg-white rounded-lg border border-slate-100 transition-all"
              id="copy-link-btn"
            >
              {copyLinkSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Referrals history loop */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm" id="referrals-history-listing">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-3">Referrals list</h3>
        {referrals.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">No referrals listed. Share code to earn bonuses.</div>
        ) : (
          <div className="divide-y divide-slate-50" id="referrals-feed">
            {referrals.map((r, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between" id={`referral-item-${i}`}>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">{r.refereeName}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Joined {new Date(r.date).toLocaleDateString()} • {r.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-600">+${r.rewardEarned.toFixed(2)}</span>
                  <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.2 ml-1.5 font-bold rounded">SUCCESS</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
