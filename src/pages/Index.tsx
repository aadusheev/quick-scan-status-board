
import React from 'react';
import { FileUpload } from '@/components/FileUpload';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { StatusDisplay } from '@/components/StatusDisplay';
import { ScanningControls } from '@/components/ScanningControls';
import { useScanningMode } from '@/hooks/useScanningMode';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useBarcodeScanning } from '@/hooks/useBarcodeScanning';
import { useScanningControls } from '@/hooks/useScanningControls';

const Index = () => {
  const {
    scanningState,
    startScanning,
    stopScanning,
    addScanResult,
    setPackages,
    clearSession
  } = useScanningMode();

  const {
    hasFile,
    handleFileUpload,
    resetFile
  } = useFileUpload(scanningState.isActive, setPackages, clearSession);

  const {
    currentPackage,
    lastScannedCode,
    handleBarcodeScanned,
    clearCurrentScan
  } = useBarcodeScanning(
    scanningState.packages,
    scanningState.isActive,
    scanningState.processedPackageIndices,
    addScanResult
  );

  const {
    handleStartScanning,
    handleStopScanning,
    handleExportResults
  } = useScanningControls(
    scanningState.packages,
    scanningState.scanResults,
    startScanning,
    stopScanning,
    clearSession,
    resetFile,
    clearCurrentScan
  );

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
