
import * as XLSX from 'xlsx';
import { PackageInfo } from '@/components/StatusDisplay';
import { ScanResult } from '@/hooks/useScanningMode';

export const exportScanningResults = (
  originalPackages: PackageInfo[],
  scanResults: ScanResult[]
) => {
  // Создаем map для быстрого поиска результатов сканирования по конкретному полю
  const scanResultsMap = new Map<string, ScanResult>();
  
  scanResults.forEach(result => {
    if (result.packageInfo && result.scannedField) {
      // Создаем ключ на основе отсканированного поля
      let key = '';
      switch (result.scannedField) {
        case 'barcode':
          key = `barcode_${result.packageInfo.barcode}`;
          break;
        case 'boxNumber':
          key = `boxNumber_${result.packageInfo.boxNumber}`;
          break;
        case 'shipmentId':
          key = `shipmentId_${result.packageInfo.shipmentId}`;
          break;
        case 'shipmentNumber':
          key = `shipmentNumber_${result.packageInfo.shipmentNumber}`;
          break;
      }
      
      if (key) {
        scanResultsMap.set(key, result);
      }
    }
  });

  // Подготавливаем данные для экспорта
  const exportData = originalPackages.map(pkg => {
    // Ищем результат сканирования для этого пакета по всем возможным ключам
    let scanResult: ScanResult | undefined;
    
    const possibleKeys = [
      `barcode_${pkg.barcode}`,
      `boxNumber_${pkg.boxNumber}`,
      `shipmentId_${pkg.shipmentId}`,
      `shipmentNumber_${pkg.shipmentNumber}`
    ].filter(key => key.split('_')[1]); // убираем ключи с пустыми значениями
    
    for (const key of possibleKeys) {
      scanResult = scanResultsMap.get(key);
      if (scanResult) break;
    }

    return {
      'Номер коробки': pkg.boxNumber || '',
      'ID отправления': pkg.shipmentId || '',
      'Номер отправления': pkg.shipmentNumber || '',
      'Штрихкод': pkg.barcode || '',
      'Статус отправления': pkg.status || '',
      'Статус сканирования': scanResult?.status || 'Не отсканировано',
      'Время сканирования': scanResult?.timestamp ? 
        scanResult.timestamp.toLocaleString('ru-RU') : ''
    };
  });

  // Добавляем излишки
  scanResults
    .filter(result => result.isExcess)
    .forEach(result => {
      exportData.push({
        'Номер коробки': '',
        'ID отправления': '',
        'Номер отправления': '',
        'Штрихкод': result.scannedValue,
        'Статус отправления': '',
        'Статус сканирования': 'Излишки',
        'Время сканирования': result.timestamp.toLocaleString('ru-RU')
      });
    });

  // Создаем workbook и worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Добавляем worksheet в workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Результаты сканирования');

  // Генерируем имя файла с текущей датой
  const now = new Date();
  const filename = `scan_results_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.xlsx`;

  // Скачиваем файл
  XLSX.writeFile(wb, filename);
};
