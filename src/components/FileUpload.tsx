
import React, { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  hasFile: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, hasFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {hasFile ? 'Файл загружен' : 'Загрузить реестр отправлений'}
            </h3>
            <p className="text-sm text-gray-600">
              {hasFile ? 'Готов к сканированию' : 'Excel файл с данными посылок'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleButtonClick}
          variant={hasFile ? "outline" : "default"}
          size="lg"
          className="flex items-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span>{hasFile ? 'Загрузить новый' : 'Выбрать файл'}</span>
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
