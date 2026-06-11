import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { 
  TrendingUp, TrendingDown, Search, ArrowUpRight, ArrowDownLeft, 
  Calendar, FileSpreadsheet, ShieldCheck, Check, Sparkles,
  Lock, Mail, Users, Edit3, ShieldAlert, CheckCircle2, 
  ChevronDown, XCircle, Settings, Image as ImageIcon, LogOut
} from 'lucide-react';

interface FinancePageProps {
  user: User;
  transactions: Transaction[];
  onUpdateUser?: (updatedUser: User) => void;
}

export default function FinancePage({ user, transactions, onUpdateUser }: FinancePageProps) {
  // Standard states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'transfer' | 'airtime'>('all');
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Administrative session states
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('fintex_admin_logged_in') === 'true';
  });

  // Admin section: data states
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearchText, setUserSearchText] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Edit user fields
  const [editBalance, setEditBalance] = useState<string>('');
  const [editTier, setEditTier] = useState<number>(1);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string>('');

  // Payment Gateway Config states
  const [usdtAddr, setUsdtAddr] = useState<string>('');
  const [nairaBank, setNairaBank] = useState<string>('');
  const [nairaAccountNum, setNairaAccountNum] = useState<string>('');
  const [nairaAccountNm, setNairaAccountNm] = useState<string>('');
  const [gatewaySuccessMsg, setGatewaySuccessMsg] = useState<string>('');

  // Proofs approval queue
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Load Admin Data when logged in
  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAdminData();
    }
  }, [isAdminLoggedIn]);

  const loadAdminData = () => {
    // Load registered users list
    const users: User[] = JSON.parse(localStorage.getItem('fintex_users') || '[]');
    setUsersList(users);

    // Load gateways config
    setUsdtAddr(localStorage.getItem('fintex_gateway_usdt') || 'TRibF41CvFeNptGPbuC5gRCfGcrqcc9XPm');
    setNairaBank(localStorage.getItem('fintex_gateway_naira_bank') || 'Opay Digital Bank');
    setNairaAccountNum(localStorage.getItem('fintex_gateway_naira_acc') || '8062940251');
    setNairaAccountNm(localStorage.getItem('fintex_gateway_naira_name') || 'Forex9ja International Hub');

    // Load pending approvals queue
    const approvals = JSON.parse(localStorage.getItem('fintex_pending_approvals') || '[]');
    setPendingApprovals(approvals);
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (adminEmail.trim().toLowerCase() === 'pellinomadio@gmail.com' && adminPassword === 'MAVELL999') {
      localStorage.setItem('fintex_admin_logged_in', 'true');
      setIsAdminLoggedIn(true);
      setShowAdminLogin(false);
      setAdminEmail('');
      setAdminPassword('');
    } else {
      setAdminError('Access Denied: Invalid Administrative Credentials.');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('fintex_admin_logged_in');
    setIsAdminLoggedIn(false);
  };

  const handleSaveGateways = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('fintex_gateway_usdt', usdtAddr);
    localStorage.setItem('fintex_gateway_naira_bank', nairaBank);
    localStorage.setItem('fintex_gateway_naira_acc', nairaAccountNum);
    localStorage.setItem('fintex_gateway_naira_name', nairaAccountNm);
    setGatewaySuccessMsg('Payment Gateways configured successfully!');
    setTimeout(() => setGatewaySuccessMsg(''), 3000);
  };

  const handleSelectUserToEdit = (u: User) => {
    setEditingUserId(u.id);
    setEditBalance(u.balance.toString());
    setEditTier(u.tier || 1);
    setEditSuccessMessage('');
  };

  const handleSaveUserEdit = (userId: string) => {
    const list = JSON.parse(localStorage.getItem('fintex_users') || '[]');
    const index = list.findIndex((u: User) => u.id === userId);
    
    if (index !== -1) {
      const parsedBalance = parseFloat(editBalance);
      if (isNaN(parsedBalance)) {
        alert('Please enter a valid balance amount.');
        return;
      }
      list[index].balance = parseFloat(parsedBalance.toFixed(2));
      list[index].tier = editTier;
      localStorage.setItem('fintex_users', JSON.stringify(list));
      
      // Update local state listing
      setUsersList(list);

      // If we edited the currently logged-in user themselves, trigger sync
      if (userId === user.id && onUpdateUser) {
        onUpdateUser(list[index]);
      }

      setEditSuccessMessage('User settings updated successfully!');
      setTimeout(() => {
        setEditingUserId(null);
        setEditSuccessMessage('');
      }, 1500);
    }
  };

  const handleToggleBanUser = (u: User) => {
    const list = JSON.parse(localStorage.getItem('fintex_users') || '[]');
    const index = list.findIndex((x: User) => x.id === u.id);
    if (index !== -1) {
      const currentlyBanned = !!list[index].banned;
      list[index].banned = !currentlyBanned;
      localStorage.setItem('fintex_users', JSON.stringify(list));
      setUsersList(list);

      if (u.id === user.id && onUpdateUser) {
        onUpdateUser(list[index]);
      }
      alert(`User ${u.name} is now ${list[index].banned ? 'Banned' : 'Unbanned'}.`);
    }
  };

  const handleApprovePayload = (approvalId: string) => {
    const approvals = JSON.parse(localStorage.getItem('fintex_pending_approvals') || '[]');
    const appIndex = approvals.findIndex((a: any) => a.id === approvalId);
    if (appIndex === -1) return;

    const approval = approvals[appIndex];
    approval.status = 'approved';
    localStorage.setItem('fintex_pending_approvals', JSON.stringify(approvals));

    // Update global users list
    const list = JSON.parse(localStorage.getItem('fintex_users') || '[]');
    const uIndex = list.findIndex((u: User) => u.id === approval.userId);
    if (uIndex !== -1) {
      const u = list[uIndex];
      if (approval.type.startsWith('upgrade_tier_')) {
        u.tier = approval.type === 'upgrade_tier_3' ? 3 : 2;
      } else {
        u.balance = parseFloat((u.balance + parseFloat(approval.amount)).toFixed(2));
      }
      list[uIndex] = u;
      localStorage.setItem('fintex_users', JSON.stringify(list));
      setUsersList(list);

      if (u.id === user.id && onUpdateUser) {
        onUpdateUser(u);
      }
    }

    // Mark corresponding transaction complete in user's index
    try {
      const userTxs = JSON.parse(localStorage.getItem(`fintex_txs_${approval.userId}`) || '[]');
      const txIndex = userTxs.findIndex((t: any) => t.id === approval.txId);
      if (txIndex !== -1) {
        userTxs[txIndex].status = 'completed';
        localStorage.setItem(`fintex_txs_${approval.userId}`, JSON.stringify(userTxs));
      }
    } catch (e) {
      console.error(e);
    }

    // Refresh display queues
    setPendingApprovals(approvals);
    alert('Request approved successfully! Balance/Tier has been credited.');
  };

  const handleRejectPayload = (approvalId: string) => {
    const approvals = JSON.parse(localStorage.getItem('fintex_pending_approvals') || '[]');
    const appIndex = approvals.findIndex((a: any) => a.id === approvalId);
    if (appIndex === -1) return;

    const approval = approvals[appIndex];
    approval.status = 'rejected';
    localStorage.setItem('fintex_pending_approvals', JSON.stringify(approvals));

    // Mark corresponding transaction as failed
    try {
      const userTxs = JSON.parse(localStorage.getItem(`fintex_txs_${approval.userId}`) || '[]');
      const txIndex = userTxs.findIndex((t: any) => t.id === approval.txId);
      if (txIndex !== -1) {
        userTxs[txIndex].status = 'failed';
        localStorage.setItem(`fintex_txs_${approval.userId}`, JSON.stringify(userTxs));
      }
    } catch (e) {
      console.error(e);
    }

    setPendingApprovals(approvals);
    alert('Payment proof rejected. Request has been cancelled.');
  };

  // Standard transactions filtering
  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (tx.reference && tx.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const income = transactions
    .filter(tx => tx.type === 'deposit' || tx.type === 'reward')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expenses = transactions
    .filter(tx => tx.type === 'transfer' || tx.type === 'airtime' || tx.type === 'utility')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const graphIncomeData = [10, 25, 15, 30, 45, 60, user.balance > 0 ? 50 + (user.balance / 10) : 10];
  const graphExpenseData = [15, 10, 20, 25, 30, 20, expenses > 0 ? 20 + (expenses / 10) : 5];
  
  const pointsIncome = graphIncomeData.map((val, idx) => `${(idx * 70) + 20},${140 - Math.min(100, val)}`).join(' ');
  const pointsExpense = graphExpenseData.map((val, idx) => `${(idx * 70) + 20},${140 - Math.min(100, val)}`).join(' ');

  const handleExportStatementClick = () => {
    setShowAdminLogin(true);
  };

  // Admin users filtering based on search
  const filteredUsers = usersList.filter(u => {
    if (!userSearchText) return true;
    const txt = userSearchText.toLowerCase();
    return u.name.toLowerCase().includes(txt) || 
           u.email.toLowerCase().includes(txt) || 
           (u.referralCode && u.referralCode.toLowerCase().includes(txt));
  });

  // COUNT ACTIVE RESOLVED USERS
  const bannedCount = usersList.filter(u => u.banned).length;

  // 1. ADMIN LOGIN VIEW
  if (showAdminLogin) {
    return (
      <div className="space-y-6 pb-24 animate-fade-in font-sans" id="admin-login-view">
        <div className="flex items-center justify-between border-b border-slate-150 pb-4">
          <div>
            <h2 className="text-xl font-bold text-brand-dark tracking-tight">Administrative Authentication</h2>
            <p className="text-xs text-slate-500">Access gateway to consolidated accounts node</p>
          </div>
          <button 
            type="button" 
            onClick={() => setShowAdminLogin(false)} 
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all"
          >
            Cancel
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold text-lg mx-auto">
            <Lock className="w-5 h-5" />
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            {adminError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Admin Email Profile Address</label>
              <div className="relative">
                <Mail className="absolute inset-y-0 left-0 pl-3 w-4 h-4 text-slate-400 my-auto" />
                <input 
                  type="email"
                  required
                  placeholder="admin@forex9ja.online"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Administrative Clearing Key</label>
              <div className="relative">
                <Lock className="absolute inset-y-0 left-0 pl-3 w-4 h-4 text-slate-400 my-auto" />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl cursor-pointer transition-all uppercase tracking-wider"
            >
              Authenticate Admin Authority
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center leading-normal">
            Only authorized personnel are granted clearance. Database reads and modifications are fully audited.
          </p>
        </div>
      </div>
    );
  }

  // 2. ADMIN PORTAL VIEW
  if (isAdminLoggedIn) {
    return (
      <div className="space-y-6 pb-24 animate-fade-in font-sans" id="admin-dashboard-root">
        {/* Admin Header */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Forex9ja System Admin</h2>
            </div>
            <p className="text-xs text-slate-550">Superuser database operations and audits</p>
          </div>
          <button 
            type="button"
            onClick={handleAdminLogout} 
            className="text-xs font-bold text-rose-600 hover:text-white px-3 py-2 bg-rose-50 hover:bg-rose-500 rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-rose-100"
            id="admin-logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Close Admin Console</span>
          </button>
        </div>

        {/* Dynamic Registered Users Counters */}
        <div className="grid grid-cols-3 gap-3" id="admin-stat-counters">
          <div className="bg-white border border-slate-100 p-4 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Users</span>
            <p className="text-xl font-mono font-black text-brand-dark mt-1">{usersList.length}</p>
          </div>
          <div className="bg-white border border-slate-100 p-4 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] font-bold text-amber-500 uppercase block">Pending Audits</span>
            <p className="text-xl font-mono font-black text-amber-600 mt-1">
              {pendingApprovals.filter(a => a.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white border border-slate-100 p-4 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] font-bold text-red-500 uppercase block">Banned Accounts</span>
            <p className="text-xl font-mono font-black text-red-650 mt-1">{bannedCount}</p>
          </div>
        </div>

        {/* 2.1 PROOFS APPROVAL QUEUE MODULE */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>📁 Proof of Payment Approvals</span>
                {pendingApprovals.filter(a => a.status === 'pending').length > 0 && (
                  <span className="bg-amber-100 text-amber-850 px-1.5 py-0.5 rounded text-[9px] font-bold animate-pulse">ACTION REQUIRED</span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Approve user deposits or upgraded tiers from receipts uploaded</p>
            </div>
            <span className="font-mono text-[9px] font-bold text-slate-450 bg-slate-100 px-2 py-0.5 rounded-md">Queue ({pendingApprovals.length})</span>
          </div>

          {pendingApprovals.filter(a => a.status === 'pending').length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No deposits or upgrade validations pending verification right now.</p>
          ) : (
            <div className="space-y-3" id="admin-pending-verification-list">
              {pendingApprovals.filter(a => a.status === 'pending').map((app: any) => (
                <div key={app.id} className="p-3.5 bg-slate-50/75 border border-slate-200/60 rounded-2xl text-xs space-y-3 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{app.userName}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{app.userEmail}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-slate-800">${parseFloat(app.amount).toFixed(2)}</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{app.type.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {app.proof && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProofUrl(app.proof)}
                        className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-brand-primary rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Inspect Receipt File Proof (Click)</span>
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApprovePayload(app.id)}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10.5px] font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
                    >
                      ✓ Approve Payee
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectPayload(app.id)}
                      className="py-2 px-3 bg-red-100 hover:bg-red-550 text-red-700 hover:text-white text-[10.5px] font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      Reject Proof
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Expanded Proof Image Modal inside Admin View */}
          {selectedProofUrl && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" id="proof-viewer-modal">
              <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Receipt File Proof Viewer</h4>
                  <button 
                    type="button" 
                    onClick={() => setSelectedProofUrl(null)} 
                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-slate-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="bg-slate-100 p-2 rounded-2xl text-center">
                  <img src={selectedProofUrl} className="max-h-72 object-contain mx-auto rounded-xl border border-slate-200" alt="Auditing receipts" referrerPolicy="no-referrer" />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProofUrl(null)}
                  className="w-full py-2 bg-brand-dark text-white font-bold text-xs rounded-xl cursor-pointer text-center"
                >
                  Close Receipt Screen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2.2 USERS DATABASE SECTION */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">🔒 Modify User Accounts Directory</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Ban compliance accounts, rewrite database ledgers, adjust verification status</p>
          </div>

          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-4 h-4 my-auto" />
            <input 
              type="text"
              placeholder="Search user by name, email or code..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:bg-white text-slate-850"
              value={userSearchText}
              onChange={(e) => setUserSearchText(e.target.value)}
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1" id="admin-users-list">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-slate-450 text-center py-6">No matching users found in directory.</p>
            ) : (
              filteredUsers.map((u: User) => {
                const isSelected = editingUserId === u.id;
                return (
                  <div key={u.id} className="py-3 flex flex-col space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          {u.name}
                          {u.banned && (
                            <span className="bg-red-100 text-red-700 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded leading-none">BANNED</span>
                          )}
                          {u.tier === 2 && (
                            <span className="bg-sky-50 text-brand-primary text-[8px] font-bold px-1.5 py-0.5 rounded leading-none">Tier 2</span>
                          )}
                          {u.tier === 3 && (
                            <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded leading-none">Tier 3</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectUserToEdit(u)}
                          className="p-2 hover:bg-slate-50 border border-slate-100 hover:border-slate-350 text-slate-500 hover:text-brand-dark rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1 font-semibold"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-brand-primary" />
                          <span>Edit Ledger</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleBanUser(u)}
                          className={`p-2 rounded-xl transition-all font-semibold border text-xs cursor-pointer ${
                            u.banned 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' 
                              : 'bg-red-50 border-red-200 text-red-650 hover:bg-red-100'
                          }`}
                        >
                          {u.banned ? '✓ Unban' : '⛔ Ban'}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED LEDGER FORM */}
                    {isSelected && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-fade-in text-xs">
                        {editSuccessMessage && (
                          <p className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold rounded-lg text-[10.5px]">
                            {editSuccessMessage}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold mb-1">Adjust Balance (USD)</label>
                            <input 
                              type="number"
                              step="0.01"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                              value={editBalance}
                              onChange={(e) => setEditBalance(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold mb-1">Status Verification Level</label>
                            <select
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                              value={editTier}
                              onChange={(e) => setEditTier(Number(e.target.value))}
                            >
                              <option value="1">Tier 1 Verification</option>
                              <option value="2">Tier 2 Verified Status</option>
                              <option value="3">Tier 3 Platinum Verified</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveUserEdit(u.id)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Save User Record
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="py-2 px-3.5 bg-slate-200 text-slate-650 hover:bg-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2.3 PAYMENT GATEWAY SETTING CONFIGS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-slate-500 animate-spin-slow" />
              <span>Change Payment Account Gateways</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Customize payment gateway accounts to match user deposit flows dynamically</p>
          </div>

          <form onSubmit={handleSaveGateways} className="space-y-4 text-xs">
            {gatewaySuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-4 h-4" /> <span>{gatewaySuccessMsg}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Company USDT Receipt Wallet Address</label>
                <input 
                  type="text"
                  required
                  placeholder="TRON network address"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-red-500"
                  value={usdtAddr}
                  onChange={(e) => setUsdtAddr(e.target.value)}
                />
              </div>

              <div className="border-t border-slate-50 pt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Company Naira Bank Account Details</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-semibold mb-1">Opay, Access or Kuda</label>
                    <input 
                      type="text"
                      required
                      placeholder="Opay Digital Bank"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 font-bold"
                      value={nairaBank}
                      onChange={(e) => setNairaBank(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-semibold mb-1">Account Number</label>
                    <input 
                      type="text"
                      required
                      placeholder="8062940251"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 font-bold"
                      value={nairaAccountNum}
                      onChange={(e) => setNairaAccountNum(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-semibold mb-1">Account Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="Forex9ja Hub LLC"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 font-bold"
                      value={nairaAccountNm}
                      onChange={(e) => setNairaAccountNm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl cursor-pointer shadow-sm uppercase tracking-wider"
            >
              ✓ Save Gateways Configuration
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. STANDARD USER LEDGER VIEW
  return (
    <div className="space-y-6 pb-24" id="finance-tab-content">
      {/* Title block */}
      <div className="flex items-center justify-between" id="finance-header-row">
        <div>
          <h2 className="text-xl font-bold text-brand-dark tracking-tight">Ledger & Analytics</h2>
          <p className="text-xs text-slate-550">Real-time ledger updates and cashflow charts</p>
        </div>
        <button
          type="button"
          onClick={handleExportStatementClick}
          className="text-xs font-bold text-brand-dark bg-white border border-slate-100 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5"
          id="export-statement-btn"
        >
          {exportSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600 font-bold">Exported (.csv)</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4 text-brand-primary" />
              <span>Export CSV Statement</span>
            </>
          )}
        </button>
      </div>

      {/* income vs expense cards */}
      <div className="grid grid-cols-2 gap-4" id="finance-stat-cards">
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm" id="finance-stat-income">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Total Credits</span>
          </div>
          <p className="text-xl font-mono font-black text-slate-800" id="stat-credits-text">
            ${income.toFixed(2)}
          </p>
          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded uppercase mt-2 inline-block">
            +12.4% this week
          </span>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm" id="finance-stat-debited">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Total Debits</span>
          </div>
          <p className="text-xl font-mono font-black text-slate-800" id="stat-debits-text">
            ${expenses.toFixed(2)}
          </p>
          <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase mt-2 inline-block">
            Stable velocity
          </span>
        </div>
      </div>

      {/* Interactive Cashflow chart block */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm" id="finance-chart-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary animate-pulse-subtle" />
              Consolidated Cashflow Trends
            </h3>
            <p className="text-[10px] text-slate-400">Visualization mapping weekly inflows to outflows</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-semibold" id="chart-legend">
            <div className="flex items-center gap-1.5 text-brand-primary">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
              <span>Inflow</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Outflow</span>
            </div>
          </div>
        </div>

        {/* Scaled Responsive Graph Canvas */}
        <div className="w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100" id="chart-panel-canvas">
          <svg className="w-full h-36" viewBox="0 0 460 140" id="cashflow-growth-svg">
            <line x1="20" y1="20" x2="440" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="20" y1="60" x2="440" y2="60" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="20" y1="100" x2="440" y2="100" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
            
            <polyline
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsExpense}
            />

            <polyline
              fill="none"
              stroke="#0284C7"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsIncome}
            />

            {graphIncomeData.map((val, idx) => (
              <circle
                key={`inCircle-${idx}`}
                cx={(idx * 70) + 20}
                cy={140 - Math.min(100, val)}
                r="4.5"
                className="fill-white stroke-brand-primary stroke-2"
              />
            ))}
          </svg>

          <div className="flex justify-between items-center px-2 mt-2 text-[10px] text-slate-400 font-bold font-mono">
            <span>May 1</span>
            <span>May 7</span>
            <span>May 14</span>
            <span>May 21</span>
            <span>May 28</span>
            <span>Jun 4</span>
            <span>Jun 11</span>
          </div>
        </div>
      </div>

      {/* Ledger Search & Complete History */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm" id="ledger-history-table-section">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-4">
          Complete Transactional Ledger ({transactions.length})
        </h3>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-4" id="ledger-search-grid">
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-4 h-4 my-auto" />
            <input
              id="ledger-search-box"
              type="text"
              placeholder="Search reference, recipient or tags..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl" id="ledger-tab-filters">
            <button
              id="filter-btn-all"
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all' ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-brand-dark'
              }`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              id="filter-btn-deposit"
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'deposit' ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-brand-dark'
              }`}
              onClick={() => setFilterType('deposit')}
            >
              Credits
            </button>
            <button
              id="filter-btn-transfer"
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'transfer' ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-505 hover:text-brand-dark'
              }`}
              onClick={() => setFilterType('transfer')}
            >
              Debits
            </button>
          </div>
        </div>

        {/* Transactions list */}
        {filteredTxs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs" id="ledger-empty-msg">
            No transaction records matched your active query filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100" id="ledger-feed-items">
            {filteredTxs.map(tx => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between" id={`ledger-item-${tx.id}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'deposit' || tx.type === 'reward' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-rose-50 text-rose-600'
                  }`} id={`ledger-icon-${tx.id}`}>
                    {tx.type === 'deposit' || tx.type === 'reward' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-dark leading-snug">{tx.description}</h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono">{tx.reference}</span>
                      <span>•</span>
                      <span>{new Date(tx.date).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-mono font-black ${
                    tx.type === 'deposit' || tx.type === 'reward' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'reward' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'pending' ? 'bg-amber-500 animate-pulse' : tx.status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <span className={`text-[9.5px] font-mono uppercase tracking-wider font-bold ${tx.status === 'pending' ? 'text-amber-600' : tx.status === 'failed' ? 'text-red-550' : 'text-slate-400'}`}>
                      {tx.status === 'pending' ? 'Processing Payment' : tx.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PCI DSS bottom notification footer badge */}
      <div className="flex items-center justify-center gap-2 text-slate-400 text-[11px] font-medium" id="finance-regulatory-guard">
        <ShieldCheck className="w-4 h-4 text-brand-primary" />
        <span>Instantly reconciled with FedWire and local clearing accounts.</span>
      </div>
    </div>
  );
}
