
import * as XLSX from 'xlsx';
import { PackageInfo } from '@/components/StatusDisplay';
import { ScanResult } from '@/hooks/useScanningMode';

export const exportScanningResults = (
  originalPackages: PackageInfo[],
  scanResults: ScanResult[]
) => {
  // Создаем map для быстрого поиска результатов сканирования по индексу строки
  const scanResultsByIndex = new Map<number, ScanResult>();
  
  scanResults.forEach(result => {
    if (result.processedRowIndex !== undefined) {
      scanResultsByIndex.set(result.processedRowIndex, result);
    }
  });

  // Подготавливаем данные для экспорта
  const exportData = originalPackages.map((pkg, index) => {
    const scanResult = scanResultsByIndex.get(index);

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
