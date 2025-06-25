
import { useCallback } from 'react';
import { exportScanningResults } from '@/utils/excelExporter';
import { PackageInfo } from '@/components/StatusDisplay';
import { ScanResult } from '@/hooks/useScanningMode';
import { useToast } from '@/hooks/use-toast';

export const useScanningControls = (
  packages: PackageInfo[],
  scanResults: ScanResult[],
  startScanning: () => void,
  stopScanning: () => void,
  clearSession: () => void,
  resetFile: () => void,
  clearCurrentScan: () => void
) => {
  const { toast } = useToast();

  const handleStartScanning = useCallback(() => {
    startScanning();
    toast({
      title: "Сканирование запущено",
      description: "Режим сканирования активирован",
    });
  }, [startScanning, toast]);

  const handleStopScanning = useCallback(() => {
    stopScanning();
    toast({
      title: "Сканирование завершено",
      description: "Режим сканирования остановлен",
    });
  }, [stopScanning, toast]);

  const handleExportResults = useCallback(() => {
    try {
      exportScanningResults(packages, scanResults);
      clearSession();
      resetFile();
      clearCurrentScan();
      
      toast({
        title: "Отчёт экспортирован",
        description: "Файл успешно скачан, данные сканирования очищены",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось создать файл отчёта",
        variant: "destructive",
      });
    }
  }, [packages, scanResults, clearSession, resetFile, clearCurrentScan, toast]);

  return {
    handleStartScanning,
    handleStopScanning,
    handleExportResults
  };
};
