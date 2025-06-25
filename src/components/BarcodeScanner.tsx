
import React, { useState, useEffect } from 'react';
import { Scan } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!disabled) {
      // Автофокус на поле ввода для сканера
      const input = document.getElementById('barcode-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  }, [disabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Если введено достаточно символов (обычно штрихкод длинный)
    if (value.length >= 8) {
      setIsActive(true);
      onScan(value);
      // Очищаем поле после сканирования
      setTimeout(() => {
        setInputValue('');
        setIsActive(false);
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      setIsActive(true);
      onScan(inputValue.trim());
      setInputValue('');
      setTimeout(() => setIsActive(false), 100);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-8 mb-6 transition-all duration-200 ${
      isActive ? 'ring-4 ring-blue-500 bg-blue-50' : ''
    }`}>
      <div className="flex items-center justify-center space-x-4">
        <Scan className={`w-12 h-12 transition-colors ${
          disabled ? 'text-gray-400' : isActive ? 'text-blue-600' : 'text-gray-600'
        }`} />
        <div className="flex-1 max-w-md">
          <label htmlFor="barcode-input" className="block text-lg font-semibold text-gray-800 mb-2">
            Сканировать код
          </label>
          <input
            id="barcode-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder={disabled ? "Сначала загрузите файл" : "Штрихкод, номер коробки или ID отправления"}
            className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none transition-colors ${
              disabled 
                ? 'bg-gray-100 border-gray-300 text-gray-500' 
                : isActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 focus:border-blue-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
