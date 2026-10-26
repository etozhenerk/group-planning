import { useEffect, useState } from 'react';
import type { Session } from '@/entities/session';
import { useUploadSelection } from '@/features/upload-media/model/useUploadSelection';
import { MediaUpload } from '@/features/upload-media/ui/MediaUpload';

export type UploadDraftProps = {
  id: string;
  session: Session;
  photo: boolean;
  purpose: 'message' | 'memory';
  active: boolean;
  done: () => void;
};

export const UploadDraft = ({
  id,
  session,
  photo,
  purpose,
  active,
  done,
}: UploadDraftProps) => {
  const selection = useUploadSelection(session.user.id, id);
  const [visited, setVisited] = useState(false);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (active) {
      setVisited(true);
    }
  }, [active]);
  useEffect(() => selection.clear, [selection.clear]);
  const initial = selection.selection;

  return (visited || active) && !selection.denied ? (
    <MediaUpload
      key={generation}
      id={id}
      session={session}
      photo={photo}
      purpose={purpose}
      initialFiles={
        initial?.photo === photo && initial.purpose === purpose ? initial.files : []
      }
      done={() => {
        selection.clear();
        setGeneration((value) => value + 1);
        setVisited(false);
        done();
      }}
    />
  ) : null;
};
