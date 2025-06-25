
import { useState, useCallback, useEffect } from 'react';
import { PackageInfo } from '@/components/StatusDisplay';

export interface ScanResult {
  scannedValue: string;
  packageInfo: PackageInfo | null;
  timestamp: Date;
  status: string;
  isExcess: boolean;
  scannedField?: string; // новое поле для отслеживания какое поле было отсканировано
}

export interface ScanningState {
  isActive: boolean;
  startTime: Date | null;
  scanResults: ScanResult[];
  packages: PackageInfo[];
  processedPackages: Set<string>; // для отслеживания уже обработанных пакетов по конкретному полю
}

const STORAGE_KEY = 'scanning-session';

export const useScanningMode = () => {
  const [scanningState, setScanningState] = useState<ScanningState>({
    isActive: false,
    startTime: null,
    scanResults: [],
    packages: [],
    processedPackages: new Set()
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
          processedPackages: new Set(parsed.processedPackages || [])
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
      processedPackages: Array.from(state.processedPackages)
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
    // Определяем какое поле было отсканировано
    let scannedField = '';
    let packageKey = '';
    
    if (result.packageInfo) {
      const normalizedScannedValue = result.scannedValue.trim().toLowerCase();
      
      if (result.packageInfo.barcode && result.packageInfo.barcode.toLowerCase().trim() === normalizedScannedValue) {
        scannedField = 'barcode';
        packageKey = `barcode_${result.packageInfo.barcode}`;
      } else if (result.packageInfo.boxNumber && result.packageInfo.boxNumber.toLowerCase().trim() === normalizedScannedValue) {
        scannedField = 'boxNumber';
        packageKey = `boxNumber_${result.packageInfo.boxNumber}`;
      } else if (result.packageInfo.shipmentId && result.packageInfo.shipmentId.toLowerCase().trim() === normalizedScannedValue) {
        scannedField = 'shipmentId';
        packageKey = `shipmentId_${result.packageInfo.shipmentId}`;
      } else if (result.packageInfo.shipmentNumber) {
        const normalizedShipmentNumber = result.packageInfo.shipmentNumber.toLowerCase().trim();
        if (normalizedShipmentNumber === normalizedScannedValue || 
            normalizedShipmentNumber.includes(normalizedScannedValue) || 
            normalizedScannedValue.includes(normalizedShipmentNumber)) {
          scannedField = 'shipmentNumber';
          packageKey = `shipmentNumber_${result.packageInfo.shipmentNumber}`;
        }
      }
    }

    const resultWithField = {
      ...result,
      scannedField
    };

    const newProcessedPackages = new Set(scanningState.processedPackages);
    if (packageKey && !result.isExcess) {
      newProcessedPackages.add(packageKey);
    }

    const newState = {
      ...scanningState,
      scanResults: [...scanningState.scanResults, resultWithField],
      processedPackages: newProcessedPackages
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
      processedPackages: new Set()
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
