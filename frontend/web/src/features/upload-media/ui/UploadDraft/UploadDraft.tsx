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
  const clear = selection.clear;
  const [visited, setVisited] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    if (!active && completed) {
      clear();
      setGeneration((value) => value + 1);
      setVisited(false);
      setCompleted(false);
    }
  }, [active, completed, clear]);
  useEffect(() => {
    if (active) {
      setVisited(true);
    }
  }, [active]);
  useEffect(() => clear, [clear]);
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
        setCompleted(true);
        done();
      }}
    />
  ) : null;
};
