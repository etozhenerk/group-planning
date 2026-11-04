import { useEffect, useState } from 'react';
import { designTokens } from '@/shared/config/design-tokens';

export const usePendingIndicator = (pending: boolean, createdAt: string) => {
  const deadline =
    Date.parse(createdAt) +
    Number.parseFloat(designTokens.componentMessageDeliveryPendingDelay);

  const [elapsed, setElapsed] = useState<number | null>(null);
  useEffect(() => {
    if (!pending || !Number.isFinite(deadline)) {
      return;
    }

    const timer = window.setTimeout(
      () => setElapsed(deadline),
      Math.max(0, deadline - Date.now()),
    );

    return () => window.clearTimeout(timer);
  }, [pending, deadline]);

  return pending && elapsed === deadline;
};
