import { useCallback, useEffect, useState } from 'react';
import { repository } from './repository';
import type { Message } from './types';

export type MessagesState =
  | { status: 'loading' }
  | { status: 'ready'; messages: Message[] }
  | { status: 'error'; message: string };

export function useMessages() {
  const [state, setState] = useState<MessagesState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    repository
      .listApproved()
      .then((messages) => {
        if (!cancelled) setState({ status: 'ready', messages });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'Langit belum bisa dimuat. Periksa koneksimu, lalu coba lagi.' });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);

  return { state, retry };
}
