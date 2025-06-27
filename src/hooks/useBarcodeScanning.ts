

import { useCallback } from 'react';
import { PackageInfo } from '@/components/StatusDisplay';
import { findPackageByBarcode } from '@/utils/excelParser';
import { ScanResult } from '@/hooks/useScanningMode';
import { useToast } from '@/hooks/use-toast';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement';

export const useBarcodeScanning = (
  packages: PackageInfo[],
  isScanning: boolean,
  processedRows: Set<number>,
  addScanResult: (result: ScanResult) => void
) => {
  const { toast } = useToast();
  const { announceStatus } = useVoiceAnnouncement();

  const handleBarcodeScanned = useCallback((scannedValue: string) => {
    console.log('=== SCAN START ===');
    console.log('Scanned value:', scannedValue);
    console.log('Is scanning active:', isScanning);
    console.log('Processed rows:', Array.from(processedRows));
    
    // Check if scanning is active
    if (!isScanning) {
      console.log('❌ Scanning not active - showing warning');
      toast({
        title: "❌ Не начато сканирование",
        description: "Нажмите кнопку 'Начать сканирование' перед началом работы",
        variant: "destructive",
      });
      return { packageInfo: null, scannedValue };
    }
    
    const searchResult = findPackageByBarcode(packages, scannedValue);
    console.log('Search result:', searchResult);
    
    if (!searchResult) {
      console.log('❌ Package not found - marking as excess');
      // Не найдено в базе - излишки
      const scanResult: ScanResult = {
        scannedValue,
        packageInfo: null,
        timestamp: new Date(),
        status: 'Излишки',
        isExcess: true
      };
      
      addScanResult(scanResult);
      
      // Голосовое оповещение для излишков
      announceStatus('излишки');
      
      toast({
        title: "⚠️ Излишки",
        description: `Значение ${scannedValue} не найдено в базе - отмечено как излишки`,
        variant: "destructive",
      });
      
      console.log('=== SCAN END (EXCESS) ===');
      return { packageInfo: null, scannedValue };
    }

    const { packageInfo: foundPackage, scannedField, allMatches } = searchResult;
    console.log('Found package:', foundPackage);
    console.log('Scanned field:', scannedField);
    console.log('All matches count:', allMatches.length);
    
    // Определяем статус
    let status: string;
    const normalizedStatus = foundPackage.status.toLowerCase().trim();
    console.log('Original status:', foundPackage.status, '| Normalized:', normalizedStatus);
    
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

    console.log('Determined status:', status);

    let processedRowIndex: number | undefined;
    let isExcess = false;

    // Для ID отправления и номера отправления - особая логика
    if (scannedField === 'shipmentId' || scannedField === 'shipmentNumber') {
      console.log('Processing shipment ID/Number logic');
      console.log('All matches for this field:', allMatches.map(m => ({ index: m.index, processed: processedRows.has(m.index) })));
      
      // Найдем первую свободную строку среди всех совпадений
      const availableRow = allMatches.find(match => !processedRows.has(match.index));
      
      if (availableRow) {
        processedRowIndex = availableRow.index;
        console.log('Found available row:', processedRowIndex);
      } else {
        // Все строки уже заполнены - это излишки
        isExcess = true;
        status = 'Излишки';
        console.log('All rows processed - marking as excess');
      }
    } else {
      console.log('Processing barcode/boxNumber logic');
      // Для штрихкода и номера коробки - обычная логика
      const packageIndex = packages.findIndex(pkg => pkg === foundPackage);
      console.log('Package index:', packageIndex, '| Already processed:', processedRows.has(packageIndex));
      
      if (packageIndex !== -1 && !processedRows.has(packageIndex)) {
        processedRowIndex = packageIndex;
      } else {
        isExcess = true;
        status = 'Излишки';
        console.log('Package already processed or not found - marking as excess');
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
    
    console.log('Final scan result:', scanResult);
    
    addScanResult(scanResult);
    
    // Голосовое оповещение для статуса
    announceStatus(status);
    
    // Show notification
    if (isExcess) {
      console.log('Showing excess notification');
      toast({
        title: "⚠️ Излишки",
        description: `Все строки для этого ${scannedField === 'shipmentId' ? 'ID отправления' : 'номера отправления'} уже обработаны`,
        variant: "destructive",
      });
    } else {
      console.log('Showing status notification:', status);
      if (status === 'Недопущенные') {
        toast({
          title: "❌ Недопущенные",
          description: `Код ${scannedValue} - недопущен к отправке`,
          variant: "destructive",
        });
      } else if (status === 'Перелимит') {
        toast({
          title: "❌ Перелимит",
          description: `Код ${scannedValue} - превышен лимит`,
          variant: "destructive",
        });
      } else if (status === 'Досмотр') {
        toast({
          title: "⚠️ Досмотр",
          description: `Код ${scannedValue} - требуется досмотр`,
          variant: "destructive",
        });
      } else if (status === 'Допущенные') {
        toast({
          title: "✅ Допущенные",
          description: `Код ${scannedValue} - допущен к отправке`,
        });
      } else {
        toast({
          title: "ℹ️ Статус",
          description: `Код ${scannedValue} - ${foundPackage.status}`,
        });
      }
    }

    console.log('=== SCAN END ===');
    return { packageInfo: foundPackage, scannedValue };
  }, [packages, isScanning, processedRows, addScanResult, toast, announceStatus]);

  return { handleBarcodeScanned };
};

