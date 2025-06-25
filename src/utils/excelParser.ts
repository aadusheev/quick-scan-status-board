
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
        
        // Конвертируем в JSON
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Parsed Excel data:', jsonData);
        
        // Преобразуем в нужный формат
        const packages: PackageInfo[] = jsonData
          .filter(row => row['Штрихкод']) // Фильтруем строки без штрихкода
          .map(row => ({
            boxNumber: row['Номер коробки']?.toString() || '',
            shipmentId: row['ID отправления']?.toString() || '',
            shipmentNumber: row['Номер отправления']?.toString() || '',
            barcode: row['Штрихкод']?.toString() || '',
            status: row['Статус отправления']?.toString() || 'Неизвестен'
          }));
        
        console.log('Processed packages:', packages);
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

export const findPackageByBarcode = (packages: PackageInfo[], barcode: string): PackageInfo | null => {
  const normalizedBarcode = barcode.trim().toLowerCase();
  
  const found = packages.find(pkg => 
    pkg.barcode.toLowerCase() === normalizedBarcode
  );
  
  console.log('Searching for barcode:', normalizedBarcode);
  console.log('Found package:', found);
  
  return found || null;
};
