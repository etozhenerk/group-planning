export type PendingMessage = {
  id: string;
  text: string;
  createdAt?: string;
  delivery?: 'queued' | 'sending' | 'uncertain' | 'rejected';
  state: 'sending' | 'failed';
};
