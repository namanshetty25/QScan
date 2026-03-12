import { useState, useEffect, useCallback } from 'react';
import { scanApi } from '../api/scanApi';
import { formatCBOMData } from '../utils/pqcClassifier';

export const useScan = (scanId) => {
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);

  const fetchStatus = useCallback(async () => {
    if (!scanId) return;
    setLoading(true);
    try {
      const response = await scanApi.getScanStatus(scanId);
      const scanData = response.data;
      console.log(`[${scanId}] Status:`, scanData.status, `Progress:`, scanData.progress);
      
      setScan(scanData);
      setProgress(Math.min(scanData.progress, 100));
      
      // Capture messages as logs  
      if (scanData.message) {
        setLogs(prev => {
          const newLog = `[${new Date().toLocaleTimeString()}] ${scanData.message}`;
          return [...prev, newLog].slice(-20); // Keep last 20 logs
        });
      }
      setError(null);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch scan status';
      setError(errorMessage);
      console.error('Error fetching scan status:', err);
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    if (!scanId) return;

    fetchStatus();
    
    // Poll every 1.5 seconds (faster feedback)
    const interval = setInterval(fetchStatus, 1500);

    return () => clearInterval(interval);
  }, [scanId, fetchStatus]);

  return { scan, loading, error, progress, logs, refetch: fetchStatus };
};

export const useScanResults = (scanId) => {
  const [results, setResults] = useState(null);
  const [cbom, setCBOM] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    if (!scanId) return;
    setLoading(true);
    try {
      const [resultsResponse, cbomResponse] = await Promise.all([
        scanApi.getScanResults(scanId),
        scanApi.getCBOM(scanId),
      ]);

      setResults(resultsResponse.data);
      const formattedCBOM = formatCBOMData(cbomResponse.data);
      setCBOM(formattedCBOM);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { results, cbom, loading, error, refetch: fetchResults };
};

export const useScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scanApi.getHistory();
      console.log('History response:', response.data);
      
      // Ensure data is an array
      const historyData = Array.isArray(response.data) ? response.data : [];
      setHistory(historyData);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch history';
      setError(errorMessage);
      console.error('Error fetching history:', err);
      setHistory([]); // Reset on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    // Refetch every 5 seconds to get latest scans
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const deleteScan = useCallback(
    async (scanId) => {
      try {
        await scanApi.deleteScan(scanId);
        setHistory(prev => prev.filter(item => item.scan_id !== scanId));
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete scan';
        setError(errorMessage);
        console.error('Error deleting scan:', err);
      }
    },
    []
  );

  return { history, loading, error, refetch: fetchHistory, deleteScan };
};

export const useStartScan = () => {
  const [scanId, setScanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startScan = useCallback(async (target, scanTypes, discover = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await scanApi.startScan(target, scanTypes, discover);
      setScanId(response.data.scan_id);
      return response.data.scan_id;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      setError(errorMessage);
      console.error('Error starting scan:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { scanId, loading, error, startScan };
};

export default {
  useScan,
  useScanResults,
  useScanHistory,
  useStartScan,
};
