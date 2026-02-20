'use client';

import { Toaster } from 'sonner';

export default function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        className: 'text-sm',
        duration: 3000,
      }}
    />
  );
}
