
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
        
        // Ищем возможные варианты названий колонок
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
        
        const barcodeColumn = findColumn(['штрихкод', 'штрих-код', 'barcode', 'код']);
        const boxColumn = findColumn(['номер коробки', 'коробка', 'box']);
        const shipmentIdColumn = findColumn(['id отправления', 'id']);
        const shipmentNumberColumn = findColumn(['номер отправления', 'отправление', 'shipment']);
        const statusColumn = findColumn(['статус', 'status']);
        
        console.log('Found columns:', {
          barcode: barcodeColumn,
          box: boxColumn,
          shipmentId: shipmentIdColumn,
          shipmentNumber: shipmentNumberColumn,
          status: statusColumn
        });
        
        if (!barcodeColumn) {
          console.error('Barcode column not found. Available columns:', Object.keys(firstRow));
          reject(new Error('Не найдена колонка со штрихкодом. Проверьте названия колонок в Excel файле.'));
          return;
        }
        
        // Преобразуем в нужный формат
        const packages: PackageInfo[] = jsonData
          .filter(row => {
            const barcode = row[barcodeColumn!];
            return barcode && barcode.toString().trim() !== '';
          })
          .map(row => ({
            boxNumber: boxColumn ? row[boxColumn]?.toString() || '' : '',
            shipmentId: shipmentIdColumn ? row[shipmentIdColumn]?.toString() || '' : '',
            shipmentNumber: shipmentNumberColumn ? row[shipmentNumberColumn]?.toString() || '' : '',
            barcode: row[barcodeColumn!]?.toString() || '',
            status: statusColumn ? row[statusColumn]?.toString() || 'Неизвестен' : 'Неизвестен'
          }));
        
        console.log('Processed packages:', packages);
        console.log('Total packages processed:', packages.length);
        
        if (packages.length === 0) {
          reject(new Error('В файле не найдено строк с заполненными штрихкодами'));
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

export const findPackageByBarcode = (packages: PackageInfo[], barcode: string): PackageInfo | null => {
  const normalizedBarcode = barcode.trim().toLowerCase();
  
  const found = packages.find(pkg => 
    pkg.barcode.toLowerCase() === normalizedBarcode
  );
  
  console.log('Searching for barcode:', normalizedBarcode);
  console.log('Available barcodes:', packages.map(p => p.barcode));
  console.log('Found package:', found);
  
  return found || null;
};
