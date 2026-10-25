export type UploadItem = {
  id: string;
  publishKey: string;
  file: File;
  caption: string;
  preview: string | null;
  mediaId: string | null;
  state: 'ready' | 'uploading' | 'done' | 'failed';
  progress: number;
  error: string;
};
