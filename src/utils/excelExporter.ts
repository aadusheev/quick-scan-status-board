
import * as XLSX from 'xlsx';
import { PackageInfo } from '@/components/StatusDisplay';
import { ScanResult } from '@/hooks/useScanningMode';

export const exportScanningResults = (
  originalPackages: PackageInfo[],
  scanResults: ScanResult[]
) => {
  // Создаем map для быстрого поиска результатов сканирования
  const scanResultsMap = new Map<string, ScanResult>();
  
  scanResults.forEach(result => {
    if (result.packageInfo) {
      // Используем уникальные идентификаторы для поиска
      const keys = [
        result.packageInfo.barcode,
        result.packageInfo.boxNumber,
        result.packageInfo.shipmentId,
        result.packageInfo.shipmentNumber
      ].filter(Boolean);
      
      keys.forEach(key => {
        if (key) {
          scanResultsMap.set(key.toLowerCase().trim(), result);
        }
      });
    }
  });

  // Подготавливаем данные для экспорта
  const exportData = originalPackages.map(pkg => {
    // Ищем результат сканирования для этого пакета
    const scanResult = [
      pkg.barcode,
      pkg.boxNumber,
      pkg.shipmentId,
      pkg.shipmentNumber
    ]
      .filter(Boolean)
      .map(key => scanResultsMap.get(key!.toLowerCase().trim()))
      .find(result => result !== undefined);

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
