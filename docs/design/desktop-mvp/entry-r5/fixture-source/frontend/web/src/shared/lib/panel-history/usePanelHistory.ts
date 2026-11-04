import { useLocation, useNavigate } from 'react-router';
import { useLayoutEffect, useRef } from 'react';

export const usePanelHistory = <Panel extends string>(
  owner: string,
  panels: readonly Panel[] | ((value: unknown) => value is Panel),
) => {
  const location = useLocation();
  const navigate = useNavigate();
  const transition = useRef({ key: location.key, pending: false });
  useLayoutEffect(() => {
    transition.current = { key: location.key, pending: false };
  }, [location.key]);
  const beginTransition = () => {
    if (transition.current.key !== location.key || transition.current.pending) {
      return false;
    }

    transition.current.pending = true;

    return true;
  };

  const previous: unknown = location.state;
  const state = typeof previous === 'object' && previous !== null ? previous : {};
  const entry = 'somewherePanel' in state ? state.somewherePanel : null;
  const candidate =
    typeof entry === 'object' &&
    entry !== null &&
    'owner' in entry &&
    entry.owner === owner &&
    'panel' in entry
      ? entry.panel
      : null;

  const panel =
    typeof panels === 'function'
      ? panels(candidate)
        ? candidate
        : null
      : (panels.find((value) => value === candidate) ?? null);

  const show = (next: Panel, replace = false) => {
    if (panel === next || !beginTransition()) {
      return;
    }

    void navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      {
        replace:
          replace ||
          (typeof entry === 'object' &&
            entry !== null &&
            'owner' in entry &&
            entry.owner !== owner),
        preventScrollReset: true,
        state: { ...state, somewherePanel: { owner, panel: next } },
      },
    );
  };

  return {
    panel,
    show,
    close: () => {
      if (panel !== null && beginTransition()) {
        void navigate(-1);
      }
    },
  };
};
