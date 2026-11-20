import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../api/axios';

/**
 * Small data-loading hook used by every page: gives the 3 UI states.
 *   const { data, pagination, loading, error, reload } = useFetch('/employees', { page: 1 });
 * Pass url = null to skip the request.
 */
export default function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params || {});
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return;
    }
    const id = ++requestId.current; // ignore answers from older requests
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params: JSON.parse(paramsKey) });
      if (id !== requestId.current) return;
      setData(res.data.data);
      setPagination(res.data.pagination || null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(getErrorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [url, paramsKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, pagination, loading, error, reload: load };
}
