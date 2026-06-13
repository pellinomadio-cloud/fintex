import { useState, useEffect, FormEvent } from 'react';
import { User, VirtualCard } from '../types';
import { 
  CreditCard, Eye, EyeOff, ShieldCheck, Lock, Check, Plus, 
  Trash2, Sliders, AlertCircle, ShoppingBag, Sparkles
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

interface CardsPageProps {
  user: User;
  onUpdateUser?: (updatedUser: User) => void;
  onAddTransaction?: (transaction: any) => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function CardsPage({ user, onUpdateUser, onAddTransaction, onNavigateToTab }: CardsPageProps) {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [revealSecure, setRevealSecure] = useState<{ [key: string]: boolean }>({});
  const [activeCardId, setActiveCardId] = useState<string>('');
  const [newCardSkin, setNewCardSkin] = useState<'deep-blue' | 'ice-blue' | 'slate-dark'>('deep-blue');
  const [newCardLabel, setNewCardLabel] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const cardsColRef = collection(db, 'users', user.id, 'cards');
    const unsubscribe = onSnapshot(cardsColRef, (snap) => {
      const fbCards: VirtualCard[] = [];
      snap.forEach(docSnap => {
        fbCards.push(docSnap.data() as VirtualCard);
      });

      if (fbCards.length > 0) {
        setCards(fbCards);
        localStorage.setItem(`fintex_cards_${user.id}`, JSON.stringify(fbCards));
        if (!activeCardId || !fbCards.some(c => c.id === activeCardId)) {
          setActiveCardId(fbCards[0].id);
        }
      } else {
        // Seed default virtual card
        const defaultCard: VirtualCard = {
          id: 'c_default',
          userId: user.id,
          cardNumber: generateCardNum(),
          cardName: `${user.name.toUpperCase()} PLATINUM`,
          expiry: '09/31',
          cvv: '581',
          status: 'active',
          type: 'visa',
          color: 'deep-blue',
          limit: 1500,
          spent: 0
        };
        const initial = [defaultCard];
        setDoc(doc(db, 'users', user.id, 'cards', 'c_default'), defaultCard)
          .catch(err => console.error("Error seeding default card:", err));
        setCards(initial);
        localStorage.setItem(`fintex_cards_${user.id}`, JSON.stringify(initial));
        setActiveCardId('c_default');
      }
    }, (err) => {
      console.error("Error fetching cards from Firestore:", err);
      const savedCards = JSON.parse(localStorage.getItem(`fintex_cards_${user.id}`) || '[]');
      if (savedCards.length > 0) {
        setCards(savedCards);
      }
    });

    return () => unsubscribe();
  }, [user.id, user.name]);

  const generateCardNum = () => {
    let num = '4000 '; // Simulated Fintex Visa BIN
    for (let i = 0; i < 3; i++) {
      num += Math.floor(1000 + Math.random() * 9000).toString() + ' ';
    }
    return num.trim();
  };

  const createVirtualCard = (e: FormEvent) => {
    e.preventDefault();
    
    if (user.balance < 5.00) {
      alert("Insufficient available balance! A $5.00 card creation fee applies.");
      return;
    }

    if (cards.length >= 3) {
      alert("You have reached the maximum of 3 virtual cards for secure asset allocation.");
      return;
    }

    const brandName = newCardLabel.trim().toUpperCase() || `${user.name.toUpperCase()} FLEX`;

    // Deduct $5 and update user state
    if (onUpdateUser) {
      const updatedUser: User = {
        ...user,
        balance: parseFloat((user.balance - 5.00).toFixed(2))
      };
      onUpdateUser(updatedUser);
    }

    // Add a debit transaction log 
    if (onAddTransaction) {
      const tx = {
        id: 'tx_card_' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        type: 'transfer' as const,
        amount: 5.00,
        description: `Fintex Virtual Card Issuance Fee (${brandName})`,
        date: new Date().toISOString(),
        status: 'completed' as const,
        reference: 'FTX-CARD-' + Math.floor(100000 + Math.random() * 900000)
      };
      onAddTransaction(tx);
    }

    const newCard: VirtualCard = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      cardNumber: generateCardNum(),
      cardName: brandName,
      expiry: '12/31',
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      status: 'active',
      type: Math.random() > 0.5 ? 'visa' : 'mastercard',
      color: newCardSkin,
      limit: 2000,
      spent: 0
    };

    setDoc(doc(db, 'users', user.id, 'cards', newCard.id), newCard)
      .catch(err => console.error("Failed to save card to Firestore:", err));

    setActiveCardId(newCard.id);
    setNewCardLabel('');
    setNotification('✓ Virtual card issued successfully! $5.00 fee deducted from wallet balance.');
  };

  const deleteCard = (cardId: string) => {
    deleteDoc(doc(db, 'users', user.id, 'cards', cardId))
      .then(() => {
        const updated = cards.filter(c => c.id !== cardId);
        if (activeCardId === cardId && updated.length > 0) {
          setActiveCardId(updated[0].id);
        }
      })
      .catch(err => console.error("Failed to delete card from Firestore:", err));
  };

  const toggleFreeze = (cardId: string) => {
    const cardToFreeze = cards.find(c => c.id === cardId);
    if (!cardToFreeze) return;
    const nextStatus = cardToFreeze.status === 'active' ? 'blocked' : 'active';
    setNotification(nextStatus === 'blocked' ? 'Card frozen. Online payments rejected.' : 'Card is successfully active!');

    updateDoc(doc(db, 'users', user.id, 'cards', cardId), { status: nextStatus })
      .catch(err => console.error("Failed to freeze/unfreeze card in Firestore:", err));
  };

  const toggleReveal = (cardId: string) => {
    setRevealSecure(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const activeCard = cards.find(c => c.id === activeCardId);

  return (
    <div className="space-y-6 pb-24" id="cards-tab-content">
      {/* Title */}
      <div className="flex items-center justify-between" id="cards-header-block">
        <div>
          <h2 className="text-xl font-bold text-brand-dark tracking-tight">Virtual Cards</h2>
          <p className="text-xs text-slate-500">Instant generation for sub-accounts</p>
        </div>
        <div className="text-xs font-semibold text-brand-dark bg-sky-50 px-2.5 py-1.5 rounded-xl border border-sky-100 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-brand-primary" />
          PCI-DSS Authenticated
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between" id="cards-page-notif">
          <span>{notification}</span>
          <button type="button" onClick={() => setNotification(null)} className="text-emerald-500 font-bold hover:text-emerald-700">OK</button>
        </div>
      )}

      {/* Grid: Selected Card Panel & Card Config */}
      {(user.tier || 1) < 2 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center max-w-md mx-auto my-8 space-y-5 animate-fade-in" id="cards-unverified-lock-screen">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-550 border border-amber-100">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-brand-dark text-lg leading-tight">🔒 Tier 2 Verification Required</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              To comply with regulatory rules, virtual debit cards and foreign dollar limits are preserved for **Tier 2 Verified** accounts.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl text-[11px] text-slate-500 text-left space-y-1 border border-slate-100 border-dashed">
            <p className="font-bold text-slate-700">✓ Virtual Card Benefits:</p>
            <p>• Multi-currency support for dollar shopping and utility payments</p>
            <p>• Daily account limit upgraded to $10,000.00 / day</p>
            <p>• Advanced freezing capability and instant ATM reset PIN operations</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('profile')}
            className="w-full py-3.5 bg-brand-dark hover:bg-brand-medium text-white font-bold text-xs rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            id="cards-lock-navigate-profile-btn"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Upgrade Status in Profile Tab
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="cards-main-body-grid">
        {/* Left: The Card list & visual view */}
        <div className="space-y-4" id="cards-selector-column">
          {/* Main Card visual */}
          {activeCard ? (
            <div 
              className={`relative h-56 rounded-3xl p-6 text-white shadow-xl transition-all duration-500 overflow-hidden ${
                activeCard.color === 'deep-blue' ? 'bg-gradient-to-br from-slate-900 via-brand-dark to-brand-medium text-white shadow-brand-dark/20' :
                activeCard.color === 'ice-blue' ? 'bg-gradient-to-br from-[#0284C7] via-[#019dec] to-brand-light text-slate-900 shadow-sky-400/10' :
                'bg-gradient-to-br from-slate-100 via-slate-50 to-sky-100/30 text-slate-800 border-2 border-slate-200/60 shadow-md shadow-slate-200/50'
              }`}
              id={`card-graphic-panel-${activeCard.id}`}
            >
              <div className="absolute right-0 bottom-0 top-0 left-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

              {/* Card top row */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`text-[10px] font-mono tracking-widest block font-bold ${activeCard.color === 'slate-dark' ? 'text-slate-500' : 'text-sky-100/70'}`}>
                    FINTECH CARD
                  </span>
                  <p className="text-xs font-bold font-display uppercase tracking-wider">{activeCard.cardName}</p>
                </div>
                <div className="font-display font-black tracking-tight text-xl italic">
                  {activeCard.type === 'visa' ? (
                    <span className="text-sky-500 font-bold">VISA</span>
                  ) : (
                    <span className="text-amber-500 font-semibold">mastercard</span>
                  )}
                </div>
              </div>

              {/* Chip and Contactless indicator */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-7 rounded bg-amber-400/90 border border-amber-500/30 shadow-inner flex flex-col justify-between p-1">
                  <div className="w-full h-0.5 bg-slate-700/20" />
                  <div className="w-full h-0.5 bg-slate-700/20" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="w-3 h-0.5 bg-current" />
                  <span className="w-4.5 h-0.5 bg-current opacity-85" />
                  <span className="w-6 h-0.5 bg-current opacity-70" />
                </div>
              </div>

              {/* Card number */}
              <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest mb-4" id="card-graphic-numbers">
                {revealSecure[activeCard.id] ? activeCard.cardNumber : '•••• •••• •••• ' + activeCard.cardNumber.slice(-4)}
              </div>

              {/* Expiry and CVV */}
              <div className="flex justify-between items-end" id="card-graphic-meta-row">
                <div className="flex gap-6">
                  <div>
                    <span className={`text-[9px] block ${activeCard.color === 'slate-dark' ? 'text-slate-400' : 'text-sky-100/60'}`}>VALID THRU</span>
                    <span className="font-mono text-sm font-bold">{activeCard.expiry}</span>
                  </div>
                  <div>
                    <span className={`text-[9px] block ${activeCard.color === 'slate-dark' ? 'text-slate-400' : 'text-sky-100/60'}`}>CVV</span>
                    <span className="font-mono text-sm font-bold">
                      {revealSecure[activeCard.id] ? activeCard.cvv : '•••'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeCard.status === 'blocked' && (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                      FROZEN
                    </span>
                  )}
                  <button 
                    type="button" 
                    onClick={() => toggleReveal(activeCard.id)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      activeCard.color === 'slate-dark' ? 'bg-slate-200 border-slate-300 hover:bg-slate-300 text-slate-700' : 'bg-white/15 border-white/10 hover:bg-white/20 text-white'
                    }`}
                    id="card-visibility-trigger"
                  >
                    {revealSecure[activeCard.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-56 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm">
              No active virtual cards. Create one below!
            </div>
          )}

          {/* Quick Info bar */}
          {activeCard && (
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3" id="spend-limit-monitor">
              <div className="flex justify-between text-xs" id="spend-limit-labels">
                <span className="font-bold text-slate-700">Digital Card Limit</span>
                <span className="text-slate-400">${activeCard.spent} / ${activeCard.limit} USD</span>
              </div>
              <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-primary" 
                  style={{ width: `${Math.min(100, (activeCard.spent / activeCard.limit) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center pt-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Verified Visa Secures</span>
                </div>
                <span>Billing Address: 100 Broadway St</span>
              </div>
            </div>
          )}

          {/* List of cards */}
          <div className="space-y-2" id="cards-clickable-list">
            <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Your Card List ({cards.length})</h4>
            <div className="grid grid-cols-1 gap-2">
              {cards.map(c => (
                <div
                  key={c.id}
                  onClick={() => setActiveCardId(c.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    activeCardId === c.id 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                      : 'bg-white text-slate-700 border-slate-100 hover:border-sky-200'
                  }`}
                  id={`list-card-btn-${c.id}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveCardId(c.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className={`w-5 h-5 ${activeCardId === c.id ? 'text-sky-300' : 'text-brand-primary'}`} />
                    <div>
                      <span className="text-xs font-bold leading-none block">{c.cardName}</span>
                      <span className="text-[10px] opacity-70">Visa •••• {c.cardNumber.slice(-4)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.status === 'blocked' ? (
                      <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase scale-90">Frozen</span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase scale-90">Active</span>
                    )}
                    {cards.length > 1 && (
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); deleteCard(c.id); }}
                        className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        id={`delete-card-${c.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Security Settings & Create new Card */}
        <div className="space-y-4" id="cards-operations-column">
          {/* Settings block for selected card */}
          {activeCard && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4" id="selected-card-controls">
              <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-brand-primary" />
                Selected Card Controls
              </h3>

              <div className="grid grid-cols-2 gap-2" id="card-controls-grid">
                <button
                  id="btn-freeze-unfreeze"
                  type="button"
                  onClick={() => toggleFreeze(activeCard.id)}
                  className={`p-3.5 rounded-2xl text-xs font-bold transition-all text-center border ${
                    activeCard.status === 'blocked' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                      : 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  {activeCard.status === 'blocked' ? '✔ Unfreeze Card' : '❄ Freeze Card'}
                </button>

                <button
                  type="button"
                  onClick={() => alert(`Your new secure ATM PIN is sent to registered email address: ${user.email}`)}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 font-bold text-xs rounded-2xl transition-all"
                  id="btn-reset-pin"
                >
                  🔒 Reset PIN
                </button>
              </div>

              <div className="p-3.5 bg-sky-50 rounded-2xl border border-sky-100 flex items-start gap-2.5 text-xs text-brand-dark" id="cards-safety-banner">
                <AlertCircle className="w-4.5 h-4.5 text-brand-primary shrink-0 mt-0.5" />
                <p className="leading-tight">
                  <strong className="font-bold block mb-0.5">Safeguard Guarantee</strong>
                  Card limits prevent over-spending and keep fraud bounded. Double tap freeze to keep assets insulated.
                </p>
              </div>
            </div>
          )}

          {/* Create Virtual Account Card Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm" id="create-card-form-wrapper">
            <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Plus className="w-4.5 h-4.5 text-brand-primary" />
              Issue New Card Skin
            </h3>

            <form onSubmit={createVirtualCard} className="space-y-4" id="create-card-form">
              <div>
                <label htmlFor="card-skin-input" className="block text-xs font-semibold text-slate-500 mb-2">
                  Choose Color Accent (White, Light Blue, Dark Blue)
                </label>
                <div className="grid grid-cols-3 gap-2" id="card-theme-skins-list">
                  <button
                    type="button"
                    onClick={() => setNewCardSkin('deep-blue')}
                    className={`p-3 rounded-xl border font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all ${
                      newCardSkin === 'deep-blue' ? 'border-brand-dark bg-sky-550/10 text-brand-dark shadow-sm bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-white'
                    }`}
                    id="skin-btn-deep-blue"
                  >
                    <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700" />
                    <span>Deep Indigo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCardSkin('ice-blue')}
                    className={`p-3 rounded-xl border font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all ${
                      newCardSkin === 'ice-blue' ? 'border-brand-primary bg-sky-50 text-brand-dark shadow-sm' : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-white'
                    }`}
                    id="skin-btn-ice-blue"
                  >
                    <div className="w-4 h-4 rounded-full bg-sky-500 border border-sky-300" />
                    <span>Ice Blue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCardSkin('slate-dark')}
                    className={`p-3 rounded-xl border font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all ${
                      newCardSkin === 'slate-dark' ? 'border-indigo-600 bg-slate-50 text-slate-900 shadow-sm' : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-white'
                    }`}
                    id="skin-btn-slate-dark"
                  >
                    <div className="w-4 h-4 rounded-full bg-white border border-slate-300" />
                    <span>Pure White</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="card-label" className="block text-xs font-semibold text-slate-500 mb-1">
                  Card Cardholder Label / Purpose
                </label>
                <input
                  id="card-label"
                  type="text"
                  placeholder="e.g. SHOPPING FLEX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                  value={newCardLabel}
                  onChange={(e) => setNewCardLabel(e.target.value)}
                />
              </div>

              <button
                id="btn-confirm-create-card"
                type="submit"
                className="w-full py-3.5 bg-brand-dark text-white font-bold text-xs rounded-2xl hover:bg-brand-medium transition-all shadow-md inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-brand-light" />
                Purchase & Setup Virtual Card ($5.00 Fee)
              </button>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
