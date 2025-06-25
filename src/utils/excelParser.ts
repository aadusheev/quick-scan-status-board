
import * as XLSX from 'xlsx';
import { PackageInfo } from '@/components/StatusDisplay';

export const parseExcelFile = async (file: File): Promise<PackageInfo[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          reject(new Error('Файл должен содержать заголовки и данные'));
          return;
        }

        const headers = jsonData[0] as string[];
        
        // Находим индексы нужных столбцов
        const boxNumberIndex = headers.findIndex(h => 
          h && (h.toLowerCase().includes('коробк') || h.toLowerCase().includes('box'))
        );
        const shipmentIdIndex = headers.findIndex(h => 
          h && (h.toLowerCase().includes('id') && h.toLowerCase().includes('отправ'))
        );
        const shipmentNumberIndex = headers.findIndex(h => 
          h && (h.toLowerCase().includes('номер') && h.toLowerCase().includes('отправ'))
        );
        const barcodeIndex = headers.findIndex(h => 
          h && (h.toLowerCase().includes('штрих') || h.toLowerCase().includes('код') || h.toLowerCase().includes('barcode'))
        );
        const statusIndex = headers.findIndex(h => 
          h && (h.toLowerCase().includes('статус') || h.toLowerCase().includes('status'))
        );

        console.log('Column indices found:', {
          boxNumber: boxNumberIndex,
          shipmentId: shipmentIdIndex, 
          shipmentNumber: shipmentNumberIndex,
          barcode: barcodeIndex,
          status: statusIndex
        });

        const packages: PackageInfo[] = [];
        
        // Обрабатываем каждую строку данных
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          const packageInfo: PackageInfo = {
            boxNumber: boxNumberIndex >= 0 ? String(row[boxNumberIndex] || '').trim() : '',
            shipmentId: shipmentIdIndex >= 0 ? String(row[shipmentIdIndex] || '').trim() : '',
            shipmentNumber: shipmentNumberIndex >= 0 ? String(row[shipmentNumberIndex] || '').trim() : '',
            barcode: barcodeIndex >= 0 ? String(row[barcodeIndex] || '').trim() : '',
            status: statusIndex >= 0 ? String(row[statusIndex] || '').trim() : '',
            rowIndex: i // добавляем индекс строки для отслеживания
          };

          // Включаем запись только если есть хотя бы одно поле для поиска
          if (packageInfo.boxNumber || packageInfo.shipmentId || packageInfo.shipmentNumber || packageInfo.barcode) {
            packages.push(packageInfo);
          }
        }

        console.log('Parsed packages:', packages.length);
        resolve(packages);
        
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(new Error('Ошибка при обработке Excel файла'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Ошибка при чтении файла'));
    };

    reader.readAsBinaryString(file);
  });
};

export const findPackageByBarcode = (packages: PackageInfo[], scannedValue: string): { package: PackageInfo | null, packageIndex: number, allMatches: { package: PackageInfo, index: number }[] } => {
  const normalizedScannedValue = scannedValue.toLowerCase().trim();
  console.log('Searching for:', normalizedScannedValue);
  
  const allMatches: { package: PackageInfo, index: number }[] = [];
  
  packages.forEach((pkg, index) => {
    // Проверяем все поля для поиска
    const fieldsToCheck = [
      pkg.barcode?.toLowerCase().trim(),
      pkg.boxNumber?.toLowerCase().trim(),
      pkg.shipmentId?.toLowerCase().trim(),
      pkg.shipmentNumber?.toLowerCase().trim()
    ].filter(Boolean);

    const isMatch = fieldsToCheck.some(field => {
      if (!field) return false;
      
      // Точное совпадение
      if (field === normalizedScannedValue) return true;
      
      // Частичное совпадение для номеров отправлений
      if (pkg.shipmentNumber && (
        field.includes(normalizedScannedValue) || 
        normalizedScannedValue.includes(field)
      )) {
        return true;
      }
      
      return false;
    });

    if (isMatch) {
      allMatches.push({ package: pkg, index });
    }
  });

  console.log('All matches found:', allMatches.length);
  
  return {
    package: allMatches.length > 0 ? allMatches[0].package : null,
    packageIndex: allMatches.length > 0 ? allMatches[0].index : -1,
    allMatches
  };
};
