import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { CSVExcelUpload } from '@/components/CSVExcelUpload';
import { AdvancedBankStatementUpload } from '@/components/AdvancedBankStatementUpload';

interface QuickUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickUploadModal({ isOpen, onClose }: QuickUploadModalProps) {
  const [activeTab, setActiveTab] = useState('pdf');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-[#1A1A1A] border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Carica Documento
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Seleziona il tipo di documento che vuoi caricare e seguire le istruzioni
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 glass-card">
            <TabsTrigger value="pdf" className="data-[state=active]:bg-purple-600">
              📄 Estratto PDF
            </TabsTrigger>
            <TabsTrigger value="csv" className="data-[state=active]:bg-purple-600">
              📊 CSV/Excel
            </TabsTrigger>
            <TabsTrigger value="camera" className="data-[state=active]:bg-purple-600">
              📷 Fotografia
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pdf" className="mt-6">
            <div className="glass-card p-6 rounded-xl">
              <AdvancedBankStatementUpload />
            </div>
          </TabsContent>
          
          <TabsContent value="csv" className="mt-6">
            <div className="glass-card p-6 rounded-xl">
              <CSVExcelUpload />
            </div>
          </TabsContent>
          
          <TabsContent value="camera" className="mt-6">
            <div className="glass-card p-6 rounded-xl text-center py-12">
              <div className="text-4xl mb-4">📷</div>
              <h3 className="font-semibold mb-2">Carica Foto del Documento</h3>
              <p className="text-sm text-gray-400 mb-6">
                Usa la fotocamera del dispositivo per scattare una foto del documento
              </p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log('Camera file selected:', file);
                    // TODO: Implementare upload
                  }
                }}
                className="hidden"
                id="camera-input"
              />
              <button
                onClick={() => document.getElementById('camera-input')?.click()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Apri Fotocamera
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}


