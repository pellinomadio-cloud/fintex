import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Bot, Cpu, Zap, Brain, TrendingUp, TrendingDown, Clock, 
  ArrowLeft, Copy, Check, CheckCircle2, X, Coins, ShieldAlert, 
  AlertCircle, CreditCard, Lock, Play, Pause, Terminal, 
  Settings, Activity, ShoppingCart, Info, CheckSquare, Sparkles, ChevronRight
} from 'lucide-react';

interface BotsPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onAddTransaction: (newTx: Transaction) => void;
  onNavigateToTab: (tab: string) => void;
}

export interface TradingBot {
  id: string;
  name: string;
  price: number;
  level: 'Novice' | 'Intermediate' | 'Advanced' | 'Expert' | 'Quantum' | 'Master' | 'Legendary' | 'Sovereign AI';
  roiRange: string;
  avgDailyRoi: number; // e.g. 0.012 for 1.2%
  strategy: string;
  description: string;
  indicators: string[];
}

export interface BotSignal {
  id: string;
  botId: string;
  botName: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  status: 'OPEN' | 'CLOSED';
  amount: number;
  profit: number;
  time: string;
}

export const ALL_BOTS_DATA: TradingBot[] = [
  {
    id: 'bot_aegis_scalper',
    name: 'Aegis AI Scalper v1.0',
    price: 15,
    level: 'Novice',
    roiRange: '0.8% - 1.2%',
    avgDailyRoi: 0.010,
    strategy: 'Forex Minute Scalping',
    description: 'Enters rapid buy and sell contracts on minor price inefficiencies during market quiet hours.',
    indicators: ['RSI(14)', 'EMA(9)', 'Bollinger Bands']
  },
  {
    id: 'bot_sentinel_grid',
    name: 'Sentinel Grid-Bot v2.4',
    price: 25,
    level: 'Novice',
    roiRange: '1.0% - 1.5%',
    avgDailyRoi: 0.0125,
    strategy: 'Grid Consolidation',
    description: 'Deploys a lattice of buy-limit and sell-limit orders inside sideways consolidation corridors.',
    indicators: ['ATR(14)', 'Pivot Points', 'VWAP']
  },
  {
    id: 'bot_vortex_trend',
    name: 'Vortex Trend Hunter',
    price: 40,
    level: 'Intermediate',
    roiRange: '1.3% - 1.8%',
    avgDailyRoi: 0.0155,
    strategy: 'Trend Following Momentum',
    description: 'Detects early bullish or bearish breakout waves and rides the direction till trend fatigue.',
    indicators: ['MACD(12,26,9)', 'ADX(14)', 'Parabolic SAR']
  },
  {
    id: 'bot_apex_arbitrage',
    name: 'Apex Arbitrage Nexus',
    price: 65,
    level: 'Intermediate',
    roiRange: '1.5% - 2.2%',
    avgDailyRoi: 0.0185,
    strategy: 'Cross-Broker Arbitrage',
    description: 'Exploits minute price spreads of major currencies between different institutional brokers.',
    indicators: ['Spread Ticker', 'Volume Profile', 'EMA(200)']
  },
  {
    id: 'bot_neural_wave',
    name: 'Neural Wave CFD',
    price: 90,
    level: 'Intermediate',
    roiRange: '1.8% - 2.5%',
    avgDailyRoi: 0.0215,
    strategy: 'LSTM Neural Waves',
    description: 'An LSTM recurrent neural net trained on past 500 hours of price ticks to forecast short-term waves.',
    indicators: ['LSTM Weights', 'Stochastic RSI', 'Keltner Channels']
  },
  {
    id: 'bot_quantum_hft',
    name: 'Quantum High-Freq v4',
    price: 120,
    level: 'Advanced',
    roiRange: '2.1% - 2.8%',
    avgDailyRoi: 0.0245,
    strategy: 'High-Frequency Scalping',
    description: 'Uses ultra low-latency order execution to lock in fractions of a pip across EUR and GBP.',
    indicators: ['Tick Delta', 'Order Flow Cumulative', 'Ichimoku Cloud']
  },
  {
    id: 'bot_euler_math',
    name: 'Euler Math Arbitrage',
    price: 150,
    level: 'Advanced',
    roiRange: '2.4% - 3.2%',
    avgDailyRoi: 0.0280,
    strategy: 'Quantitative Mean Reversion',
    description: 'Implements complex statistical models to trade currencies reverting back to their average values.',
    indicators: ['Z-Score Monitor', 'Standard Deviation', 'Linear Regression']
  },
  {
    id: 'bot_gann_grid',
    name: 'Gann-Grid Trend Hunter',
    price: 185,
    level: 'Advanced',
    roiRange: '2.6% - 3.5%',
    avgDailyRoi: 0.0305,
    strategy: 'Fibonacci Angles Grid',
    description: 'Constructs geometric trendlines utilizing Gann Angles and Fibonacci ratio boundaries.',
    indicators: ['Gann Fan', 'Fibonacci Retracements', 'ADX']
  },
  {
    id: 'bot_sentinel_pivot',
    name: 'Sentinel Pivot Elite',
    price: 220,
    level: 'Expert',
    roiRange: '2.8% - 3.8%',
    avgDailyRoi: 0.0330,
    strategy: 'Pivot Key-Levels Breakout',
    description: 'Targets hourly institutional key levels and executes massive volume buy/sell stops on breach.',
    indicators: ['Weekly Pivots', 'Support & Resistance 3', 'ATR']
  },
  {
    id: 'bot_alpha_scalper_pro',
    name: 'Alpha Scalper Pro',
    price: 275,
    level: 'Expert',
    roiRange: '3.1% - 4.2%',
    avgDailyRoi: 0.0365,
    strategy: 'Multi-Indicator Confluence',
    description: 'Requires alignment of 5 technical oscillators and volume indexes before executing a trade.',
    indicators: ['RSI', 'MACD', 'Stochastic', 'CCI', 'Chaikin Money Flow']
  },
  {
    id: 'bot_prism_liquidity',
    name: 'Prism Liquidity Bot',
    price: 350,
    level: 'Expert',
    roiRange: '3.4% - 4.6%',
    avgDailyRoi: 0.0400,
    strategy: 'Institutional Order Flow',
    description: 'Tracks institutional dark pools and large liquidity blocks to slide orders under the radar.',
    indicators: ['Market Depth', 'Volume Delta', 'CVD Osc']
  },
  {
    id: 'bot_vector_momentum',
    name: 'Vector Momentum Core',
    price: 450,
    level: 'Quantum',
    roiRange: '3.7% - 5.0%',
    avgDailyRoi: 0.0435,
    strategy: 'Vectorized Price Velocity',
    description: 'Analyses the speed and momentum angle of ticks using vector trigonometry equations.',
    indicators: ['Vector Acceleration', 'Rate of Change', 'EMA(50)']
  },
  {
    id: 'bot_sigma_arbitrage',
    name: 'Sigma Arbitrage Pro',
    price: 550,
    level: 'Quantum',
    roiRange: '4.0% - 5.5%',
    avgDailyRoi: 0.0475,
    strategy: 'Triangular Spread Finder',
    description: 'Executes rapid 3-way circular cross currency trades (e.g. USD -> EUR -> GBP -> USD) to capture spreads.',
    indicators: ['Triangular Spread Monitor', 'Volume Delta']
  },
  {
    id: 'bot_deep_reinforce',
    name: 'Deep Reinforce CFD',
    price: 700,
    level: 'Quantum',
    roiRange: '4.3% - 6.0%',
    avgDailyRoi: 0.0515,
    strategy: 'Deep Q-Learning RL',
    description: 'An advanced AI agent that continuously teaches itself trading strategies by reward maximization.',
    indicators: ['Reward State Delta', 'Q-Table Weights', 'SARSA Feed']
  },
  {
    id: 'bot_infinity_scalp',
    name: 'Infinity Scalp Elite',
    price: 850,
    level: 'Master',
    roiRange: '4.6% - 6.5%',
    avgDailyRoi: 0.0555,
    strategy: 'High-Order Fractal Analysis',
    description: 'Identifies fractal repeating geometries across 15-second charts to predict 5-minute spikes.',
    indicators: ['Chaos Fractals', 'Hurst Exponent', 'Alligator Indicator']
  },
  {
    id: 'bot_titan_inst',
    name: 'Titan Institutional AI',
    price: 1000,
    level: 'Master',
    roiRange: '5.0% - 7.0%',
    avgDailyRoi: 0.0600,
    strategy: 'Institutional Market Making',
    description: 'Places fast bid/ask quotes to earn the spread directly, hedging delta exposure across majors.',
    indicators: ['Spread Yield Delta', 'Bid-Ask Matrix', 'TPO Chart']
  },
  {
    id: 'bot_aether_quantum',
    name: 'Aether Quantum Swarm',
    price: 1250,
    level: 'Master',
    roiRange: '5.4% - 7.5%',
    avgDailyRoi: 0.0645,
    strategy: 'Particle Swarm Optimization',
    description: 'Drives 50 micro-subroutines that cooperate collectively to identify the absolute global minima/maxima.',
    indicators: ['Swarm Vector', 'Global Best Position', 'EMA(100)']
  },
  {
    id: 'bot_chronos_orbit',
    name: 'Chronos Orbit Predictor',
    price: 1500,
    level: 'Legendary',
    roiRange: '5.8% - 8.2%',
    avgDailyRoi: 0.0700,
    strategy: 'Spatio-Temporal Graph',
    description: 'Employs spatio-temporal graph convolutional networks to predict synchronized asset moves.',
    indicators: ['GCN Node Weights', 'Temporal Attention Map']
  },
  {
    id: 'bot_nexus_sovereign',
    name: 'Nexus Sovereign Trader',
    price: 2000,
    level: 'Legendary',
    roiRange: '6.3% - 9.0%',
    avgDailyRoi: 0.0765,
    strategy: 'Multi-Asset Adaptive Hedge',
    description: 'Sovereign institutional algorithm hedging forex positions against gold and commodities automatically.',
    indicators: ['Correlation Index', 'Adaptive Beta Feed', 'VIX Volatility']
  },
  {
    id: 'bot_apex_overlord',
    name: 'Apex Overlord Quantum',
    price: 2500,
    level: 'Sovereign AI',
    roiRange: '7.0% - 10.0%',
    avgDailyRoi: 0.0850,
    strategy: 'Quantum Superposition',
    description: 'Our absolute crown jewel. Simulates 10,000 potential trading parallel timelines to choose the winning path.',
    indicators: ['Superposition Wave Function', 'Schrodinger Probability']
  }
];

export default function BotsPage({ user, onUpdateUser, onAddTransaction, onNavigateToTab }: BotsPageProps) {
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [selectedBot, setSelectedBot] = useState<TradingBot | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'balance' | 'usdt' | 'naira' | 'card' | 'processing' | 'success'>('balance');
  const [notification, setNotification] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [proofBase64, setProofBase64] = useState<string>('');
  
  // Checkout Processing States
  const [progress, setProgress] = useState<number>(0);
  const [logMessage, setLogMessage] = useState<string>('');
  
  // Debit card checkout inputs
  const [cardNum, setCardNum] = useState<string>('');
  const [cardExp, setCardExp] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');

  // Live Signals Feed (Simulated logs of active bots trading)
  const [signals, setSignals] = useState<BotSignal[]>(() => {
    return JSON.parse(localStorage.getItem(`fintex_bot_signals_${user.id}`) || '[]');
  });

  const purchasedBotsList = user.purchasedBots || [];
  const activeBotsList = user.activeBots || [];
  const botEarningsMap = user.botEarnings || {};

  const totalEarnings = Object.values(botEarningsMap).reduce((acc, curr) => acc + curr, 0);

  // Dynamic Gateway Addresses loaded from settings
  const [gatewayUsdt] = useState<string>(() => localStorage.getItem('fintex_gateway_usdt') || 'TRibF41CvFeNptGPbuC5gRCfGcrqcc9XPm');
  const [gatewayNairaBank] = useState<string>(() => localStorage.getItem('fintex_gateway_naira_bank') || 'Opay Digital Bank');
  const [gatewayNairaAcc] = useState<string>(() => localStorage.getItem('fintex_gateway_naira_acc') || '8062940251');
  const [gatewayNairaName] = useState<string>(() => localStorage.getItem('fintex_gateway_naira_name') || 'Fintex International Hub');

  // Sync local storage signals
  useEffect(() => {
    localStorage.setItem(`fintex_bot_signals_${user.id}`, JSON.stringify(signals));
  }, [signals, user.id]);

  // Generate simulated trades for active bots periodically
  useEffect(() => {
    if (activeBotsList.length === 0) return;

    const interval = setInterval(() => {
      // Pick a random active bot
      const randomActiveId = activeBotsList[Math.floor(Math.random() * activeBotsList.length)];
      const bot = ALL_BOTS_DATA.find(b => b.id === randomActiveId);
      if (!bot) return;

      const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
      const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
      const isBuy = Math.random() > 0.45;
      const entryPrices: Record<string, number> = {
        'EUR/USD': 1.0842,
        'GBP/USD': 1.2715,
        'USD/JPY': 155.62,
        'AUD/USD': 0.6648,
        'USD/CAD': 1.3685
      };

      const startPrice = entryPrices[randomPair] || 1.000;
      const signalId = 'sig_' + Math.random().toString(36).substr(2, 9);
      
      // Calculate stake based on bot level price
      const stake = parseFloat((bot.price * 1.5).toFixed(2));
      // Calculate realistic trade yield based on daily average
      const tradeProfit = parseFloat((stake * bot.avgDailyRoi * (0.8 + Math.random() * 0.4)).toFixed(2));

      const newSignal: BotSignal = {
        id: signalId,
        botId: bot.id,
        botName: bot.name,
        pair: randomPair,
        type: isBuy ? 'BUY' : 'SELL',
        entryPrice: parseFloat(startPrice.toFixed(4)),
        currentPrice: parseFloat(startPrice.toFixed(4)),
        pnl: 0,
        status: 'OPEN',
        amount: stake,
        profit: tradeProfit,
        time: new Date().toLocaleTimeString()
      };

      // Add to front of signals list
      setSignals(prev => [newSignal, ...prev].slice(0, 50));

      // Fluctuate this trade for 5 seconds, then resolve and award profit
      let tickCount = 0;
      const ticks = setInterval(() => {
        tickCount++;
        setSignals(prev => {
          return prev.map(sig => {
            if (sig.id === signalId) {
              const variance = (Math.random() - 0.48) * 0.002;
              const nextPrice = sig.entryPrice * (1 + variance);
              let diffRatio = (nextPrice - sig.entryPrice) / sig.entryPrice;
              if (sig.type === 'SELL') diffRatio = -diffRatio;
              
              const livePnl = parseFloat((sig.amount * diffRatio * 15).toFixed(2));

              return {
                ...sig,
                currentPrice: parseFloat(nextPrice.toFixed(4)),
                pnl: livePnl
              };
            }
            return sig;
          });
        });

        // After 4 ticks, close with positive profit return
        if (tickCount >= 4) {
          clearInterval(ticks);
          
          setSignals(prev => {
            return prev.map(sig => {
              if (sig.id === signalId) {
                return {
                  ...sig,
                  status: 'CLOSED',
                  currentPrice: parseFloat((sig.entryPrice * (sig.type === 'BUY' ? 1.0012 : 0.9988)).toFixed(4)),
                  pnl: sig.profit
                };
              }
              return sig;
            });
          });

          // UPDATE BALANCE IN DB & STATE
          const updatedEarnings = { ...botEarningsMap };
          updatedEarnings[bot.id] = parseFloat(((updatedEarnings[bot.id] || 0) + tradeProfit).toFixed(2));

          const updatedBalance = parseFloat((user.balance + tradeProfit).toFixed(2));

          const updatedUser: User = {
            ...user,
            balance: updatedBalance,
            botEarnings: updatedEarnings
          };

          // Sync to database
          onUpdateUser(updatedUser);

          // Add transaction ledger entry
          const rTxId = 'tx_bot_trade_' + Math.random().toString(36).substr(2, 9);
          const tx: Transaction = {
            id: rTxId,
            userId: user.id,
            type: 'reward',
            amount: tradeProfit,
            description: `Automated Bot Profit Return: ${bot.name} on ${randomPair}`,
            date: new Date().toISOString(),
            status: 'completed',
            reference: 'FTX-BOT-' + Math.floor(100000 + Math.random() * 900000)
          };
          onAddTransaction(tx);
          
          setNotification(`🤖 ${bot.name} successfully closed trade on ${randomPair} for +$${tradeProfit.toFixed(2)} return!`);
          setTimeout(() => setNotification(null), 4000);
        }
      }, 1200);

    }, 15000); // Check and generate a bot trade every 15 seconds

    return () => clearInterval(interval);
  }, [activeBotsList, user.balance]);

  // Handle bot purchase with local balance
  const handlePurchaseWithBalance = () => {
    if (!selectedBot) return;
    if (user.balance < selectedBot.price) {
      setNotification(`Insufficient funds. Your balance is $${user.balance.toFixed(2)}. Selected bot price is $${selectedBot.price.toFixed(2)}.`);
      return;
    }

    // Deduct balance and add bot
    const updatedUser: User = {
      ...user,
      balance: parseFloat((user.balance - selectedBot.price).toFixed(2)),
      purchasedBots: [...purchasedBotsList, selectedBot.id],
      activeBots: [...activeBotsList, selectedBot.id] // Auto-activate on purchase
    };

    onUpdateUser(updatedUser);

    // Create a transaction ledger
    const txId = 'tx_buy_bot_' + Math.random().toString(36).substr(2, 9);
    const tx: Transaction = {
      id: txId,
      userId: user.id,
      type: 'utility',
      amount: selectedBot.price,
      description: `Purchase & Instant Activation of ${selectedBot.name}`,
      date: new Date().toISOString(),
      status: 'completed',
      reference: 'FTX-BOT-BUY-' + Math.floor(100000 + Math.random() * 900000)
    };
    onAddTransaction(tx);

    setCheckoutMethod('success');
  };

  // Simulated node payment confirmations (identical to premium upgrade scripts)
  const runSimulatedApproval = (methodLabel: string) => {
    setCheckoutMethod('processing');
    setProgress(0);
    setLogMessage('Connecting to global banking clearing network...');

    const logs = [
      'Authenticating cryptographic payment payloads...',
      'Verifying transaction receipt integrity nodes...',
      'Synchronizing with Decentralized Escrow Vault...',
      'Validating settlement hashes on TRON network...',
      'Confirming assets ledger clearance block...',
      'Deploying automated bot instance keys...',
      'Cryptographic activation keys injected successfully!'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Complete the purchase
          if (selectedBot) {
            const updatedUser: User = {
              ...user,
              purchasedBots: [...purchasedBotsList, selectedBot.id],
              activeBots: [...activeBotsList, selectedBot.id]
            };
            onUpdateUser(updatedUser);

            // Create ledger record
            const txId = 'tx_bot_proof_' + Math.random().toString(36).substr(2, 9);
            const tx: Transaction = {
              id: txId,
              userId: user.id,
              type: 'deposit',
              amount: selectedBot.price,
              description: `Direct Purchase and Activation of ${selectedBot.name} via ${methodLabel}`,
              date: new Date().toISOString(),
              status: 'completed',
              reference: 'FTX-BOT-DEP-' + Math.floor(100000 + Math.random() * 900000)
            };
            onAddTransaction(tx);
          }
          
          setCheckoutMethod('success');
          return 100;
        }
        
        // Dynamic logs matching progress
        const logIdx = Math.floor((prev / 100) * logs.length);
        if (logs[logIdx] && logs[logIdx] !== logMessage) {
          setLogMessage(logs[logIdx]);
        }
        
        return prev + 15;
      });
    }, 600);
  };

  const handleConfirmUSDT = () => {
    runSimulatedApproval('USDT Deposit');
  };

  const handleConfirmNaira = (e: React.FormEvent) => {
    e.preventDefault();
    runSimulatedApproval('Naira Local Bank Routing');
  };

  const handleConfirmCard = (e: React.FormEvent) => {
    e.preventDefault();
    runSimulatedApproval('Direct Card Payment');
  };

  // Toggle Bot activation state
  const handleToggleBotState = (botId: string) => {
    const isActive = activeBotsList.includes(botId);
    let updatedActive: string[];
    if (isActive) {
      updatedActive = activeBotsList.filter(id => id !== botId);
      setNotification(`Bot deactivated. Simulated trades have ceased.`);
    } else {
      updatedActive = [...activeBotsList, botId];
      setNotification(`Bot initialized! Simulated high-frequency trades are now active.`);
    }

    const updatedUser: User = {
      ...user,
      activeBots: updatedActive
    };
    onUpdateUser(updatedUser);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredBots = ALL_BOTS_DATA.filter(bot => {
    if (filterLevel === 'All') return true;
    if (filterLevel === 'Novice') return bot.level === 'Novice';
    if (filterLevel === 'Intermediate') return bot.level === 'Intermediate';
    if (filterLevel === 'Advanced') return bot.level === 'Advanced';
    if (filterLevel === 'Expert') return bot.level === 'Expert';
    if (filterLevel === 'Quantum+') return ['Quantum', 'Master', 'Legendary', 'Sovereign AI'].includes(bot.level);
    return true;
  });

  const levelBadges: Record<string, string> = {
    'Novice': 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    'Intermediate': 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    'Advanced': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    'Expert': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'Quantum': 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'Master': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'Legendary': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    'Sovereign AI': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  };

  return (
    <div className="space-y-6 pb-28 text-slate-100" id="bots-lobby-page">
      
      {/* Toast Notification Header */}
      {notification && (
        <div className="fixed top-16 inset-x-4 max-w-sm mx-auto z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800 animate-slide-in-top animate-bounce-slow" id="bots-global-flyout">
          <div className="flex items-center gap-2.5 text-xs font-bold leading-normal text-sky-200">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <p className="flex-1">{notification}</p>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-slate-400 hover:text-white cursor-pointer ml-2 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Stats Overview */}
      <div className="bg-gradient-to-br from-slate-950 via-[#0c1324] to-slate-900 rounded-[32px] p-5.5 border border-slate-850 shadow-2xl relative overflow-hidden" id="bots-stats-billboard">
        <div className="absolute -right-24 -bottom-24 w-60 h-60 bg-brand-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-28 h-28 bg-emerald-500/5 blur-2xl pointer-events-none" />
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm text-slate-100 tracking-tight leading-none">Automated Bot Lobby</h2>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Harness elite artificial intelligence algorithms</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              24/7 AI Engine
            </span>
          </div>
        </div>

        {/* Triple Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-850/80 text-center" id="bots-overview-bento">
          <div className="bg-slate-900/50 p-2.5 rounded-2xl border border-white/5 space-y-0.5">
            <span className="text-[8px] text-slate-450 uppercase font-black tracking-wider block">Active Units</span>
            <span className="font-mono text-base font-black text-emerald-400 block">{activeBotsList.length} <span className="text-[10px] text-slate-500">/ {purchasedBotsList.length}</span></span>
          </div>
          
          <div className="bg-slate-900/50 p-2.5 rounded-2xl border border-white/5 space-y-0.5">
            <span className="text-[8px] text-slate-450 uppercase font-black tracking-wider block">Total Earnings</span>
            <span className="font-mono text-base font-black text-sky-400 block">${totalEarnings.toFixed(2)}</span>
          </div>

          <div className="bg-slate-900/50 p-2.5 rounded-2xl border border-white/5 space-y-0.5">
            <span className="text-[8px] text-slate-450 uppercase font-black tracking-wider block">Est. Yield</span>
            <span className="font-mono text-base font-black text-amber-400 block">+{((activeBotsList.length * 1.8) || 0).toFixed(1)}% <span className="text-[9px] text-slate-500">/d</span></span>
          </div>
        </div>
      </div>

      {/* FILTERS NAVIGATION SCROLLER */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" id="bots-scroller-filters">
        {['All', 'Novice', 'Intermediate', 'Advanced', 'Expert', 'Quantum+'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(lvl)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border shrink-0 transition-all cursor-pointer ${
              filterLevel === lvl 
                ? 'bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/10' 
                : 'bg-[#0f1524] border-slate-850 text-slate-400 hover:text-white'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* BOT LIST CARDS */}
      <div className="grid grid-cols-1 gap-4" id="bots-grid-wrapper">
        {filteredBots.map((bot) => {
          const isPurchased = purchasedBotsList.includes(bot.id);
          const isActive = activeBotsList.includes(bot.id);
          const botEarned = botEarningsMap[bot.id] || 0;

          return (
            <div 
              key={bot.id} 
              className={`bg-gradient-to-br from-[#101626] via-[#0d1222] to-[#0a0e1a] border rounded-3xl p-4.5 space-y-3.5 transition-all shadow-md relative overflow-hidden ${
                isActive 
                  ? 'border-emerald-500/25 ring-1 ring-emerald-500/5 shadow-emerald-500/5' 
                  : isPurchased 
                    ? 'border-amber-500/20' 
                    : 'border-slate-850 hover:border-slate-800'
              }`}
              id={`bot-card-${bot.id}`}
            >
              {/* Background Ambient Glow */}
              {isActive && (
                <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              )}

              {/* Bot Header info row */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-2.5">
                  <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' 
                      : isPurchased 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                        : 'bg-white/5 text-slate-400 border-white/5'
                  }`}>
                    {bot.price >= 1000 ? <Brain className="w-5 h-5" /> : bot.price >= 200 ? <Cpu className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xs text-white leading-snug flex items-center gap-1.5 flex-wrap">
                      <span>{bot.name}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                    </h3>
                    <p className="text-[9px] text-slate-500 uppercase font-black mt-0.5 tracking-wider">{bot.strategy}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${levelBadges[bot.level] || 'bg-white/5 text-slate-300'}`}>
                    {bot.level}
                  </span>
                  <div className="text-[10px] text-emerald-400 font-mono font-bold mt-1">
                    Daily: {bot.roiRange}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">{bot.description}</p>

              {/* Technical Indicators metrics row */}
              <div className="flex flex-wrap gap-1 items-center py-1">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mr-1">Indicators:</span>
                {bot.indicators.map((ind, i) => (
                  <span key={i} className="text-[8px] font-mono font-semibold bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded border border-white/5">
                    {ind}
                  </span>
                ))}
              </div>

              {/* Stats Footer + Action Button */}
              <div className="pt-3 border-t border-slate-850/60 flex justify-between items-center gap-4">
                <div className="text-left space-y-0.5">
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider block">Estimated Price</span>
                  <span className="font-mono text-sm font-black text-sky-100">${bot.price.toFixed(2)} <span className="text-[10px] text-slate-500">USDT</span></span>
                </div>

                {isPurchased && (
                  <div className="text-left space-y-0.5 mr-auto">
                    <span className="text-[8px] text-slate-505 uppercase font-bold tracking-wider block">Bot Revenue</span>
                    <span className="font-mono text-xs font-black text-emerald-400">+${botEarned.toFixed(2)}</span>
                  </div>
                )}

                <div>
                  {isPurchased ? (
                    <button
                      type="button"
                      onClick={() => handleToggleBotState(bot.id)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                        isActive 
                          ? 'bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25' 
                          : 'bg-emerald-500 border border-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/10'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-3 h-3 fill-current" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" /> Activate
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBot(bot);
                        setCheckoutMethod('balance');
                        setCheckoutModalOpen(true);
                      }}
                      className="px-4 py-2 bg-brand-primary border border-brand-primary hover:bg-brand-medium text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-brand-primary/15 cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
                    >
                      <ShoppingCart className="w-3 h-3" /> Buy Bot
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* REAL-TIME BOT SIGNALS LOGS */}
      <div className="bg-[#101524] rounded-3xl p-5 border border-slate-850 shadow-2xl space-y-3.5" id="bots-live-signals-module">
        <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping-subtle" />
            <h3 className="font-display font-black text-xs text-slate-100 uppercase tracking-widest">
              🤖 Live Bot Trading Signals Ticker
            </h3>
          </div>
          <span className="font-mono text-[9px] font-bold text-slate-500 uppercase bg-slate-900 px-2 py-0.5 rounded border border-white/5">
            Realtime
          </span>
        </div>

        {activeBotsList.length === 0 ? (
          <div className="text-center py-8 text-slate-500 space-y-2" id="bots-no-signals-splash">
            <span className="text-2xl animate-pulse block">💤</span>
            <p className="text-[11px] font-bold text-slate-350">Awaiting Active Bot Deployments</p>
            <p className="text-[9.5px] text-slate-550 max-w-xs mx-auto leading-relaxed">
              Activate your purchased bots above to trigger high-speed automated trading and profit return logs.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1" id="bots-signals-feed">
            {signals.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Initializing feed connection... Expecting trade signal momentarily.
              </div>
            ) : (
              signals.map((sig) => {
                const isWin = sig.profit >= 0;
                const isOpen = sig.status === 'OPEN';

                return (
                  <div 
                    key={sig.id} 
                    className="p-3 bg-slate-950/60 rounded-2xl border border-white/5 flex justify-between items-center text-xs animate-fade-in relative overflow-hidden"
                    id={`sig-log-${sig.id}`}
                  >
                    {isOpen && (
                      <div className="absolute left-0 inset-y-0 w-0.5 bg-emerald-500 animate-pulse" />
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-md ${sig.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                          {sig.type}
                        </span>
                        <strong className="text-slate-200 font-black tracking-tight">{sig.pair}</strong>
                        <span className="text-[9.5px] text-slate-500 font-mono">@{sig.entryPrice.toFixed(4)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-sans">
                        <span className="font-bold text-sky-400">{sig.botName}</span>
                        <span>•</span>
                        <span className="text-slate-500">Margin: ${sig.amount}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      {isOpen ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[8.5px] uppercase font-black tracking-wider text-emerald-400 animate-pulse flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 animate-spin" /> RUNNING
                          </span>
                          <span className={`font-mono text-[10px] font-bold mt-0.5 ${sig.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Live: {sig.pnl >= 0 ? '+' : ''}${sig.pnl.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] uppercase font-black text-slate-500 tracking-widest block">COMPLETED</span>
                          <span className={`font-mono font-black text-[11px] mt-0.5 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            +{sig.profit.toFixed(2)} USD
                          </span>
                        </div>
                      )}
                      <span className="text-[8px] text-slate-550 block font-mono mt-0.5">{sig.time}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* CHECKOUT DRAWERS MODAL OVERLAY */}
      {checkoutModalOpen && selectedBot && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4 backdrop-blur-xs transition-all" id="checkout-modal-backdrop">
          <div className="bg-[#0b0e17] w-full max-w-md rounded-t-[32px] rounded-b-[16px] border border-slate-850 p-6 space-y-5 shadow-2xl relative animate-slide-in-bottom text-slate-100" id="checkout-drawer-panel">
            
            {/* Header close button */}
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4.5 h-4.5 text-brand-light" />
                <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">Bot Acquisition</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer hover:bg-white/5 rounded-full"
                id="btn-close-checkout"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BOT SPEC HIGHLIGHT */}
            <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl flex justify-between items-center gap-3">
              <div>
                <h4 className="font-display font-black text-xs text-white">{selectedBot.name}</h4>
                <p className="text-[9.5px] text-slate-400 font-sans mt-0.5">Level: <strong className="text-sky-400">{selectedBot.level}</strong> • Est: {selectedBot.roiRange} Daily</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Acquisition cost</span>
                <span className="font-mono text-sm font-black text-sky-300">${selectedBot.price.toFixed(2)} USDT</span>
              </div>
            </div>

            {/* PAYMENT CHOICE SELECTION */}
            {checkoutMethod !== 'processing' && checkoutMethod !== 'success' && (
              <div className="space-y-4">
                <div className="flex border-b border-slate-850 pb-0.5 gap-2 scrollbar-none overflow-x-auto" id="checkout-method-tabs">
                  {[
                    { id: 'balance', label: 'Wallet Balance', icon: <Coins className="w-3.5 h-3.5" /> },
                    { id: 'usdt', label: 'USDT Crypto', icon: <Bot className="w-3.5 h-3.5" /> },
                    { id: 'naira', label: 'Local Bank NGN', icon: <Activity className="w-3.5 h-3.5" /> },
                    { id: 'card', label: 'Debit Card', icon: <CreditCard className="w-3.5 h-3.5" /> }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setCheckoutMethod(m.id as any)}
                      className={`px-3 py-2 text-[9px] font-black uppercase tracking-wider border-b-2 shrink-0 flex items-center gap-1 cursor-pointer transition-all ${
                        checkoutMethod === m.id 
                          ? 'border-brand-primary text-white font-bold' 
                          : 'border-transparent text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* METHOD A: PAY WITH WALLET BALANCE */}
                {checkoutMethod === 'balance' && (
                  <div className="space-y-4" id="checkout-method-balance-pane">
                    <div className="p-3 bg-slate-900/40 rounded-2xl border border-white/5 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Your Wallet Balance:</span>
                        <span className="font-mono font-bold text-slate-200">${user.balance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1.5 mt-1.5">
                        <span className="text-slate-400">Selected Bot Price:</span>
                        <span className="font-mono font-bold text-sky-400">-${selectedBot.price.toFixed(2)}</span>
                      </div>
                      
                      {user.balance >= selectedBot.price ? (
                        <div className="flex justify-between items-center text-[10.5px] font-bold text-emerald-400 border-t border-white/5 pt-1.5 mt-1.5">
                          <span>Post-Purchase Balance:</span>
                          <span className="font-mono">${(user.balance - selectedBot.price).toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-[10px] font-bold text-rose-400 border-t border-white/5 pt-1.5 mt-1.5">
                          <span>Shortfall Amount:</span>
                          <span className="font-mono">${(selectedBot.price - user.balance).toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {user.balance >= selectedBot.price ? (
                      <button
                        type="button"
                        onClick={handlePurchaseWithBalance}
                        className="w-full py-3.5 bg-brand-primary hover:bg-brand-medium text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                        id="btn-complete-balance-purchase"
                      >
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                        Deduct Balance & Unlock Bot
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] text-rose-400 leading-normal">
                          ⚠️ You do not have enough wallet balance to complete this purchase. Please select another payment method above like <b>USDT Crypto</b> or <b>Local Bank NGN</b>.
                        </div>
                        <button
                          type="button"
                          onClick={() => setCheckoutMethod('usdt')}
                          className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-white/5 transition-all cursor-pointer text-center"
                        >
                          Choose USDT Cryptographic Deposit
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* METHOD B: CRYPTO USDT */}
                {checkoutMethod === 'usdt' && (
                  <div className="space-y-4" id="checkout-method-usdt-pane">
                    <div className="p-3.5 bg-slate-900 rounded-2xl space-y-1.5 text-center">
                      <span className="text-[8.5px] uppercase font-black text-slate-450 tracking-wider">Required USDT Transfer</span>
                      <h4 className="font-mono text-xl font-extrabold text-white">{selectedBot.price.toFixed(2)} USDT</h4>
                      <p className="text-[9.5px] text-slate-450">Network: <strong className="text-emerald-400">TRON (TRC20) - Fast Settlement</strong></p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Generated Deposit Wallet</label>
                      <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-2xl border border-white/5">
                        <span className="flex-1 font-mono text-[10px] text-slate-300 break-all select-all leading-normal">
                          {gatewayUsdt}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(gatewayUsdt);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="p-2 bg-[#0c1222] border border-white/10 hover:border-brand-primary rounded-xl text-slate-300 transition-all cursor-pointer flex items-center justify-center shrink-0 w-8 h-8"
                          id="checkout-btn-copy-usdt"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Receipt Drag & Drop */}
                    <div className="space-y-1.5">
                      <label className="block text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Upload Transaction Receipt Screenshot</label>
                      <div 
                        className="border-2 border-dashed border-slate-800 hover:border-brand-primary rounded-2xl p-4 text-center cursor-pointer hover:bg-white/5 transition-all text-xs text-slate-400 space-y-1"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => {
                              if (typeof r.result === 'string') setProofBase64(r.result);
                            };
                            r.readAsDataURL(file);
                          }
                        }}
                      >
                        <span className="text-lg block">📸</span>
                        <span className="font-bold text-[10.5px]">Drag & Drop receipt or click to browse</span>
                        <p className="text-[9px] text-slate-500">Formats: JPEG, PNG. Max size: 5MB</p>
                        {proofBase64 && <span className="text-[10px] text-emerald-400 block font-bold">✓ Payment proof screenshot loaded successfully!</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmUSDT}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      I have transferred the USDT
                    </button>
                  </div>
                )}

                {/* METHOD C: NAIRA LOCAL BANK */}
                {checkoutMethod === 'naira' && (
                  <form onSubmit={handleConfirmNaira} className="space-y-4" id="checkout-method-naira-pane">
                    <div className="p-3.5 bg-[#0f1424] border border-white/5 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Local Bank Name</span>
                        <span className="font-bold text-white">{gatewayNairaBank}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 border-t border-white/5 pt-2">
                        <span>Account Number</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-white tracking-wider">{gatewayNairaAcc}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(gatewayNairaAcc);
                              setNotification("Account number copied!");
                            }}
                            className="p-1 hover:bg-white/5 text-slate-350 rounded transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 border-t border-white/5 pt-2">
                        <span>Recipient Account Name</span>
                        <span className="font-bold text-white">{gatewayNairaName}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-2 text-slate-400">
                        <span>Equivalent Naira Cost</span>
                        <span className="font-mono font-black text-amber-400">₦{(selectedBot.price * 1600).toLocaleString()} NGN</span>
                      </div>
                    </div>

                    {/* Receipt upload */}
                    <div className="space-y-1.5">
                      <label className="block text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Upload Transaction Receipt Screenshot</label>
                      <div 
                        className="border-2 border-dashed border-slate-800 hover:border-brand-primary rounded-2xl p-4 text-center cursor-pointer hover:bg-white/5 transition-all text-xs text-slate-400 space-y-1"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => {
                              if (typeof r.result === 'string') setProofBase64(r.result);
                            };
                            r.readAsDataURL(file);
                          }
                        }}
                      >
                        <span className="text-lg block">📸</span>
                        <span className="font-bold text-[10.5px]">Drag & Drop receipt or click to browse</span>
                        <p className="text-[9px] text-slate-500">Formats: JPEG, PNG. Max size: 5MB</p>
                        {proofBase64 && <span className="text-[10px] text-emerald-400 block font-bold">✓ Receipt proof screenshot loaded!</span>}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md cursor-pointer text-center"
                    >
                      Submit Deposit Proof & Unlock
                    </button>
                  </form>
                )}

                {/* METHOD D: CREDIT CARD */}
                {checkoutMethod === 'card' && (
                  <form onSubmit={handleConfirmCard} className="space-y-4" id="checkout-method-card-pane">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Debit Card Number</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">💳</span>
                          <input
                            type="text"
                            required
                            maxLength={19}
                            placeholder="e.g. 4022 1928 3847 4022"
                            className="w-full pl-8.5 pr-4 py-2.5 bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary focus:bg-slate-950 text-white"
                            value={cardNum}
                            onChange={(e) => setCardNum(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Expiry Date</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            placeholder="MM/YY"
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/5 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary focus:bg-slate-950 text-white"
                            value={cardExp}
                            onChange={(e) => setCardExp(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">CVV / CVV2 Code</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            placeholder="•••"
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-brand-primary focus:bg-slate-950 text-white"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/30 rounded-2xl border border-white/5 text-[10px] text-slate-400 leading-normal space-y-0.5">
                      <span className="font-bold text-slate-350 block">Instant Card Settlement Node</span>
                      <p>Your bank card will be securely processed in 256-bit SSL encrypted channels automatically.</p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-brand-primary hover:bg-brand-medium text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md cursor-pointer"
                    >
                      Authorize Payment & Activate Bot
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* PROCESSING STATE CONTAINER */}
            {checkoutMethod === 'processing' && (
              <div className="py-6 text-center space-y-6" id="checkout-processing-view">
                <div className="relative w-20 h-20 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-slate-800 fill-none"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-emerald-400 fill-none transition-all duration-300"
                      strokeWidth="6"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * progress) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-base font-black text-white">{Math.round(progress)}%</span>
                    <span className="text-[7.5px] uppercase tracking-wider text-slate-500 font-bold font-mono">Status</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-display font-black text-sm text-slate-200">Simulating Cryptographic Clearance</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-normal">
                    We are verifying the payment settlement against blockchain ledger nodes. Please wait.
                  </p>
                </div>

                {/* Console Log Terminal box */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 text-[9.5px] font-mono text-emerald-400 text-left space-y-1 mx-auto max-w-sm shadow-inner relative overflow-hidden">
                  <div className="flex items-center gap-1 border-b border-slate-850 pb-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[7.5px] text-slate-500 ml-auto font-bold uppercase">Consensual Gateway Console</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-slate-500 shrink-0 select-none">▸</span>
                    <p className="break-all">{logMessage}</p>
                  </div>
                  {progress < 100 && (
                    <div className="flex items-start gap-1 animate-pulse text-indigo-400">
                      <span className="text-slate-500 shrink-0 select-none">▸</span>
                      <p className="text-[8.5px]">Awaiting node response consensus clearance...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUCCESS STATE CONTAINER */}
            {checkoutMethod === 'success' && (
              <div className="py-6 text-center space-y-5" id="checkout-success-view">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl border border-emerald-500/20 animate-bounce">
                  ✓
                </div>
                
                <div className="space-y-1.5">
                  <h4 className="font-display font-black text-sm text-white">Bot Activated Successfully!</h4>
                  <p className="text-[11px] text-slate-400 leading-normal max-w-xs mx-auto">
                    Your algorithm <b>{selectedBot.name}</b> has been successfully injected into the forex live feed. High-frequency automated returns are now running in the background.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[10.5px] text-emerald-400 leading-relaxed font-sans text-left space-y-1">
                  <p className="font-bold text-emerald-300">🔥 Pro AI Tip:</p>
                  <p>You can purchase up to 20 different bots simultaneously. Go back to the lobby to expand your algorithmic trading cluster for maximized automated portfolio yield!</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    setSelectedBot(null);
                  }}
                  className="w-full py-3.5 bg-brand-primary hover:bg-brand-medium text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md cursor-pointer"
                >
                  Return to AI Bot Lobby
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
