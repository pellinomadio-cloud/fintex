import { useState, useEffect, FormEvent } from 'react';
import { User, Transaction, ReferralHistory } from '../types';
import { 
  Users, Gift, Award, ArrowUpRight, Copy, Share2, Sparkles, Check, 
  Plus, Calendar, ArrowDownLeft, BadgeAlert, Sparkle, ShieldAlert,
  Pickaxe, Timer, Clock, Flame, Zap, Cpu, Crown, Star, CheckCircle, 
  ShieldCheck, TrendingUp, UserCheck
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
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  
  // Safebox form state
  const [safeboxAmount, setSafeboxAmount] = useState<string>('');

  // Daily claiming checkin state
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false);
  const [claimingStatus, setClaimingStatus] = useState<string>('');

  // Mining state (5-minute cycle for $3.00)
  const [miningTimeLeft, setMiningTimeLeft] = useState<number>(0);

  // Subscribe to all users to cross-reference referee live tiers in real-time
  useEffect(() => {
    const unsubAllUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const map: Record<string, User> = {};
      snap.forEach(d => {
        const u = d.data() as User;
        if (u.id) map[u.id] = u;
        if (u.email) map[u.email.toLowerCase()] = u;
      });
      setUsersMap(map);
    }, (err) => {
      console.warn("Could not subscribe to all users in RewardsPage:", err);
      // Fallback from localStorage
      const localUsers: User[] = JSON.parse(localStorage.getItem('fintex_users') || '[]');
      const map: Record<string, User> = {};
      localUsers.forEach(u => {
        if (u.id) map[u.id] = u;
        if (u.email) map[u.email.toLowerCase()] = u;
      });
      setUsersMap(map);
    });

    return () => unsubAllUsers();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Load mining timer state from localStorage
    const lastMined = localStorage.getItem(`fintex_last_mined_time_${user.id}`);
    if (lastMined) {
      const elapsed = Math.floor((Date.now() - Number(lastMined)) / 1000);
      if (elapsed < 300) {
        setMiningTimeLeft(300 - elapsed);
      } else {
        setMiningTimeLeft(0);
      }
    }

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

      if (fbReferrals.length > 0) {
        setReferrals(fbReferrals);
        localStorage.setItem(`fintex_referrals_${user.id}`, JSON.stringify(fbReferrals));
      } else if (user.id === 'u_demo') {
        const seed: ReferralHistory = {
          refereeName: 'David Miller',
          email: 'david.miller@gmail.com',
          date: new Date(Date.now() - 3600000 * 48).toISOString(),
          rewardEarned: 0.50,
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

  // Mining countdown timer effect
  useEffect(() => {
    if (miningTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setMiningTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [miningTimeLeft]);

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
    const rewardAmt = 50.00; // daily 50 dollars

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
        description: 'Daily Check-in Loyalty Reward ($50.00)',
        date: new Date().toISOString(),
        status: 'completed',
        reference: 'FTX-DLY-' + Math.floor(100000 + Math.random() * 900000)
      };

      onUpdateUser(updatedUser);
      onAddTransaction(tx);
      setHasCheckedInToday(true);
      localStorage.setItem(`fintex_checked_in_${user.id}_${new Date().toDateString()}`, 'true');
      setClaimingStatus('');
      alert(`Success! Daily check-in complete. You earned +$50.00 cash reward!`);
    }, 800);
  };

  const handleStartMining = () => {
    if (miningTimeLeft > 0) return;

    const miningReward = 3.00; // $3.00 per 5 minutes
    const updatedUser: User = {
      ...user,
      balance: parseFloat((user.balance + miningReward).toFixed(2))
    };

    const tx: Transaction = {
      id: 'tx_mining_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'reward',
      amount: miningReward,
      description: '5-Minute Crypto Mining Reward ($3.00)',
      date: new Date().toISOString(),
      status: 'completed',
      reference: 'FTX-MINE-' + Math.floor(100000 + Math.random() * 900000)
    };

    onUpdateUser(updatedUser);
    onAddTransaction(tx);

    const now = Date.now();
    localStorage.setItem(`fintex_last_mined_time_${user.id}`, now.toString());
    setMiningTimeLeft(300); // 5 minutes = 300 seconds
    alert('Success! You mined $3.00 cash reward added directly to your wallet balance!');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  // Check if current user is an admin
  const isAdmin = !!(user.isAdmin || user.isAdminVerified);

  // Enrich referrals with live user profile data
  const enrichedReferrals = referrals.map(r => {
    const liveReferee = (r.refereeId && usersMap[r.refereeId]) || (r.email && usersMap[r.email.toLowerCase()]);
    const liveTier = liveReferee?.tier || r.refereeTier || (r.hasUpgraded ? 2 : 1);
    const isUpgradedLevel2 = liveTier >= 2 || !!r.hasUpgraded;
    return {
      ...r,
      liveTier,
      isUpgradedLevel2,
      isRefereeAdmin: !!(liveReferee?.isAdmin || liveReferee?.isAdminVerified)
    };
  });

  const level2UpgradedCount = enrichedReferrals.filter(r => r.isUpgradedLevel2).length;
  const totalReferralsCount = enrichedReferrals.length;
  const level1Count = Math.max(0, totalReferralsCount - level2UpgradedCount);
  const conversionRate = totalReferralsCount > 0 ? Math.round((level2UpgradedCount / totalReferralsCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-24" id="rewards-tab-content">
      {/* Title Header */}
      <div id="rewards-header-row" className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-brand-dark tracking-tight">Referrals & Safebox</h2>
            {isAdmin && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-600" /> Admin Network
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">Earn daily cashbacks, lock savings, and track upgraded referral networks</p>
        </div>
      </div>

      {/* Stats row list */}
      <div className="grid grid-cols-2 gap-3" id="rewards-scoreboard">
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center justify-between px-4" id="reward-stats-box1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Total Invites</span>
              <span className="font-mono text-sm font-black text-brand-dark">{totalReferralsCount} Members</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-3xl shadow-sm flex items-center justify-between px-4" id="reward-stats-box2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block">Level 2 Upgrades</span>
              <span className="font-mono text-sm font-black text-emerald-700">{level2UpgradedCount} Upgraded</span>
            </div>
          </div>
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
          <p className="text-xs text-slate-500">Claim $50.00 cash directly into balance every 24 hours.</p>
        </div>
        <button
          type="button"
          disabled={hasCheckedInToday || claimingStatus !== ''}
          onClick={handleCheckInClaim}
          className={`px-4.5 py-3 rounded-2xl font-bold text-xs transition-all ${
            hasCheckedInToday 
              ? 'bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200' 
              : 'bg-brand-dark text-white hover:bg-brand-medium shadow-sm cursor-pointer'
          }`}
          id="btn-daily-claim"
        >
          {claimingStatus ? claimingStatus : hasCheckedInToday ? 'Claimed ✓' : 'Claim $50.00'}
        </button>
      </div>

      {/* 5-Minute Cash Mining Module */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl text-white space-y-4 relative overflow-hidden" id="cash-mining-module">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Pickaxe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-display">5-Minute Cash Mining Rig</h3>
                <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  $3.00 / 5 MIN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Mine $3.00 USD cash every 5 minutes straight to your wallet balance.</p>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-[#131926] rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Mining Reward</span>
            <strong className="text-amber-400 font-mono text-sm font-black">+$3.00 USD</strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Cycle Timer</span>
            <span className="text-white font-mono font-bold flex items-center justify-end gap-1.5 mt-0.5">
              <Timer className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              {miningTimeLeft > 0 ? formatTime(miningTimeLeft) : 'READY TO MINE'}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={miningTimeLeft > 0}
          onClick={handleStartMining}
          className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            miningTimeLeft > 0
              ? 'bg-slate-800/80 text-slate-400 border border-slate-700/80 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black hover:scale-[1.01] active:scale-[0.99]'
          }`}
          id="btn-mine-cash"
        >
          {miningTimeLeft > 0 ? (
            <>
              <Clock className="w-4 h-4 animate-pulse text-amber-400" />
              <span>Mining In Progress ({formatTime(miningTimeLeft)})</span>
            </>
          ) : (
            <>
              <Pickaxe className="w-4 h-4 text-slate-950" />
              <span>Mine & Claim $3.00 Cash Now</span>
            </>
          )}
        </button>
      </div>

      {/* Share to Invite Code container */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4" id="invite-sharer-section">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4.5 h-4.5 text-brand-primary" />
            Your Referral Statistics
          </h3>
          {isAdmin && (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-600" /> Admin Referral Link
            </span>
          )}
        </div>

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

      {/* Admin / User Level 2 Referral Upgrade Status Overview Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4" id="admin-referral-upgrade-status-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                {isAdmin ? 'Admin Referral Network & Upgrades' : 'Referral Upgrades Status'}
              </h3>
              <p className="text-[10px] text-slate-400">Track members who upgraded to Level 2 under your link</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
            {level2UpgradedCount} Upgraded
          </span>
        </div>

        {/* Highlight Banner with exact upgrade status statement */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/70 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-snug">
                Status: <span className="text-emerald-700 font-extrabold">{level2UpgradedCount} of your registered user{level2UpgradedCount === 1 ? '' : 's'} have upgraded to Level 2</span> under your referral link
              </h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                {level2UpgradedCount > 0 
                  ? `${level2UpgradedCount} member${level2UpgradedCount === 1 ? ' has' : 's have'} successfully activated Level 2 status with verified limits under your referral network.` 
                  : 'Share your referral link with members. Once registered users upgrade to Level 2, their upgrade status will be tracked and displayed here in real time.'}
              </p>
            </div>
          </div>
        </div>

        {/* Metric pills */}
        <div className="grid grid-cols-3 gap-2.5" id="referral-status-metrics">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">TOTAL REGISTERED</span>
            <span className="text-base font-mono font-black text-brand-dark">{totalReferralsCount}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Under your link</span>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
            <span className="text-[10px] text-emerald-700 font-bold block mb-0.5 flex items-center justify-center gap-1">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> UPGRADED L2
            </span>
            <span className="text-base font-mono font-black text-emerald-700">{level2UpgradedCount}</span>
            <span className="text-[9px] text-emerald-600 block mt-0.5">Level 2+ active</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">CONVERSION</span>
            <span className="text-base font-mono font-black text-indigo-700">{conversionRate}%</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Upgrade rate</span>
          </div>
        </div>
      </div>

      {/* Referrals history loop with distinct Level 2 upgrade status badges */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm" id="referrals-history-listing">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-brand-primary" />
            Referrals &amp; Upgrade Status
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">{enrichedReferrals.length} total members</span>
        </div>

        {enrichedReferrals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
            <p>No referrals listed yet.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Share your referral code to invite users and earn rewards.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100" id="referrals-feed">
            {enrichedReferrals.map((r, i) => (
              <div key={r.id || i} className="py-3 flex items-center justify-between gap-2" id={`referral-item-${i}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    r.isUpgradedLevel2 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {r.isUpgradedLevel2 ? (
                      <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-500" />
                    ) : (
                      r.refereeName?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-brand-dark">{r.refereeName}</h4>
                      {r.isUpgradedLevel2 ? (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 font-bold rounded-full flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                          Upgraded to Level {r.liveTier >= 2 ? r.liveTier : 2}
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 font-bold rounded-full">
                          Level 1 (Standard)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Joined {new Date(r.date).toLocaleDateString()} • {r.email}
                    </p>
                    {r.isUpgradedLevel2 && (
                      <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">
                        ✓ Upgraded to Level {r.liveTier >= 2 ? r.liveTier : 2} under your referral link
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-600 block">
                    +${(r.rewardEarned || 0.50).toFixed(2)}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.2 font-bold rounded block mt-0.5 ${
                    r.isUpgradedLevel2 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {r.isUpgradedLevel2 ? 'L2 UPGRADED' : 'SUCCESS'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
