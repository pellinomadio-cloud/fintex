import { useState, useEffect } from 'react';
import { User, Transaction } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CardsPage from './components/CardsPage';
import FinancePage from './components/FinancePage';
import RewardsPage from './components/RewardsPage';
import ProfilePage from './components/ProfilePage';
import TradingPage from './components/TradingPage';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { doc, collection, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// Lucide Icons
import { 
  Home as HomeIcon, Gift as RewardsIcon, TrendingUp as FinanceIcon, 
  CreditCard as CardsIcon, User as ProfileIcon, ShieldAlert, Sparkles,
  Activity as TradeIcon
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [triggerUpgrade, setTriggerUpgrade] = useState<boolean>(false);

  useEffect(() => {
    // Check local session
    const storedUser = localStorage.getItem('fintex_current_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        setCurrentUser(parsed);
        // Load user-specific transaction list
        const txs = JSON.parse(localStorage.getItem(`fintex_txs_${parsed.id}`) || '[]');
        setTransactions(txs);
      } catch (err) {
        console.error('Session retrieve failure', err);
      }
    }
  }, []);

  // Sync state between global users list, Firestore, and current session using real-time listeners
  useEffect(() => {
    if (!currentUser?.id) return;

    // 1. Local storage sync on initial mount or load
    const users: User[] = JSON.parse(localStorage.getItem('fintex_users') || '[]');
    const latest = users.find(u => u.id === currentUser.id);
    if (latest) {
      if (
        latest.banned !== currentUser.banned || 
        latest.tier !== currentUser.tier || 
        latest.balance !== currentUser.balance ||
        latest.savingsBalance !== currentUser.savingsBalance
      ) {
        setCurrentUser(latest);
        localStorage.setItem('fintex_current_user', JSON.stringify(latest));
      }
    }

    // 2. Real-time User Profile Firestore Sync
    const userRef = doc(db, 'users', currentUser.id);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const fbUser = docSnap.data() as User;
        
        // Cache in user dictionary too
        const localUsersList: User[] = JSON.parse(localStorage.getItem('fintex_users') || '[]');
        const idx = localUsersList.findIndex(u => u.id === fbUser.id);
        if (idx !== -1) {
          localUsersList[idx] = fbUser;
          localStorage.setItem('fintex_users', JSON.stringify(localUsersList));
        }

        if (
          fbUser.banned !== currentUser.banned ||
          fbUser.tier !== currentUser.tier ||
          fbUser.balance !== currentUser.balance ||
          fbUser.savingsBalance !== currentUser.savingsBalance
        ) {
          setCurrentUser(fbUser);
          localStorage.setItem('fintex_current_user', JSON.stringify(fbUser));
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${currentUser.id}`);
    });

    // 3. Real-time Transactions Firestore Sync
    const txsColRef = collection(db, 'users', currentUser.id, 'transactions');
    const unsubscribeTxs = onSnapshot(txsColRef, (querySnap) => {
      const fbTxs: Transaction[] = [];
      querySnap.forEach(snap => {
        fbTxs.push(snap.data() as Transaction);
      });
      fbTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(fbTxs);
      localStorage.setItem(`fintex_txs_${currentUser.id}`, JSON.stringify(fbTxs));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${currentUser.id}/transactions`);
    });

    return () => {
      unsubscribeUser();
      unsubscribeTxs();
    };
  }, [currentUser?.id]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    // Load existing transactions or default empty
    const txs = JSON.parse(localStorage.getItem(`fintex_txs_${user.id}`) || '[]');
    setTransactions(txs);
    setActiveTab('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('fintex_current_user');
    setCurrentUser(null);
    setTransactions([]);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('fintex_current_user', JSON.stringify(updatedUser));

    // Update in users dictionary
    const users: User[] = JSON.parse(localStorage.getItem('fintex_users') || '[]');
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('fintex_users', JSON.stringify(users));
    }

    // Sync user changes to Firestore
    try {
      await setDoc(doc(db, 'users', updatedUser.id), updatedUser);
    } catch (err) {
      console.error("Firestore user update fail", err);
    }
  };

  const handleAddTransaction = async (newTx: Transaction) => {
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    if (currentUser) {
      localStorage.setItem(`fintex_txs_${currentUser.id}`, JSON.stringify(updatedTxs));

      // Sync transaction to Firestore
      try {
        await setDoc(doc(db, 'users', currentUser.id, 'transactions', newTx.id), newTx);
      } catch (err) {
        console.error("Firestore add transaction error", err);
      }
    }
  };

  const handleUpdateTransaction = async (txId: string, updatedFields: Partial<Transaction>) => {
    const updatedTxs = transactions.map(t => t.id === txId ? { ...t, ...updatedFields } : t);
    setTransactions(updatedTxs);
    if (currentUser) {
      localStorage.setItem(`fintex_txs_${currentUser.id}`, JSON.stringify(updatedTxs));

      // Sync updated fields to Firestore
      try {
        await updateDoc(doc(db, 'users', currentUser.id, 'transactions', txId), updatedFields);
      } catch (err) {
        console.error("Firestore update transaction error", err);
      }
    }
  };

  if (!currentUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  if (currentUser.banned) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 antialiased" id="banned-view">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-6 border border-red-500/30 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl border border-red-500/20 animate-pulse">
            🔒
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-black text-2xl text-red-500">Account Access Suspended</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              We have detected compliance abnormalities on your UX-trade account. As a security precaution, your wallet balance, debit cards, and transfers have been locked.
            </p>
          </div>
          
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50 space-y-2 text-left">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">Account Identification:</span>
            <span className="text-[11px] font-mono font-bold text-slate-300 block break-all">ID: {currentUser.id}</span>
            <span className="text-[11px] font-mono font-bold text-slate-400 block">Email: {currentUser.email}</span>
          </div>

          <div className="space-y-3">
            <a 
              href="https://t.me/uxtrade" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl block transition-all hover:scale-[1.02] cursor-pointer text-center"
            >
              Contact Agent on Telegram @uxtrade
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 bg-transparent text-slate-450 hover:text-white font-bold text-xs rounded-2xl border border-slate-705 hover:border-slate-500 transition-all cursor-pointer"
            >
              Sign Out of Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased select-none" id="uxtrade-master-app">
      {/* Top Banner Applet Brand Bar */}
      <header className="fixed top-0 inset-x-0 bg-brand-dark text-white z-40 h-14 flex items-center justify-between px-4 sm:px-6 shadow-md border-b border-brand-medium/20" id="uxtrade-global-header">
        <div className="flex items-center gap-2" id="header-brand-logo-section">
          <div className="w-8 h-8 rounded-lg bg-white text-brand-dark flex items-center justify-center font-display font-black text-lg shadow">
            U
          </div>
          <span className="font-display font-semibold tracking-tight text-base" id="header-app-brand-name">
            UX-trade<span className="text-brand-light font-sans font-medium text-[10px] ml-1">Secure</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-sky-100" id="header-connection-status">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Secured Sandbox</span>
        </div>
      </header>

      {/* Main Page scroll viewport */}
      <main className="flex-1 mt-14 px-4 py-6 max-w-lg mx-auto w-full" id="uxtrade-main-tab-content">
        {activeTab === 'home' && (
          <Dashboard 
            user={currentUser} 
            onUpdateUser={handleUpdateUser} 
            transactions={transactions} 
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            triggerUpgrade={triggerUpgrade}
            onClearTriggerUpgrade={() => setTriggerUpgrade(false)}
          />
        )}
        {activeTab === 'cards' && (
          <CardsPage 
            user={currentUser} 
            onUpdateUser={handleUpdateUser}
            onAddTransaction={handleAddTransaction}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'finance' && (
          <FinancePage 
            user={currentUser} 
            transactions={transactions} 
            onUpdateUser={handleUpdateUser}
          />
        )}
        {activeTab === 'trade' && (
          <TradingPage 
            user={currentUser} 
            onUpdateUser={handleUpdateUser} 
            onAddTransaction={handleAddTransaction}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'rewards' && (
          <RewardsPage 
            user={currentUser} 
            onUpdateUser={handleUpdateUser} 
            onAddTransaction={handleAddTransaction}
          />
        )}
        {activeTab === 'profile' && (
          <ProfilePage 
            user={currentUser} 
            onLogout={handleLogout} 
            onUpdateUser={handleUpdateUser}
            onNavigateToUpgrade={() => {
              setTriggerUpgrade(true);
              setActiveTab('home');
            }}
          />
        )}
      </main>

      {/* Fixed bottom navigation drawer bar matching user supplied design */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 py-2.5 px-4 flex justify-around items-center z-40 shadow-[0_-4px_12px_rgba(15,23,42,0.03)]" id="fixed-bottom-application-nav">
        <button
          id="nav-btn-home"
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center transition-all px-3 py-1 rounded-xl ${
            activeTab === 'home' 
              ? 'text-brand-dark scale-105' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <HomeIcon className={`w-5.5 h-5.5 ${activeTab === 'home' ? 'text-brand-dark fill-current' : ''}`} />
          <span className={`text-[10px] font-bold mt-1 ${activeTab === 'home' ? 'text-brand-dark' : 'text-slate-400'}`}>Home</span>
        </button>

        <button
          id="nav-btn-rewards"
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`flex flex-col items-center justify-center transition-all px-3 py-1 rounded-xl ${
            activeTab === 'rewards' 
              ? 'text-brand-dark scale-105' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <RewardsIcon className={`w-5.5 h-5.5 ${activeTab === 'rewards' ? 'text-brand-dark fill-current' : ''}`} />
          <span className={`text-[10px] font-bold mt-1 ${activeTab === 'rewards' ? 'text-brand-dark' : 'text-slate-400'}`}>Rewards</span>
        </button>

        <button
          id="nav-btn-finance"
          type="button"
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center justify-center transition-all px-3 py-1 rounded-xl ${
            activeTab === 'finance' 
              ? 'text-brand-dark scale-105' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FinanceIcon className="w-5.5 h-5.5" />
          <span className={`text-[10px] font-bold mt-1 ${activeTab === 'finance' ? 'text-brand-dark' : 'text-slate-400'}`}>Finance</span>
        </button>

        <button
          id="nav-btn-trade"
          type="button"
          onClick={() => setActiveTab('trade')}
          className={`flex flex-col items-center justify-center transition-all px-3 py-1 rounded-xl ${
            activeTab === 'trade' 
              ? 'text-brand-dark scale-105' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <TradeIcon className={`w-5.5 h-5.5 ${activeTab === 'trade' ? 'text-brand-dark' : ''}`} />
          <span className={`text-[10px] font-bold mt-1 ${activeTab === 'trade' ? 'text-brand-dark' : 'text-slate-400'}`}>Trade</span>
        </button>

        <button
          id="nav-btn-cards"
          type="button"
          onClick={() => setActiveTab('cards')}
          className={`flex flex-col items-center justify-center transition-all px-3 py-1 rounded-xl ${
            activeTab === 'cards' 
              ? 'text-brand-dark scale-105' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CardsIcon className="w-5.5 h-5.5" />
          <span className={`text-[10px] font-bold mt-1 ${activeTab === 'cards' ? 'text-brand-dark' : 'text-slate-400'}`}>Cards</span>
        </button>

        <button
          id="nav-btn-profile"
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center transition-all px-3 py-1 rounded-xl ${
            activeTab === 'profile' 
              ? 'text-brand-dark scale-105' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ProfileIcon className={`w-5.5 h-5.5 ${activeTab === 'profile' ? 'text-brand-dark fill-current' : ''}`} />
          <span className={`text-[10px] font-bold mt-1 ${activeTab === 'profile' ? 'text-brand-dark' : 'text-slate-400'}`}>Me</span>
        </button>
      </nav>
    </div>
  );
}
