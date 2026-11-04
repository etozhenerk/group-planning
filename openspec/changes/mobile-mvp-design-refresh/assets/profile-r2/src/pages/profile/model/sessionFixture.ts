export const session = {
  user: { id: "misha", displayName: "Миша" },
  expiresAt: "2027-01-01T00:00:00Z",
  csrf: null,
};
export const useSession = () => ({
  data: session,
  isPending: false,
  error: null,
});
