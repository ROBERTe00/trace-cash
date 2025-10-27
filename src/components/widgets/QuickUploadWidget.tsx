import { FileText, Upload, Camera, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

export function QuickUploadWidget() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const onDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      setUploading(true);
      setUploadProgress(0);
      
      try {
        // Simula upload progress
        await simulateUpload(file);
        console.log('File caricato:', file.name);
      } catch (error) {
        console.error('Errore nel caricamento:', error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };
  
  const simulateUpload = async (file: File) => {
    // TODO: Implementare upload reale
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve(true);
        }
      }, 200);
    });
  };
  
  const { getRootProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xlsx', '.xls'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          Carica Documenti
        </h3>
      </div>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragActive 
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-gray-700 hover:border-purple-500/50 bg-white/5'
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400">Caricamento... {uploadProgress}%</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-10 h-10 mx-auto text-purple-400" />
            <div>
              <p className="text-sm font-medium">Trascina file qui</p>
              <p className="text-xs text-gray-400 mt-1">o clicca per selezionare</p>
            </div>
            <div className="flex gap-4 justify-center text-xs text-gray-500 mt-2">
              <span>📄 PDF</span>
              <span>📊 CSV</span>
              <span>📷 Foto</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <button className="p-3 glass-card hover:bg-white/10 transition-all rounded-lg group">
          <Camera className="w-4 h-4 mx-auto mb-1 group-hover:text-purple-400" />
          <p className="text-xs text-gray-400 group-hover:text-white">Scatta</p>
        </button>
        <button className="p-3 glass-card hover:bg-white/10 transition-all rounded-lg group">
          <FileSpreadsheet className="w-4 h-4 mx-auto mb-1 group-hover:text-purple-400" />
          <p className="text-xs text-gray-400 group-hover:text-white">Scegli</p>
        </button>
        <button className="p-3 glass-card hover:bg-white/10 transition-all rounded-lg group">
          <Upload className="w-4 h-4 mx-auto mb-1 group-hover:text-purple-400" />
          <p className="text-xs text-gray-400 group-hover:text-white">Importa</p>
        </button>
      </div>
    </div>
  );
}
