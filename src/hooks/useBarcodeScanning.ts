
import { useCallback } from 'react';
import { PackageInfo } from '@/components/StatusDisplay';
import { findPackageByBarcode } from '@/utils/excelParser';
import { ScanResult } from '@/hooks/useScanningMode';
import { useToast } from '@/hooks/use-toast';

export const useBarcodeScanning = (
  packages: PackageInfo[],
  isScanning: boolean,
  processedRows: Set<number>,
  addScanResult: (result: ScanResult) => void
) => {
  const { toast } = useToast();

  const handleBarcodeScanned = useCallback((scannedValue: string) => {
    console.log('Scanned value:', scannedValue);
    
    // Check if scanning is active
    if (!isScanning) {
      toast({
        title: "❌ Не начато сканирование",
        description: "Нажмите кнопку 'Начать сканирование' перед началом работы",
        variant: "destructive",
      });
      return { packageInfo: null, scannedValue };
    }
    
    const searchResult = findPackageByBarcode(packages, scannedValue);
    
    if (!searchResult) {
      // Не найдено в базе - излишки
      const scanResult: ScanResult = {
        scannedValue,
        packageInfo: null,
        timestamp: new Date(),
        status: 'Излишки',
        isExcess: true
      };
      
      addScanResult(scanResult);
      
      toast({
        title: "⚠️ Излишки",
        description: `Значение ${scannedValue} не найдено в базе - отмечено как излишки`,
        variant: "destructive",
      });
      
      return { packageInfo: null, scannedValue };
    }

    const { packageInfo: foundPackage, scannedField, allMatches } = searchResult;
    
    // Определяем статус
    let status: string;
    const normalizedStatus = foundPackage.status.toLowerCase().trim();
    
    if (normalizedStatus === 'недопущенные' || normalizedStatus === 'недопущен' || normalizedStatus.includes('недопущ')) {
      status = 'Недопущенные';
    } else if (normalizedStatus === 'перелимит' || normalizedStatus.includes('перелимит')) {
      status = 'Перелимит';
    } else if (normalizedStatus === 'досмотр' || normalizedStatus.includes('досмотр')) {
      status = 'Досмотр';
    } else if (normalizedStatus === '0' || normalizedStatus === 'допущенные' || normalizedStatus === 'допущен' || normalizedStatus.includes('допущ')) {
      status = 'Допущенные';
    } else {
      status = foundPackage.status;
    }

    let processedRowIndex: number | undefined;
    let isExcess = false;

    // Для ID отправления и номера отправления - особая логика
    if (scannedField === 'shipmentId' || scannedField === 'shipmentNumber') {
      // Найдем первую свободную строку среди всех совпадений
      const availableRow = allMatches.find(match => !processedRows.has(match.index));
      
      if (availableRow) {
        processedRowIndex = availableRow.index;
      } else {
        // Все строки уже заполнены - это излишки
        isExcess = true;
        status = 'Излишки';
      }
    } else {
      // Для штрихкода и номера коробки - обычная логика
      const packageIndex = packages.findIndex(pkg => pkg === foundPackage);
      if (packageIndex !== -1 && !processedRows.has(packageIndex)) {
        processedRowIndex = packageIndex;
      } else {
        isExcess = true;
        status = 'Излишки';
      }
    }
    
    const scanResult: ScanResult = {
      scannedValue,
      packageInfo: foundPackage,
      timestamp: new Date(),
      status,
      isExcess,
      scannedField,
      processedRowIndex
    };
    
    addScanResult(scanResult);
    
    // Show notification
    if (isExcess) {
      toast({
        title: "⚠️ Излишки",
        description: `Все строки для этого ${scannedField === 'shipmentId' ? 'ID отправления' : 'номера отправления'} уже обработаны`,
        variant: "destructive",
      });
    } else {
      if (status === 'Недопущенные') {
        toast({
          title: "❌ Недопущенные",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - недопущена к отправке`,
          variant: "destructive",
        });
      } else if (status === 'Перелимит') {
        toast({
          title: "❌ Перелимит",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - превышен лимит`,
          variant: "destructive",
        });
      } else if (status === 'Досмотр') {
        toast({
          title: "⚠️ Досмотр",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - требуется досмотр`,
          variant: "destructive",
        });
      } else if (status === 'Допущенные') {
        toast({
          title: "✅ Допущенные",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - допущена к отправке`,
        });
      } else {
        toast({
          title: "ℹ️ Статус",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - ${foundPackage.status}`,
        });
      }
    }

    return { packageInfo: foundPackage, scannedValue };
  }, [packages, isScanning, processedRows, addScanResult, toast]);

  return { handleBarcodeScanned };
};
