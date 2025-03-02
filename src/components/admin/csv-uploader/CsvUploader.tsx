
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { FileUploader } from './components/FileUploader';
import { UploadProgress } from './components/UploadProgress';
import { UploadButton } from './components/UploadButton';
import { TemplateDownloader } from './components/TemplateDownloader';
import { useFileUpload } from './hooks/useFileUpload';
import { useCsvImport } from './hooks/useCsvImport';

export const CsvUploader = () => {
  const { file, setFile, handleFileChange } = useFileUpload();
  const { isUploading, progress, uploadCSV } = useCsvImport(file, setFile);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import Leads from CSV
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <FileUploader 
            handleFileChange={handleFileChange}
            isUploading={isUploading}
          />
          
          {file && (
            <div className="text-sm">
              Selected file: <span className="font-medium">{file.name}</span> ({Math.round(file.size / 1024)} KB)
            </div>
          )}
          
          {isUploading && progress > 0 && (
            <UploadProgress progress={progress} />
          )}
          
          <UploadButton 
            onClick={uploadCSV}
            disabled={!file || isUploading}
            isUploading={isUploading}
          />
          
          <TemplateDownloader />
        </div>
      </CardContent>
    </Card>
  );
};
