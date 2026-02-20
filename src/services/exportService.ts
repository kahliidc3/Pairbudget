import JSZip from 'jszip';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { Transaction, User } from '@/types';

const csvEscape = (value: unknown): string => {
  const raw = String(value ?? '');
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

const transactionsToCsv = (transactions: Transaction[]): string => {
  const header = ['id', 'pocketId', 'userId', 'type', 'category', 'description', 'amount', 'date', 'createdAt'];
  const rows = transactions.map((transaction) => [
    csvEscape(transaction.id),
    csvEscape(transaction.pocketId),
    csvEscape(transaction.userId),
    csvEscape(transaction.type),
    csvEscape(transaction.category),
    csvEscape(transaction.description),
    csvEscape(transaction.amount),
    csvEscape(transaction.date.toISOString()),
    csvEscape(transaction.createdAt.toISOString()),
  ]);

  return [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

/**
 * Exports the current user's profile and own transactions as a ZIP file.
 */
export const exportUserData = async (userUid: string): Promise<void> => {
  try {
    const userSnap = await getDoc(doc(db, 'users', userUid));
    if (!userSnap.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userSnap.data() as User & { createdAt?: { toDate?: () => Date } };
    const profileJson = JSON.stringify(
      {
        ...userData,
        createdAt:
          userData?.createdAt && typeof userData.createdAt === 'object' && 'toDate' in userData.createdAt
            ? userData.createdAt.toDate?.().toISOString()
            : null,
      },
      null,
      2
    );

    const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', userUid));
    const transactionsSnap = await getDocs(transactionsQuery);
    const transactions: Transaction[] = transactionsSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        pocketId: String(data.pocketId ?? ''),
        userId: String(data.userId ?? ''),
        type: data.type === 'fund' ? 'fund' : 'expense',
        category: String(data.category ?? ''),
        description: String(data.description ?? ''),
        amount: Number(data.amount ?? 0),
        date: data.date?.toDate?.() ?? new Date(),
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      };
    });

    const zip = new JSZip();
    zip.file('profile.json', profileJson);
    zip.file('transactions.csv', transactionsToCsv(transactions));

    const blob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = `pairbudget-user-export-${userUid}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    logger.error('Failed to export user data', { error, context: { userUid } });
    throw new Error('Failed to export your data. Please try again.');
  }
};
