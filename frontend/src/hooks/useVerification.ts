import { useCallback, useEffect, useState } from 'react';

import { api } from '../services/api';
import { VerificationRecord } from '../types/kyc';
import { useAuth } from '../contexts/AuthContext';

export function useVerificationHistory() {
  const { token } = useAuth();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      setRecords(await api.getHistory(token));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { records, loading, refresh };
}
