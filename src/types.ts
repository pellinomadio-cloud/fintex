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
  tier?: number;
  banned?: boolean;
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
  refereeName: string;
  email: string;
  date: string;
  rewardEarned: number;
  status: 'completed' | 'pending';
}
