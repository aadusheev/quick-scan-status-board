import * as XLSX from 'xlsx';
import { PackageInfo } from '@/components/StatusDisplay';

export interface ExcelRow {
  'Номер коробки'?: string;
  'ID отправления'?: string;  
  'Номер отправления'?: string;
  'Штрихкод'?: string;
  'Статус отправления'?: string;
  [key: string]: any;
}

export interface PackageSearchResult {
  packageInfo: PackageInfo;
  scannedField: string;
  allMatches: Array<{ package: PackageInfo; index: number }>;
}

export const findPackageByBarcode = (packages: PackageInfo[], scannedValue: string): PackageSearchResult | null => {
  const normalizedScannedValue = scannedValue.trim().toLowerCase();
  
  console.log('Searching for scanned value:', normalizedScannedValue);
  
  let foundPackage: PackageInfo | null = null;
  let scannedField = '';
  let allMatches: Array<{ package: PackageInfo; index: number }> = [];
  
  // Ищем все совпадения
  packages.forEach((pkg, index) => {
    // Проверяем штрихкод
    if (pkg.barcode && pkg.barcode.toLowerCase().trim() === normalizedScannedValue) {
      if (!foundPackage) {
        foundPackage = pkg;
        scannedField = 'barcode';
      }
      allMatches.push({ package: pkg, index });
      return;
    }
    
    // Проверяем номер коробки
    if (pkg.boxNumber && pkg.boxNumber.toLowerCase().trim() === normalizedScannedValue) {
      if (!foundPackage) {
        foundPackage = pkg;
        scannedField = 'boxNumber';
      }
      allMatches.push({ package: pkg, index });
      return;
    }
    
    // Проверяем ID отправления
    if (pkg.shipmentId && pkg.shipmentId.toLowerCase().trim() === normalizedScannedValue) {
      if (!foundPackage) {
        foundPackage = pkg;
        scannedField = 'shipmentId';
      }
      allMatches.push({ package: pkg, index });
      return;
    }
    
    // Проверяем номер отправления
    if (pkg.shipmentNumber) {
      const normalizedShipmentNumber = pkg.shipmentNumber.toLowerCase().trim();
      if (normalizedShipmentNumber === normalizedScannedValue || 
          normalizedShipmentNumber.includes(normalizedScannedValue) || 
          normalizedScannedValue.includes(normalizedShipmentNumber)) {
        if (!foundPackage) {
          foundPackage = pkg;
          scannedField = 'shipmentNumber';
        }
        allMatches.push({ package: pkg, index });
        return;
      }
    }
  });
  
  if (!foundPackage) {
    return null;
  }
  
  console.log('Found package:', foundPackage);
  console.log('Scanned field:', scannedField);
  console.log('All matches:', allMatches.length);
  
  return {
    packageInfo: foundPackage,
    scannedField,
    allMatches
  };
};

export const parseExcelFile = async (file: File): Promise<PackageInfo[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Берем первый лист
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        console.log('Available sheets:', workbook.SheetNames);
        console.log('Processing sheet:', firstSheetName);
        
        // Конвертируем в JSON
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Raw Excel data:', jsonData);
        console.log('Number of rows:', jsonData.length);
        
        if (jsonData.length === 0) {
          console.error('No data found in Excel file');
          reject(new Error('Excel файл пустой или не содержит данных'));
          return;
        }
        
        // Проверяем первую строку для анализа колонок
        const firstRow = jsonData[0];
        console.log('First row keys:', Object.keys(firstRow));
        console.log('First row data:', firstRow);
        
        // Ищем возможные варианты названий колонок (русские и английские)
        const findColumn = (possibleNames: string[]) => {
          const keys = Object.keys(firstRow);
          for (const name of possibleNames) {
            const found = keys.find(key => 
              key.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(key.toLowerCase())
            );
            if (found) return found;
          }
          return null;
        };
        
        const barcodeColumn = findColumn([
          'штрихкод', 'штрих-код', 'штрих код', 'barcode', 'код', 'Штрихкод', 'Штрих-код'
        ]);
        const boxColumn = findColumn([
          'номер коробки', 'коробка', 'box', 'Номер коробки', 'коробка'
        ]);
        const shipmentIdColumn = findColumn([
          'id отправления', 'id', 'ID отправления', 'ИД отправления'
        ]);
        const shipmentNumberColumn = findColumn([
          'номер отправления', 'отправление', 'shipment', 'Номер отправления'
        ]);
        const statusColumn = findColumn([
          'статус', 'status', 'Статус', 'статус отправления', 'Статус отправления'
        ]);
        
        console.log('Found columns:', {
          barcode: barcodeColumn,
          box: boxColumn,
          shipmentId: shipmentIdColumn,
          shipmentNumber: shipmentNumberColumn,
          status: statusColumn
        });
        
        // Теперь мы принимаем записи, если есть хотя бы одно из полей: штрихкод, номер коробки или ID отправления
        if (!barcodeColumn && !boxColumn && !shipmentIdColumn) {
          console.error('None of the required columns found. Available columns:', Object.keys(firstRow));
          reject(new Error('Не найдены обязательные колонки. Проверьте названия колонок в Excel файле. Ожидаемые названия: "Штрихкод", "Номер коробки", "ID отправления"'));
          return;
        }
        
        // Преобразуем в нужный формат
        const packages: PackageInfo[] = jsonData
          .filter(row => {
            // Проверяем, что есть хотя бы одно из полей для поиска
            const barcode = barcodeColumn ? row[barcodeColumn] : null;
            const boxNumber = boxColumn ? row[boxColumn] : null;
            const shipmentId = shipmentIdColumn ? row[shipmentIdColumn] : null;
            
            return (barcode && barcode.toString().trim() !== '') ||
                   (boxNumber && boxNumber.toString().trim() !== '') ||
                   (shipmentId && shipmentId.toString().trim() !== '');
          })
          .map(row => ({
            boxNumber: boxColumn ? row[boxColumn]?.toString() || '' : '',
            shipmentId: shipmentIdColumn ? row[shipmentIdColumn]?.toString() || '' : '',
            shipmentNumber: shipmentNumberColumn ? row[shipmentNumberColumn]?.toString() || '' : '',
            barcode: barcodeColumn ? row[barcodeColumn]?.toString() || '' : '',
            status: statusColumn ? row[statusColumn]?.toString() || 'Неизвестен' : 'Неизвестен'
          }));
        
        console.log('Processed packages:', packages);
        console.log('Total packages processed:', packages.length);
        
        if (packages.length === 0) {
          reject(new Error('В файле не найдено строк с заполненными полями для поиска (штрихкод, номер коробки или ID отправления)'));
          return;
        }
        
        resolve(packages);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(new Error(`Ошибка при обработке Excel файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка при чтении файла'));
    };
    
    reader.readAsBinaryString(file);
  });
};
