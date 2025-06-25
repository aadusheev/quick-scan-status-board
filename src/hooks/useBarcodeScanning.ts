
import { useCallback } from 'react';
import { PackageInfo } from '@/components/StatusDisplay';
import { findPackageByBarcode } from '@/utils/excelParser';
import { ScanResult } from '@/hooks/useScanningMode';
import { useToast } from '@/hooks/use-toast';

export const useBarcodeScanning = (
  packages: PackageInfo[],
  isScanning: boolean,
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
    
    const foundPackage = findPackageByBarcode(packages, scannedValue);
    
    // If scanning is active, record the result
    let status: string;
    let isExcess = false;
    
    if (foundPackage) {
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
    } else {
      status = 'Излишки';
      isExcess = true;
    }
    
    const scanResult: ScanResult = {
      scannedValue,
      packageInfo: foundPackage,
      timestamp: new Date(),
      status,
      isExcess
    };
    
    addScanResult(scanResult);
    
    // Show notification
    if (foundPackage) {
      const status = foundPackage.status.toLowerCase().trim();
      
      console.log('Toast logic - original status:', `"${foundPackage.status}"`, 'normalized:', `"${status}"`);
      
      if (status === 'недопущенные' || status === 'недопущен' || status.includes('недопущ')) {
        toast({
          title: "❌ Недопущенные",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - недопущена к отправке`,
          variant: "destructive",
        });
      } else if (status === 'перелимит' || status.includes('перелимит')) {
        toast({
          title: "❌ Перелимит",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - превышен лимит`,
          variant: "destructive",
        });
      } else if (status === 'досмотр' || status.includes('досмотр')) {
        toast({
          title: "⚠️ Досмотр",
          description: `Коробка ${foundPackage.boxNumber || 'без номера'} - требуется досмотр`,
          variant: "destructive",
        });
      } else if (status === '0' || status === 'допущенные' || status === 'допущен' || status.includes('допущ')) {
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
    } else {
      // Show "Излишки" status
      toast({
        title: "⚠️ Излишки",
        description: `Значение ${scannedValue} не найдено в базе - отмечено как излишки`,
        variant: "destructive",
      });
    }

    return { packageInfo: foundPackage, scannedValue };
  }, [packages, isScanning, addScanResult, toast]);

  return { handleBarcodeScanned };
};
