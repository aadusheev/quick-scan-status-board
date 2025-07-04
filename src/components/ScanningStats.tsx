
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, AlertTriangle, Package } from 'lucide-react';
import { ScanResult } from '@/hooks/useScanningMode';

interface ScanningStatsProps {
  scanResults: ScanResult[];
}

interface StatusStats {
  [key: string]: {
    count: number;
    icon: React.ComponentType<any>;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    color: string;
  };
}

export const ScanningStats: React.FC<ScanningStatsProps> = ({ scanResults }) => {
  // Подсчитываем статистику по статусам
  const getStatusStats = (): StatusStats => {
    const stats: StatusStats = {
      'Допущенные': { count: 0, icon: CheckCircle, variant: 'default', color: 'text-green-600' },
      'Недопущенные': { count: 0, icon: X, variant: 'destructive', color: 'text-red-600' },
      'Перелимит': { count: 0, icon: X, variant: 'destructive', color: 'text-red-600' },
      'Досмотр': { count: 0, icon: AlertTriangle, variant: 'secondary', color: 'text-yellow-600' },
      'Излишки': { count: 0, icon: Package, variant: 'outline', color: 'text-orange-600' },
    };

    scanResults.forEach(result => {
      const status = result.status;
      if (stats[status]) {
        stats[status].count++;
      } else {
        // Для неизвестных статусов создаем запись
        stats[status] = { 
          count: 1, 
          icon: Package, 
          variant: 'outline', 
          color: 'text-blue-600' 
        };
      }
    });

    return stats;
  };

  const statusStats = getStatusStats();
  const totalScanned = scanResults.length;

  if (totalScanned === 0) {
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
            if (stats.count === 0) return null;
            
            const IconComponent = stats.icon;
            
            return (
              <div key={status} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <div className={`flex items-center gap-2 mb-2 ${stats.color}`}>
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium text-sm">{status}</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats.count}
                </div>
                <Badge variant={stats.variant} className="mt-1 text-xs">
                  {((stats.count / totalScanned) * 100).toFixed(1)}%
                </Badge>
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
