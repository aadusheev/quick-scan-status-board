
import { useState, useCallback } from 'react';
import { parseExcelFile } from '@/utils/excelParser';
import { PackageInfo } from '@/components/StatusDisplay';
import { useToast } from '@/hooks/use-toast';

export const useFileUpload = (
  isScanning: boolean,
  setPackages: (packages: PackageInfo[]) => void,
  clearSession: () => void
) => {
  const [hasFile, setHasFile] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (file: File) => {
    // Блокируем загрузку нового файла во время активного сканирования
    if (isScanning) {
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
    }
  }, [isScanning, setPackages, clearSession, toast]);

  const resetFile = useCallback(() => {
    setHasFile(false);
  }, []);

  return {
    hasFile,
    handleFileUpload,
    resetFile
  };
};
