import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data with explicit loading / error / data states and ignores responses that
 * arrive after the inputs changed or the component unmounted.
 *
 * With `refreshEvery` (ms) the data is fetched again in the background while the page is
 * visible, and when the shopper comes back to the tab, without showing the loading state, so
 * changes made elsewhere (an order status set in the admin console, #183) appear on their own.
 *
 * @param {() => Promise<any>} load - called whenever `deps` change
 * @param {any[]} deps
 * @param {{ refreshEvery?: number }} [options]
 * @returns {{ data: any, error: Error|null, loading: boolean, reload: () => void, setData: Function }}
 */
export function useResource(load, deps, { refreshEvery } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;
  // Bumped on every full load so a background refresh started before it is ignored.
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    generation.current += 1;
    setState((prev) => ({ ...prev, error: null, loading: true }));
    // Promise.resolve().then() also captures a loader that throws synchronously.
    Promise.resolve()
      .then(() => loadRef.current())
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error) => active && setState({ data: null, error, loading: false }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const hasData = state.data !== null && !state.loading;
  useEffect(() => {
    if (!refreshEvery || !hasData) return undefined;
    let active = true;
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      const started = generation.current;
      Promise.resolve()
        .then(() => loadRef.current())
        .then((data) => {
          if (active && started === generation.current) setState((prev) => ({ ...prev, data }));
        })
        // A failed background refresh keeps what is on screen; the next one tries again.
        .catch(() => {});
    };
    const timer = setInterval(refresh, refreshEvery);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [refreshEvery, hasData]);
  const setData = useCallback(
    (updater) =>
      setState((prev) => ({
        ...prev,
        data: typeof updater === 'function' ? updater(prev.data) : updater,
      })),
    []
  );

  return { ...state, reload, setData };
}
