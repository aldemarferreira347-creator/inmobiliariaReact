import { useEffect } from 'react';

export default function usePolling(callback, intervaloMs = 30000) {
  useEffect(() => {
    const id = setInterval(callback, intervaloMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervaloMs]);
}
