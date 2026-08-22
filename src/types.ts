export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  referralCode: string;
  referredBy?: string;
  balance: number;
  savingsBalance: number;
  createdAt: string;
  avatar?: string;
  tier?: number;
  banned?: boolean;
  isAdminVerified?: boolean;
  isAdmin?: boolean;
  lastCheckInDate?: string;
  lastCharityDeductionDate?: string;
  purchasedBots?: string[];
  activeBots?: string[];
  botEarnings?: Record<string, number>;
  joinedCommunity?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'transfer' | 'withdrawal' | 'reward' | 'airtime' | 'utility' | 'savings_deposit' | 'savings_withdrawal';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
  proof?: string;
  validationFeeNaira?: number;
  validationStatus?: 'unvalidated' | 'pending_approval' | 'approved' | 'rejected';
  validationProof?: string;
  tierRequested?: number;
}

export interface VirtualCard {
  id: string;
  userId: string;
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
  status: 'active' | 'blocked';
  type: 'visa' | 'mastercard';
  color: 'deep-blue' | 'ice-blue' | 'slate-dark';
  limit: number;
  spent: number;
}

export interface ReferralHistory {
  id?: string;
  refereeId?: string;
  refereeName: string;
  email: string;
  date: string;
  rewardEarned: number;
  status: 'completed' | 'pending' | 'credited' | string;
  hasUpgraded?: boolean;
  refereeTier?: number;
  upgradeLevel?: number;
  upgradedAt?: string;
}

export interface SupportMessage {
  id: string;
  message: string;
  createdAt: string;
  expiresAt: string;
  authorName?: string;
}

