import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

export type AuditAction =
  | 'account.delete'
  | 'pocket.delete'
  | 'pocket.leave'
  | 'pocket.role.reassigned'
  | 'pocket.role.assigned';

interface AuditLogInput {
  actorUid: string;
  action: AuditAction;
  targetId?: string;
  targetType?: 'user' | 'pocket';
  metadata?: Record<string, unknown>;
}

/**
 * Writes an audit event to Firestore.
 * Client apps cannot reliably determine public IP, so `ip` may be null.
 */
export const writeAuditLog = async (entry: AuditLogInput): Promise<void> => {
  try {
    await addDoc(collection(db, 'audit-logs'), {
      actorUid: entry.actorUid,
      action: entry.action,
      targetId: entry.targetId ?? null,
      targetType: entry.targetType ?? null,
      metadata: entry.metadata ?? {},
      ip: null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    logger.warn('Failed to write audit log entry', {
      error,
      context: { action: entry.action, actorUid: entry.actorUid },
    });
  }
};
