export interface TierInfo {
  level: number;
  name: string;
  priceNaira: number;
  priceUsd: number;
  dailyLimitUsd: number;
  dailyLimitLabel: string;
  features: string[];
  color: string;
  badge: string;
}

export const TIER_CONFIG: Record<number, TierInfo> = {
  1: {
    level: 1,
    name: 'Level 1 (Basic)',
    priceNaira: 0,
    priceUsd: 0,
    dailyLimitUsd: 0,
    dailyLimitLabel: 'Withdrawals Locked (Upgrade to Level 2)',
    features: ['Explore dashboard features', 'Standard deposits & savings', 'Withdrawals LOCKED'],
    color: 'amber',
    badge: 'Level 1 Basic'
  },
  2: {
    level: 2,
    name: 'Level 2 Standard',
    priceNaira: 10500,
    priceUsd: 6.56,
    dailyLimitUsd: 500,
    dailyLimitLabel: '$500.00 / day',
    features: ['Unlocks instant withdrawals', 'Daily cashout limit: $500.00', 'Virtual debit card access', 'Standard priority routing'],
    color: 'blue',
    badge: 'Level 2 Active'
  },
  3: {
    level: 3,
    name: 'Level 3 Advanced',
    priceNaira: 26700,
    priceUsd: 16.68,
    dailyLimitUsd: 2000,
    dailyLimitLabel: '$2,000.00 / day',
    features: ['Daily cashout limit: $2,000.00', 'Accelerated clearance node', 'Zero conversion surcharge'],
    color: 'indigo',
    badge: 'Level 3 Advanced'
  },
  4: {
    level: 4,
    name: 'Level 4 Pro',
    priceNaira: 50000,
    priceUsd: 31.25,
    dailyLimitUsd: 5000,
    dailyLimitLabel: '$5,000.00 / day',
    features: ['Daily cashout limit: $5,000.00', 'Pro wire settlement queues', 'Dedicated account manager'],
    color: 'purple',
    badge: 'Level 4 Pro'
  },
  5: {
    level: 5,
    name: 'Level 5 Elite',
    priceNaira: 79000,
    priceUsd: 49.38,
    dailyLimitUsd: 15000,
    dailyLimitLabel: '$15,000.00 / day',
    features: ['Daily cashout limit: $15,000.00', 'High-volume debit volume', '24/7 Priority support'],
    color: 'emerald',
    badge: 'Level 5 Elite'
  },
  6: {
    level: 6,
    name: 'Level 6 Executive',
    priceNaira: 100800,
    priceUsd: 63.00,
    dailyLimitUsd: 50000,
    dailyLimitLabel: '$50,000.00 / day',
    features: ['Daily cashout limit: $50,000.00', 'VIP wire settlement', 'Institutional escrow lock'],
    color: 'sky',
    badge: 'Level 6 Executive'
  },
  7: {
    level: 7,
    name: 'Level 7 VIP Ultimate',
    priceNaira: 180000,
    priceUsd: 112.50,
    dailyLimitUsd: 999999999,
    dailyLimitLabel: 'UNLIMITED Withdrawal',
    features: ['UNLIMITED Daily Withdrawals', 'Zero fee VIP routing', 'Instant direct wire priority', 'Personal Wealth Desk Manager'],
    color: 'amber',
    badge: 'Level 7 VIP Unlimited'
  }
};
