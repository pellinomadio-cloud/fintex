import React, { useState, useEffect, useRef } from 'react';
import { User, Transaction } from '../types';
import { 
  TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownLeft, 
  Sparkles, Activity, DollarSign, AlertCircle, CheckCircle2, 
  X, HelpCircle, ArrowUp, ArrowDown, ChevronRight, BookOpen, 
  Globe, Play, RefreshCw, Layers
} from 'lucide-react';

interface TradingPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onAddTransaction: (newTx: Transaction) => void;
  onNavigateToTab: (tab: string) => void;
}

interface ForexPair {
  symbol: string;
  name: string;
  price: number;
  decimals: number;
  change: number; // percentage change today
  history: number[]; // past prices for the chart
}

interface ActiveTrade {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  amount: number; // stake/margin in USD
  leverage: number; // 50, 100, 500
  openTime: string;
}

interface BinaryContract {
  id: string;
  pair: string;
  prediction: 'UP' | 'DOWN';
  entryPrice: number;
  amount: number;
  duration: number; // in seconds
  timeLeft: number;
  openTime: string;
}

export default function TradingPage({ user, onUpdateUser, onAddTransaction, onNavigateToTab }: TradingPageProps) {
  // Available Forex Pairs
  const INITIAL_PAIRS: ForexPair[] = [
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0842, decimals: 4, change: +0.24, history: [1.0820, 1.0825, 1.0831, 1.0828, 1.0836, 1.0840, 1.0838, 1.0842] },
    { symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2715, decimals: 4, change: +0.12, history: [1.2695, 1.2702, 1.2710, 1.2705, 1.2712, 1.2718, 1.2711, 1.2715] },
    { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 155.62, decimals: 2, change: -0.38, history: [156.10, 155.95, 155.80, 155.85, 155.70, 155.60, 155.65, 155.62] },
    { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', price: 0.6648, decimals: 4, change: +0.45, history: [0.6610, 0.6622, 0.6628, 0.6635, 0.6631, 0.6642, 0.6640, 0.6648] },
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', price: 1.3685, decimals: 4, change: -0.08, history: [1.3698, 1.3690, 1.3682, 1.3688, 1.3680, 1.3684, 1.3687, 1.3685] },
  ];

  const [pairs, setPairs] = useState<ForexPair[]>(INITIAL_PAIRS);
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);
  const currentPair = pairs[selectedPairIndex];

  // Tab configurations: 'leveraged' (CFD Margin trading) or 'binary' (forecast options)
  const [tradeMode, setTradeMode] = useState<'leveraged' | 'binary'>('leveraged');

  // Input states
  const [marginInput, setMarginInput] = useState<string>('50');
  const [leverage, setLeverage] = useState<number>(100);
  const [binaryStakeInput, setBinaryStakeInput] = useState<string>('20');
  const [binaryDuration, setBinaryDuration] = useState<number>(30); // 30, 60, 120, 300 seconds

  // Active positions
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>(() => {
    return JSON.parse(localStorage.getItem(`fintex_active_trades_${user.id}`) || '[]');
  });
  const [activeContracts, setActiveContracts] = useState<BinaryContract[]>(() => {
    return JSON.parse(localStorage.getItem(`fintex_active_contracts_${user.id}`) || '[]');
  });

  // Simulated indicators / telemetry
  const [orderbook, setOrderbook] = useState<{ price: number; size: number; action: 'buy' | 'sell' }[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [pulseUp, setPulseUp] = useState<boolean>(false);
  const [pulseDown, setPulseDown] = useState<boolean>(false);

  // Sound/Vibration effect indicator
  const [tradeTone, setTradeTone] = useState<'open' | 'win' | 'lose' | null>(null);

  // Update orderbook & ticks in real-time
  useEffect(() => {
    // Generate initial orderbook
    generateOrderbook(currentPair.price, currentPair.decimals);

    const interval = setInterval(() => {
      // Fluctuate prices slightly
      setPairs(prevPairs => {
        return prevPairs.map((p, idx) => {
          const isSelected = idx === selectedPairIndex;
          const pct = (Math.random() - 0.49) * 0.001; // slightly bullish bias
          const diff = p.price * pct;
          const newPrice = parseFloat((p.price + diff).toFixed(p.decimals));
          
          if (isSelected) {
            if (diff > 0) {
              setPulseUp(true);
              setPulseDown(false);
            } else {
              setPulseUp(false);
              setPulseDown(true);
            }
            setTimeout(() => {
              setPulseUp(false);
              setPulseDown(false);
            }, 600);
          }

          // Append to history, maintain size limit of 15 candles
          let newHistory = [...p.history];
          newHistory.push(newPrice);
          if (newHistory.length > 15) {
            newHistory.shift();
          }

          return {
            ...p,
            price: newPrice,
            change: parseFloat((p.change + (pct * 100)).toFixed(2)),
            history: newHistory
          };
        });
      });

      // Fluctuate orderbook
      generateOrderbook(currentPair.price, currentPair.decimals);
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedPairIndex, currentPair?.price]);

  // Handle countdown timers for Binary Option Contracts
  useEffect(() => {
    if (activeContracts.length === 0) return;

    const timer = setInterval(() => {
      const expiredList: BinaryContract[] = [];

      setActiveContracts(prev => {
        const remaining: BinaryContract[] = [];
        
        prev.forEach(contract => {
          if (contract.timeLeft <= 1) {
            expiredList.push(contract);
          } else {
            remaining.push({
              ...contract,
              timeLeft: contract.timeLeft - 1
            });
          }
        });

        localStorage.setItem(`fintex_active_contracts_${user.id}`, JSON.stringify(remaining));
        return remaining;
      });

      if (expiredList.length > 0) {
        expiredList.forEach(contract => {
          setTimeout(() => {
            const targetPair = pairs.find(p => p.symbol === contract.pair) || currentPair;
            if (!targetPair) return;
            const payoutDecimal = targetPair.price;
            const isWin = contract.prediction === 'UP' 
              ? payoutDecimal > contract.entryPrice 
              : payoutDecimal < contract.entryPrice;

            resolveBinaryContract(contract, targetPair.price, isWin);
          }, 0);
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeContracts, pairs, user]);

  const generateOrderbook = (midPrice: number, decimals: number) => {
    const list: any[] = [];
    // Generate 4 sell orders (above price)
    for (let i = 4; i >= 1; i--) {
      const step = 0.00015 * i * (midPrice > 100 ? 50 : 1);
      list.push({
        price: parseFloat((midPrice + step).toFixed(decimals)),
        size: parseFloat((Math.random() * 2.5 + 0.1).toFixed(2)),
        action: 'sell'
      });
    }
    // Generate 4 buy orders (below price)
    for (let i = 1; i <= 4; i++) {
      const step = 0.00015 * i * (midPrice > 100 ? 50 : 1);
      list.push({
        price: parseFloat((midPrice - step).toFixed(decimals)),
        size: parseFloat((Math.random() * 2.5 + 0.1).toFixed(2)),
        action: 'buy'
      });
    }
    setOrderbook(list);
  };

  // Open classical CFD Position
  const handleOpenLeveragedTrade = (type: 'BUY' | 'SELL') => {
    const margin = parseFloat(marginInput);
    if (isNaN(margin) || margin <= 0) {
      alert("Please enter a valid margin stakeholder amount.");
      return;
    }

    if (user.balance < margin) {
      alert("Insufficient account balance to stake this trade.");
      return;
    }

    // Deduct margin stake from available balance
    const updatedUser = {
      ...user,
      balance: parseFloat((user.balance - margin).toFixed(2))
    };
    onUpdateUser(updatedUser);

    const newTrade: ActiveTrade = {
      id: 'trade_' + Math.random().toString(36).substr(2, 9),
      pair: currentPair.symbol,
      type: type,
      entryPrice: currentPair.price,
      currentPrice: currentPair.price,
      amount: margin,
      leverage: leverage,
      openTime: new Date().toLocaleTimeString()
    };

    const nextTrades = [newTrade, ...activeTrades];
    setActiveTrades(nextTrades);
    localStorage.setItem(`fintex_active_trades_${user.id}`, JSON.stringify(nextTrades));

    triggerAlertTone('open');
    showFlyoutNotification(`✓ Entered ${type} position on ${currentPair.symbol} ($${margin})`);
  };

  // Open Binary Option Forecast Position
  const handleOpenBinaryOption = (prediction: 'UP' | 'DOWN') => {
    const stake = parseFloat(binaryStakeInput);
    if (isNaN(stake) || stake <= 0) {
      alert("Please enter a valid Option stake amount.");
      return;
    }

    if (user.balance < stake) {
      alert("Insufficient account balance for Option forecast contract.");
      return;
    }

    // Deduct stake
    const updatedUser = {
      ...user,
      balance: parseFloat((user.balance - stake).toFixed(2))
    };
    onUpdateUser(updatedUser);

    const newContract: BinaryContract = {
      id: 'option_' + Math.random().toString(36).substr(2, 9),
      pair: currentPair.symbol,
      prediction: prediction,
      entryPrice: currentPair.price,
      amount: stake,
      duration: binaryDuration,
      timeLeft: binaryDuration,
      openTime: new Date().toLocaleTimeString()
    };

    const nextContracts = [newContract, ...activeContracts];
    setActiveContracts(nextContracts);
    localStorage.setItem(`fintex_active_contracts_${user.id}`, JSON.stringify(nextContracts));

    triggerAlertTone('open');
    showFlyoutNotification(`✓ Contract active: Predict ${prediction} on ${currentPair.symbol}`);
  };

  // Close Leveraged Position Manually
  const handleClosePosition = (tradeId: string) => {
    const trade = activeTrades.find(t => t.id === tradeId);
    if (!trade) return;

    // Find latest pair price for PnL calculation
    const currentPairPrice = (pairs.find(p => p.symbol === trade.pair) || currentPair).price;
    const priceDiff = currentPairPrice - trade.entryPrice;
    const rawRatio = priceDiff / trade.entryPrice;
    
    // Leverage multiplies percentage difference
    let pctMultiplier = rawRatio * trade.leverage;
    if (trade.type === 'SELL') {
      pctMultiplier = -pctMultiplier;
    }

    // Calculate dynamic margin return and dynamic profit
    const absoluteProfit = parseFloat((trade.amount * pctMultiplier).toFixed(2));
    const totalPayout = parseFloat((trade.amount + absoluteProfit).toFixed(2));

    // Handle margin returns (at worst they lose all margin, PnL limited to -margin)
    const marginRecovered = Math.max(0, totalPayout);
    const netProfit = parseFloat((marginRecovered - trade.amount).toFixed(2));

    // Update user balance
    const nextBalance = parseFloat((user.balance + marginRecovered).toFixed(2));
    const updatedUser: User = {
      ...user,
      balance: nextBalance
    };
    onUpdateUser(updatedUser);

    // Save transaction log
    const tx: Transaction = {
      id: 'tx_trade_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: netProfit >= 0 ? 'deposit' : 'withdrawal',
      amount: Math.abs(netProfit),
      description: `${trade.type} Closed: ${trade.pair} @ ${currentPairPrice} (Entry: ${trade.entryPrice}, Ret: $${marginRecovered})`,
      date: new Date().toISOString(),
      status: 'completed',
      reference: 'FTX-TRD-' + Math.floor(100000 + Math.random() * 900000)
    };
    onAddTransaction(tx);

    // Filter active trades
    const nextTrades = activeTrades.filter(t => t.id !== tradeId);
    setActiveTrades(nextTrades);
    localStorage.setItem(`fintex_active_trades_${user.id}`, JSON.stringify(nextTrades));

    if (netProfit >= 0) {
      triggerAlertTone('win');
      showFlyoutNotification(`💰 Position closed! Realized profit: +$${netProfit}`);
    } else {
      triggerAlertTone('lose');
      showFlyoutNotification(`Position closed. Net return: $${marginRecovered} (Loss: $${Math.abs(netProfit)})`);
    }
  };

  // Resolve Expired Option Contracts
  const resolveBinaryContract = (contract: BinaryContract, strikePrice: number, isWin: boolean) => {
    let winProfit = 0;
    let payoutAmount = 0;

    if (isWin) {
      // 90% payout yield
      winProfit = parseFloat((contract.amount * 0.9).toFixed(2));
      payoutAmount = parseFloat((contract.amount + winProfit).toFixed(2));
    } else {
      // Total lockup loss
      payoutAmount = 0;
      winProfit = -contract.amount;
    }

    // Update balance
    const storedUser = JSON.parse(localStorage.getItem('fintex_current_user') || '{}');
    // We fetch freshest balance from localStorage to avoid out-of-sync edits
    const baseBalance = storedUser.balance !== undefined ? storedUser.balance : user.balance;
    const finalBalance = parseFloat((baseBalance + payoutAmount).toFixed(2));
    
    const updatedUser: User = {
      ...user,
      balance: finalBalance
    };
    onUpdateUser(updatedUser);

    // Log transaction
    const tx: Transaction = {
      id: 'tx_opt_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: isWin ? 'deposit' : 'withdrawal',
      amount: isWin ? winProfit : contract.amount,
      description: `binary ${contract.prediction} Option Resolved: ${contract.pair} @ ${strikePrice} (Strike: ${contract.entryPrice}, Result: ${isWin ? 'WIN' : 'LOSS'})`,
      date: new Date().toISOString(),
      status: 'completed',
      reference: 'FTX-OPT-' + Math.floor(100000 + Math.random() * 900000)
    };
    onAddTransaction(tx);

    if (isWin) {
      triggerAlertTone('win');
      // Create visual modal notice
      alert(`🎉 Option Forecaster Succcess!\n\nPair: ${contract.pair}\nStrike Price: ${contract.entryPrice}\nClose Price: ${strikePrice}\nResult: WIN! (+$${winProfit.toFixed(2)} credited!)`);
    } else {
      triggerAlertTone('lose');
      alert(`📉 Option Contract Expired OTM\n\nPair: ${contract.pair}\nStrike Price: ${contract.entryPrice}\nClose Price: ${strikePrice}\nResult: OUT OF THE MONEY (-$${contract.amount.toFixed(2)})`);
    }
  };

  const triggerAlertTone = (tone: 'open' | 'win' | 'lose') => {
    setTradeTone(tone);
    setTimeout(() => setTradeTone(null), 3000);
  };

  const showFlyoutNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // P&L calculation helpers for Leveraged Trades
  const getTradeLiveStats = (trade: ActiveTrade) => {
    const livePair = pairs.find(p => p.symbol === trade.pair) || currentPair;
    const currentPrice = livePair.price;
    const entryPrice = trade.entryPrice;
    
    const diff = currentPrice - entryPrice;
    const rawRatio = diff / entryPrice;
    let leveragedRatio = rawRatio * trade.leverage;

    if (trade.type === 'SELL') {
      leveragedRatio = -leveragedRatio;
    }

    const pnlPercentage = parseFloat((leveragedRatio * 100).toFixed(2));
    const pnlAmount = parseFloat((trade.amount * leveragedRatio).toFixed(2));
    
    return {
      currentPrice,
      pnlPercentage,
      pnlAmount,
      isPositive: pnlAmount >= 0
    };
  };

  // Draw simulated elegant Forex chart using dynamic high contrast SVG
  const renderInteractiveChart = () => {
    const history = currentPair.history;
    const minVal = Math.min(...history);
    const maxVal = Math.max(...history);
    const valRange = maxVal - minVal || 0.001;

    // Chart Dimensions
    const width = 360;
    const height = 150;
    const padding = 15;

    const points = history.map((price, idx) => {
      const x = padding + (idx * (width - padding * 2)) / (history.length - 1);
      const y = height - padding - ((price - minVal) * (height - padding * 2)) / valRange;
      return { x, y, price };
    });

    const isBullish = points[points.length - 1]?.price >= points[points.length - 2]?.price;
    const chartColor = isBullish ? '#10b981' : '#ef4444'; // Emerald or Rose

    // Line Path drawing
    let linePath = '';
    points.forEach((p, idx) => {
      if (idx === 0) {
        linePath += `M ${p.x} ${p.y}`;
      } else {
        linePath += ` L ${p.x} ${p.y}`;
      }
    });

    // Area path drawing (underneath gradient)
    let areaPath = linePath;
    if (points.length > 0) {
      areaPath += ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    }

    return (
      <div className="relative bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-xl" id="forex-live-charts-area">
        {/* Header metrics */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-extrabold text-white text-sm">{currentPair.symbol}</span>
              <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full ${currentPair.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {currentPair.change >= 0 ? '+' : ''}{currentPair.change}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">{currentPair.name}</p>
          </div>
          
          <div className="text-right">
            <div className={`font-mono font-black text-lg transition-all duration-300 ${pulseUp ? 'text-emerald-400 scale-102 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]' : pulseDown ? 'text-rose-400 scale-102 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-sky-300'}`}>
              {currentPair.price.toFixed(currentPair.decimals)}
            </div>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Live Feed Ledger</span>
          </div>
        </div>

        {/* Dynamic Canvas SVG Container */}
        <div className="relative h-40 w-full flex items-center justify-center">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 pointer-events-none opacity-[0.03] border-t border-b border-white">
            {[...Array(24)].map((_, i) => <div key={i} className="border-r border-b border-slate-700" />)}
          </div>

          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity="0.16" />
                <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Helper horizontal lines */}
            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="3 3" />

            {/* Simulated Candlesticks (for the Forex realistic feel) */}
            {points.map((p, idx) => {
              if (idx === 0) return null;
              const prev = points[idx - 1];
              const candleBullish = p.price >= prev.price;
              const candleColor = candleBullish ? '#34d399' : '#f87171';
              const candleWidth = width / history.length - 12;
              
              // Plot high/low wick
              const wickY1 = Math.min(p.y, prev.y) - (Math.random() * 8);
              const wickY2 = Math.max(p.y, prev.y) + (Math.random() * 8);
              // Body coordinates
              const bodyY1 = Math.min(p.y, prev.y);
              const bodyY2 = Math.max(p.y, prev.y);
              const bodyHeight = Math.max(2, bodyY2 - bodyY1);

              return (
                <g key={idx} opacity="0.8">
                  {/* Wick line */}
                  <line x1={p.x} y1={wickY1} x2={p.x} y2={wickY2} stroke={candleColor} strokeWidth="1.2" />
                  {/* Body rectangle */}
                  <rect
                    x={p.x - candleWidth / 2}
                    y={bodyY1}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={candleColor}
                    rx="1"
                  />
                </g>
              );
            })}

            {/* Line Overlay connecting tick nodes */}
            <path d={linePath} fill="none" stroke={chartColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={areaPath} fill="url(#chartGradient)" />

            {/* Glowing Active Tick dot on endpoints */}
            {points.length > 0 && (
              <g transform={`translate(${points[points.length - 1].x}, ${points[points.length - 1].y})`}>
                <circle r="6" fill={chartColor} className="animate-ping opacity-75" />
                <circle r="3.5" fill={chartColor} />
              </g>
            )}
          </svg>

          {/* Indicators details */}
          <div className="absolute bottom-1 left-2 flex gap-2 font-mono text-[8px] text-slate-500 font-bold uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
            <span>RSI(14): 54.2</span>
            <span className="text-emerald-500">MACD(26,12,9): Bullish Signal</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24" id="trading-desk-applet-view">
      {/* Toast Notification Header */}
      {notification && (
        <div className="fixed top-16 inset-x-4 max-w-sm mx-auto z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-slate-705 animate-slide-in-top" id="trade-global-flyout">
          <div className="flex items-center gap-2 text-xs font-bold leading-normal text-sky-200">
            <Sparkles className="w-4 h-4 text-brand-light shrink-0" />
            <p>{notification}</p>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-slate-400 hover:text-white cursor-pointer ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tone Simulator Feedback (visual helper since HTML5 Audio can trigger permission blocks) */}
      {tradeTone && (
        <div className={`fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-xl flex items-center gap-1.5 transition-all animate-bounce ${
          tradeTone === 'win' ? 'bg-emerald-600 border border-emerald-400' :
          tradeTone === 'lose' ? 'bg-rose-600 border border-rose-400' :
          'bg-sky-600 border border-sky-400'
        }`}>
          <span>🔔</span>
          <span>{tradeTone === 'win' ? 'Profit Verified (+)' : tradeTone === 'lose' ? 'Broker Slipped (-)' : 'Order Lodged'}</span>
        </div>
      )}

      {/* Fintex Market Subheader & User Balance Indicator */}
      <div className="bg-brand-dark rounded-3xl p-5 border border-brand-medium/20 shadow-lg text-white space-y-4" id="trading-stats-hero">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-brand-light/10 text-brand-light rounded-lg flex items-center justify-center font-bold text-xs">
              📊
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest text-sky-205 font-bold block leading-none">UX-trade Premium</span>
              <h1 className="font-display font-black text-sm tracking-tight mt-0.5">Forex Liquidity Hub</h1>
            </div>
          </div>

          <button 
            type="button" 
            onClick={() => onNavigateToTab('home')}
            className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white font-bold transition-all"
          >
            ← Leave Desk
          </button>
        </div>

        <div className="flex justify-between items-end border-t border-white/10 pt-3">
          <div>
            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block leading-none font-bold">Collateral Vault Balance</span>
            <span className="font-sans font-black text-2xl text-white inline-block mt-1 font-sans">
              ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block leading-none font-bold">Leverage Ratio limit</span>
            <span className="text-emerald-400 font-extrabold text-xs block mt-1.5">
              1:500 Unlimited CFD
            </span>
          </div>
        </div>
      </div>

      {/* Forex Instrument Selector Slides */}
      <div className="space-y-2" id="forex-instruments-slider">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-450">Active Forex Currency Pairs</span>
          <span className="text-[9.5px] font-medium font-mono text-slate-400 uppercase">Fluctuating Live ⚡</span>
        </div>

        <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-none" id="ticker-slider-horizontal">
          {pairs.map((p, idx) => {
            const isSelected = idx === selectedPairIndex;
            return (
              <button
                key={p.symbol}
                type="button"
                onClick={() => setSelectedPairIndex(idx)}
                className={`p-3.5 rounded-2xl flex-1 min-w-[115px] border transition-all text-left cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-102 font-black' 
                    : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-black">{p.symbol}</span>
                  <span className={`text-[8px] font-bold font-mono px-1 py-0.2 rounded-full ${p.change >= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                    {p.change >= 0 ? '▲' : '▼'}
                  </span>
                </div>
                <div className="font-mono text-xs font-semibold leading-none text-slate-800">
                  <span className={isSelected ? 'text-sky-300 font-bold' : 'text-slate-900'}>{p.price.toFixed(p.decimals)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Candlestick SVG Chart Component */}
      {renderInteractiveChart()}

      {/* Order Entry Controls and Leveraged Position Panel */}
      <div className="bg-white rounded-3xl p-5 border border-slate-150-custom shadow-sm space-y-4" id="fx-order-controls-card">
        {/* Trading Mode Switch */}
        <div className="flex border border-slate-100 rounded-xl p-1 bg-slate-50" id="trading-mode-tabs-selector">
          <button
            type="button"
            onClick={() => setTradeMode('leveraged')}
            className={`flex-1 py-2 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              tradeMode === 'leveraged' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📊 Leveraged CFD Contract
          </button>
          <button
            type="button"
            onClick={() => setTradeMode('binary')}
            className={`flex-1 py-2 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              tradeMode === 'binary' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⏱ binary Option Predictor
          </button>
        </div>

        {/* MODE A: CFD ACTIVE SPECULATION OPTIONS */}
        {tradeMode === 'leveraged' && (
          <div className="space-y-4" id="leveraged-cfd-tab">
            <div className="grid grid-cols-2 gap-3">
              {/* Margin Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Stake Margin Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">$</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    placeholder="Stake USD"
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                    value={marginInput}
                    onChange={(e) => setMarginInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Leverage Custom Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Requested Leverage</label>
                <select
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                >
                  <option value={50}>1:50 Multiplier</option>
                  <option value={100}>1:100 Premium Spec</option>
                  <option value={200}>1:200 High Gain</option>
                  <option value={500}>1:500 Forex Pro</option>
                </select>
              </div>
            </div>

            {/* Quick spec helpers */}
            <div className="flex gap-1.5 justify-between">
              {['20', '50', '100', '250', '500'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMarginInput(val)}
                  className={`px-3 py-1 bg-slate-50 border border-slate-200 text-[10px] font-bold rounded-lg text-slate-600 hover:bg-slate-100 ${
                    marginInput === val ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-900' : ''
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            {/* CFD execution buttons */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => handleOpenLeveragedTrade('BUY')}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-98 flex flex-col items-center justify-center cursor-pointer"
                id="btn-trade-spec-long"
              >
                <span className="flex items-center gap-1">🟢 BUY (LONG)</span>
                <span className="text-[8px] font-normal tracking-wide opacity-80 mt-0.5">Expect Price Increase ↑</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenLeveragedTrade('SELL')}
                className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-98 flex flex-col items-center justify-center cursor-pointer"
                id="btn-trade-spec-short"
              >
                <span className="flex items-center gap-1">🔴 SELL (SHORT)</span>
                <span className="text-[8px] font-normal tracking-wide opacity-80 mt-0.5">Expect Price Decrease ↓</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE B: BINARY FORECAST PREDICTOR */}
        {tradeMode === 'binary' && (
          <div className="space-y-4" id="binary-options-tab">
            <div className="grid grid-cols-2 gap-3">
              {/* Option Stake */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Stake Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">$</span>
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                    value={binaryStakeInput}
                    onChange={(e) => setBinaryStakeInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Expiry timers */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Contract Expiry</label>
                <select
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  value={binaryDuration}
                  onChange={(e) => setBinaryDuration(Number(e.target.value))}
                >
                  <option value={30}>30 Seconds Contract (90%)</option>
                  <option value={60}>60 Seconds Contract (90%)</option>
                  <option value={120}>2 Minutes Spec (90%)</option>
                  <option value={300}>5 Minutes Safe Match (90%)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl text-[10px] text-emerald-800 leading-normal border border-emerald-100 font-sans font-medium flex items-center gap-2">
              <span className="text-sm">🔥</span>
              <p>Option specs pay <b>90% instant yield</b> if correct! E.g. Stake <strong className="font-semibold">${binaryStakeInput || '20'}</strong> to receive <strong className="text-emerald-700 font-bold">${((parseFloat(binaryStakeInput) || 20) * 1.9).toFixed(2)}</strong> payout. Incorrect predictions claim 100% loss.</p>
            </div>

            {/* Put / Call Buttons */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => handleOpenBinaryOption('UP')}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-98 flex flex-col items-center justify-center cursor-pointer"
                id="btn-option-put"
              >
                <span className="flex items-center gap-1 font-black">▲ CALL (UP)</span>
                <span className="text-[8px] font-normal normal-case opacity-90 mt-0.5">Ends above strike price</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenBinaryOption('DOWN')}
                className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-98 flex flex-col items-center justify-center cursor-pointer"
                id="btn-option-call"
              >
                <span className="flex items-center gap-1 font-black">▼ PUT (DOWN)</span>
                <span className="text-[8px] font-normal normal-case opacity-90 mt-0.5">Ends below strike price</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Orderbook Spec & Active Trades Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Interactive CFD Active Spec Positions List */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3" id="active-positions-box">
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <span>💼 Live Spec Positions</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[8.5px] font-mono text-slate-550 font-bold">
                {activeTrades.length}
              </span>
            </h3>
          </div>

          {activeTrades.length === 0 ? (
            <div className="text-center py-6 text-slate-400 space-y-1.5" id="no-active-positions">
              <div className="text-lg">😴</div>
              <p className="text-[10px] font-bold">No running speculation contracts</p>
              <p className="text-[9px] text-slate-400">Open a BUY or SELL CFD spec position to start especulative trading ledger.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto" id="active-positions-scroller">
              {activeTrades.map(trade => {
                const stats = getTradeLiveStats(trade);
                return (
                  <div key={trade.id} className="py-2.5 flex justify-between items-center text-xs first:pt-0 last:pb-0" id={`holding-${trade.id}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${trade.type === 'BUY' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {trade.type}
                        </span>
                        <strong className="text-slate-800 font-bold">{trade.pair}</strong>
                        <span className="text-[9px] text-slate-400 font-mono">@{trade.entryPrice}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Stake Margin: <b>${trade.amount}</b> ({trade.leverage}x Lev)</p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        {/* Live P&L Indicator */}
                        <span className={`font-mono font-black text-xs leading-none block ${stats.isPositive ? 'text-emerald-600' : 'text-rose-650'}`}>
                          {stats.isPositive ? '+' : ''}${stats.pnlAmount.toFixed(2)}
                        </span>
                        <span className={`font-mono text-[9px] mt-0.5 block ${stats.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          ({stats.isPositive ? '+' : ''}{stats.pnlPercentage}%)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClosePosition(trade.id)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-extrabold rounded-lg select-all cursor-pointer shadow-sm transition-all text-center leading-none inline-block hover:scale-102"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Option Contracts Countdowns List */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3" id="active-bin-contracts-box">
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <span>⏱ Live Option Contracts</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[8.5px] font-mono text-slate-550 font-bold">
                {activeContracts.length}
              </span>
            </h3>
          </div>

          {activeContracts.length === 0 ? (
            <div className="text-center py-6 text-slate-400 space-y-1.5" id="no-active-options">
              <div className="text-lg">⏳</div>
              <p className="text-[10px] font-bold">No running Option Forecasts</p>
              <p className="text-[9px] text-slate-400 font-sans">Submit CALL or PUT targets to run a countdown speculation task.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto" id="active-options-scroller">
              {activeContracts.map(contract => {
                const livePair = pairs.find(p => p.symbol === contract.pair) || currentPair;
                const isOverStrike = livePair.price > contract.entryPrice;
                const isUnderStrike = livePair.price < contract.entryPrice;
                const predictionWinning = (contract.prediction === 'UP' && isOverStrike) || (contract.prediction === 'DOWN' && isUnderStrike);

                return (
                  <div key={contract.id} className="py-2.5 flex justify-between items-center text-xs first:pt-0 last:pb-0" id={`contract-${contract.id}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${contract.prediction === 'UP' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>
                          {contract.prediction === 'UP' ? 'CALL' : 'PUT'}
                        </span>
                        <strong className="text-slate-800 font-bold">{contract.pair}</strong>
                        <span className="text-[9px] text-slate-400 font-mono">Strike: {contract.entryPrice}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono uppercase">Ticket Stake: <b>${contract.amount}</b></p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-1 font-mono font-black text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-brand-dark animate-pulse" />
                        <span>{contract.timeLeft}s left</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        predictionWinning ? 'text-emerald-700 bg-emerald-150' : 'text-rose-750 bg-rose-150'
                      }`}>
                        {predictionWinning ? '🟢 WINNING' : '🔴 OUT OF MONEY'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Forex Ledger Order Book & Simulated News Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Forex Order Book */}
        <div className="bg-slate-950 text-slate-200 rounded-3xl p-5 border border-slate-800 shadow-sm space-y-3" id="order-book-module">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Market Depth Order Book ({currentPair.symbol})</span>
          </h4>

          <div className="font-mono text-[10px] space-y-1.5">
            {/* Ask / Sells area (highest first) */}
            <div className="space-y-1">
              {orderbook.filter(o => o.action === 'sell').map((order, i) => (
                <div key={`sell-${i}`} className="flex justify-between items-center text-rose-450 hover:bg-rose-500/5 px-1 py-0.5 rounded">
                  <span>{order.price.toFixed(currentPair.decimals)}</span>
                  <span className="text-rose-400">{order.size} Lots</span>
                </div>
              ))}
            </div>

            {/* Price Spread Node */}
            <div className="py-1 border-y border-slate-800 text-center text-slate-400 font-bold bg-slate-900/50 rounded flex justify-between px-2">
              <span>SPREAD</span>
              <span className="text-sky-300 font-mono">{(0.00018 * (currentPair.price > 100 ? 50 : 1)).toFixed(currentPair.decimals)}</span>
            </div>

            {/* Bids / Buys area */}
            <div className="space-y-1">
              {orderbook.filter(o => o.action === 'buy').map((order, i) => (
                <div key={`buy-${i}`} className="flex justify-between items-center text-emerald-450 hover:bg-emerald-500/5 px-1 py-0.5 rounded">
                  <span>{order.price.toFixed(currentPair.decimals)}</span>
                  <span className="text-emerald-400">{order.size} Lots</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Forex News Ticker Feed */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3" id="forex-news-feed">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-brand-dark" />
            <span>Forex Live Intelligence Stream</span>
          </h4>

          <ul className="text-[10.5px] tracking-tight leading-relaxed text-slate-600 space-y-3.5 divide-y divide-slate-50">
            <li className="pt-2 first:pt-0">
              <span className="text-[8px] bg-sky-50 text-sky-700 font-bold px-1.5 py-0.2 rounded uppercase block w-fit mb-1">MARKET ALERT</span>
              <p className="font-bold text-slate-800 leading-tight">Federal Reserve signals potential rate stabilization, buoying USD speculative volume index.</p>
              <span className="text-[8px] text-slate-450 font-mono mt-1 block">Live • 4 minutes ago</span>
            </li>
            <li className="pt-3">
              <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded uppercase block w-fit mb-1">EUROZONE</span>
              <p className="font-bold text-slate-800 leading-tight">European Central Bank confirms liquidity boost on active ledger networks, EUR/USD holds firm.</p>
              <span className="text-[8px] text-slate-450 font-mono mt-1 block">Live • 18 minutes ago</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}
