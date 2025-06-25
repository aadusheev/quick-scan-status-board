
import React from 'react';
import { Package, AlertTriangle, X, CheckCircle } from 'lucide-react';

export interface PackageInfo {
  boxNumber?: string;
  shipmentId?: string;
  shipmentNumber?: string;
  barcode: string;
  status: string;
}

interface StatusDisplayProps {
  packageInfo: PackageInfo | null;
  lastScannedCode: string;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ packageInfo, lastScannedCode }) => {
  const getStatusConfig = () => {
    if (!packageInfo) {
      return {
        text: 'НЕ НАЙДЕНО',
        bgColor: 'bg-gray-500',
        textColor: 'text-white',
        icon: X,
        description: 'Штрихкод не найден в загруженном файле'
      };
    }

    const status = packageInfo.status.toLowerCase().trim();
    
    console.log('Processing status:', `"${packageInfo.status}"`, 'normalized:', `"${status}"`);
    
    // Недопущенные (красный) - проверяем ПЕРВЫМИ
    if (status === 'недопущенные' || status === 'недопущен' || status.includes('недопущ')) {
      return {
        text: 'НЕДОПУЩЕННЫЕ',
        bgColor: 'bg-red-500',
        textColor: 'text-white',
        icon: X,
        description: 'Посылка недопущена к отправке'
      };
    }
    
    // Досмотр (желтый)
    if (status === 'досмотр' || status.includes('досмотр')) {
      return {
        text: 'ДОСМОТР',
        bgColor: 'bg-yellow-500',
        textColor: 'text-white',
        icon: AlertTriangle,
        description: 'Требуется досмотр посылки'
      };
    }
    
    // Допущенные (зеленый) - проверяем ПОСЛЕ недопущенных
    if (status === '0' || status === 'допущенные' || status === 'допущен' || status.includes('допущ')) {
      return {
        text: 'ДОПУЩЕННЫЕ',
        bgColor: 'bg-green-500',
        textColor: 'text-white',
        icon: CheckCircle,
        description: 'Посылка допущена к отправке'
      };
    }
    
    // Статус по умолчанию для неизвестных статусов
    return {
      text: packageInfo.status.toUpperCase(),
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      icon: Package,
      description: 'Статус посылки'
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  if (!lastScannedCode) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Package className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <p className="text-2xl text-gray-500 font-medium">
          Отсканируйте штрихкод для проверки статуса
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Основной статус */}
      <div className={`${statusConfig.bgColor} ${statusConfig.textColor} p-12 text-center`}>
        <StatusIcon className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-6xl font-bold mb-2 tracking-wide">
          {statusConfig.text}
        </h1>
        <p className="text-xl opacity-90">
          {statusConfig.description}
        </p>
      </div>

      {/* Информация о посылке */}
      <div className="p-8 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Информация о посылке</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Штрихкод:</span>
                <span className="font-mono text-lg">{lastScannedCode}</span>
              </div>
              {packageInfo?.boxNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Номер коробки:</span>
                  <span className="font-semibold">{packageInfo.boxNumber}</span>
                </div>
              )}
              {packageInfo?.shipmentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID отправления:</span>
                  <span className="font-semibold">{packageInfo.shipmentId}</span>
                </div>
              )}
            </div>
          </div>
          
          {packageInfo && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Детали отправления</h3>
              <div className="space-y-3">
                {packageInfo.shipmentNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Номер отправления:</span>
                    <span className="font-semibold">{packageInfo.shipmentNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Статус:</span>
                  <span className="font-semibold">{packageInfo.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
