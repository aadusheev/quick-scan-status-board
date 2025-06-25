
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
  // Определяем какое поле было отсканировано
  const getScannedFieldType = () => {
    if (!packageInfo || !lastScannedCode) return null;
    
    const normalizedScannedValue = lastScannedCode.trim().toLowerCase();
    
    if (packageInfo.barcode && packageInfo.barcode.toLowerCase().trim() === normalizedScannedValue) {
      return 'barcode';
    }
    
    if (packageInfo.boxNumber && packageInfo.boxNumber.toLowerCase().trim() === normalizedScannedValue) {
      return 'boxNumber';
    }
    
    if (packageInfo.shipmentId && packageInfo.shipmentId.toLowerCase().trim() === normalizedScannedValue) {
      return 'shipmentId';
    }
    
    if (packageInfo.shipmentNumber) {
      const normalizedShipmentNumber = packageInfo.shipmentNumber.toLowerCase().trim();
      if (normalizedShipmentNumber === normalizedScannedValue || 
          normalizedShipmentNumber.includes(normalizedScannedValue) || 
          normalizedScannedValue.includes(normalizedShipmentNumber)) {
        return 'shipmentNumber';
      }
    }
    
    return null;
  };

  const getFieldName = (fieldType: string | null) => {
    switch (fieldType) {
      case 'barcode': return 'Штрихкод';
      case 'boxNumber': return 'Номер коробки';
      case 'shipmentId': return 'ID отправления';
      case 'shipmentNumber': return 'Номер отправления';
      default: return 'Неизвестное поле';
    }
  };

  const getStatusConfig = () => {
    if (!packageInfo) {
      return {
        text: 'ИЗЛИШКИ',
        bgColor: 'bg-yellow-400',
        textColor: 'text-black',
        icon: AlertTriangle,
        description: 'Отправление не найдено в базе - излишки'
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
    
    // Перелимит (красный)
    if (status === 'перелимит' || status.includes('перелимит')) {
      return {
        text: 'ПЕРЕЛИМИТ',
        bgColor: 'bg-red-500',
        textColor: 'text-white',
        icon: X,
        description: 'Превышен лимит по посылке'
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
  const scannedFieldType = getScannedFieldType();

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
        {/* Показываем какое поле было отсканировано */}
        {scannedFieldType && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-semibold text-center">
              Отсканировано поле: {getFieldName(scannedFieldType)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Информация о посылке</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Отсканированное значение:</span>
                <span className="font-mono text-lg">{lastScannedCode}</span>
              </div>
              {packageInfo?.barcode && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Штрихкод:</span>
                  <span className={`font-mono ${scannedFieldType === 'barcode' ? 'font-bold text-blue-600' : ''}`}>
                    {packageInfo.barcode}
                  </span>
                </div>
              )}
              {packageInfo?.boxNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Номер коробки:</span>
                  <span className={`font-semibold ${scannedFieldType === 'boxNumber' ? 'font-bold text-blue-600' : ''}`}>
                    {packageInfo.boxNumber}
                  </span>
                </div>
              )}
              {packageInfo?.shipmentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID отправления:</span>
                  <span className={`font-semibold ${scannedFieldType === 'shipmentId' ? 'font-bold text-blue-600' : ''}`}>
                    {packageInfo.shipmentId}
                  </span>
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
                    <span className={`font-semibold ${scannedFieldType === 'shipmentNumber' ? 'font-bold text-blue-600' : ''}`}>
                      {packageInfo.shipmentNumber}
                    </span>
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
