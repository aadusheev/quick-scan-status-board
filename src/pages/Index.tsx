import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { StatusDisplay, PackageInfo } from '@/components/StatusDisplay';
import { parseExcelFile, findPackageByBarcode } from '@/utils/excelParser';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [currentPackage, setCurrentPackage] = useState<PackageInfo | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [hasFile, setHasFile] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      console.log('Starting file upload:', file.name, file.size, 'bytes');
      
      toast({
        title: "Загрузка файла",
        description: "Обработка Excel файла...",
      });

      const parsedPackages = await parseExcelFile(file);
      
      console.log('File parsed successfully, packages:', parsedPackages.length);
      
      if (parsedPackages.length === 0) {
        toast({
          title: "Предупреждение",
          description: "В файле не найдено данных о посылках с заполненными штрихкодами",
          variant: "destructive",
        });
        return;
      }

      setPackages(parsedPackages);
      setHasFile(true);
      setCurrentPackage(null);
      setLastScannedCode('');
      
      toast({
        title: "Файл загружен",
        description: `Успешно обработано ${parsedPackages.length} записей`,
      });

      console.log('Loaded packages:', parsedPackages);
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      toast({
        title: "Ошибка загрузки файла",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Сбрасываем состояние при ошибке
      setPackages([]);
      setHasFile(false);
      setCurrentPackage(null);
      setLastScannedCode('');
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    console.log('Scanned barcode:', barcode);
    setLastScannedCode(barcode);
    
    const foundPackage = findPackageByBarcode(packages, barcode);
    setCurrentPackage(foundPackage);
    
    // Показываем уведомление с исправленной логикой статусов
    if (foundPackage) {
      const status = foundPackage.status.toLowerCase().trim();
      
      console.log('Toast logic - original status:', `"${foundPackage.status}"`, 'normalized:', `"${status}"`);
      
      // Недопущенные - проверяем ПЕРВЫМИ
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
      toast({
        title: "❌ Не найдено",
        description: `Штрихкод ${barcode} не найден в базе`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Система сканирования посылок
          </h1>
          <p className="text-lg text-gray-600">
            Внутренний сервис логистического склада
          </p>
        </div>

        {/* Загрузка файла */}
        <FileUpload onFileUpload={handleFileUpload} hasFile={hasFile} />

        {/* Сканер штрихкодов */}
        <BarcodeScanner 
          onScan={handleBarcodeScanned} 
          disabled={!hasFile}
        />

        {/* Отображение статуса */}
        <StatusDisplay 
          packageInfo={currentPackage}
          lastScannedCode={lastScannedCode}
        />

        {/* Информация о загруженных данных */}
        {hasFile && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Загружено записей: {packages.length}</span>
              <span>Готов к сканированию</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
