
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ScanningControlsProps {
  isScanning: boolean;
  hasPackages: boolean;
  scanCount: number;
  onStartScanning: () => void;
  onStopScanning: () => void;
  onExportResults: () => void;
}

export const ScanningControls: React.FC<ScanningControlsProps> = ({
  isScanning,
  hasPackages,
  scanCount,
  onStartScanning,
  onStopScanning,
  onExportResults
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Режим сканирования
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={isScanning ? "default" : "secondary"}>
                {isScanning ? "Сканирование активно" : "Сканирование остановлено"}
              </Badge>
              {isScanning && (
                <span className="text-sm text-gray-600">
                  Отсканировано: {scanCount}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isScanning ? (
            <Button
              onClick={onStartScanning}
              disabled={!hasPackages}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Начать сканирование
            </Button>
          ) : (
            <>
              <Button
                onClick={onStopScanning}
                variant="destructive"
                size="lg"
              >
                <Square className="w-5 h-5 mr-2" />
                Завершить сканирование
              </Button>
            </>
          )}
          
          {!isScanning && scanCount > 0 && (
            <Button
              onClick={onExportResults}
              variant="outline"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Скачать отчёт
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
