import { SkeletonRows } from '@/shared/ui/SkeletonRows';

export type MeetingsLoadingProps = { agenda?: boolean };

export const MeetingsLoading = ({ agenda = false }: MeetingsLoadingProps) => (
  <SkeletonRows label="Загрузка встреч" variant={agenda ? 'agenda' : 'cards'} />
);
