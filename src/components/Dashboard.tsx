import { useState, useEffect, FormEvent } from 'react';
import { User, Transaction, SupportMessage } from '../types';
import { db, cleanForFirestore } from '../firebase';
import { doc, setDoc, onSnapshot, getDoc, collection, deleteDoc } from 'firebase/firestore';
import { 
  Eye, EyeOff, Plus, ArrowUpRight, ArrowDownLeft, Landmark, 
  Send, Phone, Database, Trophy, Landmark as LoanIcon, 
  Users, HelpCircle, ChevronRight, Bell, Smartphone, 
  Tv, Sparkles, AlertCircle, ShieldAlert, CheckCircle2,
  X, BadgeAlert, ArrowRightCircle, ArrowLeft, Coins, Copy, Check, Gift,
  ShieldCheck, Megaphone
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onUpdateTransaction?: (txId: string, updatedFields: Partial<Transaction>) => void;
  onNavigateToTab: (tab: string) => void;
  triggerUpgrade?: boolean;
  onClearTriggerUpgrade?: () => void;
}

export default function Dashboard({ 
  user, 
  onUpdateUser, 
  transactions, 
  onAddTransaction,
  onUpdateTransaction,
  onNavigateToTab,
  triggerUpgrade,
  onClearTriggerUpgrade
}: DashboardProps) {
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<'none' | 'add_money' | 'transfer' | 'airtime' | 'loan' | 'success'>('none');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [inputRecipient, setInputRecipient] = useState<string>('');
  const [inputBank, setInputBank] = useState<string>('National Bank');
  const [inputPhone, setInputPhone] = useState<string>('');
  const [inputCarrier, setInputCarrier] = useState<string>('Airtel Network');
  const [notification, setNotification] = useState<string | null>(null);
  const [primaryCurrency, setPrimaryCurrency] = useState<'USD' | 'NGN'>('USD');
  
  // Multi-step deposit states
  const [addMoneyStep, setAddMoneyStep] = useState<'select' | 'usdt_input' | 'usdt_address' | 'naira_transfer' | 'card_deposit' | 'processing_usdt'>('select');
  const [usdtAmount, setUsdtAmount] = useState<string>('');
  const [usdtNetwork, setUsdtNetwork] = useState<string>('TRON (TRC20) - Fast & Low Fee');
  const [nairaAmount, setNairaAmount] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeProcessingTxId, setActiveProcessingTxId] = useState<string>('');
  const [usdtProgress, setUsdtProgress] = useState<number>(0);
  const [usdtLogs, setUsdtLogs] = useState<string>('Initializing secure ledger connection...');
  
  // Transfer / Cashout states
  const [transferStep, setTransferStep] = useState<'select' | 'naira_form' | 'usdt_form' | 'processing_transfer'>('select');
  const [cashoutBank, setCashoutBank] = useState<string>('OPay');
  const [cashoutAccountNumber, setCashoutAccountNumber] = useState<string>('');
  const [cashoutAccountName, setCashoutAccountName] = useState<string>('');
  const [cashoutAmount, setCashoutAmount] = useState<string>('');
  const [cashoutUSDTAmount, setCashoutUSDTAmount] = useState<string>('');
  const [cashoutUSDTAddress, setCashoutUSDTAddress] = useState<string>('');
  const [cashoutUSDTNetwork, setCashoutUSDTNetwork] = useState<string>('TRON (TRC20)');
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [transferLogs, setTransferLogs] = useState<string>('Initializing cross-border clearance node...');

  // Paid tier upgrade states
  const [upgradeStep, setUpgradeStep] = useState<'benefits' | 'payment_select' | 'usdt_deposit' | 'naira_deposit' | 'card_deposit' | 'processing' | 'success' | 'success_pending'>('benefits');
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<2 | 3 | null>(null);
  const [upgradeProgress, setUpgradeProgress] = useState<number>(0);
  const [upgradeLogs, setUpgradeLogs] = useState<string>('Initializing secure validation gateway...');
  const [upgradeCardNumber, setUpgradeCardNumber] = useState<string>('');
  const [upgradeCardExpiry, setUpgradeCardExpiry] = useState<string>('');
  const [upgradeCardCvv, setUpgradeCardCvv] = useState<string>('');
  const [upgradeUsdtOption, setUpgradeUsdtOption] = useState<string>('TRON (TRC20)');
  const [uploadedProofBase64, setUploadedProofBase64] = useState<string>('');
  const [forceShowUpgrade, setForceShowUpgrade] = useState<boolean>(false);

  useEffect(() => {
    if (triggerUpgrade) {
      setActiveModal('transfer');
      setUpgradeStep('benefits');
      setSelectedUpgradeTier(null);
      setForceShowUpgrade(true);
      if (onClearTriggerUpgrade) {
        onClearTriggerUpgrade();
      }
    }
  }, [triggerUpgrade]);

  // Loaded Gateway addresses dynamically customized by Admin
  const [gatewayUsdt, setGatewayUsdt] = useState<string>(() => localStorage.getItem('fintex_gateway_usdt') || 'TRibF41CvFeNptGPbuC5gRCfGcrqcc9XPm');
  const [gatewayNairaBank, setGatewayNairaBank] = useState<string>(() => localStorage.getItem('fintex_gateway_naira_bank') || 'Opay Digital Bank');
  const [gatewayNairaAcc, setGatewayNairaAcc] = useState<string>(() => localStorage.getItem('fintex_gateway_naira_acc') || '8062940251');
  const [gatewayNairaName, setGatewayNairaName] = useState<string>(() => localStorage.getItem('fintex_gateway_naira_name') || 'Fintex International Hub');

  // Customer support global premium notifications state
  const [activeSupportMessages, setActiveSupportMessages] = useState<SupportMessage[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);

  // Subscribe to priority support messages
  useEffect(() => {
    if (!user.id) return;
    const unsub = onSnapshot(collection(db, 'supportMessages'), (snap) => {
      const msgs: SupportMessage[] = [];
      snap.forEach((docSnap) => {
        const item = docSnap.data();
        
        // Convert Firebase Timestamps or fallback strings safely
        const createdAt = item.createdAt?.seconds 
          ? new Date(item.createdAt.seconds * 1000).toISOString() 
          : (item.createdAt || new Date().toISOString());
        const expiresAt = item.expiresAt?.seconds 
          ? new Date(item.expiresAt.seconds * 1000).toISOString() 
          : (item.expiresAt || new Date(Date.now() + 3600000).toISOString());

        msgs.push({
          id: docSnap.id,
          message: item.message,
          createdAt,
          expiresAt,
          authorName: item.authorName || 'Customer Support'
        });
      });

      // Local filter & auto-pruning from database if expired
      const validMsgs = msgs.filter((msg) => {
        const isExpired = new Date() > new Date(msg.expiresAt);
        if (isExpired) {
          // Fire-and-forget server side deletion call
          deleteDoc(doc(db, 'supportMessages', msg.id))
            .catch((e) => console.log('Auto pruned expired broadcast:', e.message));
          return false;
        }
        return true;
      });

      // Priority Announcements sorted by time (descending)
      validMsgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActiveSupportMessages(validMsgs);
    }, (err) => {
      console.warn("Failed to subscribe to supportMessages on Dashboard:", err);
    });

    return () => unsub();
  }, [user.id]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'gateways'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.usdtAddr) {
          setGatewayUsdt(data.usdtAddr);
          localStorage.setItem('fintex_gateway_usdt', data.usdtAddr);
        }
        if (data.nairaBank) {
          setGatewayNairaBank(data.nairaBank);
          localStorage.setItem('fintex_gateway_naira_bank', data.nairaBank);
        }
        if (data.nairaAccountNum) {
          setGatewayNairaAcc(data.nairaAccountNum);
          localStorage.setItem('fintex_gateway_naira_acc', data.nairaAccountNum);
        }
        if (data.nairaAccountNm) {
          setGatewayNairaName(data.nairaAccountNm);
          localStorage.setItem('fintex_gateway_naira_name', data.nairaAccountNm);
        }
      }
    }, (err) => {
      console.warn("Failed to subscribe to payment gateways configs in Firestore settings/gateways:", err);
    });
    return () => unsub();
  }, []);

  // Claim Daily Rewards states
  const [claimStatus, setClaimStatus] = useState<'idle' | 'processing' | 'success' | 'already_claimed'>('idle');
  const [claimProgress, setClaimProgress] = useState<number>(0);
  const [claimTimeLeft, setClaimTimeLeft] = useState<string>('');

  const renderProofUploadArea = () => {
    return (
      <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200/65 rounded-2xl">
        <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center justify-between">
          <span>Upload Receipt Screenshot <span className="text-red-500">*</span></span>
          {uploadedProofBase64 && <span className="text-[10px] text-emerald-600 font-bold">✓ Loaded</span>}
        </label>
        <div 
          className="border-2 border-dashed border-slate-200 hover:border-brand-primary rounded-xl p-3 text-center cursor-pointer hover:bg-sky-50/15 transition-all text-xs"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const r = new FileReader();
              r.onloadend = () => {
                if (typeof r.result === 'string') setUploadedProofBase64(r.result);
              };
              r.readAsDataURL(file);
            }
          }}
          onClick={() => {
            const el = document.createElement('input');
            el.type = 'file';
            el.accept = 'image/*';
            el.onchange = (e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                const r = new FileReader();
                r.onloadend = () => {
                  if (typeof r.result === 'string') setUploadedProofBase64(r.result);
                };
                r.readAsDataURL(file);
              }
            };
            el.click();
          }}
        >
          {uploadedProofBase64 ? (
            <div className="space-y-1.5">
              <img src={uploadedProofBase64} className="h-14 mx-auto rounded border border-slate-300 object-cover" alt="Proof screenshot" referrerPolicy="no-referrer" />
              <p className="text-[9px] text-slate-400 font-semibold selection:bg-brand-primary/10">Proof loaded. Click to replace screenshot.</p>
            </div>
          ) : (
            <div className="space-y-1.5 py-1 text-slate-500">
              <div className="text-sm">📁</div>
              <p className="font-bold text-slate-700 text-[10.5px]">Drag & Drop payment receipt, or Click to select</p>
              <p className="text-[9.5px] text-slate-400">Supports JPG, JPEG, PNG formats</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const checkClaimEligibility = () => {
    const lastClaim = localStorage.getItem(`fintex_last_claim_${user.id}`);
    if (!lastClaim) {
      return { eligible: true, timeLeft: '' };
    }
    const lastClaimTime = new Date(lastClaim).getTime();
    const now = new Date().getTime();
    const diff = now - lastClaimTime;
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (diff < oneDay) {
      const remaining = oneDay - diff;
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      return {
        eligible: false,
        timeLeft: `${hours}h ${minutes}m ${seconds}s`
      };
    }
    return { eligible: true, timeLeft: '' };
  };

  const handleClaimReward = () => {
    const eligibility = checkClaimEligibility();
    if (!eligibility.eligible) {
      setClaimStatus('already_claimed');
      setClaimTimeLeft(eligibility.timeLeft);
      return;
    }
    
    setClaimStatus('processing');
    setClaimProgress(0);
    
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 25;
      setClaimProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        
        const rewardAmount = (user.tier && user.tier >= 2) ? 200.00 : 5.00;
        const updatedUser = {
          ...user,
          balance: (user.balance || 0) + rewardAmount
        };
        onUpdateUser(updatedUser);
        
        const tx: Transaction = {
          id: 'tx_reward_' + Math.random().toString(36).substring(2, 11),
          userId: user.id,
          type: 'reward',
          amount: rewardAmount,
          description: 'Daily Premium Reward Claim',
          date: new Date().toISOString(),
          status: 'completed',
          reference: 'FTX-RWD-' + Math.floor(100000 + Math.random() * 900000)
        };
        onAddTransaction(tx);
        
        localStorage.setItem(`fintex_last_claim_${user.id}`, new Date().toISOString());
        setClaimStatus('success');
      }
    }, 500);
  };

  useEffect(() => {
    let interval: any;
    if (activeModal === 'claim_reward') {
      const eligibility = checkClaimEligibility();
      if (!eligibility.eligible) {
        setClaimStatus('already_claimed');
        setClaimTimeLeft(eligibility.timeLeft);
        
        interval = setInterval(() => {
          const updated = checkClaimEligibility();
          if (updated.eligible) {
            setClaimStatus('idle');
            setClaimTimeLeft('');
            clearInterval(interval);
          } else {
            setClaimTimeLeft(updated.timeLeft);
          }
        }, 1000);
      } else {
        setClaimStatus('idle');
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeModal, user.id]);
  
  // Custom states for interactive features
  const [selectedSecurityAnswer, setSelectedSecurityAnswer] = useState<string | null>(null);
  const [promoMessageIndex, setPromoMessageIndex] = useState<number>(0);

  const promoCarousels = [
    { title: "Grab Up to 15% APY 🔥", desc: "Unlock Safebox Vault rewards by saving as little as $5.00 daily.", btnText: "Open Safebox" },
    { title: "Complete Daily Tasks 🏆", desc: "Gain point streaks and earn real cashback coupons in Rewards.", btnText: "Check Rewards" },
    { title: "Double Referral Bonus 👥", desc: "Get $5.00 cash for every friend that sets up an account with your code.", btnText: "Copy Link" }
  ];

  useEffect(() => {
    if (addMoneyStep !== 'processing_usdt') {
      setUsdtProgress(0);
      return;
    }
    setUsdtProgress(0);
    setUsdtLogs('Initializing secure gateway connection...');

    const interval = setInterval(() => {
      setUsdtProgress((prev) => {
        const next = prev + 12.5; // reaches 100 in 8 intervals of 1s (8 seconds total)
        if (next >= 100) {
          clearInterval(interval);
          setUsdtLogs('Settlement successful. Multi-asset wallet credited!');
          return 100;
        }
        if (next < 25) {
          setUsdtLogs('Awaiting network signature confirmations...');
        } else if (next < 50) {
          setUsdtLogs('Verifying block hash TRD8814... (1/2 validations)');
        } else if (next < 75) {
          setUsdtLogs('Confirming smart contract security execution... (2/2 validations)');
        } else {
          setUsdtLogs('Settling assets to local vault address...');
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [addMoneyStep]);

  useEffect(() => {
    if (transferStep !== 'processing_transfer') {
      setTransferProgress(0);
      return;
    }
    setTransferProgress(0);
    setTransferLogs('Establishing contact with settlement networks...');

    const interval = setInterval(() => {
      setTransferProgress((prev) => {
        const next = prev + 20; // 5 intervals of 20% reaches 100% in 5 seconds
        if (next >= 100) {
          clearInterval(interval);
          setTransferLogs('Clearance successful. Settlement completed!');
          return 100;
        }
        if (next < 25) {
          setTransferLogs('Connecting to gateway routing nodes...');
        } else if (next < 50) {
          setTransferLogs('Validating security credentials and signature hashes...');
        } else if (next < 75) {
          setTransferLogs('Securing escrow gateway allocation...');
        } else {
          setTransferLogs('Routing transfer funds to final recipient address...');
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [transferStep]);

  useEffect(() => {
    if (upgradeStep !== 'processing') {
      setUpgradeProgress(0);
      return;
    }
    setUpgradeProgress(0);
    setUpgradeLogs('Initializing secure validation gateway...');

    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += 20;
      const next = Math.min(currentProgress, 100);
      setUpgradeProgress(next);

      if (next >= 100) {
        clearInterval(interval);
        setUpgradeLogs('Upgrade clearance successful! Account database updated!');
        
        if (selectedUpgradeTier) {
          const updatedUser = {
            ...user,
            tier: selectedUpgradeTier
          };
          onUpdateUser(updatedUser);
          
          const tx: Transaction = {
            id: 'tx_upgrade_' + Math.random().toString(36).substr(2, 9),
            userId: user.id,
            type: 'deposit',
            amount: selectedUpgradeTier === 2 ? 20.00 : 60.00,
            description: `Payment for Tier ${selectedUpgradeTier} Verification Status`,
            date: new Date().toISOString(),
            status: 'completed',
            reference: 'FTX-UPG-' + Math.floor(100000 + Math.random() * 900000)
          };
          onAddTransaction(tx);
        }
        
        setUpgradeStep('success');
      } else {
        if (next < 25) {
          setUpgradeLogs('Establishing contact with payment gateway router...');
        } else if (next < 50) {
          setUpgradeLogs('Validating payment signature hashes...');
        } else if (next < 75) {
          setUpgradeLogs('Securing escrow gateway allocation and limits credentials...');
        } else {
          setUpgradeLogs('Writing updated higher level tier status into cloud nodes...');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [upgradeStep, selectedUpgradeTier]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoMessageIndex((prev) => (prev + 1) % promoCarousels.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleAddMoney = (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(inputAmount);
    if (!amt || amt <= 0) return;

    if (!uploadedProofBase64) {
      alert("Please upload proof of payment before proceeding.");
      return;
    }

    const txId = 'tx_' + Math.random().toString(36).substr(2, 9);
    
    // Create transaction (pending status)
    const tx: Transaction = {
      id: txId,
      userId: user.id,
      type: 'deposit',
      amount: amt,
      description: 'Card Deposit funding',
      date: new Date().toISOString(),
      status: 'pending',
      reference: 'FTX-DEP-' + Math.floor(100000 + Math.random() * 900000),
      proof: uploadedProofBase64
    };

    const approvalId = 'app_' + Math.random().toString(36).substr(2, 9);
    const newApproval = {
      id: approvalId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      type: 'deposit_card',
      amount: amt,
      proof: uploadedProofBase64,
      date: new Date().toISOString(),
      status: 'pending',
      txId: txId
    };

    // Save pending approval record to global space
    const approvals = JSON.parse(localStorage.getItem('fintex_pending_approvals') || '[]');
    approvals.push(newApproval);
    localStorage.setItem('fintex_pending_approvals', JSON.stringify(approvals));

    setDoc(doc(db, 'approvals', approvalId), cleanForFirestore(newApproval)).catch(err => console.error("FB approval save error", err));

    onAddTransaction(tx);
    setInputAmount('');
    setUploadedProofBase64('');
    setActiveModal('success');
    setNotification(`Proof submitted! $${amt.toFixed(2)} deposit will reflect once approved by Admin.`);
  };

  const handleConfirmUSDTDeposit = (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(usdtAmount);
    if (!amt || amt <= 0) return;

    if (!uploadedProofBase64) {
      alert("Please upload proof of payment before proceeding.");
      return;
    }

    const txId = 'tx_usdt_' + Math.random().toString(36).substr(2, 9);
    
    // Create transaction (pending status)
    const tx: Transaction = {
      id: txId,
      userId: user.id,
      type: 'deposit',
      amount: amt,
      description: `USDT Deposit (${usdtNetwork.split(' ')[0]})`,
      date: new Date().toISOString(),
      status: 'pending',
      reference: 'FTX-USDT-' + Math.floor(100000 + Math.random() * 900000),
      proof: uploadedProofBase64
    };

    const approvalId = 'app_' + Math.random().toString(36).substr(2, 9);
    const newApproval = {
      id: approvalId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      type: 'deposit_usdt',
      amount: amt,
      proof: uploadedProofBase64,
      date: new Date().toISOString(),
      status: 'pending',
      txId: txId
    };

    // Save pending approval record to global space
    const approvals = JSON.parse(localStorage.getItem('fintex_pending_approvals') || '[]');
    approvals.push(newApproval);
    localStorage.setItem('fintex_pending_approvals', JSON.stringify(approvals));

    setDoc(doc(db, 'approvals', approvalId), cleanForFirestore(newApproval)).catch(err => console.error("FB approval save error", err));

    onAddTransaction(tx);
    setUsdtAmount('');
    setUploadedProofBase64('');
    setAddMoneyStep('select');
    setActiveModal('success');
    setNotification('Proof of USDT payment submitted! Awaiting Admin verification.');
  };

  const handleConfirmNairaDeposit = (e: FormEvent) => {
    e.preventDefault();
    const ngnAmt = parseFloat(nairaAmount);
    if (!ngnAmt || ngnAmt <= 0) return;

    if (!uploadedProofBase64) {
      alert("Please upload proof of payment before proceeding.");
      return;
    }

    const usdEquivalent = parseFloat((ngnAmt / 1600).toFixed(2));
    const txId = 'tx_ngn_' + Math.random().toString(36).substr(2, 9);
    
    // Create transaction
    const tx: Transaction = {
      id: txId,
      userId: user.id,
      type: 'deposit',
      amount: usdEquivalent,
      description: `Naira Transfer Verification (₦${ngnAmt.toLocaleString()})`,
      date: new Date().toISOString(),
      status: 'pending',
      reference: 'FTX-NGN-' + Math.floor(100000 + Math.random() * 900000),
      proof: uploadedProofBase64
    };

    const approvalId = 'app_' + Math.random().toString(36).substr(2, 9);
    const newApproval = {
      id: approvalId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      type: 'deposit_naira',
      amount: usdEquivalent,
      proof: uploadedProofBase64,
      date: new Date().toISOString(),
      status: 'pending',
      txId: txId
    };

    // Save pending approval record to global space
    const approvals = JSON.parse(localStorage.getItem('fintex_pending_approvals') || '[]');
    approvals.push(newApproval);
    localStorage.setItem('fintex_pending_approvals', JSON.stringify(approvals));

    setDoc(doc(db, 'approvals', approvalId), cleanForFirestore(newApproval)).catch(err => console.error("FB approval save error", err));

    onAddTransaction(tx);
    setNairaAmount('');
    setUploadedProofBase64('');
    setAddMoneyStep('select');
    setActiveModal('success');
    setNotification(`Local transfer submitted! $${usdEquivalent.toFixed(2)} will reflect as soon as approved.`);
  };

  const handleTriggerUpgradeSubmission = () => {
    if (!selectedUpgradeTier) return;
    if (!uploadedProofBase64) {
      alert("Please upload proof of payment before proceeding.");
      return;
    }

    const upgradeAmt = selectedUpgradeTier === 2 ? 20.00 : 60.00;
    const txId = 'tx_upgp_' + Math.random().toString(36).substr(2, 9);

    // Create a transaction record (pending review)
    const tx: Transaction = {
      id: txId,
      userId: user.id,
      type: 'deposit',
      amount: upgradeAmt,
      description: `Upgrade Tier ${selectedUpgradeTier} Status Payment`,
      date: new Date().toISOString(),
      status: 'pending',
      reference: 'FTX-UPG-' + Math.floor(100000 + Math.random() * 900000),
      proof: uploadedProofBase64
    };

    const approvalId = 'app_' + Math.random().toString(36).substr(2, 9);
    const newApproval = {
      id: approvalId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      type: `upgrade_tier_${selectedUpgradeTier}`,
      amount: upgradeAmt,
      proof: uploadedProofBase64,
      date: new Date().toISOString(),
      status: 'pending',
      txId: txId
    };

    // Store in global approvals queue
    const approvals = JSON.parse(localStorage.getItem('fintex_pending_approvals') || '[]');
    approvals.push(newApproval);
    localStorage.setItem('fintex_pending_approvals', JSON.stringify(approvals));

    setDoc(doc(db, 'approvals', approvalId), cleanForFirestore(newApproval)).catch(err => console.error("FB approval save error", err));

    onAddTransaction(tx);
    setUploadedProofBase64('');
    setUpgradeStep('success_pending');
  };

  const handleCopyWalletAddress = () => {
    navigator.clipboard.writeText("TRibF41CvFeNptGPbuC5gRCfGcrqcc9XPm");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransfer = (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(inputAmount);
    if (!amt || amt <= 0) {
      alert("Please specify a valid transfer amount.");
      return;
    }
    if (amt > user.balance) {
      alert("Insufficient available balance.");
      return;
    }
    if (!inputRecipient) {
      alert("Please provide the recipient email or account name.");
      return;
    }

    const updatedUser: User = {
      ...user,
      balance: parseFloat((user.balance - amt).toFixed(2))
    };

    const tx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'transfer',
      amount: amt,
      description: `Transfer to ${inputRecipient} (${inputBank})`,
      date: new Date().toISOString(),
      status: 'completed',
      reference: 'FTX-TRF-' + Math.floor(100000 + Math.random() * 900000)
    };

    onUpdateUser(updatedUser);
    onAddTransaction(tx);
    setInputAmount('');
    setInputRecipient('');
    setActiveModal('success');
  };

  const handleAirtime = (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(inputAmount);
    if (!amt || amt <= 0) return;
    if (amt > user.balance) {
      alert("Insufficient balance to buy airtime.");
      return;
    }

    const updatedUser: User = {
      ...user,
      balance: parseFloat((user.balance - amt).toFixed(2))
    };

    const tx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'airtime',
      amount: amt,
      description: `Airtime Topup list: ${inputCarrier} [${inputPhone}]`,
      date: new Date().toISOString(),
      status: 'completed',
      reference: 'FTX-ART-' + Math.floor(100000 + Math.random() * 900000)
    };

    onUpdateUser(updatedUser);
    onAddTransaction(tx);
    setInputAmount('');
    setInputPhone('');
    setActiveModal('success');
  };

  const handleApplyLoan = (amount: number) => {
    const updatedUser: User = {
      ...user,
      balance: parseFloat((user.balance + amount).toFixed(2))
    };

    const tx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'reward',
      amount: amount,
      description: `Approved Instant Personal microloan`,
      date: new Date().toISOString(),
      status: 'completed',
      reference: 'FTX-LN-' + Math.floor(100000 + Math.random() * 900000)
    };

    onUpdateUser(updatedUser);
    onAddTransaction(tx);
    setActiveModal('success');
  };

  const currentTxs = transactions.slice(0, 4);

  if (activeModal === 'transfer') {
    const isTier1 = (user.tier || 1) < 2;
    const isShowingUpgrade = forceShowUpgrade || isTier1;

    return (
      <div className="space-y-6 pb-24 animate-fade-in font-sans" id="cashout-page-view">
        {/* Title / Back Row */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4" id="cashout-page-header">
          <button
            type="button"
            onClick={() => {
              setActiveModal('none');
              setTransferStep('select');
              setUpgradeStep('benefits');
              setSelectedUpgradeTier(null);
              setForceShowUpgrade(false);
            }}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all cursor-pointer text-slate-600 flex items-center justify-center shrink-0 w-10 h-10"
            id="cashout-back-to-dashboard-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-brand-dark tracking-tight">
              {isShowingUpgrade ? (
                user.tier === 3 ? "Premium Verified Status" : 
                user.tier === 2 ? "Upgrade Account Limits" : 
                "Account Verification Upgrade"
              ) : "Withdraw & Cash Out"}
            </h2>
            <p className="text-xs text-slate-500">
              {isShowingUpgrade ? (
                user.tier === 3 ? "Your account is active on Tier 3. Maximum privileges enabled." :
                user.tier === 2 ? "Upgrade to Tier 3 Platinum to unlock unlimited features" :
                "Unlock your transfers with an upgraded verification status"
              ) : "Secure cross-border withdrawal in local currency or crypto"}
            </p>
          </div>
        </div>

        {notification && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-brand-dark text-xs font-semibold flex items-center justify-between" id="cashout-page-toast">
            <span className="text-rose-700">{notification}</span>
            <button type="button" onClick={() => setNotification(null)} className="text-brand-primary font-bold hover:text-brand-dark">OK</button>
          </div>
        )}

        {/* Outer content container */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs max-w-lg mx-auto animate-fade-in" id="cashout-page-content-wrapper">
          
          {isShowingUpgrade ? (
            /* TIER 1 BLOCKED & UPGRADE FLOW */
            <div className="space-y-4" id="tier-upgrade-wrapper">
              
              {/* STATUS 1: BENEFITS DISPLAY */}
              {upgradeStep === 'benefits' && (
                <div className="space-y-5" id="upgrade-view-benefits">
                  <div className="text-center pb-2 border-b border-slate-50">
                    {user.tier === 3 ? (
                      <>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2.5">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="font-display font-black text-brand-dark text-base">Account Fully Verified</h3>
                        <p className="text-xs text-slate-500">Your account is currently on <strong className="text-emerald-600">Tier 3 Platinum</strong>. You have activated maximum tier limits!</p>
                      </>
                    ) : user.tier === 2 ? (
                      <>
                        <div className="w-12 h-12 bg-sky-50 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-2.5">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="font-display font-black text-brand-dark text-base">Maximize Your Limits</h3>
                        <p className="text-xs text-slate-500">Your account is on <strong className="text-brand-dark font-bold">Tier 2</strong>. Upgrade to Tier 3 Platinum status to unlock maximum limits!</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2.5">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h3 className="font-display font-black text-brand-dark text-base">Verification Upgrade Required</h3>
                        <p className="text-xs text-slate-500">Your account is currently on <strong className="text-amber-600">Tier 1</strong>. You cannot make transfers unless you upgrade.</p>
                      </>
                    )}
                  </div>

                  <div className="space-y-4" id="tier-comparison">
                    {/* TIER 2 PLAN BAR */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden text-left" id="tier-2-comparison-card">
                      <div className="flex justify-between items-start mb-2.5">
                        <div>
                          <span className="text-[10px] font-extrabold bg-brand-primary/10 text-brand-dark px-2.5 py-0.5 rounded-full uppercase">Tier 2 Verification</span>
                          <h4 className="text-sm font-bold text-brand-dark mt-1">Naira & Global Access</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block line-through">$30.00</span>
                          <span className="text-base font-black font-mono text-emerald-600">$20.00</span>
                        </div>
                      </div>
                      <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc pl-4 mb-4">
                        <li>Withdraw & Cash Out instantly to external networks</li>
                        <li>Daily transfer and cashout limit raised to <strong className="font-semibold text-slate-700">$10,000.00 USD / Day</strong></li>
                        <li>Unlocks virtual debit cards & higher level interest lockbox yields</li>
                      </ul>
                      {(user.tier || 1) >= 2 ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 bg-slate-200 text-slate-500 text-xs font-bold rounded-xl text-center block cursor-not-allowed border border-slate-300/35"
                          id="btn-select-tier-2-disabled"
                        >
                          ✓ Tier 2 Currently Active
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUpgradeTier(2);
                            setUpgradeStep('payment_select');
                          }}
                          className="w-full py-2.5 bg-brand-dark hover:bg-brand-medium text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer text-center block"
                          id="btn-select-tier-2"
                        >
                          Upgrade to Tier 2 ($20)
                        </button>
                      )}
                    </div>

                    {/* TIER 3 PLAN BAR */}
                    <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl relative overflow-hidden text-left" id="tier-3-comparison-card">
                      <div className="flex justify-between items-start mb-2.5">
                        <div>
                          <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full uppercase">Tier 3 Platinum</span>
                          <h4 className="text-sm font-bold text-indigo-950 mt-1">Unlimited Pro Remmitance</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-indigo-300 block line-through">$100.00</span>
                          <span className="text-base font-black font-mono text-indigo-600">$60.00</span>
                        </div>
                      </div>
                      <ul className="text-[11px] text-indigo-900/70 space-y-1.5 list-disc pl-4 mb-4">
                        <li>Unlimited cross-border wire payouts & transfers</li>
                        <li>Daily transfer and cashout limit raised to <strong className="font-semibold text-indigo-900">$100,000.00 USD / Day</strong></li>
                        <li>Priority premium wire settlement queues & 24/7 dedicated account manager</li>
                        <li>Zero-fees on cashout conversions and unlimited debit currency volume</li>
                      </ul>
                      {(user.tier || 1) >= 3 ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 bg-slate-200 text-slate-500 text-xs font-bold rounded-xl text-center block cursor-not-allowed border border-slate-300/35"
                          id="btn-select-tier-3-disabled"
                        >
                          ✓ Tier 3 Platinum Active
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUpgradeTier(3);
                            setUpgradeStep('payment_select');
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer text-center block"
                          id="btn-select-tier-3"
                        >
                          Upgrade to Tier 3 ($60)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STATUS 2: SAME PAYMENT METHOD OPTIONS AS ADD MONEY */}
              {upgradeStep === 'payment_select' && (
                <div className="space-y-4 text-left" id="upgrade-view-payment-select">
                  <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-brand-dark text-base">Select Payment Method</h3>
                      <p className="text-xs text-slate-500">Pay <strong className="font-bold text-brand-dark">${selectedUpgradeTier === 2 ? '20.00' : '60.00'}</strong> to activate Tier {selectedUpgradeTier} Status.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpgradeStep('benefits')}
                      className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                    >
                      Change Plan
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* USDT Method */}
                    <button
                      type="button"
                      onClick={() => setUpgradeStep('usdt_deposit')}
                      className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer group"
                      id="upgrade-pay-usdt"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold font-mono text-lg shrink-0 w-11 h-11">
                          ₮
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">USDT Stablecoin Pay</p>
                          <p className="text-[10px] text-slate-400 font-sans font-medium">TRON (TRC20) or BSC (BEP20) instant crypto networks</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>

                    {/* Naira Bank Transfer Method */}
                    <button
                      type="button"
                      onClick={() => setUpgradeStep('naira_deposit')}
                      className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer group"
                      id="upgrade-pay-naira"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 w-11 h-11">
                          ₦
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Naira Local Bank Transfer</p>
                          <p className="text-[10px] text-slate-400 font-sans font-medium">Pay ₦{(selectedUpgradeTier === 2 ? 32000 : 96000).toLocaleString()} via local instant transfer</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>
                  </div>
                </div>
              )}

              {/* STATUS 3A: USDT SCREEN */}
              {upgradeStep === 'usdt_deposit' && (
                <div className="space-y-4 text-left" id="upgrade-view-usdt-deposit">
                  <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-brand-dark text-base">Pay via USDT (Crypto)</h3>
                      <p className="text-xs text-slate-500">Send exactly <b className="font-bold text-brand-dark font-mono">${selectedUpgradeTier === 2 ? '20.00' : '60.00'} USDT</b> to the company desk.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpgradeStep('payment_select')}
                      className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                    >
                      Go Back
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Select Network Destination</label>
                      <select
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none"
                        value={upgradeUsdtOption}
                        onChange={(e) => setUpgradeUsdtOption(e.target.value)}
                      >
                        <option value="TRON (TRC20)">TRON (TRC20) - Fast & Cheap Fee</option>
                        <option value="Binance Smart Chain (BEP20)">Binance Smart Chain (BEP20)</option>
                        <option value="Ethereum (ERC20)">Ethereum (ERC20)</option>
                      </select>
                    </div>

                    <div className="p-4 bg-slate-900 text-white rounded-2xl font-mono text-center relative border border-slate-800 space-y-2 flex flex-col items-center">
                      <span className="text-[8px] bg-sky-500/10 text-sky-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">USDT DEPOSIT CODES</span>
                      <p className="text-xs break-all tracking-wider select-all font-bold text-sky-300">
                        {upgradeUsdtOption === 'Ethereum (ERC20)' 
                          ? '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' 
                          : gatewayUsdt}
                      </p>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const addr = upgradeUsdtOption === 'Ethereum (ERC20)' 
                            ? '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' 
                            : gatewayUsdt;
                          navigator.clipboard.writeText(addr);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="mt-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-[10px] rounded-lg transition-all inline-flex items-center gap-1 active:scale-95 cursor-pointer max-w-fit"
                      >
                        {copied ? '✓ Address Copied!' : '📋 Copy Address'}
                      </button>

                      <p className="text-[9px] text-slate-400">Do not send non-supported tokens. Send exactly ${selectedUpgradeTier === 2 ? '20' : '60'} USDT via {upgradeUsdtOption}.</p>
                    </div>

                    {renderProofUploadArea()}

                    <button
                      type="button"
                      onClick={handleTriggerUpgradeSubmission}
                      className="w-full py-3 bg-brand-dark hover:bg-brand-medium text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer mt-2 animate-pulse"
                      id="upgrade-confirm-usdt"
                    >
                      Confirm USDT Upgrade Receipt
                    </button>
                  </div>
                </div>
              )}

              {/* STATUS 3B: NAIRA BANK TRANSFER */}
              {upgradeStep === 'naira_deposit' && (
                <div className="space-y-4 text-left" id="upgrade-view-naira-deposit">
                  <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-brand-dark text-base">Pay via Naira Bank Transfer</h3>
                      <p className="text-xs text-slate-500">Transfer Naira to the designated bank account below.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpgradeStep('payment_select')}
                      className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                    >
                      Go Back
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">EXACT AMOUNT TO PAY</span>
                        <strong className="text-base font-black font-mono text-emerald-700">₦{(selectedUpgradeTier === 2 ? 32000 : 96000).toLocaleString()}</strong>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-bold rounded-full font-sans uppercase">Rate: ₦1,600 / $1</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Bank Destination</span>
                        <strong className="text-slate-800 font-semibold">{gatewayNairaBank}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Account Number</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                          <span>{gatewayNairaAcc}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              navigator.clipboard.writeText(gatewayNairaAcc);
                              setNotification("Account Number copied to clipboard.");
                            }} 
                            className="bg-white px-2 py-0.5 border border-slate-200 rounded text-[9px] uppercase font-bold text-brand-primary cursor-pointer active:scale-95 transition-all"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-slate-400">Account Name</span>
                        <strong className="text-slate-850 font-bold">
                          {gatewayNairaName}
                        </strong>
                      </div>
                    </div>

                    {renderProofUploadArea()}

                    <button
                      type="button"
                      onClick={handleTriggerUpgradeSubmission}
                      className="w-full py-3 bg-brand-dark hover:bg-brand-medium text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer mt-2"
                      id="upgrade-confirm-naira"
                    >
                      I Have Transferred ₦{(selectedUpgradeTier === 2 ? 32000 : 96000).toLocaleString()} (Submit Proof)
                    </button>
                  </div>
                </div>
              )}

              {/* STATUS 4: PROCESSING AND SPINNING */}
              {upgradeStep === 'processing' && (
                <div className="space-y-6 text-center py-6 animate-fade-in" id="upgrade-view-processing">
                  <div className="relative w-24 h-24 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" className="stroke-slate-100 fill-none" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-amber-500 fill-none transition-all duration-1000"
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * upgradeProgress) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-lg font-extrabold text-brand-dark">{Math.round(upgradeProgress)}%</span>
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold font-mono">Routing</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display font-black text-brand-dark text-lg">Verifying Payment Gateway</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">Please wait while the electronic terminal registers your verification upgrade.</p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-[10px] font-mono text-amber-400 text-left space-y-1 mx-auto max-w-sm">
                    <p>▸ {upgradeLogs}</p>
                  </div>
                </div>
              )}

              {/* STATUS 5: SUCCESS DISPLAY */}
              {upgradeStep === 'success' && (
                <div className="space-y-5 text-center py-6 animate-fade-in" id="upgrade-view-success">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 font-black text-3xl">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-black text-brand-dark text-lg">Account Upgraded Successfully!</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto text-center">
                      Congratulations! Your account is now elevated to <strong className="text-emerald-600">Tier {selectedUpgradeTier} Status</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 py-3 text-xs max-w-xs mx-auto text-left space-y-2 font-sans font-medium">
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-500">New Account Level</span>
                      <strong className="text-slate-850 font-bold">Tier {selectedUpgradeTier} Verified</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-500">Daily Remittance Limit</span>
                      <strong className="text-slate-850 font-bold font-mono">
                        {selectedUpgradeTier === 2 ? '$10,000.00 / day' : '$100,000.00 / day'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transfers Privilege</span>
                      <strong className="text-emerald-600 font-bold">UNLOCKED ✓</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal('none');
                      setTransferStep('select');
                      setUpgradeStep('benefits');
                      setSelectedUpgradeTier(null);
                      setForceShowUpgrade(false);
                    }}
                    className="w-full max-w-xs py-3 bg-brand-dark hover:bg-brand-medium text-white text-xs font-bold rounded-2xl transition-all shadow-md cursor-pointer inline-block"
                  >
                    Alright! Take Me Back
                  </button>
                </div>
              )}

              {/* STATUS 5B: SUCCESS PENDING AUDIT */}
              {upgradeStep === 'success_pending' && (
                <div className="space-y-5 text-center py-6 animate-fade-in" id="upgrade-view-success-pending">
                  <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2 font-black text-3xl animate-pulse">
                    ⌛
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-black text-brand-dark text-lg">Verification Submitting For Review!</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto text-center leading-normal">
                      We have received your receipt of <strong className="text-brand-dark">${selectedUpgradeTier === 2 ? '20.00' : '60.00'}</strong>. Your Tier {selectedUpgradeTier} Upgrade is now under review.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50/55 rounded-2xl border border-amber-100 py-3 text-[11px] max-w-xs mx-auto text-left space-y-2">
                    <p className="text-amber-800 font-medium leading-normal">
                      ▸ <b>Audit Status:</b> Awaiting Manual Administrator Approval.<br/>
                      ▸ <b>Time Frame:</b> Verification typically completes within 5-10 minutes.<br/>
                      ▸ Once verified, your higher limits and daily claim gift values will activate instantly.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal('none');
                      setTransferStep('select');
                      setUpgradeStep('benefits');
                      setSelectedUpgradeTier(null);
                      setForceShowUpgrade(false);
                    }}
                    className="w-full max-w-xs py-3 bg-brand-dark hover:bg-brand-medium text-white text-xs font-bold rounded-2xl transition-all shadow-md cursor-pointer inline-block"
                  >
                    Close & Monitor Account
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* NORMAL CASHOUT DISPLAY FOR VERIFIED USERS (TIER 2+) */
            <div id="normal-cashout-content">
              {/* STEP 1: SELECT CASHOUT METHOD */}
              {transferStep === 'select' && (
            <div className="space-y-4" id="page-transfer-select">
              <div className="pb-2">
                <h3 className="font-display font-bold text-brand-dark text-base">Choose Cashout Method</h3>
                <p className="text-xs text-slate-500">Select how you want to convert and withdraw your balance.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Naira Cashout Method */}
                <button
                  type="button"
                  onClick={() => setTransferStep('naira_form')}
                  className="p-4 bg-slate-50/75 hover:bg-slate-100 border border-slate-100 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer group"
                  id="choice-naira-cashout"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-amber-100 transition-colors shrink-0">
                      ₦
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Naira Bank Cashout (Auto-Settled)</p>
                      <p className="text-[10px] text-slate-400 font-medium">Direct routing to local Nigerian banks at ₦1,600 / $1</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                </button>

                {/* USDT Cashout Method */}
                <button
                  type="button"
                  onClick={() => setTransferStep('usdt_form')}
                  className="p-4 bg-slate-50/75 hover:bg-slate-100 border border-slate-100 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer group"
                  id="choice-usdt-cashout"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold font-mono text-lg group-hover:bg-emerald-100 transition-colors shrink-0">
                      ₮
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Crypto Wallet Withdrawal (USDT)</p>
                      <p className="text-[10px] text-slate-400 font-medium">Instant transaction to your TRC20, BEP20 or ERC20 address</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                </button>
              </div>

              <div className="mt-6 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Instant settlement. Available balance: ${user.balance.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* STEP 2A: NAIRA FORM */}
          {transferStep === 'naira_form' && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const amtUSD = parseFloat(cashoutAmount);
                if (!amtUSD || amtUSD <= 0) {
                  setNotification("Please enter a valid amount to cash out.");
                  return;
                }
                if (amtUSD > user.balance) {
                  setNotification(`Insufficient balance. You have $${user.balance.toFixed(2)} in your wallet.`);
                  return;
                }

                const updatedUser: User = {
                  ...user,
                  balance: parseFloat((user.balance - amtUSD).toFixed(2))
                };

                const txId = 'tx_' + Math.random().toString(36).substr(2, 9);
                const tx: Transaction = {
                  id: txId,
                  userId: user.id,
                  type: 'withdrawal',
                  amount: amtUSD,
                  description: `Naira Cashout to ${cashoutBank} (${cashoutAccountNumber})`,
                  date: new Date().toISOString(),
                  status: 'pending',
                  reference: 'FTX-WD-' + Math.floor(100000 + Math.random() * 900000)
                };

                onUpdateUser(updatedUser);
                onAddTransaction(tx);
                
                // Store names locally to prevent race conditions when cleared
                const finalAcctName = cashoutAccountName;
                const finalBank = cashoutBank;

                setTransferStep('processing_transfer');

                setTimeout(() => {
                  if (onUpdateTransaction) {
                    onUpdateTransaction(txId, { status: 'completed' });
                  }
                  setNotification(`Naira Cashout check completed! Sent USD $${amtUSD.toFixed(2)} (approx ₦${(amtUSD * 1600).toLocaleString()}) to ${finalAcctName} (${finalBank}).`);
                }, 5000);
              }}
              className="space-y-4"
              id="naira-cashout-form"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
                <button
                  type="button"
                  onClick={() => setTransferStep('select')}
                  className="text-xs text-slate-500 hover:text-brand-dark flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  id="btn-back-to-select-transfer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded font-mono font-bold">Naira Transfer Node</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-brand-dark text-base">Direct Local Bank Cash Out</h3>
                <p className="text-xs text-slate-500">Submit your local bank details to withdraw your USD instantly.</p>
              </div>

              <div className="space-y-3">
                {/* Bank Selector */}
                <div>
                  <label htmlFor="cashout-bank" className="block text-xs font-semibold text-slate-500 mb-1">
                    Select Destination Bank
                  </label>
                  <select
                    id="cashout-bank"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                    value={cashoutBank}
                    onChange={(e) => setCashoutBank(e.target.value)}
                  >
                    <option value="OPay">OPay Digital Bank</option>
                    <option value="Moniepoint">Moniepoint Microfinance</option>
                    <option value="Kuda Bank">Kuda Microfinance</option>
                    <option value="Guaranty Trust Bank (GTBank)">Guaranty Trust Bank (GTB)</option>
                    <option value="Zenith Bank">Zenith Bank Plc</option>
                    <option value="Access Bank">Access Bank Plc</option>
                    <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label htmlFor="cashout-account-number" className="block text-xs font-semibold text-slate-500 mb-1">
                    10-Digit Account Number
                  </label>
                  <input
                    id="cashout-account-number"
                    type="text"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    placeholder="e.g. 1029384756"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-mono focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800 tracking-wider"
                    value={cashoutAccountNumber}
                    onChange={(e) => setCashoutAccountNumber(e.target.value)}
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label htmlFor="cashout-account-name" className="block text-xs font-semibold text-slate-500 mb-1">
                    Account Recipient Name
                  </label>
                  <input
                    id="cashout-account-name"
                    type="text"
                    required
                    placeholder="e.g. JOHN DOE"
                    className="w-full px-4 py-3 bg-slate-55 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                    value={cashoutAccountName}
                    onChange={(e) => setCashoutAccountName(e.target.value)}
                  />
                </div>

                {/* Amount (USD) */}
                <div>
                  <label htmlFor="cashout-amount" className="block text-xs font-semibold text-slate-500 mb-1">
                    Withdrawal Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold font-mono text-slate-400 mt-0.5">$</span>
                    <input
                      id="cashout-amount"
                      type="number"
                      step="0.01"
                      min="1.00"
                      required
                      placeholder={`Max: $${user.balance.toFixed(2)}`}
                      className="w-full pl-8 pr-4 py-3 bg-slate-55 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                    />
                  </div>
                  {cashoutAmount && parseFloat(cashoutAmount) > 0 && (
                    <p className="text-[10px] text-emerald-600 font-semibold px-1 mt-1">
                      ✓ Recipient receives: ₦{(parseFloat(cashoutAmount) * 1600).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN (at ₦1,600 / $1).
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-dark text-white font-bold text-xs rounded-2xl hover:bg-brand-medium transition-all shadow-md mt-2 cursor-pointer"
                id="btn-execute-naira-cashout"
              >
                Initiate Naira Cash Out
              </button>
            </form>
          )}

          {/* STEP 2B: USDT FORM */}
          {transferStep === 'usdt_form' && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const amtUSD = parseFloat(cashoutUSDTAmount);
                if (!amtUSD || amtUSD <= 0) {
                  setNotification("Please enter a valid USDT amount to cash out.");
                  return;
                }
                if (amtUSD > user.balance) {
                  setNotification(`Insufficient balance. You have $${user.balance.toFixed(2)} in your wallet.`);
                  return;
                }

                const updatedUser: User = {
                  ...user,
                  balance: parseFloat((user.balance - amtUSD).toFixed(2))
                };

                const txId = 'tx_' + Math.random().toString(36).substr(2, 9);
                const tx: Transaction = {
                  id: txId,
                  userId: user.id,
                  type: 'withdrawal',
                  amount: amtUSD,
                  description: `USDT Withdrawal (${cashoutUSDTNetwork})`,
                  date: new Date().toISOString(),
                  status: 'pending',
                  reference: 'FTX-WD-' + Math.floor(100000 + Math.random() * 900000)
                };

                onUpdateUser(updatedUser);
                onAddTransaction(tx);
                
                // Store local variables to avoid closure issues
                const finalAddress = cashoutUSDTAddress;
                const finalNetwork = cashoutUSDTNetwork;

                setTransferStep('processing_transfer');

                setTimeout(() => {
                  if (onUpdateTransaction) {
                    onUpdateTransaction(txId, { status: 'completed' });
                  }
                  setNotification(`USDT withdrawal sequence completed! Sent ${amtUSD.toFixed(2)} USDT to address ${finalAddress.substring(0,6)}... via ${finalNetwork}.`);
                }, 5000);
              }}
              className="space-y-4"
              id="usdt-cashout-form"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
                <button
                  type="button"
                  onClick={() => setTransferStep('select')}
                  className="text-xs text-slate-500 hover:text-brand-dark flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  id="btn-back-to-select-usdt-transfer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded font-mono font-bold">Stablecoin Rail</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-brand-dark text-base">Direct USDT Crypto Withdraw</h3>
                <p className="text-xs text-slate-500">Cashout your stable assets straight to your dynamic wallet destination.</p>
              </div>

              <div className="space-y-3">
                {/* Amount (USDT) */}
                <div>
                  <label htmlFor="cashout-usdt-amount" className="block text-xs font-semibold text-slate-500 mb-1">
                    Amount to Cash Out (USDT)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold font-mono text-slate-400 mt-0.5">₮</span>
                    <input
                      id="cashout-usdt-amount"
                      type="number"
                      step="0.01"
                      min="1.00"
                      required
                      placeholder={`Max: $${user.balance.toFixed(2)}`}
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                      value={cashoutUSDTAmount}
                      onChange={(e) => setCashoutUSDTAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* USDT Network */}
                <div>
                  <label htmlFor="cashout-usdt-network" className="block text-xs font-semibold text-slate-500 mb-1">
                    Selected Crypto Blockchain
                  </label>
                  <select
                    id="cashout-usdt-network"
                    className="w-full px-4 py-3 bg-slate-55 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                    value={cashoutUSDTNetwork}
                    onChange={(e) => setCashoutUSDTNetwork(e.target.value)}
                  >
                    <option value="TRON (TRC20)">TRON (TRC20)</option>
                    <option value="BNB Smart Chain (BEP20)">BSC (BEP20)</option>
                    <option value="Ethereum (ERC20)">Ethereum (ERC20)</option>
                  </select>
                </div>

                {/* Destination Wallet Address */}
                <div>
                  <label htmlFor="cashout-usdt-address" className="block text-xs font-semibold text-slate-550 mb-1">
                    Destination Wallet Address
                  </label>
                  <input
                    id="cashout-usdt-address"
                    type="text"
                    required
                    placeholder="e.g. TYr9TszA86v..."
                    className="w-full px-4 py-3 bg-slate-55 border border-slate-100 rounded-2xl text-sm font-mono focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800 tracking-wider"
                    value={cashoutUSDTAddress}
                    onChange={(e) => setCashoutUSDTAddress(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-dark text-white font-bold text-xs rounded-2xl hover:bg-brand-medium transition-all shadow-md mt-2 cursor-pointer"
                id="btn-execute-usdt-cashout"
              >
                Withdraw USDT
              </button>
            </form>
          )}

          {/* STEP 3: PROCESSING TRANSFER SCREEN */}
          {transferStep === 'processing_transfer' && (
            <div className="space-y-6 text-center py-6 animate-fade-in" id="transfer-processing-view">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-100 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-amber-500 fill-none transition-all duration-1000"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * transferProgress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-lg font-extrabold text-brand-dark">{Math.round(transferProgress)}%</span>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold font-mono">Routing</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-brand-dark text-lg">
                  {transferProgress < 100 ? "Processing Transfer" : "Transfer Complete!"}
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                  {transferProgress < 100 
                    ? `Please wait while we route your cashout funds to your external ledger destination.`
                    : `Your transfer has been successfully settled and completed!`
                  }
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-[10px] font-mono text-amber-400 text-left space-y-1 mx-auto max-w-sm shadow-inner relative overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[8px] text-slate-400 ml-auto font-bold uppercase">Cashout Terminal</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-slate-500 shrink-0 select-none">▸</span>
                  <p className="break-all">{transferLogs}</p>
                </div>
                {transferProgress < 100 && (
                  <div className="flex items-start gap-1.5 animate-pulse text-yellow-300">
                    <span className="text-slate-500 shrink-0 select-none">▸</span>
                    <p className="text-[9px]">Awaiting inter-network settlement response...</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                {transferProgress < 100 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal('none');
                      setTransferStep('select');
                    }}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    id="back-to-home-while-processing-wd"
                  >
                    Go Back to Home (Runs in Background)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal('none');
                      setTransferStep('select');
                      setCashoutAccountNumber('');
                      setCashoutAccountName('');
                      setCashoutAmount('');
                      setCashoutUSDTAddress('');
                      setCashoutUSDTAmount('');
                    }}
                    className="w-full max-w-xs py-3.5 bg-brand-dark hover:bg-brand-medium text-white text-xs font-bold rounded-2xl transition-all shadow-md cursor-pointer"
                    id="finish-processing-ok-btn-wd"
                  >
                    Return to Dashboard
                  </button>
                )}
              </div>
            </div>
          )}
          </div>
          )}
        </div>
      </div>
    );
  }

  if (activeModal === 'add_money') {
    return (
      <div className="space-y-6 pb-24 animate-fade-in font-sans" id="add-money-page-view">
        {/* Title / Back Row */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4" id="add-money-page-header">
          <button
            type="button"
            onClick={() => {
              setActiveModal('none');
              setAddMoneyStep('select');
            }}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all cursor-pointer text-slate-600 flex items-center justify-center"
            id="add-money-back-to-dashboard-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-brand-dark tracking-tight">Fund Your Wallet</h2>
            <p className="text-xs text-slate-500">Secure payment gateway & instant posting</p>
          </div>
        </div>

        {notification && (
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-brand-dark text-xs font-medium flex items-center justify-between" id="add-money-page-toast">
            <span>{notification}</span>
            <button type="button" onClick={() => setNotification(null)} className="text-brand-primary font-bold hover:text-brand-dark">OK</button>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs max-w-lg mx-auto" id="add-money-page-content-wrapper">
          {/* SELECT */}
          {addMoneyStep === 'select' && (
            <div className="space-y-4" id="page-deposit-select">
              <div className="pb-2">
                <h3 className="font-display font-bold text-brand-dark text-base">Select Deposit Channel</h3>
                <p className="text-xs text-slate-500">All channels are processed securely with instant routing.</p>
              </div>

              <div className="space-y-3">
                {/* USDT Method */}
                <button
                  type="button"
                  onClick={() => setAddMoneyStep('usdt_input')}
                  className="w-full p-4 bg-slate-50/75 hover:bg-slate-100 border border-slate-100 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer group"
                  id="page-deposit-method-usdt"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold font-mono text-lg group-hover:bg-emerald-100 transition-colors">
                      ₮
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">USDT Cryptographic Deposit</p>
                      <p className="text-[10px] text-slate-400 font-medium">Safe smart-contract based allocation (TRC20, BEP20)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                </button>

                {/* Naira Transfer Method */}
                <button
                  type="button"
                  onClick={() => setAddMoneyStep('naira_transfer')}
                  className="w-full p-4 bg-slate-50/75 hover:bg-slate-100 border border-slate-100 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer group"
                  id="page-deposit-method-naira"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-amber-100 transition-colors">
                      ₦
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Naira Instant Bank Transfer</p>
                      <p className="text-[10px] text-slate-400 font-medium font-sans">Auto-credited local virtual bank account (₦1,600 / $1)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                </button>

                {/* Legacy Card Method */}
                <button
                  type="button"
                  onClick={() => setAddMoneyStep('card_deposit')}
                  className="w-full p-4 bg-slate-50/75 hover:bg-slate-100 border border-slate-100 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer group"
                  id="page-deposit-method-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-sky-50 text-brand-primary rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Linked Debit Card Payment</p>
                      <p className="text-[10px] text-slate-400 font-medium">Funds straight from your external Visa / Mastercard</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* USDT INPUT STATE */}
          {addMoneyStep === 'usdt_input' && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setAddMoneyStep('usdt_address');
              }}
              className="space-y-4"
              id="page-deposit-usdt-input"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
                <button
                  type="button"
                  onClick={() => setAddMoneyStep('select')}
                  className="text-xs text-slate-500 hover:text-brand-dark flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  id="page-btn-back-to-select-usdt"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-[10px] text-slate-400 font-mono">Step 1 of 2</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-brand-dark text-base">USDT Payment details</h3>
                <p className="text-xs text-slate-500">Provide funding sum to generate unique address.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="page-usdt-amount" className="block text-xs font-semibold text-slate-500 mb-1">
                    Amount to Fund (USDT)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold font-mono text-slate-400 mt-0.5">₮</span>
                    <input 
                      id="page-usdt-amount"
                      type="number"
                      step="0.01"
                      min="5.00"
                      required
                      placeholder="50.00"
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                      value={usdtAmount}
                      onChange={(e) => setUsdtAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Minimum deposit amount is 5 USDT.</p>
                </div>

                <div>
                  <label htmlFor="page-usdt-network" className="block text-xs font-semibold text-slate-505 mb-1">
                    Crypto Network Selector
                  </label>
                  <select
                    id="page-usdt-network"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                    value={usdtNetwork}
                    onChange={(e) => setUsdtNetwork(e.target.value)}
                  >
                    <option value="TRON (TRC20) - Fast & Low Fee">TRON (TRC20)</option>
                    <option value="BNB Smart Chain (BEP20) - Ultra-Fast">BSC (BEP20)</option>
                    <option value="Ethereum (ERC20) - High Gas">Ethereum (ERC20)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-brand-dark text-white font-bold text-xs rounded-2xl hover:bg-brand-medium transition-all shadow-md mt-2 cursor-pointer"
                id="page-btn-generate-usdt"
              >
                Generate Wallet Address
              </button>
            </form>
          )}

          {/* USDT ADDRESS STATE */}
          {addMoneyStep === 'usdt_address' && (
            <div className="space-y-4" id="page-deposit-usdt-address">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
                <button
                  type="button"
                  onClick={() => setAddMoneyStep('usdt_input')}
                  className="text-xs text-slate-505 hover:text-brand-dark flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  id="page-btn-back-to-usdt-input"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded font-mono font-bold">Secure Port</span>
              </div>

              <div className="text-center">
                <h3 className="font-display font-bold text-brand-dark text-base">Send USDT Payment</h3>
                <p className="text-xs text-slate-500">Send USDT tokens to the address generated below.</p>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-center" id="page-usdt-payment-details">
                <p className="text-[10px] text-sky-205 uppercase tracking-widest font-bold">Required Deposit Amount</p>
                <h4 className="font-mono text-2xl font-bold tracking-tight">{parseFloat(usdtAmount || '0').toFixed(2)} USDT</h4>
                <p className="text-xs text-slate-300">Selected network: <strong className="text-emerald-400">{usdtNetwork.split(' ')[0]}</strong></p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Deposit Wallet Address</label>
                <div className="flex items-center gap-2.5 p-3 bg-slate-55 rounded-2xl border border-slate-100" id="page-usdt-address-box">
                  <span className="flex-1 font-mono text-[11px] text-brand-dark break-all font-bold select-all leading-relaxed animate-fade-in">
                    {gatewayUsdt}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(gatewayUsdt);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-505 hover:text-brand-dark hover:shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0 w-9 h-9"
                    title="Copy Address"
                    id="page-btn-copy-address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600 font-bold" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {renderProofUploadArea()}

              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-[10.5px] text-amber-850 leading-relaxed">
                <p className="font-bold text-amber-900 mb-0.5 flex items-center gap-1">⚠️ Crucial Warning</p>
                <p>Ensure you send exactly <strong className="font-semibold">USDT</strong> on the <strong className="font-semibold">{usdtNetwork.split(' ')[0]}</strong> network to this wallet address. Transfer of non-supported coins will result in zero credit.</p>
              </div>

              <button 
                type="button" 
                onClick={handleConfirmUSDTDeposit}
                className="w-full py-3.5 bg-brand-dark hover:bg-brand-medium text-white font-bold text-xs rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                id="page-btn-confirm-usdt-payment"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                I have made the payment
              </button>
            </div>
          )}

          {/* NAIRA TRANSFER STATE */}
          {addMoneyStep === 'naira_transfer' && (
            <form 
              onSubmit={handleConfirmNairaDeposit}
              className="space-y-4"
              id="page-deposit-naira-transfer"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
                <button
                  type="button"
                  onClick={() => setAddMoneyStep('select')}
                  className="text-xs text-slate-505 hover:text-brand-dark flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  id="page-btn-back-to-select-naira"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-[10px] text-slate-400 font-mono">Naira Virtual Terminal</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-brand-dark text-base">Naira Local Bank Routing</h3>
                <p className="text-xs text-slate-500 font-sans">Submit payments via your local banking apps instantly.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5" id="page-naira-virtual-account">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Bank Name</span>
                  <span className="font-bold text-slate-800">{gatewayNairaBank}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Account Number</span>
                  <div className="flex items-center gap-1.5 font-sans">
                    <span className="font-mono font-bold text-brand-dark text-sm">{gatewayNairaAcc}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(gatewayNairaAcc);
                        setNotification("Virtual account number copied to clipboard.");
                      }}
                      className="p-1.5 hover:bg-slate-200/50 rounded transition-colors text-slate-505 hover:text-slate-850 cursor-pointer"
                      id="page-btn-copy-account-num"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-xs">
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Account Name</span>
                  <span className="font-bold text-slate-800">
                    {gatewayNairaName}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-xs">
                  <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Settlement Rate</span>
                  <span className="font-mono font-bold text-brand-primary">₦1,600 = $1.00 USD</span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="page-naira-amount" className="block text-xs font-semibold text-slate-505">
                  Transferred Amount (₦ NGN)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-505 mt-0.5">₦</span>
                  <input 
                    id="page-naira-amount"
                    type="number"
                    required
                    step="100"
                    min="1000"
                    placeholder="e.g. 16,000"
                    className="w-full pl-8 pr-4 py-3 bg-slate-55 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                    value={nairaAmount}
                    onChange={(e) => setNairaAmount(e.target.value)}
                  />
                </div>
                {nairaAmount && parseFloat(nairaAmount) > 0 && (
                  <p className="text-[10px] text-emerald-600 font-semibold px-1">
                    ✓ You will receive approx. ${(parseFloat(nairaAmount) / 1600).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD in your wallet balance.
                  </p>
                )}
              </div>

              {renderProofUploadArea()}

              <button 
                type="submit" 
                className="w-full py-3.5 bg-brand-dark hover:bg-brand-medium text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer mt-2"
                id="page-btn-confirm-naira-transfer"
              >
                Confirm Deposit Credit
              </button>
            </form>
          )}

          {/* LEGACY CARD DEPOSIT STATE */}
          {addMoneyStep === 'card_deposit' && (
            <form onSubmit={handleAddMoney} className="space-y-4" id="page-deposit-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
                <button
                  type="button"
                  onClick={() => setAddMoneyStep('select')}
                  className="text-xs text-slate-505 hover:text-brand-dark flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  id="page-btn-back-to-select-card"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-[10px] text-slate-400 font-mono">Linked Card</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-brand-dark text-base">Debit Card Funding</h3>
                <p className="text-xs text-slate-505 font-sans">Instant top up using your pre-authorized card assets.</p>
              </div>

              <div>
                <label htmlFor="page-card-amount" className="block text-xs font-semibold text-slate-550 mb-1">
                  Funding Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-brand-dark mt-0.5">$</span>
                  <input 
                    id="page-card-amount"
                    type="number"
                    step="0.01"
                    min="1.00"
                    required
                    placeholder="50.00"
                    className="w-full pl-7 pr-4 py-3 bg-slate-55 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10.5px] text-slate-505 space-y-1">
                <span className="font-bold text-slate-600 block">Simulated Funding Node</span>
                <p>Visa Debit ending in •• 4022</p>
                <p className="text-[9.5px] text-emerald-500 font-bold">✔ Secured by Verified-by-Visa</p>
              </div>

              {renderProofUploadArea()}

              <button 
                type="submit" 
                className="w-full py-3.5 bg-brand-dark text-white font-bold text-xs rounded-2xl hover:bg-brand-medium transition-all shadow-md mt-2 cursor-pointer"
                id="page-btn-submit-card-deposit"
              >
                Complete Payment Settlement
              </button>
            </form>
          )}

          {/* USDT PROCESSING STATE */}
          {addMoneyStep === 'processing_usdt' && (
            <div className="space-y-6 text-center py-6" id="usdt-deposit-processing-view">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-100 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-emerald-500 fill-none transition-all duration-1000"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * usdtProgress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-lg font-extrabold text-brand-dark">{Math.round(usdtProgress)}%</span>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold font-mono">Status</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-brand-dark text-lg">
                  {usdtProgress < 100 ? "Processing Deposit" : "Deposit Completed"}
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                  {usdtProgress < 100 
                    ? `Please wait while our smart-contract settles your ${parseFloat(usdtAmount || '0').toFixed(2)} USDT transfer.`
                    : `Your ${parseFloat(usdtAmount || '0').toFixed(2)} USDT deposit has been successfully settled and credited!`
                  }
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-[10px] font-mono text-emerald-400 text-left space-y-1 mx-auto max-w-sm shadow-inner relative overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[8px] text-slate-400 ml-auto font-bold uppercase">USDT Node Console</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-slate-500 shrink-0 select-none">▸</span>
                  <p className="break-all">{usdtLogs}</p>
                </div>
                {usdtProgress < 100 && (
                  <div className="flex items-start gap-1.5 animate-pulse text-indigo-300">
                    <span className="text-slate-500 shrink-0 select-none">▸</span>
                    <p className="text-[9px]">Awaiting blockchain confirmation ledger state...</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                {usdtProgress < 100 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal('none');
                      setAddMoneyStep('select');
                    }}
                    className="px-6 py-2.5 bg-slate-105 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    id="back-to-home-while-processing"
                  >
                    Go Back to Home (Runs in Background)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal('none');
                      setAddMoneyStep('select');
                    }}
                    className="w-full max-w-xs py-3.5 bg-brand-dark hover:bg-brand-medium text-white text-xs font-bold rounded-2xl transition-all shadow-md cursor-pointer"
                    id="finish-processing-ok-btn"
                  >
                    Return to Dashboard
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24" id="dashboard-tab-content">
      {/* Header Profile Info Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm" id="user-header-profile-bar">
        <div className="flex items-center gap-3" id="profile-meta-left">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-brand-primary flex items-center justify-center font-bold text-brand-dark" id="avatar-circle">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div id="welcome-text-labels">
            <span className="text-xs text-slate-500 block leading-none">Good day</span>
            <span className="font-bold tracking-tight text-brand-dark text-sm" id="dashboard-user-name">
              Hi, {user.name.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2" id="profile-meta-shortcuts">
          <button 
            type="button"
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-sky-50 flex items-center justify-center text-brand-dark border border-slate-100 relative transition-all"
            id="notif-bell-btn"
            onClick={() => setNotification("Welcome to UX-trade! Zero hidden fees.")}
          >
            <Bell className="w-5 h-5 text-brand-dark" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-ping-subtle" />
          </button>
          <button 
            type="button"
            onClick={() => {
              if ((user.tier || 1) < 2) {
                setNotification("You are on Tier 1 status. Navigate to the 'Profile' tab to upgrade to Tier 2 and unlock daily limits of $10,000 / day!");
              } else {
                setNotification(`You are on the premium Tier ${user.tier || 2} status with complete limits verified.`);
              }
            }}
            className="bg-sky-50 hover:bg-sky-100 text-brand-medium text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-sky-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            id="user-tier-indicator-badge"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
            Tier {user.tier || 1} User
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 flex items-center justify-between text-xs font-medium" id="system-notif-bar">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-primary shrink-0" />
            <span>{notification}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-indigo-400 hover:text-indigo-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Priority Support Broadcasts Alert */}
      {activeSupportMessages
        .filter((msg) => !dismissedMessages.includes(msg.id))
        .map((msg) => {
          const diffMs = new Date(msg.expiresAt).getTime() - Date.now();
          const remMin = Math.max(0, Math.round(diffMs / 60000));
          return (
            <div 
              key={msg.id} 
              className="p-3.5 bg-gradient-to-r from-rose-50/95 to-amber-50/95 border border-rose-100 rounded-3xl text-slate-850 flex items-start gap-2.5 shadow-xs relative overflow-hidden" 
              id={`support-broadcast-${msg.id}`}
            >
              <div className="absolute right-0 top-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Megaphone className="w-3.5 h-3.5 text-white animate-bounce-slow" />
              </div>
              <div className="flex-1 space-y-0.5 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black uppercase tracking-wider text-[8px] text-rose-605 bg-rose-100/80 px-2 py-0.5 rounded-full">Support Broadcast</span>
                  <span className="text-[8px] font-bold text-slate-450 bg-slate-205/60 px-1.5 py-0.5 rounded">
                    Expires in {remMin}m
                  </span>
                </div>
                <p className="font-bold text-slate-800 leading-normal text-[11px] pr-2 whitespace-pre-wrap">{msg.message}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setDismissedMessages(prev => [...prev, msg.id])} 
                className="text-slate-400 hover:text-rose-600 p-1 rounded-xl hover:bg-white/60 transition-all cursor-pointer shrink-0"
                id={`dismiss-support-${msg.id}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

      {/* Hero Card - Balance Display Block (White, Light Blue, Dark Blue) */}
      <div 
        className="relative bg-gradient-to-br from-brand-dark via-brand-medium to-brand-primary text-white rounded-3xl p-6 shadow-xl shadow-brand-dark/20 overflow-hidden" 
        id="dashboard-available-balance-module"
      >
        {/* Background art patterns for premium aesthetic */}
        <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full bg-white/5 border border-white/10 pointer-events-none" />
        <div className="absolute right-12 -top-12 w-32 h-32 rounded-full bg-white/5 border border-white/10 pointer-events-none" />

        <div className="flex items-center justify-between mb-2.5" id="balance-title-row">
          <div className="flex items-center gap-1.5" id="balance-label-trigger">
            <Landmark className="w-4 h-4 text-brand-light" />
            <span className="text-xs text-sky-100 font-medium tracking-wide">Available Balance</span>
            <button 
              type="button" 
              className="text-sky-100 hover:text-white transition-colors" 
              onClick={() => setShowBalance(!showBalance)}
              id="toggle-visibility-btn"
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <button 
            type="button"
            onClick={() => onNavigateToTab('history')}
            className="text-xs text-sky-100 hover:text-white flex items-center gap-1 font-medium bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/10 transition-all"
            id="tx-history-nav-btn"
          >
            Transaction History <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="balance-number-display-wrapper">
          <div>
            <span className="font-mono text-3xl sm:text-4xl font-bold flex items-baseline gap-1.5 text-white" id="main-balance-text">
              {showBalance ? (primaryCurrency === 'USD' ? `$${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₦${(user.balance * 1600).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : '••••••'}
            </span>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-sky-100/85">
              <span>
                {showBalance ? (primaryCurrency === 'USD' ? `₦${(user.balance * 1600).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} equivalent` : `$${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} equivalent`) : '••••••'}
              </span>
              <span className="text-sky-300/40">•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Safebox: {showBalance ? (primaryCurrency === 'USD' ? `$${user.savingsBalance.toFixed(2)}` : `₦${(user.savingsBalance * 1600).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : '••••••'}
              </span>
            </div>
          </div>

          {/* Premium Currency Selector */}
          <div className="inline-flex self-start sm:self-center bg-white/10 p-0.5 rounded-xl border border-white/10 backdrop-blur-xs shrink-0" id="currency-display-toggle-bar">
            <button
              type="button"
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                primaryCurrency === 'USD' 
                  ? 'bg-white text-brand-dark shadow-xs' 
                  : 'text-sky-100 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setPrimaryCurrency('USD')}
              id="currency-switch-usd"
            >
              $ USD
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                primaryCurrency === 'NGN' 
                  ? 'bg-white text-brand-dark shadow-xs' 
                  : 'text-sky-100 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setPrimaryCurrency('NGN')}
              id="currency-switch-ngn"
            >
              ₦ NGN
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3" id="balance-core-actions">
          <button 
            type="button"
            onClick={() => {
              setInputAmount('');
              setUsdtAmount('');
              setNairaAmount('');
              setAddMoneyStep('select');
              setActiveModal('add_money');
            }}
            className="w-full py-3.5 bg-white text-brand-dark font-bold text-xs rounded-2xl hover:bg-sky-100 hover:text-brand-medium active:scale-98 transition-all inline-flex items-center justify-center gap-2 shadow-sm"
            id="btn-add-money-modal"
          >
            <Plus className="w-4 h-4 text-brand-primary" />
            Add Money
          </button>
          <button 
            type="button"
            onClick={() => {
              setInputAmount('');
              setActiveModal('transfer');
            }}
            className="w-full py-3.5 bg-brand-light/20 hover:bg-brand-light/30 border border-white/20 font-bold text-xs rounded-2xl active:scale-98 transition-all inline-flex items-center justify-center gap-2"
            id="btn-send-money-modal"
          >
            <Send className="w-4 h-4 text-brand-light" />
            Send Transfer
          </button>
        </div>
      </div>

      {/* Quick Action Category Options - OPay style transfer circles */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm" id="dashboard-transfer-destinations">
        <div className="grid grid-cols-3 gap-2" id="quick-transfer-grid">
          <button 
            type="button"
            onClick={() => onNavigateToTab('trade')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50/50 hover:bg-sky-50 border border-transparent hover:border-sky-100 transition-all text-center"
            id="action-opay-mail"
          >
            <div className="w-11 h-11 bg-white text-brand-primary rounded-xl flex items-center justify-center shadow-sm mb-2">
              <Sparkles className="w-5 h-5 text-brand-primary" />
            </div>
            <span className="text-xs font-bold text-brand-dark leading-none">UX-trade Trade</span>
            <span className="text-[8px] text-slate-400 mt-1 leading-none">Trade to Earn</span>
          </button>
          <button 
            type="button"
            onClick={() => { 
              setActiveModal('transfer'); 
              setUpgradeStep('benefits');
              setSelectedUpgradeTier(null);
              setForceShowUpgrade(true);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/50 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all text-center"
            id="action-upgrade-tier"
          >
            <div className="w-11 h-11 bg-white text-amber-500 rounded-xl flex items-center justify-center shadow-sm mb-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-bold text-brand-dark leading-none">Upgrade Tier</span>
            <span className="text-[8px] text-slate-400 mt-1 leading-none">Tier 2 & 3</span>
          </button>
          <button 
            type="button"
            onClick={() => {
              setClaimStatus('idle');
              setActiveModal('claim_reward');
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50/50 hover:bg-sky-50 border border-transparent hover:border-sky-100 transition-all text-center"
            id="action-claim-reward"
          >
            <div className="w-11 h-11 bg-white text-amber-500 rounded-xl flex items-center justify-center shadow-sm mb-2">
              <Gift className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-bold text-brand-dark leading-none">Claim Gift</span>
            <span className="text-[8px] text-slate-400 mt-1 leading-none">Daily $5.00</span>
          </button>
        </div>
      </div>

      {/* Services Grid (Telegram Support & Refer and Earn) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm" id="services-grid-module">
        <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3.5 flex items-center justify-between">
          <span>Explore Utilities & Services</span>
          <span className="text-[10px] text-brand-primary bg-sky-50 px-2 py-0.5 rounded-full font-bold">Quick Access</span>
        </h3>
        <div className="grid grid-cols-2 gap-4" id="grid-list-services">
          <a 
            href="https://t.me/uxtrade"
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-sky-50/55 hover:bg-sky-50 border border-transparent hover:border-sky-100 transition-all text-left group"
            id="service-btn-support"
          >
            <div className="w-11 h-11 bg-white text-sky-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Send className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Telegram Support</span>
              <span className="text-[10px] text-slate-400">@uxtrade • Chat online</span>
            </div>
          </a>

          <button 
            type="button" 
            onClick={() => onNavigateToTab('rewards')}
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-amber-50/45 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all text-left group"
            id="service-btn-refer"
          >
            <div className="w-11 h-11 bg-white text-amber-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Refer & Earn</span>
              <span className="text-[10px] text-slate-400">Invite friends • Earn $10</span>
            </div>
          </button>
        </div>
      </div>

      {/* Special Carousel / Dynamic Notification Cards */}
      <div 
        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between" 
        id="dashboard-promo-cards"
      >
        <div className="flex-1 pr-6" id="promo-slide-info">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded-full mb-1">
            <Sparkles className="w-3 h-3 text-brand-primary" />
            Special Bonus For You
          </span>
          <h4 className="text-sm font-bold text-brand-dark transition-all duration-300">
            {promoCarousels[promoMessageIndex].title}
          </h4>
          <p className="text-xs text-slate-500 mt-1 transition-all duration-300">
            {promoCarousels[promoMessageIndex].desc}
          </p>
        </div>
        <button 
          type="button"
          onClick={() => {
            if (promoMessageIndex === 0) onNavigateToTab('rewards');
            if (promoMessageIndex === 1) onNavigateToTab('rewards');
            if (promoMessageIndex === 2) onNavigateToTab('rewards');
          }}
          className="px-4 py-2.5 bg-brand-primary hover:bg-brand-medium text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-sky-400/10 shrink-0 select-none"
          id="promo-action-btn"
        >
          {promoCarousels[promoMessageIndex].btnText}
        </button>
      </div>

      {/* Security Test Card Section */}
      <div className="bg-sky-50 border border-sky-100 rounded-3xl p-5" id="security-quiz-section">
        <label className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-brand-primary" />
          <span className="text-xs font-bold text-brand-dark uppercase tracking-wider">Security Awareness</span>
        </label>
        <h4 className="text-xs font-semibold text-brand-dark mb-2 leading-snug">
          Question: What should I immediately do if my phone gets stolen?
        </h4>
        <div className="space-y-2 mt-3" id="security-quiz-options">
          <button 
            type="button" 
            onClick={() => setSelectedSecurityAnswer('A')}
            className={`w-full text-left p-3 rounded-2xl text-xs transition-all border ${
              selectedSecurityAnswer === 'A' 
                ? 'bg-brand-dark border-brand-dark text-white' 
                : 'bg-white border-slate-100 hover:border-sky-300 text-slate-700'
            }`}
          >
            <strong className="font-bold mr-1">Option A:</strong> Block my account instanly, lock generated virtual cards, and immediately reach support to prevent unauthorized actions.
          </button>
          <button 
            type="button" 
            onClick={() => setSelectedSecurityAnswer('B')}
            className={`w-full text-left p-3 rounded-2xl text-xs transition-all border ${
              selectedSecurityAnswer === 'B' 
                ? 'bg-brand-dark border-brand-dark text-white' 
                : 'bg-white border-slate-100 hover:border-sky-300 text-slate-700'
            }`}
          >
            <strong className="font-bold mr-1">Option B:</strong> Wait for cell carrier updates and buy another device to check.
          </button>
        </div>
        
        {selectedSecurityAnswer && (
          <div className="mt-4 p-3 rounded-xl bg-white/80 border border-sky-100 text-xs font-medium text-slate-600 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <div>
              {selectedSecurityAnswer === 'A' ? (
                <span><strong className="text-brand-dark font-bold">Excellent choice!</strong> You are 100% correct. Security starts by reporting issues instantly. Always lock virtual cards from the Cards tab if suspicious.</span>
              ) : (
                <span><strong className="text-rose-500 font-bold">Safe Tip:</strong> Option A is much safer. Instant action saves balances! Use UX-trade locks to keep funds perfectly insulated on the go.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Feed Mini list */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm" id="dashboard-mini-feed">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
            Recent Activities
          </h3>
          <button 
            type="button"
            onClick={() => onNavigateToTab('history')} 
            className="text-xs font-semibold text-brand-primary flex items-center hover:underline"
            id="see-all-transactions"
          >
            See All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {currentTxs.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs" id="empty-tx-placeholder">
            No transactions posted yet. balance is $0.00.
            <div className="mt-3">
              <button 
                type="button"
                onClick={() => { setInputAmount('50.00'); setActiveModal('add_money'); }} 
                className="text-xs font-bold text-brand-primary hover:text-brand-medium inline-flex items-center gap-1 border border-sky-200 bg-sky-50 px-3 py-1.5 rounded-full"
                id="quick-fund-btn"
              >
                Fund $50 Demo Now <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-50" id="mini-feed-list">
            {currentTxs.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between" id={`tx-item-${tx.id}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    tx.type === 'deposit' || tx.type === 'reward' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-rose-50 text-rose-600'
                  }`} id={`tx-icon-${tx.id}`}>
                    {tx.type === 'deposit' || tx.type === 'reward' ? <ArrowDownLeft className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-dark leading-snug">{tx.description}</p>
                    <p className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-mono font-bold ${
                    tx.type === 'deposit' || tx.type === 'reward' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'reward' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                    tx.status === 'pending' 
                      ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' 
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {tx.status === 'pending' ? 'Processing Payment' : tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Modals Block */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-xs p-4" id="global-modal-wrapper">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 relative" id="modal-container-inner">
            <button 
              type="button" 
              onClick={() => setActiveModal('none')} 
              className="absolute top-4 right-4 text-slate-400 hover:text-brand-dark p-1 rounded-full hover:bg-slate-50"
              id="modal-close-btn"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'add_money_legacy' && (
              <div className="space-y-4" id="modal-container-add-money-routes">
                {/* 1. SELECT PAYMENT METHOD */}
                {addMoneyStep === 'select' && (
                  <div className="space-y-4" id="deposit-select-method-screen">
                    <div className="text-center pb-2">
                      <div className="w-12 h-12 bg-sky-50 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-2.5">
                        <Plus className="w-6 h-6" />
                      </div>
                      <h3 className="font-display font-bold text-brand-dark text-base">Select Deposit Method</h3>
                      <p className="text-xs text-slate-500">Choose how you want to fund your account.</p>
                    </div>

                    <div className="space-y-2.5">
                      {/* USDT Method */}
                      <button
                        type="button"
                        onClick={() => setAddMoneyStep('usdt_input')}
                        className="w-full p-3.5 bg-slate-50/75 hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer group"
                        id="deposit-method-usdt"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold font-mono text-sm group-hover:bg-emerald-100 transition-colors">
                            ₮
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">USDT Deposit</p>
                            <p className="text-[10px] text-slate-400 font-medium">Instant USD crypto credit</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-405 group-hover:text-slate-600 transition-colors shrink-0" />
                      </button>

                      {/* Naira Transfer Method */}
                      <button
                        type="button"
                        onClick={() => setAddMoneyStep('naira_transfer')}
                        className="w-full p-3.5 bg-slate-50/75 hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer group"
                        id="deposit-method-naira"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-amber-55 text-amber-600 rounded-xl flex items-center justify-center font-bold text-sm group-hover:bg-amber-100 transition-colors">
                            ₦
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Naira Bank Transfer</p>
                            <p className="text-[10px] text-slate-400 font-medium">Local Bank virtual account (₦1,600 / $1)</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-405 group-hover:text-slate-600 transition-colors shrink-0" />
                      </button>

                      {/* Legacy Card Method */}
                      <button
                        type="button"
                        onClick={() => setAddMoneyStep('card_deposit')}
                        className="w-full p-3.5 bg-slate-50/75 hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer group"
                        id="deposit-method-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-sky-50 text-brand-primary rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                            <Plus className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Linked Debit Card</p>
                            <p className="text-[10px] text-slate-400 font-medium">USD Visa / Mastercard credit</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-405 group-hover:text-slate-600 transition-colors shrink-0" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. USDT INPUT STAGE */}
                {addMoneyStep === 'usdt_input' && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setAddMoneyStep('usdt_address');
                    }}
                    className="space-y-4"
                    id="deposit-usdt-input-screen"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
                      <button
                        type="button"
                        onClick={() => setAddMoneyStep('select')}
                        className="text-xs text-slate-500 hover:text-brand-dark flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        id="btn-back-to-select-usdt-input"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">Step 1 of 2</span>
                    </div>

                    <div className="text-center">
                      <h3 className="font-display font-bold text-brand-dark text-base">USDT Payment</h3>
                      <p className="text-xs text-slate-500">Specify details to generate wallet address.</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label htmlFor="usdt-amount" className="block text-xs font-semibold text-slate-500 mb-1">
                          Amount to Fund (USDT)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold font-mono text-slate-400">₮</span>
                          <input 
                            id="usdt-amount"
                            type="number"
                            step="0.01"
                            min="5.00"
                            required
                            placeholder="50.00"
                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                            value={usdtAmount}
                            onChange={(e) => setUsdtAmount(e.target.value)}
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">Minimum deposit amount is 5 USDT.</p>
                      </div>

                      <div>
                        <label htmlFor="usdt-network-select" className="block text-xs font-semibold text-slate-500 mb-1">
                          Select Crypto Network
                        </label>
                        <select
                          id="usdt-network-select"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                          value={usdtNetwork}
                          onChange={(e) => setUsdtNetwork(e.target.value)}
                        >
                          <option value="TRON (TRC20) - Fast & Low Fee">TRON (TRC20)</option>
                          <option value="BNB Smart Chain (BEP20) - Ultra-Fast">BSC (BEP20)</option>
                          <option value="Ethereum (ERC20) - High Gas">Ethereum (ERC20)</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-3.5 bg-brand-dark text-white font-bold text-xs rounded-2xl hover:bg-brand-medium transition-all shadow-md mt-2 cursor-pointer font-sans"
                      id="btn-generate-usdt-address"
                    >
                      Generate Deposit Address
                    </button>
                  </form>
                )}

                {/* 3. USDT GENERATED ADDRESS SCREEN */}
                {addMoneyStep === 'usdt_address' && (
                  <div className="space-y-4" id="deposit-usdt-address-screen">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
                      <button
                        type="button"
                        onClick={() => setAddMoneyStep('usdt_input')}
                        className="text-xs text-slate-500 hover:text-brand-dark flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        id="btn-back-to-usdt-input"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded font-mono font-bold">Secure Port</span>
                    </div>

                    <div className="text-center">
                      <h3 className="font-display font-bold text-brand-dark text-base">Make USDT Payment</h3>
                      <p className="text-xs text-slate-500">Send USDT tokens securely to complete deposit.</p>
                    </div>

                    <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-2 text-center relative overflow-hidden" id="usdt-payment-details-card">
                      <p className="text-[10px] text-sky-200 uppercase tracking-widest font-bold">Payment Amount Required</p>
                      <h4 className="font-mono text-xl font-bold text-white tracking-tight">{parseFloat(usdtAmount).toFixed(2)} USDT</h4>
                      <p className="text-[10px] text-slate-300">Network: <strong className="text-emerald-400 font-sans">{usdtNetwork.split(' ')[0]}</strong></p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deposit Wallet Address</label>
                      <div className="flex items-center gap-2 p-2.5 bg-slate-55 rounded-2xl border border-slate-100" id="usdt-address-box">
                        <span className="flex-1 font-mono text-[11px] text-brand-dark break-all font-bold select-all leading-tight">
                          TRibF41CvFeNptGPbuC5gRCfGcrqcc9XPm
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyWalletAddress}
                          className="p-2 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-brand-dark hover:shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0 w-8.5 h-8.5"
                          title="Copy Wallet Address"
                          id="btn-copy-usdt-address"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-600 font-bold" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl text-[10px] text-amber-850 leading-relaxed">
                      <p className="font-bold flex items-center gap-1 text-amber-900 mb-0.5">⚠️ Network Caution</p>
                      <p>Only send <strong className="font-semibold">USDT</strong> via the <strong className="font-semibold">{usdtNetwork.split(' ')[0]}</strong> network to this address. Sending other cryptos causes irreversible financial loss.</p>
                    </div>

                    <button 
                      type="button" 
                      onClick={handleConfirmUSDTDeposit}
                      className="w-full py-3.5 bg-brand-dark hover:bg-brand-medium text-white font-bold text-xs rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                      id="btn-confirm-usdt-payment-success"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      I have made the payment
                    </button>
                  </div>
                )}

                {/* 4. NAIRA BANK TRANSFER VIEW */}
                {addMoneyStep === 'naira_transfer' && (
                  <form 
                    onSubmit={handleConfirmNairaDeposit}
                    className="space-y-4"
                    id="deposit-naira-transfer-screen"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
                      <button
                        type="button"
                        onClick={() => setAddMoneyStep('select')}
                        className="text-xs text-slate-500 hover:text-brand-dark flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        id="btn-back-to-select-naira"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">Naira Routing</span>
                    </div>

                    <div className="text-center">
                      <h3 className="font-display font-bold text-brand-dark text-base">Local Bank Transfer</h3>
                      <p className="text-xs text-slate-500">Fund your balance instantly by bank transfer in Naira.</p>
                    </div>

                    {/* Virtual Account Info Card */}
                    <div className="p-4 bg-slate-55 border border-slate-100 rounded-2xl space-y-2" id="naira-virtual-account-info">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-slate-400 uppercase tracking-widest font-bold font-sans">Bank Name</span>
                        <span className="font-bold text-slate-800">Wema Bank</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-100/60 pt-2">
                        <span className="text-slate-400 uppercase tracking-widest font-bold text-[10.5px]">Account Number</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-brand-dark text-xs">805{user.referralCode || 'FTX28'}390</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`805${user.referralCode || 'FTX28'}390`);
                              setNotification("Account Number copied to clipboard.");
                            }}
                            className="p-1 hover:bg-slate-200/50 rounded transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
                            id="btn-copy-naira-account-number"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-100/60 pt-2 text-[10.5px]">
                        <span className="text-slate-400 uppercase tracking-widest font-bold">Account Name</span>
                        <span className="font-bold text-slate-805 break-all max-w-[150px] text-right">
                          UXTRADE / {(user.email || 'USER').split('@')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-100/60 pt-2 text-[10.5px]">
                        <span className="text-slate-400 uppercase tracking-widest font-bold">Exchange Rate</span>
                        <span className="font-mono font-bold text-brand-primary">₦1,600 = $1.00 USD</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="naira-amount-input" className="block text-xs font-semibold text-slate-500">
                        Transferred Amount (₦ NGN)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-500">₦</span>
                        <input 
                          id="naira-amount-input"
                          type="number"
                          required
                          step="100"
                          min="1000"
                          placeholder="e.g. 16,000"
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                          value={nairaAmount}
                          onChange={(e) => setNairaAmount(e.target.value)}
                        />
                      </div>
                      {nairaAmount && parseFloat(nairaAmount) > 0 && (
                        <p className="text-[10px] text-emerald-600 font-semibold px-1">
                          ✓ You will receive approx. ${(parseFloat(nairaAmount) / 1600).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD in your wallet balance.
                        </p>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-3.5 bg-brand-dark hover:bg-brand-medium text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer mt-2"
                      id="btn-confirm-naira-transfer"
                    >
                      Confirm Deposit Credit
                    </button>
                  </form>
                )}

                {/* 5. LEGACY CARD FUNDING */}
                {addMoneyStep === 'card_deposit' && (
                  <form onSubmit={handleAddMoney} className="space-y-4" id="modal-form-add-money">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
                      <button
                        type="button"
                        onClick={() => setAddMoneyStep('select')}
                        className="text-xs text-slate-500 hover:text-brand-dark flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        id="btn-back-to-select-card"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">Credit Card</span>
                    </div>

                    <div className="text-center pb-1">
                      <h3 className="font-display font-bold text-brand-dark text-base">Linked Debit Card</h3>
                      <p className="text-xs text-slate-500">Fund your account using instant card settlement.</p>
                    </div>

                    <div>
                      <label htmlFor="deposit-amount" className="block text-xs font-semibold text-slate-500 mb-1">
                        Funding Amount (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-brand-dark">$</span>
                        <input 
                          id="deposit-amount"
                          type="number"
                          step="0.01"
                          min="1.00"
                          required
                          placeholder="50.00"
                          className="w-full pl-7 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                          value={inputAmount}
                          onChange={(e) => setInputAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 space-y-1.5">
                      <span className="font-bold text-slate-600 block">Simulated Payment Method</span>
                      <p>Visa Debit ending in •••• 4022</p>
                      <p className="text-[10px] text-emerald-500 font-bold">✔ Verified by Secure-Code</p>
                    </div>

                    <button 
                      id="btn-confirm-deposit"
                      type="submit" 
                      className="w-full py-3.5 bg-brand-dark text-white font-bold text-xs rounded-2xl hover:bg-brand-medium transition-all shadow-md mt-2 cursor-pointer"
                    >
                      Verify and Complete Funding
                    </button>
                  </form>
                )}
              </div>
            )}

            {activeModal === 'transfer' && (
              <form onSubmit={handleTransfer} className="space-y-4" id="modal-form-transfer">
                <div className="text-center pb-2">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2.5">
                    <Send className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-brand-dark text-base">
                    Transfer to {inputBank === 'UX-trade Mail' ? 'UX-trade User' : inputBank}
                  </h3>
                  <p className="text-xs text-slate-500">Send money instantly across platforms.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="transfer-recipient" className="block text-xs font-semibold text-slate-500 mb-1">
                      {inputBank === 'UX-trade Mail' ? 'Recipient Registered Email' : 'Recipient Account / Routing Number'}
                    </label>
                    <input 
                      id="transfer-recipient"
                      type="text"
                      required
                      placeholder={inputBank === 'UX-trade Mail' ? 'friend@example.com' : '8839011293'}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                      value={inputRecipient}
                      onChange={(e) => setInputRecipient(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="transfer-amount" className="block text-xs font-semibold text-slate-500 mb-1">
                      Amount (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-brand-dark">$</span>
                      <input 
                        id="transfer-amount"
                        type="number"
                        step="0.01"
                        min="0.99"
                        required
                        placeholder="10.00"
                        className="w-full pl-7 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  id="btn-confirm-transfer"
                  type="submit" 
                  className="w-full py-3.5 bg-brand-dark text-white font-bold text-xs rounded-2xl hover:bg-brand-medium transition-all shadow-md"
                >
                  Authorize Secure Transfer
                </button>
              </form>
            )}

            {activeModal === 'claim_reward' && (
              <div className="space-y-4 text-center" id="modal-container-claim-reward">
                {/* IDLE / ELIGIBLE */}
                {claimStatus === 'idle' && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto animate-bounce text-amber-500">
                      <Gift className="w-8 h-8 font-bold" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-brand-dark text-base">Claim Daily Gift Reward</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-normal">
                        Every 24 hours, claim your free <strong className="text-emerald-600">$5.00</strong> loyalty bonus instantly credited to your available balance.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClaimReward}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs rounded-2xl transition-all shadow-md cursor-pointer"
                    >
                      Claim $5.00 Cash Now 🎁
                    </button>
                  </div>
                )}

                {/* PROCESSING */}
                {claimStatus === 'processing' && (
                  <div className="space-y-4 py-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" className="stroke-slate-100 fill-none" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-amber-500 fill-none transition-all duration-300"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * claimProgress) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-slate-800">{claimProgress}%</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Clearancing Claim Gateway</h5>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        {claimProgress < 40 
                          ? 'Checking local registry timestamp...' 
                          : claimProgress < 80 
                            ? 'Adding instant allocation to ledger...' 
                            : 'Settling $5.00 safe assets...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* SUCCESS */}
                {claimStatus === 'success' && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-display font-black text-slate-850 text-base">Congratulations!</h4>
                      <p className="text-xs text-slate-550 mt-1 leading-normal">
                        Your free <strong className="text-emerald-600">$5.00</strong> daily reward has been deposited into your active account balance.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal('none')}
                      className="w-full py-3 bg-brand-dark hover:bg-brand-medium text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                )}

                {/* ALREADY CLAIMED */}
                {claimStatus === 'already_claimed' && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                      🔒
                    </div>
                    <div>
                      <h4 className="font-display font-black text-slate-850 text-base">Daily Reward Claimed</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">
                        You have already claimed your reward for today. Please come back after the cooling countdown:
                      </p>
                      
                      <div className="mt-3 p-3 bg-red-50/50 border border-red-100 font-mono text-base font-bold text-red-600 rounded-2xl tracking-wider">
                        {claimTimeLeft}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 bg-slate-200 text-slate-400 font-bold text-xs rounded-2xl cursor-not-allowed uppercase tracking-wider"
                    >
                      Next Reward Locked
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeModal === 'airtime' && (
              <form onSubmit={handleAirtime} className="space-y-4" id="modal-form-airtime">
                <div className="text-center pb-2">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2.5">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-brand-dark text-base">Recharge Phone & Data</h3>
                  <p className="text-xs text-slate-500">Buy credits instantly. Earn up to 6% cashback.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="airtime-carrier" className="block text-xs font-semibold text-slate-500 mb-1">
                      Select Network Operator
                    </label>
                    <select 
                      id="airtime-carrier"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                      value={inputCarrier}
                      onChange={(e) => setInputCarrier(e.target.value)}
                    >
                      <option value="Airtel">Airtel Network (6% Cashback)</option>
                      <option value="MTN">MTN Direct (4% Cashback)</option>
                      <option value="Starlink">Starlink Broadband</option>
                      <option value="Glo-Speed">Glo Telecom</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="airtime-phone" className="block text-xs font-semibold text-slate-500 mb-1">
                      Mobile Number
                    </label>
                    <input 
                      id="airtime-phone"
                      type="tel"
                      required
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="airtime-amount" className="block text-xs font-semibold text-slate-500 mb-1">
                      Recharge Amount ($)
                    </label>
                    <input 
                      id="airtime-amount"
                      type="number"
                      required
                      min="2"
                      placeholder="10"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-primary focus:bg-white text-slate-800"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  id="btn-confirm-airtime"
                  type="submit" 
                  className="w-full py-3.5 bg-brand-dark text-white font-bold text-xs rounded-2xl hover:bg-brand-medium transition-all shadow-md"
                >
                  Recharge Now
                </button>
              </form>
            )}

            {activeModal === 'loan' && (
              <div className="space-y-4" id="modal-container-loans">
                <div className="text-center pb-2">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2.5">
                    <LoanIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-brand-dark text-base">UX-trade Loan Desk</h3>
                  <p className="text-xs text-slate-500">Instant credit based on Tier-{user.tier || 1} Verification limits.</p>
                </div>

                <div className="space-y-3">
                  {(user.tier || 1) < 2 ? (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-[11.5px] text-amber-800 space-y-2.5 text-center">
                      <p className="font-bold">🔒 Higher Tier Verification Required</p>
                      <p className="leading-normal">For regulatory and security compliance, instant credit is only offered to **Tier 2 verified** accounts.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModal('none');
                          onNavigateToTab('profile');
                        }}
                        className="px-4 py-2 bg-brand-dark hover:bg-brand-medium text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        Verify Identity to Upgrade
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                        <p className="font-bold text-brand-dark">✔ Pre-Approved Microloan Option</p>
                        <p>Amount: <strong className="font-mono text-xs text-slate-800">$100.00</strong></p>
                        <p>Interest rate: <strong className="text-brand-primary font-bold">0%</strong> for first 14 days</p>
                        <p>No paperwork, posted instantly.</p>
                      </div>

                      <p className="text-[10px] text-slate-400">By claiming this loan, you authorize repayments post automatically when balance covers the total.</p>

                      <button 
                        type="button" 
                        onClick={() => handleApplyLoan(100.00)}
                        className="w-full py-3.5 bg-brand-dark text-white font-bold text-xs rounded-2xl hover:bg-brand-medium transition-all shadow-md"
                        id="btn-confirm-loan-claim"
                      >
                        Accept and Deposit $100.00
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeModal === 'success' && (
              <div className="text-center space-y-4 py-3" id="modal-container-success">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-brand-dark text-lg">Transaction Complete</h3>
                  <p className="text-xs text-slate-500 mt-1">Successfully posted to ledger. Updated available balance is now ${user.balance.toFixed(2)}.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveModal('none')} 
                  className="w-full py-3 bg-brand-dark text-white font-bold text-xs rounded-xl hover:bg-brand-medium transition-all"
                  id="btn-success-modal-close"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
