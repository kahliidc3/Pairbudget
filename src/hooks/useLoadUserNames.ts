import { useEffect, useMemo, useState } from 'react';
import { getUserProfilesBatch } from '@/services/authService';
import { logger } from '@/lib/logger';

type UserNameMap = Record<string, string>;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedName {
  name: string;
  expires: number;
}

const userNameCache = new Map<string, CachedName>();

export const useLoadUserNames = (userIds: string[]) => {
  const [userNames, setUserNames] = useState<UserNameMap>({});
  const [loading, setLoading] = useState(false);

  // Normalize IDs to a stable, sorted array to avoid unnecessary effects
  const normalizedIds = useMemo(() => {
    const ids = Array.from(new Set(userIds.filter(Boolean)));
    ids.sort();
    return ids;
  }, [userIds.join('|')]);

  useEffect(() => {
    if (normalizedIds.length === 0) {
      setUserNames({});
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

      let fetchedEntries: UserNameMap = {};

      if (missingIds.length > 0) {
        try {
          const batchResult = await getUserProfilesBatch(missingIds);
          const expiry = Date.now() + CACHE_TTL_MS;

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
        setUserNames((prev) => ({
          ...prev,
          ...cachedEntries,
          ...fetchedEntries,
        }));
        setLoading(false);
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [normalizedIds.join('|')]);

  return { userNames, loading };
};
