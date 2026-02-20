'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { getPocket } from '@/services/pocketService';
import { updateUserProfile } from '@/services/authService';
import { logger } from '@/lib/logger';
import { Pocket } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function PocketSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const tDashboard = useTranslations('dashboard');
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { currentPocket, setCurrentPocket } = usePocketStore();

  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingPocketId, setSwitchingPocketId] = useState<string | null>(null);

  const pocketIds = useMemo(() => userProfile?.pocketIds ?? [], [userProfile?.pocketIds]);
  const pocketIdsKey = useMemo(() => pocketIds.join('|'), [pocketIds]);

  useEffect(() => {
    const loadPockets = async () => {
      if (pocketIds.length === 0) {
        setPockets([]);
        return;
      }

      setLoading(true);
      try {
        const loaded = await Promise.all(pocketIds.map((id) => getPocket(id)));
        setPockets(loaded.filter((pocket): pocket is Pocket => Boolean(pocket)));
      } catch (error) {
        logger.error('Failed to load pockets for switcher', { error });
        setPockets([]);
      } finally {
        setLoading(false);
      }
    };

    void loadPockets();
  }, [pocketIds, pocketIdsKey]);

  const handleSelectPocket = async (pocket: Pocket) => {
    if (!user || !userProfile || switchingPocketId || currentPocket?.id === pocket.id) {
      return;
    }

    setSwitchingPocketId(pocket.id);
    try {
      await updateUserProfile(user.uid, { currentPocketId: pocket.id });
      setUserProfile({ ...userProfile, currentPocketId: pocket.id });
      setCurrentPocket(pocket);
    } catch (error) {
      logger.error('Failed to switch pocket from dropdown', {
        error,
        context: { pocketId: pocket.id, userId: user.uid },
      });
    } finally {
      setSwitchingPocketId(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
          aria-label={tDashboard('modals.selectPocket')}
        >
          <span>{currentPocket?.name || tDashboard('modals.selectPocket')}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{tDashboard('modals.selectPocket')}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <DropdownMenuItem disabled>{tDashboard('loadingPockets')}</DropdownMenuItem>
        ) : pockets.length > 0 ? (
          pockets.map((pocket) => {
            const isCurrent = currentPocket?.id === pocket.id;
            const isSwitching = switchingPocketId === pocket.id;

            return (
              <DropdownMenuItem
                key={pocket.id}
                disabled={isSwitching}
                onSelect={(event) => {
                  event.preventDefault();
                  void handleSelectPocket(pocket);
                }}
                className="flex items-center justify-between"
              >
                <span className="truncate">{pocket.name}</span>
                {isCurrent ? <Check className="h-4 w-4 text-blue-600" /> : null}
              </DropdownMenuItem>
            );
          })
        ) : (
          <DropdownMenuItem disabled>{tDashboard('noPocketsAvailable')}</DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            router.push(`/${locale}/pocket-setup`);
          }}
        >
          {tDashboard('quickActions.managePockets')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
