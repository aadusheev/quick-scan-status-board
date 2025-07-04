import React, { useState, useCallback } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { StatusDisplay, PackageInfo } from '@/components/StatusDisplay';
import { ScanningControls } from '@/components/ScanningControls';
import { ScanningStats } from '@/components/ScanningStats';
import { parseExcelFile } from '@/utils/excelParser';
import { exportScanningResults } from '@/utils/excelExporter';
import { useScanningMode } from '@/hooks/useScanningMode';
import { useBarcodeScanning } from '@/hooks/useBarcodeScanning';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentPackage, setCurrentPackage] = useState<PackageInfo | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [hasFile, setHasFile] = useState(false);
  const [forceStatsRefresh, setForceStatsRefresh] = useState(0);
  const { toast } = useToast();
  
  const {
    scanningState,
    startScanning,
    stopScanning,
    addScanResult,
    setPackages,
    clearSession
  } = useScanningMode();

  const { handleBarcodeScanned: processBarcodeScanned } = useBarcodeScanning(
    scanningState.packages,
    scanningState.isActive,
    scanningState.processedRows,
    addScanResult
  );

  const handleFileUpload = async (file: File) => {
    try {
      console.log('Starting file upload:', file.name, file.size, 'bytes');
      
      // Принудительно очищаем абсолютно все данные перед загрузкой нового файла
      console.log('Clearing all session data before new file upload');
      
      // Сначала очищаем localStorage
      localStorage.removeItem('scanning-session');
      
      // Затем очищаем состояние
      clearSession();
      setCurrentPackage(null);
      setLastScannedCode('');
      setHasFile(false);
      
      // Принудительно обновляем компонент статистики
      setForceStatsRefresh(prev => prev + 1);
      
      // Ждем, чтобы состояние успело обновиться
      await new Promise(resolve => setTimeout(resolve, 100));
      
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

      // Устанавливаем новые пакеты (это создаст новую сессию)
      setPackages(parsedPackages);
      setHasFile(true);
      
      // Еще раз принудительно обновляем статистику
      setForceStatsRefresh(prev => prev + 1);
      
      toast({
        title: "Файл загружен",
        description: `Успешно обработано ${parsedPackages.length} записей. Готов к началу сканирования.`,
      });

      console.log('New session started with packages:', parsedPackages.length);
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      toast({
        title: "Ошибка загрузки файла",
        description: errorMessage,
        variant: "destructive",
      });
      
      // При ошибке также очищаем все данные
      localStorage.removeItem('scanning-session');
      clearSession();
      setHasFile(false);
      setCurrentPackage(null);
      setLastScannedCode('');
      setForceStatsRefresh(prev => prev + 1);
    }
  };

  const handleBarcodeScanned = useCallback((scannedValue: string) => {
    const result = processBarcodeScanned(scannedValue);
    setCurrentPackage(result.packageInfo);
    setLastScannedCode(result.scannedValue);
  }, [processBarcodeScanned]);

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

        {/* Статистика сканирования */}
        {hasPackagesLoaded && (
          <div className="mb-6" key={forceStatsRefresh}>
            <ScanningStats 
              scanResults={scanningState.scanResults} 
              packages={currentPackages}
            />
          </div>
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
