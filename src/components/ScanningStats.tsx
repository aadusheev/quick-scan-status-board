
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, X, AlertTriangle, Package } from 'lucide-react';
import { ScanResult } from '@/hooks/useScanningMode';
import { PackageInfo } from '@/components/StatusDisplay';

interface ScanningStatsProps {
  scanResults: ScanResult[];
  packages: PackageInfo[];
}

interface StatusStats {
  [key: string]: {
    scanned: number;
    total: number;
    icon: React.ComponentType<any>;
    color: string;
  };
}

export const ScanningStats: React.FC<ScanningStatsProps> = ({ scanResults, packages }) => {
  // Подсчитываем общую статистику по статусам из реестра
  const getTotalStats = (): { [key: string]: number } => {
    const totalStats: { [key: string]: number } = {};
    
    packages.forEach(pkg => {
      const normalizedStatus = pkg.status.toLowerCase().trim();
      let status: string;
      
      if (normalizedStatus === 'недопущенные' || normalizedStatus === 'недопущен' || normalizedStatus.includes('недопущ')) {
        status = 'Недопущенные';
      } else if (normalizedStatus === 'перелимит' || normalizedStatus.includes('перелимит')) {
        status = 'Перелимит';
      } else if (normalizedStatus === 'досмотр' || normalizedStatus.includes('досмотр')) {
        status = 'Досмотр';
      } else if (normalizedStatus === '0' || normalizedStatus === 'допущенные' || normalizedStatus === 'допущен' || normalizedStatus.includes('допущ')) {
        status = 'Допущенные';
      } else {
        status = pkg.status;
      }
      
      totalStats[status] = (totalStats[status] || 0) + 1;
    });
    
    return totalStats;
  };

  // Подсчитываем статистику отсканированных
  const getScannedStats = (): { [key: string]: number } => {
    const scannedStats: { [key: string]: number } = {};
    
    scanResults.forEach(result => {
      const status = result.status;
      scannedStats[status] = (scannedStats[status] || 0) + 1;
    });
    
    return scannedStats;
  };

  // Объединяем статистику
  const getStatusStats = (): StatusStats => {
    const totalStats = getTotalStats();
    const scannedStats = getScannedStats();
    const stats: StatusStats = {};

    // Добавляем все статусы из реестра
    Object.keys(totalStats).forEach(status => {
      let icon = Package;
      let color = 'text-blue-600';

      if (status === 'Допущенные') {
        icon = CheckCircle;
        color = 'text-green-600';
      } else if (status === 'Недопущенные' || status === 'Перелимит') {
        icon = X;
        color = 'text-red-600';
      } else if (status === 'Досмотр') {
        icon = AlertTriangle;
        color = 'text-yellow-600';
      }

      stats[status] = {
        scanned: scannedStats[status] || 0,
        total: totalStats[status],
        icon,
        color
      };
    });

    // Добавляем излишки если есть
    if (scannedStats['Излишки']) {
      stats['Излишки'] = {
        scanned: scannedStats['Излишки'],
        total: 0,
        icon: Package,
        color: 'text-orange-600'
      };
    }

    return stats;
  };

  const statusStats = getStatusStats();
  const totalScanned = scanResults.length;

  if (packages.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Статистика сканирования
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(statusStats).map(([status, stats]) => {
            const IconComponent = stats.icon;
            
            return (
              <div key={status} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <div className={`flex items-center gap-2 mb-2 ${stats.color}`}>
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium text-sm">{status}</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {status === 'Излишки' ? stats.scanned : `${stats.scanned}/${stats.total}`}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Всего отсканировано:</span>
            <span className="font-semibold text-lg text-gray-800">{totalScanned}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
