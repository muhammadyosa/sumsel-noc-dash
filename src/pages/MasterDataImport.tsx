import { useState } from "react";
import { FileUp, FileSpreadsheet, Check, X, AlertCircle, Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { importMultiSheetExcel, getExcelSheets, ImportResult } from "@/lib/multiSheetImport";
import { saveExcelData, saveOLTData, openDB } from "@/lib/indexedDB";

const UPE_STORE_NAME = "upe_data";
const BNG_STORE_NAME = "bng_data";

// Save UPE data to IndexedDB
async function saveUPEData(data: any[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([UPE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(UPE_STORE_NAME);
    const request = store.put(data, "upe_records");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Save BNG data to IndexedDB
async function saveBNGData(data: any[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BNG_STORE_NAME], "readwrite");
    const store = transaction.objectStore(BNG_STORE_NAME);
    const request = store.put(data, "bng_records");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

interface SheetPreview {
  name: string;
  rowCount: number;
  type: string | null;
}

export default function MasterDataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetPreview[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setSheets([]);
    setImportResult(null);
    setIsAnalyzing(true);

    try {
      const sheetList = await getExcelSheets(selectedFile);
      setSheets(sheetList);
      toast.success(`File berhasil dianalisis: ${sheetList.length} sheet ditemukan`);
    } catch (error) {
      toast.error("Gagal menganalisis file Excel");
      if (import.meta.env.DEV) {
        console.error("Error analyzing Excel:", error);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setShowConfirmDialog(false);
    setIsImporting(true);
    setImportProgress(0);

    try {
      // Step 1: Parse Excel
      setImportProgress(10);
      const result = await importMultiSheetExcel(file);
      setImportProgress(30);

      // Step 2: Save User data
      if (result.userRecords.length > 0) {
        await saveExcelData(result.userRecords);
        setImportProgress(50);
      }

      // Step 3: Save OLT data
      if (result.oltRecords.length > 0) {
        await saveOLTData(result.oltRecords);
        setImportProgress(65);
      }

      // Step 4: Save UPE data
      if (result.upeRecords.length > 0) {
        await saveUPEData(result.upeRecords);
        setImportProgress(80);
      }

      // Step 5: Save BNG data
      if (result.bngRecords.length > 0) {
        await saveBNGData(result.bngRecords);
        setImportProgress(95);
      }

      setImportProgress(100);
      setImportResult(result);

      const totalRecords = result.summary.user + result.summary.olt + result.summary.upe + result.summary.bng;
      toast.success(`Berhasil import ${totalRecords.toLocaleString()} data dari ${result.summary.processedSheets.length} sheet`);
    } catch (error) {
      toast.error("Gagal mengimport data");
      if (import.meta.env.DEV) {
        console.error("Error importing Excel:", error);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const getTypeLabel = (type: string | null) => {
    switch (type) {
      case "user":
        return { label: "List User", color: "bg-blue-500" };
      case "fat":
        return { label: "List FAT", color: "bg-green-500" };
      case "upe":
        return { label: "List UPE", color: "bg-purple-500" };
      case "bng":
        return { label: "List BNG", color: "bg-orange-500" };
      default:
        return { label: "Tidak Dikenali", color: "bg-muted" };
    }
  };

  const resetImport = () => {
    setFile(null);
    setSheets([]);
    setImportResult(null);
    setImportProgress(0);
  };

  const recognizedSheets = sheets.filter(s => s.type !== null);
  const unrecognizedSheets = sheets.filter(s => s.type === null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Master Data</h1>
        <p className="text-muted-foreground">
          Upload file Excel sekali saja - data langsung tersimpan permanen dan terintegrasi ke Ticket Management, List FAT, List UPE, dan List BNG
        </p>
      </div>

      {/* File Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload File Excel
          </CardTitle>
        <CardDescription>
          Pilih file Excel (.xlsx, .xls) - data tersimpan permanen di aplikasi (hanya perlu upload 1x)
        </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
                disabled={isImporting}
              />
              <label htmlFor="excel-upload">
                <Button variant="outline" asChild disabled={isImporting || isAnalyzing}>
                  <span className="cursor-pointer">
                    <FileUp className="h-4 w-4 mr-2" />
                    {isAnalyzing ? "Menganalisis..." : "Pilih File Excel"}
                  </span>
                </Button>
              </label>
              {file && (
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetImport}
                    disabled={isImporting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Mengimport data...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sheet Analysis Card */}
      {sheets.length > 0 && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Analisis Sheet ({sheets.length} sheet ditemukan)
            </CardTitle>
            <CardDescription>
              Sistem akan mendeteksi jenis data berdasarkan nama sheet dan kolom
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recognized Sheets */}
            {recognizedSheets.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Sheet yang Dikenali ({recognizedSheets.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Sheet</TableHead>
                      <TableHead>Jumlah Baris</TableHead>
                      <TableHead>Tipe Data</TableHead>
                      <TableHead>Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recognizedSheets.map((sheet) => {
                      const typeInfo = getTypeLabel(sheet.type);
                      return (
                        <TableRow key={sheet.name}>
                          <TableCell className="font-medium">{sheet.name}</TableCell>
                          <TableCell>{sheet.rowCount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                          </TableCell>
                        <TableCell className="text-muted-foreground">
                            {sheet.type === "user" && "→ Ticket Management"}
                            {sheet.type === "fat" && "→ List FAT"}
                            {sheet.type === "upe" && "→ List UPE"}
                            {sheet.type === "bng" && "→ List BNG"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Unrecognized Sheets */}
            {unrecognizedSheets.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Sheet tidak dikenali ({unrecognizedSheets.length}) - akan dilewati
                </h4>
                <div className="flex flex-wrap gap-2">
                  {unrecognizedSheets.map((sheet) => (
                    <Badge key={sheet.name} variant="outline">
                      {sheet.name} ({sheet.rowCount} baris)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Import Button */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={recognizedSheets.length === 0 || isImporting}
                size="lg"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Import {recognizedSheets.length} Sheet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result Card */}
      {importResult && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Import Berhasil!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{importResult.summary.user.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">List User → Ticket Management</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{importResult.summary.olt.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">List FAT → Data FAT</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{importResult.summary.upe.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">List UPE → Data UPE</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{importResult.summary.bng.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">List BNG → Data BNG</div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ✓ Data tersimpan permanen! Anda dapat langsung menggunakan:
              </p>
              <ul className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
                {importResult.summary.user > 0 && <li>• Ticket Management - {importResult.summary.user.toLocaleString()} data user siap digunakan</li>}
                {importResult.summary.olt > 0 && <li>• List FAT - {importResult.summary.olt.toLocaleString()} data FAT siap digunakan</li>}
                {importResult.summary.upe > 0 && <li>• List UPE - {importResult.summary.upe.toLocaleString()} data UPE siap digunakan</li>}
                {importResult.summary.bng > 0 && <li>• List BNG - {importResult.summary.bng.toLocaleString()} data BNG siap digunakan</li>}
              </ul>
            </div>

            {/* Processed Sheets */}
            <div>
              <h4 className="text-sm font-medium mb-2">Sheet yang Diproses:</h4>
              <div className="flex flex-wrap gap-2">
                {importResult.summary.processedSheets.map((sheet) => (
                  <Badge key={sheet} variant="secondary" className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    {sheet}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Skipped Sheets */}
            {importResult.summary.skippedSheets.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Sheet yang Dilewati:</h4>
                <div className="flex flex-wrap gap-2">
                  {importResult.summary.skippedSheets.map((sheet) => (
                    <Badge key={sheet} variant="outline">
                      {sheet}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex gap-2">
              <Button variant="outline" onClick={resetImport}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Import File Lain
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Format File yang Didukung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">📋 List User (untuk Ticket Management)</h4>
              <p className="text-sm text-muted-foreground mb-2">Kolom yang didukung:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Customer Name / customer / nama pelanggan</li>
                <li>Service ID / service</li>
                <li>Hostname OLT / hostname</li>
                <li>ID FAT / fat</li>
                <li>SN ONT / sn</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📍 List FAT (untuk Data FAT)</h4>
              <p className="text-sm text-muted-foreground mb-2">Kolom yang didukung:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Provinsi</li>
                <li>ID FAT / FAT ID</li>
                <li>Hostname OLT</li>
                <li>Tikor FAT / koordinat</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔗 List UPE (untuk Data UPE)</h4>
              <p className="text-sm text-muted-foreground mb-2">Kolom yang didukung:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Hostname OLT</li>
                <li>Hostname UPE</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🌐 List BNG (untuk Data BNG)</h4>
              <p className="text-sm text-muted-foreground mb-2">Kolom yang didukung:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>IP RADIUS</li>
                <li>HOSTNAME RADIUS</li>
                <li>IP BNG</li>
                <li>HOSTNAME BNG</li>
                <li>NPE</li>
                <li>VLAN</li>
                <li>HOSTNAME OLT</li>
                <li>UPE</li>
                <li>PORT UPE</li>
                <li>KOTA/KABUPATEN</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Import Data</DialogTitle>
            <DialogDescription>
              Data yang sudah ada akan ditimpa dengan data baru dari file Excel.
              Pastikan file yang dipilih sudah benar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">Sheet yang akan diimport:</p>
            <ul className="mt-2 space-y-1">
              {recognizedSheets.map((sheet) => {
                const typeInfo = getTypeLabel(sheet.type);
                return (
                  <li key={sheet.name} className="text-sm flex items-center gap-2">
                    <Badge className={typeInfo.color} variant="secondary">
                      {typeInfo.label}
                    </Badge>
                    <span>{sheet.name}</span>
                    <span className="text-muted-foreground">({sheet.rowCount.toLocaleString()} baris)</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleImport}>
              Ya, Import Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
