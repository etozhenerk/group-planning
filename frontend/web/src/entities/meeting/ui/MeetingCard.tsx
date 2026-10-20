import { Link } from 'react-router';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { MeetingSummary } from '@/entities/meeting/model/types';
import { timeLabel } from '@/shared/lib/time';

export type MeetingCardProps = { meeting: MeetingSummary };

export const MeetingCard = ({ meeting }: MeetingCardProps) => {
  return (
    <Link to={`/meetings/${meeting.id}`} className="meeting-card">
      <div className="meeting-emblem">
        <Sparkles aria-hidden="true" size={22} />
      </div>
      <div className="grow">
        <h2>{meeting.title}</h2>
        <p>{timeLabel(meeting.startsAt, meeting.timezone)}</p>
        <p>
          {meeting.place || 'Место пока не выбрано'} · Участников:{' '}
          {meeting.participantCount}
        </p>
      </div>
      <ArrowUpRight aria-hidden="true" size={22} />
    </Link>
  );
};
