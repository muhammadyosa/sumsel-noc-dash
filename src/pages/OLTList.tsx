import { useState, useEffect } from "react";
import { Upload, Download, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { OLT, OLTExcelRecord } from "@/types/olt";
import { loadOLTData, saveOLTData, clearOLTData } from "@/lib/indexedDB";
import { z } from "zod";
import { MAX_RECORDS, oltDataSchema, sanitizeForCSV } from "@/lib/validation";

const OLTList = () => {
  const [oltData, setOltData] = useState<OLT[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    provinsi: "",
    fatId: "",
    hostname: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load OLT data from IndexedDB on mount
  useEffect(() => {
    loadOLTData()
      .then((data) => {
        setOltData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading OLT data:", error);
        setIsLoading(false);
      });
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
        const jsonData: OLTExcelRecord[] = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: "",
        });

        // Validate record count
        if (jsonData.length > MAX_RECORDS) {
          toast({
            title: "Terlalu banyak record",
            description: `Maksimal ${MAX_RECORDS.toLocaleString()} record`,
            variant: "destructive",
          });
          return;
        }

        const processedData: OLT[] = jsonData
          .map((row) => {
            const provinsi = 
              row.provinsi || 
              row.Provinsi || 
              row["Nama Provinsi"] || 
              row["nama provinsi"] || "";
            
            const fatId = 
              row["id fat"] || 
              row["fat id"] || 
              row.fatid || 
              row["ID FAT"] || 
              row["Fat ID"] || "";
            
            const hostname = 
              row.hostname || 
              row.Hostname || 
              row["hostname olt"] || 
              row["Hostname OLT"] || "";
            
            const tikor = 
              row.tikor || 
              row.Tikor || 
              row["tikor fat"] || 
              row["Tikor FAT"] ||
              row["tikor olt"] || 
              row["Tikor OLT"] || "";

            if (!provinsi && !fatId && !hostname && !tikor) return null;

            return {
              id: `OLT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              provinsi: String(provinsi).trim(),
              fatId: String(fatId).trim(),
              hostname: String(hostname).trim(),
              tikor: String(tikor).trim(),
              createdAt: new Date().toISOString(),
            };
          })
          .filter((item): item is OLT => item !== null);

        if (processedData.length === 0) {
          toast({
            title: "Tidak ada data valid",
            description: "File tidak mengandung data OLT yang valid.",
            variant: "destructive",
          });
          return;
        }

        // Validate with zod (validate data fields only, id/createdAt already added)
        processedData.forEach((item) => {
          oltDataSchema.parse({
            provinsi: item.provinsi,
            fatId: item.fatId,
            hostname: item.hostname,
            tikor: item.tikor,
          });
        });

        const newData = [...oltData, ...processedData];
        setOltData(newData);
        
        // Save to IndexedDB
        saveOLTData(newData).catch((error) => {
          if (import.meta.env.DEV) {
            console.error("Error saving OLT data:", error);
          }
          toast({
            title: "Gagal menyimpan",
            description: "Terjadi kesalahan saat menyimpan data.",
            variant: "destructive",
          });
        });

        toast({
          title: "Import berhasil",
          description: `${processedData.length} data OLT berhasil diimport dan disimpan secara permanen.`,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: "Validasi gagal",
            description: error.errors[0].message,
            variant: "destructive",
          });
        } else {
          if (import.meta.env.DEV) {
            console.error("Error processing file:", error);
          }
          toast({
            title: "Import gagal",
            description: "Terjadi kesalahan saat memproses file.",
            variant: "destructive",
          });
        }
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

    const exportData = filteredData.map((olt) => ({
      "Nama Provinsi": sanitizeForCSV(olt.provinsi),
      "ID FAT": sanitizeForCSV(olt.fatId),
      "Hostname OLT": sanitizeForCSV(olt.hostname),
      "Tikor OLT": sanitizeForCSV(olt.tikor),
      "Tanggal Import": sanitizeForCSV(new Date(olt.createdAt).toLocaleString("id-ID")),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "List OLT");
    XLSX.writeFile(wb, `List_OLT_${new Date().toISOString().split("T")[0]}.xlsx`);

    toast({
      title: "Export berhasil",
      description: "Data OLT berhasil diekspor ke Excel.",
    });
  };

  const handleClearData = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua data OLT?")) {
      try {
        await clearOLTData();
        setOltData([]);
        toast({
          title: "Data dihapus",
          description: "Semua data OLT berhasil dihapus.",
        });
      } catch (error) {
        console.error("Error clearing OLT data:", error);
        toast({
          title: "Gagal menghapus",
          description: "Terjadi kesalahan saat menghapus data.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredData = oltData.filter((olt) => {
    const provinsi = String(olt.provinsi || "").toLowerCase();
    const fatId = String(olt.fatId || "").toLowerCase();
    const hostname = String(olt.hostname || "").toLowerCase();

    return (
      (!searchFilters.provinsi || provinsi.includes(searchFilters.provinsi.toLowerCase())) &&
      (!searchFilters.fatId || fatId.includes(searchFilters.fatId.toLowerCase())) &&
      (!searchFilters.hostname || hostname.includes(searchFilters.hostname.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">List OLT</h1>
        <p className="text-muted-foreground">
          Kelola data OLT dengan import dari Excel/CSV
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span>Data OLT</span>
              <p className="text-xs text-muted-foreground font-normal mt-1">
                {isLoading ? (
                  "Memuat data OLT..."
                ) : oltData.length > 0 ? (
                  `✓ ${oltData.length} data tersimpan secara permanen - tidak perlu upload ulang!`
                ) : (
                  "Upload Excel/CSV sekali, data tersimpan permanen di aplikasi"
                )}
              </p>
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
                disabled={oltData.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Semua Data
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Upload file Excel/CSV dengan kolom: Nama Provinsi, ID FAT, Hostname OLT, Tikor OLT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search & Filter
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>📜 Nama Provinsi</Label>
                <Input
                  placeholder="Cari Provinsi..."
                  value={searchFilters.provinsi}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, provinsi: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>🛠️ ID FAT</Label>
                <Input
                  placeholder="Cari ID FAT..."
                  value={searchFilters.fatId}
                  onChange={(e) => setSearchFilters({ ...searchFilters, fatId: e.target.value })}
                />
              </div>
              <div>
                <Label>📍 Hostname OLT</Label>
                <Input
                  placeholder="Cari Hostname..."
                  value={searchFilters.hostname}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, hostname: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Nama Provinsi</TableHead>
                  <TableHead>ID FAT</TableHead>
                  <TableHead>Hostname OLT</TableHead>
                  <TableHead>Tikor FAT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Memuat data OLT...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {oltData.length === 0
                        ? "Belum ada data OLT. Silakan import file Excel/CSV."
                        : "Tidak ada data yang sesuai dengan pencarian."}
                    </TableCell>
                  </TableRow>
                 ) : (
                  filteredData.slice(0, 100).map((olt, index) => (
                    <TableRow key={olt.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{olt.provinsi}</TableCell>
                      <TableCell className="font-mono text-xs">{olt.fatId}</TableCell>
                      <TableCell className="font-mono text-xs">{olt.hostname}</TableCell>
                      <TableCell>{olt.tikor}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredData.length > 100 ? (
              <>Menampilkan 100 dari {filteredData.length} hasil pencarian (Total: {oltData.length} data OLT)</>
            ) : (
              <>Total: {filteredData.length} dari {oltData.length} data OLT</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OLTList;
