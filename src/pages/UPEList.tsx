import { useState, useEffect } from "react";
import { Upload, Download, Trash2, Server, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { sanitizeForCSV } from "@/lib/validation";
import { openDB } from "@/lib/indexedDB";

interface UPE {
  id: string;
  hostnameUPE: string;
  hostnameOLT: string;
  createdAt: string;
}

const UPE_STORE_NAME = "upe_data";

const UPE_FIELDS = [
  { value: "all", label: "Semua Field" },
  { value: "hostnameUPE", label: "Hostname UPE" },
  { value: "hostnameOLT", label: "Hostname OLT" },
];

async function saveUPEData(data: UPE[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([UPE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(UPE_STORE_NAME);
    const request = store.put(data, "upe_records");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function loadUPEData(): Promise<UPE[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([UPE_STORE_NAME], "readonly");
      const store = transaction.objectStore(UPE_STORE_NAME);
      const request = store.get("upe_records");
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

async function clearUPEData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([UPE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(UPE_STORE_NAME);
    const request = store.delete("upe_records");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

const UPEList = () => {
  const [upeData, setUpeData] = useState<UPE[]>([]);
  const [searchField, setSearchField] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUPEData()
      .then((data) => {
        setUpeData(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: "",
        });

        const processedData: UPE[] = jsonData
          .map((row) => {
            const hostnameUPE = 
              row["Hostname UPE"] || 
              row["hostname upe"] || 
              row["HOSTNAME UPE"] ||
              row.hostnameUPE || 
              row.hostname_upe || "";
            
            const hostnameOLT = 
              row["Hostname OLT"] || 
              row["hostname olt"] || 
              row["HOSTNAME OLT"] ||
              row.hostnameOLT || 
              row.hostname_olt || "";

            if (!hostnameUPE && !hostnameOLT) return null;

            return {
              id: `UPE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              hostnameUPE: String(hostnameUPE).trim(),
              hostnameOLT: String(hostnameOLT).trim(),
              createdAt: new Date().toISOString(),
            };
          })
          .filter((item): item is UPE => item !== null);

        if (processedData.length === 0) {
          toast({
            title: "Tidak ada data valid",
            description: "File tidak mengandung data UPE yang valid.",
            variant: "destructive",
          });
          return;
        }

        setUpeData(processedData);
        saveUPEData(processedData).catch(() => {
          toast({
            title: "Gagal menyimpan",
            description: "Terjadi kesalahan saat menyimpan data.",
            variant: "destructive",
          });
        });

        toast({
          title: "Import berhasil",
          description: `${processedData.length} data UPE berhasil diimport (data lama digantikan).`,
        });
      } catch {
        toast({
          title: "Import gagal",
          description: "Terjadi kesalahan saat memproses file.",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk diekspor.",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredData.map((upe) => ({
      "Hostname UPE": sanitizeForCSV(upe.hostnameUPE),
      "Hostname OLT": sanitizeForCSV(upe.hostnameOLT),
      "Tanggal Import": sanitizeForCSV(new Date(upe.createdAt).toLocaleString("id-ID")),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "List UPE");
    XLSX.writeFile(wb, `List_UPE_${new Date().toISOString().split("T")[0]}.xlsx`);

    toast({
      title: "Export berhasil",
      description: "Data UPE berhasil diekspor ke Excel.",
    });
  };

  const handleClearData = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua data UPE?")) {
      try {
        await clearUPEData();
        setUpeData([]);
        toast({
          title: "Data dihapus",
          description: "Semua data UPE berhasil dihapus.",
        });
      } catch {
        toast({
          title: "Gagal menghapus",
          description: "Terjadi kesalahan saat menghapus data.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredData = upeData.filter((upe) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    if (searchField === "all") {
      return (
        String(upe.hostnameUPE || "").toLowerCase().includes(query) ||
        String(upe.hostnameOLT || "").toLowerCase().includes(query)
      );
    }
    
    const fieldValue = String(upe[searchField as keyof UPE] || "").toLowerCase();
    return fieldValue.includes(query);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">List UPE</h1>
        <p className="text-muted-foreground">
          Kelola data Universal Platform Equipment dengan import dari Excel/CSV
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <div>
                <span>Data UPE</span>
                <p className="text-xs text-muted-foreground font-normal mt-1">
                  {isLoading ? (
                    "Memuat data UPE..."
                  ) : upeData.length > 0 ? (
                    `✓ ${upeData.length} data tersimpan - upload baru akan menggantikan data lama`
                  ) : (
                    "Upload Excel/CSV, data tersimpan permanen di aplikasi"
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default" size="sm">
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Excel/CSV
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filteredData.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearData}
                disabled={upeData.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Semua Data
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Upload file Excel/CSV dengan kolom: Hostname UPE, Hostname OLT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Simplified Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <SelectValue placeholder="Pilih Field" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg z-50">
                  {UPE_FIELDS.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 w-full sm:max-w-md">
              <Input
                placeholder={`Cari ${UPE_FIELDS.find(f => f.value === searchField)?.label || "data"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Hostname UPE</TableHead>
                  <TableHead>Hostname OLT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Memuat data UPE...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {upeData.length === 0
                        ? "Belum ada data UPE. Silakan import file Excel/CSV."
                        : "Tidak ada data yang sesuai dengan pencarian."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.slice(0, 100).map((upe, index) => (
                    <TableRow key={upe.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{upe.hostnameUPE}</TableCell>
                      <TableCell className="font-mono text-xs">{upe.hostnameOLT}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredData.length > 100 ? (
              <>Menampilkan 100 dari {filteredData.length} hasil pencarian (Total: {upeData.length} data UPE)</>
            ) : (
              <>Total: {filteredData.length} dari {upeData.length} data UPE</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UPEList;
