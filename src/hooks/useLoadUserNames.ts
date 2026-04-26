import { useEffect, useMemo, useState } from 'react';
import { getUserProfilesBatch } from '@/services/authService';
import { APP_LIMITS } from '@/constants/config';
import { logger } from '@/lib/logger';

type UserNameMap = Record<string, string>;

interface CachedName {
  name: string;
  expires: number;
}

const userNameCache = new Map<string, CachedName>();

export const useLoadUserNames = (userIds: string[]) => {
  const [userNames, setUserNames] = useState<UserNameMap>({});
  const [loading, setLoading] = useState(false);
  // Normalize IDs into a stable key to avoid re-running effects on every render.
  const normalizedIdsKey = useMemo(() => {
    const ids = Array.from(new Set(userIds.filter(Boolean)));
    ids.sort();
    return ids.join('|');
  }, [userIds]);

  useEffect(() => {
    const normalizedIds = normalizedIdsKey ? normalizedIdsKey.split('|').filter(Boolean) : [];

    if (normalizedIds.length === 0) {
      setUserNames((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    let isCancelled = false;

    const load = async () => {
      setLoading(true);
      const now = Date.now();
      const cachedEntries: UserNameMap = {};
      const missingIds: string[] = [];

      normalizedIds.forEach((id) => {
        const cached = userNameCache.get(id);
        if (cached && cached.expires > now) {
          cachedEntries[id] = cached.name;
        } else {
          missingIds.push(id);
        }
      });

      const fetchedEntries: UserNameMap = {};

      if (missingIds.length > 0) {
        try {
          const batchResult = await getUserProfilesBatch(missingIds);
          const expiry = Date.now() + APP_LIMITS.userNameCacheTtlMs;

          Object.entries(batchResult).forEach(([id, profile]) => {
            const name = profile?.name || 'Unknown User';
            fetchedEntries[id] = name;
            userNameCache.set(id, { name, expires: expiry });
          });

          // Mark any still-missing IDs as unknown to avoid re-fetching immediately
          missingIds.forEach((id) => {
            if (!fetchedEntries[id]) {
              fetchedEntries[id] = 'Unknown User';
              userNameCache.set(id, { name: 'Unknown User', expires: expiry });
            }
          });
        } catch (error) {
          logger.error('Failed to batch load user names', { error });
          // Fallback to Unknown User for missing IDs
          missingIds.forEach((id) => {
            fetchedEntries[id] = 'Unknown User';
          });
        }
      }

      if (!isCancelled) {
        setUserNames((prev) => {
          const next = {
            ...prev,
            ...cachedEntries,
            ...fetchedEntries,
          };

          const prevKeys = Object.keys(prev);
          const nextKeys = Object.keys(next);
          const isSame =
            prevKeys.length === nextKeys.length &&
            nextKeys.every((key) => prev[key] === next[key]);

          return isSame ? prev : next;
        });
        setLoading(false);
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [normalizedIdsKey]);

  return { userNames, loading };
};
