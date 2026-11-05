import type { PlacePoll } from '@/entities/meeting';
import { placePollStatus } from '@/features/place-poll/model/placePollCopy';

export type PlacePollFooterProps = {
  poll: PlacePoll;
  zone: string;
  now: number;
  currentPlace: string | null;
};

export const PlacePollFooter = ({
  poll,
  zone,
  now,
  currentPlace,
}: PlacePollFooterProps) =>
  poll.state === 'open' ? (
    <>
      <span>{placePollStatus(poll, zone, now)}</span>
      <span>Место пока прежнее</span>
    </>
  ) : (
    <span>
      {poll.state === 'applied'
        ? 'Голосование завершено'
        : (currentPlace ?? 'Место пока прежнее')}
    </span>
  );
