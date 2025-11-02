import { FileText, Upload, Camera, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { QuickUploadModal } from '@/components/modals/QuickUploadModal';

export function QuickUploadWidget() {
  const [showModal, setShowModal] = useState(false);
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
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Carica Documenti
          </h3>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="w-full border-2 border-dashed border-gray-700 hover:border-purple-500/50 bg-white/5 rounded-xl p-6 text-center cursor-pointer transition-all"
        >
          <div className="space-y-3">
            <Upload className="w-10 h-10 mx-auto text-purple-400" />
            <div>
              <p className="text-sm font-medium">Clicca per caricare</p>
              <p className="text-xs text-gray-400 mt-1">PDF, CSV, Excel o Foto</p>
            </div>
            <div className="flex gap-4 justify-center text-xs text-gray-500 mt-2">
              <span>📄 PDF</span>
              <span>📊 CSV</span>
              <span>📷 Foto</span>
            </div>
          </div>
        </button>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Supporta tutti i formati bancari standard
          </p>
        </div>
      </div>
      
      <QuickUploadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
