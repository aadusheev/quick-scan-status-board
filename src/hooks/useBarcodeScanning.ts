
import { useState, useCallback } from 'react';
import { PackageInfo } from '@/components/StatusDisplay';
import { ScanResult } from '@/hooks/useScanningMode';
import { findPackageByBarcode } from '@/utils/excelParser';
import { useToast } from '@/hooks/use-toast';

export const useBarcodeScanning = (
  packages: PackageInfo[],
  isScanning: boolean,
  processedPackageIndices: Set<number>,
  addScanResult: (result: ScanResult, packageIndex?: number) => void
) => {
  const [currentPackage, setCurrentPackage] = useState<PackageInfo | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const { toast } = useToast();

  const handleBarcodeScanned = useCallback((scannedValue: string) => {
    console.log('Scanned value:', scannedValue);
    setLastScannedCode(scannedValue);
    
    // Проверяем, активно ли сканирование
    if (!isScanning) {
      toast({
        title: "❌ Не начато сканирование",
        description: "Нажмите 'Начать сканирование' для активации режима",
        variant: "destructive",
      });
      setCurrentPackage(null);
      return;
    }

    const searchResult = findPackageByBarcode(packages, scannedValue);
    const { package: foundPackage, packageIndex, allMatches } = searchResult;
    
    setCurrentPackage(foundPackage);
    
    let status: string;
    let isExcess = false;
    let processedRowIndex: number | undefined;
    
    if (foundPackage && allMatches.length > 0) {
      // Ищем первую необработанную строку среди совпадений
      const unprocessedMatch = allMatches.find(match => 
        !processedPackageIndices.has(match.index)
      );
      
      if (unprocessedMatch) {
        // Есть необработанная строка - обрабатываем её
        const pkg = unprocessedMatch.package;
        processedRowIndex = unprocessedMatch.index;
        
        const normalizedStatus = pkg.status.toLowerCase().trim();
        
        if (normalizedStatus === 'недопущенные' || normalizedStatus === 'недопущен' || normalizedStatus.includes('недопущ')) {
          status = 'Недопущенные';
        } else if (normalizedStatus === 'перелимит' || normalizedStatus.includes('перелимит')) {
          status = 'Перелимит';
        } else if (normalizedStatus === 'досмотр' || normalizedStatus.includes('досмотр')) {
          status = 'Досмотр';
        } else if (normalizedStatus === '0' || normalizedStatus === 'допущенные' || normalizedStatus === 'допущен' || normalizedStatus.includes('допущ')) {
          status = 'Допущенные';
        } else {
          status = pkg.status;
        }
      } else {
        // Все строки уже обработаны - это излишки
        status = 'Излишки';
        isExcess = true;
      }
    } else {
      // Не найдено совпадений - это излишки
      status = 'Излишки';
      isExcess = true;
    }
    
    const scanResult: ScanResult = {
      scannedValue,
      packageInfo: foundPackage,
      timestamp: new Date(),
      status,
      isExcess,
      processedRowIndex
    };
    
    addScanResult(scanResult, processedRowIndex);
    
    // Показываем уведомление
    if (foundPackage && !isExcess) {
      const statusLower = status.toLowerCase();
      
      if (statusLower.includes('недопущ')) {
        toast({
          title: "❌ Недопущенные",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - недопущена к отправке`,
          variant: "destructive",
        });
      } else if (statusLower.includes('перелимит')) {
        toast({
          title: "❌ Перелимит",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - превышен лимит`,
          variant: "destructive",
        });
      } else if (statusLower.includes('досмотр')) {
        toast({
          title: "⚠️ Досмотр",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - требуется досмотр`,
          variant: "destructive",
        });
      } else if (statusLower.includes('допущ')) {
        toast({
          title: "✅ Допущенные",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - допущена к отправке`,
        });
      } else {
        toast({
          title: "ℹ️ Статус",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - ${status}`,
        });
      }
    } else {
      // Показываем статус "Излишки"
      toast({
        title: "⚠️ Излишки",
        description: `Значение ${scannedValue} не найдено в базе или уже обработано - отмечено как излишки`,
        variant: "destructive",
      });
    }
  }, [packages, isScanning, processedPackageIndices, addScanResult, toast]);

  const clearCurrentScan = useCallback(() => {
    setCurrentPackage(null);
    setLastScannedCode('');
  }, []);

  return {
    currentPackage,
    lastScannedCode,
    handleBarcodeScanned,
    clearCurrentScan
  };
};
