export const storedInvitation = (id: string): string | null => {
  try {
    const user = sessionStorage.getItem('somewhere-active-user');
    const token = user
      ? sessionStorage.getItem(`somewhere-invitation:${user}:${id}`)
      : null;

    return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
  } catch {
    return null;
  }
};
