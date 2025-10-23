/**
 * Unified Import Section
 * Consolidates PDF, CSV, and Plaid import methods in one component
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Table, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdvancedBankStatementUpload } from "@/components/AdvancedBankStatementUpload";
import { CSVExcelUpload } from "@/components/CSVExcelUpload";
import { motion, AnimatePresence } from "framer-motion";

interface UnifiedImportSectionProps {
  onTransactionsExtracted: (expenses: any[]) => void;
  defaultCollapsed?: boolean;
}

export const UnifiedImportSection = ({
  onTransactionsExtracted,
  defaultCollapsed = true,
}: UnifiedImportSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <Card className="glass-card border-2">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div className="text-left">
            <h3 className="text-lg font-semibold">Importa Transazioni</h3>
            <p className="text-sm text-muted-foreground">
              Carica estratti conto PDF, file CSV o connetti la tua carta
            </p>
          </div>
        </div>
        {isCollapsed ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t"
          >
            <div className="p-6 pt-4">
              <Tabs defaultValue="pdf" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pdf" className="gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="gap-2">
                    <Table className="h-4 w-4" />
                    <span className="hidden sm:inline">CSV/Excel</span>
                  </TabsTrigger>
                  <TabsTrigger value="card" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="hidden sm:inline">Carta</span>
                  </TabsTrigger>
                </TabsList>

                {/* PDF Upload Tab */}
                <TabsContent value="pdf" className="space-y-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Upload your bank statement PDF for automatic transaction extraction.
                      Advanced coordinate-based parsing for multiple banks and formats.
                    </p>
                  </div>
                  
                  {/* Advanced PDF Reader (Coordinate-based) - Primary method */}
                  <AdvancedBankStatementUpload onTransactionsExtracted={onTransactionsExtracted} />
                </TabsContent>

                {/* CSV Upload Tab */}
                <TabsContent value="csv">
                  <div className="text-sm text-muted-foreground mb-4">
                    <p>
                      Importa file CSV o Excel esportati dalla tua banca. Il sistema supporta
                      formati standard e personalizzati.
                    </p>
                  </div>
                  <CSVExcelUpload onTransactionsParsed={() => {}} />
                </TabsContent>

                {/* Card Connection Tab */}
                <TabsContent value="card">
                  <div className="text-sm text-muted-foreground mb-4">
                    <p>
                      Connetti la tua carta di credito tramite Plaid per sincronizzazione automatica
                      delle transazioni in tempo reale.
                    </p>
                  </div>
                  <Card className="p-6 bg-muted/50">
                    <div className="text-center space-y-4">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">Connessione Carta</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Vai alla pagina Credit Card Integration per connettere le tue carte
                        </p>
                      </div>
                      <Button
                        onClick={() => (window.location.href = '/credit-cards')}
                        className="gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        Vai a Credit Cards
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Memoized export
import { memo, useMemo } from "react";
export default memo(UnifiedImportSection);

