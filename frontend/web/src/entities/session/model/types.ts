export type Session = {
  user: { id: string; displayName: string };
  expiresAt: string;
  csrf: string | null;
};
