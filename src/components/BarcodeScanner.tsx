
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scan, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [showManualHint, setShowManualHint] = useState(false);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputTimeRef = useRef<number>(0);
  const inputSequenceRef = useRef<string>('');

  // Определяем тип ввода по времени между символами
  const detectInputType = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastInputTimeRef.current;
    
    // Если между символами прошло больше 100мс - считаем ручным вводом
    // Сканеры обычно вводят символы очень быстро (< 50мс между символами)
    if (timeDiff > 100 && inputValue.length > 0) {
      setIsManualInput(true);
      setShowManualHint(true);
    } else if (timeDiff < 50 && inputValue.length > 3) {
      // Быстрый ввод нескольких символов - вероятно сканер
      setIsManualInput(false);
      setShowManualHint(false);
    }
    
    lastInputTimeRef.current = now;
  }, [inputValue.length]);

  // Debounce функция для автоматического сканирования
  const debouncedScan = useCallback((value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (value.length >= 8 && !isManualInput) {
        console.log('Auto-scan triggered after debounce:', value);
        setIsActive(true);
        onScan(value);
        setInputValue('');
        setIsActive(false);
        setShowManualHint(false);
      }
    }, 100); // 100мс задержка для завершения сканирования
  }, [onScan, isManualInput]);

  useEffect(() => {
    if (!disabled) {
      const input = document.getElementById('barcode-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  }, [disabled]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Сбрасываем статус активного сканирования
    setIsActive(false);
    
    // Определяем тип ввода
    detectInputType();
    
    // Если поле очищено, сбрасываем все флаги
    if (value.length === 0) {
      setIsManualInput(false);
      setShowManualHint(false);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return;
    }

    // Запускаем debounced проверку только для автоматического ввода
    if (!isManualInput) {
      debouncedScan(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      // Отменяем любые pending debounce таймеры
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      console.log('Manual scan triggered by Enter:', inputValue.trim());
      setIsActive(true);
      onScan(inputValue.trim());
      setInputValue('');
      setIsManualInput(false);
      setShowManualHint(false);
      setTimeout(() => setIsActive(false), 100);
    }
  };

  const handleFocus = () => {
    // При фокусе сбрасываем состояние
    setIsManualInput(false);
    setShowManualHint(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-8 mb-6 transition-all duration-200 ${
      isActive ? 'ring-4 ring-blue-500 bg-blue-50' : ''
    }`}>
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <Scan className={`w-12 h-12 transition-colors ${
            disabled ? 'text-gray-400' : isActive ? 'text-blue-600' : 'text-gray-600'
          }`} />
          {isManualInput && (
            <Keyboard className="w-8 h-8 text-orange-500" />
          )}
        </div>
        
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
            onFocus={handleFocus}
            disabled={disabled}
            placeholder={disabled ? "Сначала загрузите файл" : "Штрихкод, номер коробки или ID отправления"}
            className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none transition-colors ${
              disabled 
                ? 'bg-gray-100 border-gray-300 text-gray-500' 
                : isActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : isManualInput
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          
          {/* Подсказка для ручного ввода */}
          {showManualHint && !disabled && (
            <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded-lg">
              <div className="flex items-center space-x-2">
                <Keyboard className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-orange-700 font-medium">
                  Ручной ввод — нажмите ENTER для завершения
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
