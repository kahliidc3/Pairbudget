import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

admin.initializeApp();

const db = admin.firestore();
const CLEANUP_RETENTION_DAYS = 30;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export const cleanupSoftDeletedData = onSchedule(
  {
    schedule: 'every day 02:00',
    timeZone: 'UTC',
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const cutoff = admin.firestore.Timestamp.fromMillis(
      Date.now() - CLEANUP_RETENTION_DAYS * MS_IN_DAY
    );

    logger.info('Starting soft-deleted records cleanup', {
      retentionDays: CLEANUP_RETENTION_DAYS,
      cutoff: cutoff.toDate().toISOString(),
    });

    const stalePockets = await db
      .collection('pockets')
      .where('deleted', '==', true)
      .where('deletedAt', '<=', cutoff)
      .get();

    let deletedPocketCount = 0;
    let deletedTransactionCount = 0;

    for (const pocketDoc of stalePockets.docs) {
      const pocketId = pocketDoc.id;

      const transactionsSnapshot = await db
        .collection('transactions')
        .where('pocketId', '==', pocketId)
        .get();

      let batch = db.batch();
      let operations = 0;

      for (const transactionDoc of transactionsSnapshot.docs) {
        batch.delete(transactionDoc.ref);
        operations++;
        deletedTransactionCount++;

        if (operations === 450) {
          await batch.commit();
          batch = db.batch();
          operations = 0;
        }
      }

      if (operations > 0) {
        await batch.commit();
      }

      await pocketDoc.ref.delete();
      deletedPocketCount++;
    }

    logger.info('Soft-deleted records cleanup completed', {
      deletedPocketCount,
      deletedTransactionCount,
      stalePocketCandidates: stalePockets.size,
    });
  }
);
