import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export interface Transaction {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  commission: number;
  sellerId: string;
  type: 'affiliate' | 'direct' | 'drop';
  status: 'pending' | 'completed' | 'refunded';
  createdAt: Date;
}

/**
 * Log a purchase transaction
 */
export async function logPurchase(params: {
  userId: string;
  productId: string;
  amount: number;
  sellerId: string;
  type: 'affiliate' | 'direct' | 'drop';
}): Promise<string> {
  const db = getAdminFirestore();
  
  const commission = calculateCommission(params.amount, params.type);
  
  // Create transaction
  const txRef = db.collection('transactions').doc();
  await txRef.set({
    id: txRef.id,
    ...params,
    commission,
    status: 'completed',
    createdAt: new Date(),
  });
  
  // Update product stats
  await db.collection('contentItems').doc(params.productId).update({
    'stats.purchases': FieldValue.increment(1),
    'stats.revenue': FieldValue.increment(params.amount),
  });
  
  // Update seller stats
  const sellerEarnings = params.amount * (1 - (commission / params.amount));
  await db.collection('users').doc(params.sellerId).set({
    stats: {
      totalSales: FieldValue.increment(1),
      totalRevenue: FieldValue.increment(sellerEarnings),
    },
  }, { merge: true });
  
  // Update platform stats
  await db.collection('platformStats').doc('global').set({
    totalTransactions: FieldValue.increment(1),
    totalRevenue: FieldValue.increment(commission),
    totalGMV: FieldValue.increment(params.amount),
  }, { merge: true });
  
  return txRef.id;
}

/**
 * Calculate platform commission
 */
export function calculateCommission(amount: number, type: string): number {
  switch (type) {
    case 'affiliate': return amount * 0.05; // 5%
    case 'direct': return amount * 0.10; // 10%
    case 'drop': return amount * 0.15; // 15%
    default: return 0;
  }
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const db = getAdminFirestore();
  
  const snapshot = await db
    .collection('transactions')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as Transaction;
  });
}

/**
 * Get revenue summary for a user (as seller)
 */
export async function getSellerRevenue(userId: string, period: 'today' | 'week' | 'month' | 'all' = 'all') {
  const db = getAdminFirestore();
  
  let query: any = db.collection('transactions')
    .where('sellerId', '==', userId);
  
  // Add date filter
  if (period !== 'all') {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    
    query = query.where('createdAt', '>=', startDate);
  }
  
  const snapshot = await query.get();
  
  let totalSales = 0;
  let totalRevenue = 0;
  
  snapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    totalSales++;
    totalRevenue += data.amount * (1 - (data.commission / data.amount));
  });
  
  return {
    sales: totalSales,
    revenue: totalRevenue,
    avgOrder: totalSales > 0 ? totalRevenue / totalSales : 0,
  };
}

