import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { 
  ArrowLeft, RotateCw, Sparkles, TrendingUp, TrendingDown, 
  X, Check, AlertCircle, ArrowUpRight, ArrowDownLeft, Clock, Activity
} from 'lucide-react';

interface TradingPageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onAddTransaction: (newTx: Transaction) => void;
  onNavigateToTab: (tab: string) => void;
}

interface AssetOption {
  symbol: string;
  name: string;
  price: number;
  changeValue: number;
  changePercent: number;
  timeScale: string[];
  history: number[];
  chartPoints: { x: number; y: number; val: number }[];
  yMin: number;
  yMax: number;
}

interface ActiveTrade {
  id: string;
  asset: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  amount: number;
  leverage: number;
  openTime: string;
}

export default function TradingPage({ user, onUpdateUser, onAddTransaction, onNavigateToTab }: TradingPageProps) {
  // Available DEX Trading Assets
  const ASSETS: AssetOption[] = [
    {
      symbol: 'SLN',
      name: 'Solana',
      price: 132.28,
      changeValue: -82.0,
      changePercent: -5.62,
      timeScale: ['3 AM', '6 AM', '9 AM', '12 AM', 'NOW'],
      yMin: 75.0,
      yMax: 195.0,
      history: [110, 85, 140, 92, 160, 150, 130, 180, 172, 132.28],
      chartPoints: []
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 64280.50,
      changeValue: +1420.0,
      changePercent: +2.26,
      timeScale: ['3 AM', '6 AM', '9 AM', '12 AM', 'NOW'],
      yMin: 61000,
      yMax: 66000,
      history: [62100, 61800, 63400, 62900, 64100, 63800, 64280.50],
      chartPoints: []
    },
    {
      symbol: 'WCN',
      name: 'Wecoin',
      price: 1764.46,
      changeValue: +124.50,
      changePercent: +7.80,
      timeScale: ['3 AM', '6 AM', '9 AM', '12 AM', 'NOW'],
      yMin: 1500,
      yMax: 1900,
      history: [1580, 1620, 1590, 1710, 1680, 1740, 1764.46],
      chartPoints: []
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 3412.10,
      changeValue: -45.20,
      changePercent: -1.31,
      timeScale: ['3 AM', '6 AM', '9 AM', '12 AM', 'NOW'],
      yMin: 3300,
      yMax: 3600,
      history: [3480, 3420, 3450, 3390, 3430, 3412.10],
      chartPoints: []
    }
  ];

  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number>(0);
  const [assetList, setAssetList] = useState<AssetOption[]>(ASSETS);
  const currentAsset = assetList[selectedAssetIndex];

  // Timeframe selector
  const [timeframe, setTimeframe] = useState<'D' | 'W' | 'M' | '6M' | 'Y' | 'All'>('D');

  // Interactive trade drawer modal state
  const [tradeModalType, setTradeModalType] = useState<'BUY' | 'SELL' | null>(null);
  const [tradeAmount, setTradeAmount] = useState<string>('50');
  const [leverage, setLeverage] = useState<number>(50);
  const [notification, setNotification] = useState<string | null>(null);

  // Active trades
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>(() => {
    return JSON.parse(localStorage.getItem(`uxtrade_dex_trades_${user.id}`) || '[]');
  });

  // Asset switcher dropdown state
  const [showAssetDropdown, setShowAssetDropdown] = useState<boolean>(false);

  // Chart hover / touch marker index
  const [activeHoverPointIndex, setActiveHoverPointIndex] = useState<number>(3);

  // Real-time chart price tick simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setAssetList(prev => {
        return prev.map((item, idx) => {
          if (idx === selectedAssetIndex) {
            const pct = (Math.random() - 0.49) * 0.003;
            const priceDiff = item.price * pct;
            const newPrice = parseFloat((item.price + priceDiff).toFixed(2));
            const newHist = [...item.history.slice(1), newPrice];

            return {
              ...item,
              price: newPrice,
              changeValue: parseFloat((item.changeValue + priceDiff).toFixed(1)),
              history: newHist
            };
          }
          return item;
        });
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedAssetIndex]);

  // Execute Order
  const handleExecuteTrade = () => {
    if (!tradeModalType) return;

    const amountNum = parseFloat(tradeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid trade amount.");
      return;
    }

    if (user.balance < amountNum) {
      alert("Insufficient wallet balance for this trade order.");
      return;
    }

    // Deduct margin stake
    const nextBalance = parseFloat((user.balance - amountNum).toFixed(2));
    const updatedUser: User = {
      ...user,
      balance: nextBalance
    };
    onUpdateUser(updatedUser);

    const newTrade: ActiveTrade = {
      id: 'trade_' + Math.random().toString(36).substr(2, 9),
      asset: currentAsset.symbol,
      type: tradeModalType,
      entryPrice: currentAsset.price,
      currentPrice: currentAsset.price,
      amount: amountNum,
      leverage: leverage,
      openTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextTrades = [newTrade, ...activeTrades];
    setActiveTrades(nextTrades);
    localStorage.setItem(`uxtrade_dex_trades_${user.id}`, JSON.stringify(nextTrades));

    setNotification(`✓ ${tradeModalType} order executed for $${amountNum.toFixed(2)} on ${currentAsset.symbol}`);
    setTradeModalType(null);
    setTimeout(() => setNotification(null), 4000);
  };

  // Close position
  const handleCloseTrade = (tradeId: string) => {
    const trade = activeTrades.find(t => t.id === tradeId);
    if (!trade) return;

    const livePrice = (assetList.find(a => a.symbol === trade.asset) || currentAsset).price;
    const priceDiff = livePrice - trade.entryPrice;
    const rawRatio = priceDiff / trade.entryPrice;
    let leveragedRatio = rawRatio * trade.leverage;

    if (trade.type === 'SELL') {
      leveragedRatio = -leveragedRatio;
    }

    const netProfit = parseFloat((trade.amount * leveragedRatio).toFixed(2));
    const totalReturn = Math.max(0, parseFloat((trade.amount + netProfit).toFixed(2)));

    // Return funds
    const updatedUser: User = {
      ...user,
      balance: parseFloat((user.balance + totalReturn).toFixed(2))
    };
    onUpdateUser(updatedUser);

    // Record transaction log
    const tx: Transaction = {
      id: 'tx_dex_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: netProfit >= 0 ? 'deposit' : 'withdrawal',
      amount: Math.abs(netProfit),
      description: `DEX ${trade.type} Closed: ${trade.asset} @ $${livePrice} (PnL: ${netProfit >= 0 ? '+' : ''}$${netProfit})`,
      date: new Date().toISOString(),
      status: 'completed',
      reference: 'UXDEX-' + Math.floor(100000 + Math.random() * 900000)
    };
    onAddTransaction(tx);

    const nextTrades = activeTrades.filter(t => t.id !== tradeId);
    setActiveTrades(nextTrades);
    localStorage.setItem(`uxtrade_dex_trades_${user.id}`, JSON.stringify(nextTrades));

    setNotification(`Closed position on ${trade.asset}. ${netProfit >= 0 ? 'Profit' : 'Loss'}: ${netProfit >= 0 ? '+' : ''}$${netProfit}`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Compute Bezier SVG Path matching screenshot smooth mountain-valley curve
  const renderSmoothChart = () => {
    const width = 360;
    const height = 260;
    const padY = 35;

    // Check if there is an active position for the currently selected asset
    const activeTradeForAsset = activeTrades.find(t => t.asset === currentAsset.symbol);

    let livePnL = 0;
    let livePnlPct = 0;
    let isInProfit = true;
    let lineStrokeColor = "#E2E8F0"; // Default smooth white
    let lineGlowColor = "#FFFFFF";

    if (activeTradeForAsset) {
      const priceDiff = currentAsset.price - activeTradeForAsset.entryPrice;
      const rawRatio = priceDiff / activeTradeForAsset.entryPrice;
      const leveragedRatio = activeTradeForAsset.type === 'BUY' 
        ? rawRatio * activeTradeForAsset.leverage 
        : -rawRatio * activeTradeForAsset.leverage;

      livePnL = parseFloat((activeTradeForAsset.amount * leveragedRatio).toFixed(2));
      livePnlPct = parseFloat((leveragedRatio * 100).toFixed(2));
      isInProfit = livePnL >= 0;

      // Color active trade curve green for profit, red for loss
      lineStrokeColor = isInProfit ? "#10B981" : "#F43F5E";
      lineGlowColor = isInProfit ? "#10B981" : "#F43F5E";
    }

    // Dynamic trajectory calculation based on history and current price
    // Base Y values for points
    let p1Y = 190;
    let p2Y = 120;
    let p3Y = 175;
    let p4Y = 95;
    let p5Y = 110;
    let p6Y = 70;
    let p7Y = 55;

    // Calculate end Y position dynamically based on live price movement vs baseline
    // Lower Y = Higher on chart canvas
    let endY = 105;
    if (activeTradeForAsset) {
      const priceDelta = currentAsset.price - activeTradeForAsset.entryPrice;
      // Scale delta to SVG pixels (max +/- 80px shift)
      const yOffset = Math.max(-75, Math.min(75, priceDelta * 12));
      endY = 105 - yOffset; // Upward if price increase, downward if decrease
    }

    const normalizedPoints = [
      { x: 15, y: p1Y, val: -42.0 },
      { x: 65, y: p2Y, val: -18.5 },
      { x: 105, y: p3Y, val: -82.0 },
      { x: 165, y: p4Y, val: -12.0 },
      { x: 215, y: p5Y, val: -28.0 },
      { x: 255, y: p6Y, val: -5.0 },
      { x: 295, y: p7Y, val: +15.0 },
      { x: 345, y: endY, val: currentAsset.changeValue }
    ];

    // Compute entry price Y position if trade exists
    let entryY = 105;
    if (activeTradeForAsset) {
      // Entry line fixed relative to mid
      entryY = 105;
    }

    // Build smooth cubic bezier SVG path
    let d = `M ${normalizedPoints[0].x} ${normalizedPoints[0].y}`;
    for (let i = 0; i < normalizedPoints.length - 1; i++) {
      const curr = normalizedPoints[i];
      const next = normalizedPoints[i + 1];
      const cp1X = curr.x + (next.x - curr.x) / 2;
      const cp1Y = curr.y;
      const cp2X = curr.x + (next.x - curr.x) / 2;
      const cp2Y = next.y;
      d += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${next.x} ${next.y}`;
    }

    // Closed path for subtle dark area gradient
    const areaD = `${d} L ${normalizedPoints[normalizedPoints.length - 1].x} ${height} L ${normalizedPoints[0].x} ${height} Z`;

    const hoverPt = normalizedPoints[activeHoverPointIndex] || normalizedPoints[7];

    return (
      <div className="relative w-full select-none my-2">
        {/* Active Position Banner Overlay if Trade is Open */}
        {activeTradeForAsset && (
          <div className="mb-2 p-3 bg-[#121826] border border-slate-700/80 rounded-2xl flex items-center justify-between shadow-xl animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isInProfit ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${activeTradeForAsset.type === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {activeTradeForAsset.type} {activeTradeForAsset.leverage}x
                  </span>
                  <span className="text-xs font-bold text-white font-mono">
                    ${activeTradeForAsset.entryPrice}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Current: ${currentAsset.price}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`text-xs font-black font-mono block ${isInProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isInProfit ? '+' : ''}${livePnL.toFixed(2)}
                </span>
                <span className={`text-[10px] font-bold font-mono block ${isInProfit ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>
                  {isInProfit ? '+' : ''}{livePnlPct}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCloseTrade(activeTradeForAsset.id)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="relative w-full h-[280px]">
          {/* Background dark grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.04]">
            <div className="border-b border-white w-full" />
            <div className="border-b border-white w-full" />
            <div className="border-b border-white w-full" />
            <div className="border-b border-white w-full" />
          </div>

          {/* Faint Y-Axis labels on right side */}
          <div className="absolute right-2 top-28 space-y-12 text-[10px] font-mono text-slate-600 pointer-events-none text-right">
            <div>-${(currentAsset.price * 0.05).toFixed(1)}</div>
            <div>+${(currentAsset.price * 0.05).toFixed(1)}</div>
          </div>

          <svg 
            className="w-full h-full overflow-visible" 
            viewBox={`0 0 ${width} ${height}`} 
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartFillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineGlowColor} stopOpacity={activeTradeForAsset ? "0.22" : "0.12"} />
                <stop offset="60%" stopColor={lineGlowColor} stopOpacity="0.03" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
              </linearGradient>

              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Area Fill */}
            <path d={areaD} fill="url(#chartFillGradient)" />

            {/* Entry Price Horizontal Reference Line if Trade is active */}
            {activeTradeForAsset && (
              <g id="entry-price-line-group">
                <line
                  x1="0"
                  y1={entryY}
                  x2={width}
                  y2={entryY}
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeOpacity="0.8"
                />
                <text
                  x="8"
                  y={entryY - 4}
                  fill="#38BDF8"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  ENTRY ${activeTradeForAsset.entryPrice}
                </text>
              </g>
            )}

            {/* Dynamic Market Line (Turns Green for Profit, Red for Loss) */}
            <path 
              d={d} 
              fill="none" 
              stroke={lineStrokeColor} 
              strokeWidth="3.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              filter="url(#glowEffect)"
            />

            {/* Interactive Dotted vertical line down to x-axis */}
            <line
              x1={hoverPt.x}
              y1={hoverPt.y}
              x2={hoverPt.x}
              y2={height}
              stroke={lineStrokeColor}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeOpacity="0.7"
            />

            {/* Active Marker Dot */}
            <circle
              cx={hoverPt.x}
              cy={hoverPt.y}
              r="5"
              fill="#FFFFFF"
              stroke={lineStrokeColor}
              strokeWidth="3"
            />

            {/* Interactive click zones for graph points */}
            {normalizedPoints.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r="16"
                fill="transparent"
                className="cursor-pointer"
                onClick={() => setActiveHoverPointIndex(idx)}
              />
            ))}
          </svg>

          {/* Floating Pill Tag Badge matching live state */}
          <div 
            className={`absolute transform -translate-x-1/2 -translate-y-full mb-2 text-white text-[10.5px] font-black font-mono px-3 py-1 rounded-full shadow-lg pointer-events-none transition-all flex items-center gap-1 ${
              activeTradeForAsset
                ? (isInProfit ? 'bg-emerald-600 shadow-emerald-600/40' : 'bg-rose-600 shadow-rose-600/40')
                : 'bg-[#2563EB] shadow-blue-600/40'
            }`}
            style={{
              left: `${(hoverPt.x / width) * 100}%`,
              top: `${(hoverPt.y / height) * 100}%`
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>
              {activeTradeForAsset 
                ? `${isInProfit ? '+' : ''}$${livePnL.toFixed(2)} (${isInProfit ? '+' : ''}${livePnlPct}%)`
                : (hoverPt.val > 0 ? `+${hoverPt.val.toFixed(1)}` : hoverPt.val.toFixed(1))
              }
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white p-4 pb-28 font-sans space-y-4 max-w-md mx-auto" id="trading-dex-page">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-[#161B26] border border-slate-700 text-slate-100 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Bar: Back Button Left | Title "Chart" Center | Refresh Icon Right */}
      <div className="flex items-center justify-between pt-2" id="trading-top-header">
        <button
          type="button"
          onClick={() => onNavigateToTab('home')}
          className="w-10 h-10 rounded-2xl bg-[#121622] border border-slate-800/90 text-slate-300 flex items-center justify-center hover:bg-[#1C2336] hover:text-white transition-all cursor-pointer shadow-md"
          title="Back to Dashboard"
          id="btn-back-chart"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <h1 className="text-base font-bold text-white tracking-wide" id="chart-title">
          Chart
        </h1>

        <button
          type="button"
          onClick={() => {
            // Trigger refresh pulse
            setAssetList([...assetList]);
            setNotification("Chart feed re-synced live.");
            setTimeout(() => setNotification(null), 2500);
          }}
          className="w-10 h-10 rounded-2xl bg-[#121622] border border-slate-800/90 text-slate-300 flex items-center justify-center hover:bg-[#1C2336] hover:text-white transition-all cursor-pointer shadow-md"
          title="Sync Chart Data"
          id="btn-refresh-chart"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Asset Header Info Bar: Ticker Symbol Left | Price Large White | Change Metrics Right */}
      <div className="pt-2 px-1 relative" id="asset-info-header">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setShowAssetDropdown(!showAssetDropdown)}
              className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <span>{currentAsset.symbol}</span>
              <span className="text-[9px] text-slate-500">▼</span>
            </button>

            <h2 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight" id="asset-live-price">
              ${currentAsset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          <div className="text-right space-y-0.5 font-mono">
            <span className={`text-sm font-bold block ${currentAsset.changeValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentAsset.changeValue >= 0 ? '+' : ''}{currentAsset.changeValue.toFixed(1)}
            </span>
            <span className={`text-xs font-bold block ${currentAsset.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentAsset.changePercent >= 0 ? '+' : ''}{currentAsset.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Asset Selector Dropdown Drawer */}
        {showAssetDropdown && (
          <div className="absolute top-14 left-0 inset-x-0 z-30 bg-[#121622] border border-slate-800 rounded-2xl p-2 shadow-2xl space-y-1">
            <span className="text-[9px] font-extrabold uppercase text-slate-500 px-3 py-1 block">Select DEX Market Asset</span>
            {assetList.map((asset, idx) => (
              <button
                key={asset.symbol}
                type="button"
                onClick={() => {
                  setSelectedAssetIndex(idx);
                  setShowAssetDropdown(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer ${
                  idx === selectedAssetIndex ? 'bg-[#1C2436] text-white font-bold' : 'text-slate-300 hover:bg-[#181E2E]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white">{asset.symbol}</span>
                  <span className="text-[10px] text-slate-400">{asset.name}</span>
                </div>
                <span className="font-mono text-slate-200">${asset.price.toLocaleString()}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time Scale Bar matching screenshot: 3 AM | 6 AM | 9 AM | 12 AM | NOW */}
      <div className="flex items-center justify-between px-2 pt-2 text-[10px] font-mono text-slate-500 font-semibold" id="time-scale-labels">
        {currentAsset.timeScale.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>

      {/* Main Bezier Smooth SVG Chart Canvas */}
      {renderSmoothChart()}

      {/* Timeframe Selector Pills Bar matching screenshot: D | W | M | 6M | Y | All */}
      <div className="bg-[#121622] p-1 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-lg" id="timeframe-pill-selector">
        {(['D', 'W', 'M', '6M', 'Y', 'All'] as const).map((tf) => {
          const isActive = timeframe === tf;
          return (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white text-slate-950 shadow-md font-extrabold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          );
        })}
      </div>

      {/* Bottom Action Buttons: Buy (Vibrant Blue Pill) & Sell (Dark Grey Pill) */}
      <div className="grid grid-cols-2 gap-3 pt-2" id="trading-action-buttons">
        <button
          type="button"
          onClick={() => {
            setTradeAmount('50');
            setTradeModalType('BUY');
          }}
          className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center"
          id="btn-buy-dex"
        >
          Buy
        </button>

        <button
          type="button"
          onClick={() => {
            setTradeAmount('50');
            setTradeModalType('SELL');
          }}
          className="w-full py-3.5 bg-[#1E2536] hover:bg-[#283248] border border-slate-700/60 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center"
          id="btn-sell-dex"
        >
          Sell
        </button>
      </div>

      {/* Active Positions List Drawer Panel */}
      <div className="bg-[#121622] border border-slate-800/80 rounded-2xl p-4 space-y-3 mt-4" id="active-dex-positions-panel">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Open DEX Orders</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-bold bg-[#1C2336] px-2 py-0.5 rounded-full">
            {activeTrades.length}
          </span>
        </div>

        {activeTrades.length === 0 ? (
          <div className="text-center py-5 text-slate-500 text-xs font-medium">
            No active positions. Click Buy or Sell above to place an order.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeTrades.map((trade) => {
              const livePrice = (assetList.find(a => a.symbol === trade.asset) || currentAsset).price;
              const priceDiff = livePrice - trade.entryPrice;
              const rawRatio = priceDiff / trade.entryPrice;
              let leveragedRatio = rawRatio * trade.leverage;
              if (trade.type === 'SELL') leveragedRatio = -leveragedRatio;
              const pnl = parseFloat((trade.amount * leveragedRatio).toFixed(2));

              return (
                <div key={trade.id} className="p-3 bg-[#181F2E] border border-slate-700/50 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {trade.type}
                      </span>
                      <span className="text-xs font-bold text-white">{trade.asset}</span>
                      <span className="text-[10px] text-slate-400 font-mono">@{trade.entryPrice}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">Stake: ${trade.amount} ({trade.leverage}x)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black font-mono ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCloseTrade(trade.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
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

      {/* Trade Execution Modal Drawer */}
      {tradeModalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4" id="trade-order-drawer">
          <div className="w-full max-w-md bg-[#121622] border border-slate-800 rounded-3xl p-5 space-y-4 animate-slide-in-top shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${tradeModalType === 'BUY' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                <h3 className="text-base font-extrabold text-white">
                  Execute {tradeModalType} on {currentAsset.symbol}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTradeModalType(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Order Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-8 pr-3 py-3 bg-[#181F2E] border border-slate-700/80 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick preset buttons */}
              <div className="flex gap-2">
                {['20', '50', '100', '250', '500'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTradeAmount(preset)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      tradeAmount === preset 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-[#181F2E] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Leverage Multiplier
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => setLeverage(lev)}
                      className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                        leverage === lev 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'bg-[#181F2E] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#181F2E] rounded-xl border border-slate-800 text-xs text-slate-300 flex justify-between font-mono">
                <span>Available Balance:</span>
                <span className="font-bold text-white">${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExecuteTrade}
              className={`w-full py-3.5 text-white font-black text-sm rounded-2xl shadow-lg transition-all cursor-pointer active:scale-95 ${
                tradeModalType === 'BUY' 
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-blue-600/30' 
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
              }`}
            >
              Confirm {tradeModalType} Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
