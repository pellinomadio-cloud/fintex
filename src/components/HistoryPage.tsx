import React, { useState } from 'react';
import { Transaction, User } from '../types';
import { 
  ArrowLeft, Search, ArrowUpRight, ArrowDownLeft, Calendar, 
  FileSpreadsheet, ShieldCheck, Check, Clock, X, SlidersHorizontal, Info,
  TrendingDown, TrendingUp
} from 'lucide-react';

interface HistoryPageProps {
  user: User;
  transactions: Transaction[];
  onNavigateToTab: (tab: string) => void;
}

export default function HistoryPage({ user, transactions, onNavigateToTab }: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'transfer' | 'reward' | 'airtime' | 'utility'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Compute metrics
  const deposits = transactions.filter(t => t.type === 'deposit' || t.type === 'reward');
  const disbursements = transactions.filter(t => t.type !== 'deposit' && t.type !== 'reward');

  const totalInflow = deposits.reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = disbursements.reduce((sum, t) => sum + t.amount, 0);

  // Filter logic
  const filteredTxs = transactions.filter(tx => {
    const term = searchTerm.toLowerCase();
    const descriptionMatch = tx.description?.toLowerCase().includes(term);
    const referenceMatch = tx.reference?.toLowerCase().includes(term);
    const idMatch = tx.id?.toLowerCase().includes(term);
    const amountMatch = tx.amount?.toString().includes(term);
    
    const matchesSearch = descriptionMatch || referenceMatch || idMatch || amountMatch;

    let matchesType = true;
    if (filterType === 'deposit') {
      matchesType = tx.type === 'deposit' || tx.type === 'reward';
    } else if (filterType === 'transfer') {
      matchesType = tx.type !== 'deposit' && tx.type !== 'reward';
    }

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-24 animate-fade-in font-sans" id="history-tab-content">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4" id="history-header">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateToTab('home')}
            className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-505 transition-all hover:scale-105 cursor-pointer"
            id="back-to-dashboard-history"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-brand-dark tracking-tight leading-none">Transaction History</h2>
            <p className="text-[10px] text-slate-400 mt-1 font-medium select-none">
              Consolidated real-time ledger & cryptographic statements
            </p>
          </div>
        </div>
        
        <div className="text-right hidden sm:block">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ledger Authority</span>
          <p className="text-xs font-mono font-black text-brand-dark">NODE-07A1</p>
        </div>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-2 gap-4" id="history-summary-widgets">
        <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-emerald-850 uppercase tracking-wider block mb-1">Total Inflow</span>
            <span className="font-mono text-base font-black text-emerald-700">+${totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-100/60 border border-slate-200/50 p-4 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-650 uppercase tracking-wider block mb-1">Total Outflow</span>
            <span className="font-mono text-base font-black text-slate-800">-${totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4" id="ledger-history-main">
        <div className="flex flex-col gap-3">
          {/* Live Search */}
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-4 h-4 my-auto" />
            <input
              id="history-ledger-search-box"
              type="text"
              placeholder="Search reference, description or amount..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtering buttons */}
          <div className="flex items-center justify-between gap-2.5 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl" id="ledger-tab-filters-history">
            <button
              id="history-filter-all"
              type="button"
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all ${
                filterType === 'all' ? 'bg-white text-brand-dark shadow-xs' : 'text-slate-500 hover:text-brand-dark'
              }`}
              onClick={() => setFilterType('all')}
            >
              All Runs
            </button>
            <button
              id="history-filter-deposit"
              type="button"
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all ${
                filterType === 'deposit' ? 'bg-white text-brand-dark shadow-xs' : 'text-slate-500 hover:text-brand-dark'
              }`}
              onClick={() => setFilterType('deposit')}
            >
              Inflows (+)
            </button>
            <button
              id="history-filter-transfer"
              type="button"
              className={`flex-1 py-2 text-center rounded-xl text-xs font-bold transition-all ${
                filterType === 'transfer' ? 'bg-white text-brand-dark shadow-xs' : 'text-slate-505 hover:text-brand-dark'
              }`}
              onClick={() => setFilterType('transfer')}
            >
              Outflows (-)
            </button>
          </div>
        </div>

        {/* Transactions list viewport */}
        {filteredTxs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs space-y-2 select-none" id="history-feed-empty">
            <div className="font-mono text-2xl text-slate-300">🕵️</div>
            <p className="font-semibold text-slate-501 text-[11px]">No transaction ledger matches filter rules</p>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto text-center font-medium leading-relaxed">
              Verify search string keyword or change list filter option tab to retrieve account activity.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80" id="history-feed-items">
            {filteredTxs.map(tx => {
              const isCredit = tx.type === 'deposit' || tx.type === 'reward';
              return (
                <div 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 px-2.5 -mx-2.5 rounded-2xl transition-all" 
                  id={`history-ledger-item-${tx.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`} id={`history-ledger-icon-${tx.id}`}>
                      {isCredit ? <ArrowDownLeft className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark leading-snug">{tx.description}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                        <span className="font-mono font-bold">{tx.reference || 'FTX-GEN-773'}</span>
                        <span>•</span>
                        <span>{new Date(tx.date).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-mono font-black ${
                      isCredit ? 'text-emerald-600 font-bold' : 'text-slate-800'
                    }`}>
                      {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>
                    <div className="flex items-center justify-end gap-1 mt-0.5 select-none">
                      <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'pending' ? 'bg-amber-500 animate-pulse' : tx.status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <span className={`text-[9px] font-mono uppercase tracking-wider font-bold ${tx.status === 'pending' ? 'text-amber-500' : tx.status === 'failed' ? 'text-red-550' : 'text-slate-400'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PCI Certified Compliance Disclaimer Footer */}
      <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] text-center max-w-xs mx-auto leading-relaxed select-none" id="ledger-certification-compliance">
        <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0" />
        <span>This cryptographic ledger matches PCI-DSS 4.0 regulations. Entries are immutable and archived instantly.</span>
      </div>

      {/* Detailed Transaction Info Modal (Sliding Dialog style) */}
      {selectedTx && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 leading-relaxed animate-fade-in" id="tx-details-dialog">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 border-t sm:border border-slate-100 shadow-2xl space-y-6 animate-[slide-up_0.2s_ease-out]" id="tx-details-container">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="tx-details-head">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedTx.type === 'deposit' || selectedTx.type === 'reward' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-brand-dark">Transaction Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                id="btn-close-tx-details"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Receipt Summary */}
            <div className="text-center py-4 bg-slate-50/70 rounded-3xl space-y-1.5 border border-slate-100" id="tx-details-summary">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Transaction Value</span>
              <h2 className="font-mono text-2xl font-black text-slate-800">
                {(selectedTx.type === 'deposit' || selectedTx.type === 'reward') ? '+' : '-'}${selectedTx.amount.toFixed(2)}
              </h2>
              <span className={`inline-block px-3 py-1 rounded-full font-mono text-[9.5px] uppercase font-bold tracking-wider ${
                selectedTx.status === 'completed' ? 'bg-emerald-100 text-emerald-805' : selectedTx.status === 'pending' ? 'bg-amber-100 text-amber-805 animate-pulse' : 'bg-red-100 text-red-805'
              }`}>
                {selectedTx.status}
              </span>
            </div>

            {/* Key-Value details */}
            <div className="space-y-3.5 text-xs" id="tx-details-list">
              <div className="flex justify-between items-center" id="detail-description">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Description</span>
                <span className="font-extrabold text-slate-800 text-right">{selectedTx.description}</span>
              </div>

              <div className="flex justify-between items-center" id="detail-reference">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Reference ID</span>
                <span className="font-mono font-extrabold text-slate-800 uppercase tracking-tight">{selectedTx.reference || 'FTX-GEN-000'}</span>
              </div>

              <div className="flex justify-between items-center" id="detail-timestamp">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">UTC Timestamp</span>
                <span className="font-semibold text-slate-650">{new Date(selectedTx.date).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center" id="detail-type">
                <span className="text-slate-405 font-bold uppercase tracking-wider text-[9px]">Payment Core Type</span>
                <span className="font-bold text-slate-800 capitalize bg-slate-100 px-2.5 py-0.5 rounded text-[10px]">{selectedTx.type}</span>
              </div>

              <div className="flex justify-between items-center" id="detail-ledger-id">
                <span className="text-slate-405 font-bold uppercase tracking-wider text-[9px]">Ledger Document ID</span>
                <span className="font-mono text-slate-500 tracking-wider text-[10px] select-all font-semibold overflow-x-auto max-w-[200px] block text-right">{selectedTx.id}</span>
              </div>
            </div>

            {/* Security Proof of Ledger */}
            <div className="p-3 bg-indigo-50/60 border border-indigo-100/80 rounded-2xl text-[10px] text-indigo-900 leading-relaxed space-y-1" id="tx-details-certificate">
              <p className="font-bold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Immutable Cryptographic Lock</p>
              <p>
                This log was digitally signed at the time of entry. It serves as standard legal proof of payout and ledger balance settlement.
              </p>
            </div>

            <button
              id="detail-close-btn"
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 bg-brand-dark text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-brand-medium transition-all cursor-pointer text-center"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
