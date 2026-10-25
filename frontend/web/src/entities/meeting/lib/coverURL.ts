export const safeCoverURL = (
  raw: string | null,
  origin: string,
  meeting: string,
): string | null => {
  if (!raw) {
    return null;
  }

  try {
    const value = new URL(raw);
    const parts = value.pathname.split('/');

    if (
      value.origin !== origin ||
      value.username ||
      value.password ||
      value.hash ||
      parts.length !== 6 ||
      parts[1] !== 'api' ||
      parts[2] !== 'v1' ||
      parts[5] !== 'cover'
    ) {
      return null;
    }

    const allowed =
      parts[3] === 'meetings'
        ? parts[4] === meeting
        : parts[3] === 'invitations' && /^[A-Za-z0-9_-]{22,43}$/.test(parts[4] ?? '');

    if (
      !allowed ||
      [...value.searchParams].length !== 1 ||
      !/^[a-f0-9]{64}$/.test(value.searchParams.get('v') ?? '')
    ) {
      return null;
    }

    return value.href;
  } catch {
    return null;
  }
};
