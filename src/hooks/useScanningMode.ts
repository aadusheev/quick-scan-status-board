
import { useState, useCallback, useEffect } from 'react';
import { PackageInfo } from '@/components/StatusDisplay';

export interface ScanResult {
  scannedValue: string;
  packageInfo: PackageInfo | null;
  timestamp: Date;
  status: string;
  isExcess: boolean;
  scannedField?: string;
  processedRowIndex?: number; // добавляем индекс обработанной строки
}

export interface ScanningState {
  isActive: boolean;
  startTime: Date | null;
  scanResults: ScanResult[];
  packages: PackageInfo[];
  processedRows: Set<number>; // отслеживаем индексы обработанных строк
}

const STORAGE_KEY = 'scanning-session';

export const useScanningMode = () => {
  const [scanningState, setScanningState] = useState<ScanningState>({
    isActive: false,
    startTime: null,
    scanResults: [],
    packages: [],
    processedRows: new Set()
  });

  // Загрузка данных из LocalStorage при инициализации
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setScanningState({
          ...parsed,
          startTime: parsed.startTime ? new Date(parsed.startTime) : null,
          scanResults: parsed.scanResults.map((result: any) => ({
            ...result,
            timestamp: new Date(result.timestamp)
          })),
          processedRows: new Set(parsed.processedRows || [])
        });
      } catch (error) {
        console.error('Error loading scanning state:', error);
      }
    }
  }, []);

  // Сохранение в LocalStorage при изменении состояния
  const saveToStorage = useCallback((state: ScanningState) => {
    const stateToSave = {
      ...state,
      processedRows: Array.from(state.processedRows)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, []);

  const startScanning = useCallback(() => {
    const newState = {
      ...scanningState,
      isActive: true,
      startTime: new Date()
    };
    setScanningState(newState);
    saveToStorage(newState);
  }, [scanningState, saveToStorage]);

  const stopScanning = useCallback(() => {
    const newState = {
      ...scanningState,
      isActive: false
    };
    setScanningState(newState);
    saveToStorage(newState);
  }, [scanningState, saveToStorage]);

  const addScanResult = useCallback((result: ScanResult) => {
    const newProcessedRows = new Set(scanningState.processedRows);
    if (result.processedRowIndex !== undefined && !result.isExcess) {
      newProcessedRows.add(result.processedRowIndex);
    }

    const newState = {
      ...scanningState,
      scanResults: [...scanningState.scanResults, result],
      processedRows: newProcessedRows
    };
    setScanningState(newState);
    saveToStorage(newState);
  }, [scanningState, saveToStorage]);

  const setPackages = useCallback((packages: PackageInfo[]) => {
    const newState = {
      ...scanningState,
      packages
    };
    setScanningState(newState);
    saveToStorage(newState);
  }, [scanningState, saveToStorage]);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setScanningState({
      isActive: false,
      startTime: null,
      scanResults: [],
      packages: [],
      processedRows: new Set()
    });
  }, []);

  return {
    scanningState,
    startScanning,
    stopScanning,
    addScanResult,
    setPackages,
    clearSession
  };
};
