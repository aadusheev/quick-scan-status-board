
import React, { useState, useCallback } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { StatusDisplay, PackageInfo } from '@/components/StatusDisplay';
import { ScanningControls } from '@/components/ScanningControls';
import { parseExcelFile, findPackageByBarcode } from '@/utils/excelParser';
import { exportScanningResults } from '@/utils/excelExporter';
import { useScanningMode, ScanResult } from '@/hooks/useScanningMode';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentPackage, setCurrentPackage] = useState<PackageInfo | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [hasFile, setHasFile] = useState(false);
  const { toast } = useToast();
  
  const {
    scanningState,
    startScanning,
    stopScanning,
    addScanResult,
    setPackages,
    clearSession
  } = useScanningMode();

  const handleFileUpload = async (file: File) => {
    // Блокируем загрузку нового файла во время активного сканирования
    if (scanningState.isActive) {
      toast({
        title: "Ошибка",
        description: "Завершите текущее сканирование перед загрузкой нового файла",
        variant: "destructive",
      });
      return;
    }

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
          description: "В файле не найдено данных о посылках с заполненными полями для поиска",
          variant: "destructive",
        });
        return;
      }

      // Очищаем предыдущую сессию и устанавливаем новые пакеты
      clearSession();
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
      
      setHasFile(false);
      setCurrentPackage(null);
      setLastScannedCode('');
    }
  };

  const handleBarcodeScanned = useCallback((scannedValue: string) => {
    console.log('Scanned value:', scannedValue);
    setLastScannedCode(scannedValue);
    
    const foundPackage = findPackageByBarcode(scanningState.packages, scannedValue);
    setCurrentPackage(foundPackage);
    
    // Если сканирование активно, записываем результат
    if (scanningState.isActive) {
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
    }
    
    // Показываем уведомление
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
      // Показываем статус "Излишки"
      toast({
        title: "⚠️ Излишки",
        description: `Значение ${scannedValue} не найдено в базе - отмечено как излишки`,
        variant: "destructive",
      });
    }
  }, [scanningState.packages, scanningState.isActive, addScanResult, toast]);

  const handleStartScanning = () => {
    startScanning();
    toast({
      title: "Сканирование запущено",
      description: "Режим сканирования активирован",
    });
  };

  const handleStopScanning = () => {
    stopScanning();
    toast({
      title: "Сканирование завершено",
      description: "Режим сканирования остановлен",
    });
  };

  const handleExportResults = () => {
    try {
      exportScanningResults(scanningState.packages, scanningState.scanResults);
      clearSession();
      setHasFile(false);
      setCurrentPackage(null);
      setLastScannedCode('');
      
      toast({
        title: "Отчёт экспортирован",
        description: "Файл успешно скачан, данные сканирования очищены",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось создать файл отчёта",
        variant: "destructive",
      });
    }
  };

  // Определяем, есть ли загруженные пакеты (из состояния или текущей загрузки)
  const hasPackagesLoaded = hasFile || scanningState.packages.length > 0;
  const currentPackages = scanningState.packages.length > 0 ? scanningState.packages : [];

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
        <FileUpload 
          onFileUpload={handleFileUpload} 
          hasFile={hasPackagesLoaded}
        />

        {/* Управление сканированием */}
        {hasPackagesLoaded && (
          <ScanningControls
            isScanning={scanningState.isActive}
            hasPackages={currentPackages.length > 0}
            scanCount={scanningState.scanResults.length}
            onStartScanning={handleStartScanning}
            onStopScanning={handleStopScanning}
            onExportResults={handleExportResults}
          />
        )}

        {/* Сканер штрихкодов */}
        <BarcodeScanner 
          onScan={handleBarcodeScanned} 
          disabled={!hasPackagesLoaded}
        />

        {/* Отображение статуса */}
        <StatusDisplay 
          packageInfo={currentPackage}
          lastScannedCode={lastScannedCode}
        />

        {/* Информация о загруженных данных */}
        {hasPackagesLoaded && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Загружено записей: {currentPackages.length}</span>
              <span>Готов к сканированию по штрихкоду, номеру коробки или ID отправления</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
