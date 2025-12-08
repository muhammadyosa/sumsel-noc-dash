import { useState, useEffect } from "react";
import { Upload, Download, Trash2, Search, Network } from "lucide-react";
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
import { sanitizeForCSV } from "@/lib/validation";

interface BNG {
  id: string;
  provinsi: string;
  hostname: string;
  ipAddress: string;
  lokasi: string;
  createdAt: string;
}

const DB_NAME = "NOC_Database";
const BNG_STORE_NAME = "bng_data";
const DB_VERSION = 4;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("excel_data")) {
        db.createObjectStore("excel_data");
      }
      if (!db.objectStoreNames.contains("olt_data")) {
        db.createObjectStore("olt_data");
      }
      if (!db.objectStoreNames.contains("upe_data")) {
        db.createObjectStore("upe_data");
      }
      if (!db.objectStoreNames.contains(BNG_STORE_NAME)) {
        db.createObjectStore(BNG_STORE_NAME);
      }
    };
  });
}

async function saveBNGData(data: BNG[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BNG_STORE_NAME], "readwrite");
    const store = transaction.objectStore(BNG_STORE_NAME);
    const request = store.put(data, "bng_records");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function loadBNGData(): Promise<BNG[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BNG_STORE_NAME], "readonly");
      const store = transaction.objectStore(BNG_STORE_NAME);
      const request = store.get("bng_records");
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

async function clearBNGData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BNG_STORE_NAME], "readwrite");
    const store = transaction.objectStore(BNG_STORE_NAME);
    const request = store.delete("bng_records");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

const BNGList = () => {
  const [bngData, setBngData] = useState<BNG[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    provinsi: "",
    hostname: "",
    ipAddress: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBNGData()
      .then((data) => {
        setBngData(data);
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

        const processedData: BNG[] = jsonData
          .map((row) => {
            const provinsi = row.provinsi || row.Provinsi || row["Nama Provinsi"] || "";
            const hostname = row.hostname || row.Hostname || row["Hostname BNG"] || "";
            const ipAddress = row.ip || row.IP || row["IP Address"] || row.ipAddress || "";
            const lokasi = row.lokasi || row.Lokasi || row["Lokasi BNG"] || "";

            if (!provinsi && !hostname && !ipAddress) return null;

            return {
              id: `BNG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              provinsi: String(provinsi).trim(),
              hostname: String(hostname).trim(),
              ipAddress: String(ipAddress).trim(),
              lokasi: String(lokasi).trim(),
              createdAt: new Date().toISOString(),
            };
          })
          .filter((item): item is BNG => item !== null);

        if (processedData.length === 0) {
          toast({
            title: "Tidak ada data valid",
            description: "File tidak mengandung data BNG yang valid.",
            variant: "destructive",
          });
          return;
        }

        // Replace old data with new data
        setBngData(processedData);
        saveBNGData(processedData).catch(() => {
          toast({
            title: "Gagal menyimpan",
            description: "Terjadi kesalahan saat menyimpan data.",
            variant: "destructive",
          });
        });

        toast({
          title: "Import berhasil",
          description: `${processedData.length} data BNG berhasil diimport (data lama digantikan).`,
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

    const exportData = filteredData.map((bng) => ({
      "Nama Provinsi": sanitizeForCSV(bng.provinsi),
      "Hostname BNG": sanitizeForCSV(bng.hostname),
      "IP Address": sanitizeForCSV(bng.ipAddress),
      "Lokasi": sanitizeForCSV(bng.lokasi),
      "Tanggal Import": sanitizeForCSV(new Date(bng.createdAt).toLocaleString("id-ID")),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "List BNG");
    XLSX.writeFile(wb, `List_BNG_${new Date().toISOString().split("T")[0]}.xlsx`);

    toast({
      title: "Export berhasil",
      description: "Data BNG berhasil diekspor ke Excel.",
    });
  };

  const handleClearData = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua data BNG?")) {
      try {
        await clearBNGData();
        setBngData([]);
        toast({
          title: "Data dihapus",
          description: "Semua data BNG berhasil dihapus.",
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

  const filteredData = bngData.filter((bng) => {
    const provinsi = String(bng.provinsi || "").toLowerCase();
    const hostname = String(bng.hostname || "").toLowerCase();
    const ipAddress = String(bng.ipAddress || "").toLowerCase();

    return (
      (!searchFilters.provinsi || provinsi.includes(searchFilters.provinsi.toLowerCase())) &&
      (!searchFilters.hostname || hostname.includes(searchFilters.hostname.toLowerCase())) &&
      (!searchFilters.ipAddress || ipAddress.includes(searchFilters.ipAddress.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">List BNG</h1>
        <p className="text-muted-foreground">
          Kelola data Broadband Network Gateway dengan import dari Excel/CSV
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              <div>
                <span>Data BNG</span>
                <p className="text-xs text-muted-foreground font-normal mt-1">
                  {isLoading ? (
                    "Memuat data BNG..."
                  ) : bngData.length > 0 ? (
                    `✓ ${bngData.length} data tersimpan - upload baru akan menggantikan data lama`
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
                disabled={bngData.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Semua Data
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Upload file Excel/CSV dengan kolom: Nama Provinsi, Hostname BNG, IP Address, Lokasi
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
                <Label>🖥️ Hostname BNG</Label>
                <Input
                  placeholder="Cari Hostname..."
                  value={searchFilters.hostname}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, hostname: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>🌐 IP Address</Label>
                <Input
                  placeholder="Cari IP Address..."
                  value={searchFilters.ipAddress}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, ipAddress: e.target.value })
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
                  <TableHead>Hostname BNG</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Lokasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Memuat data BNG...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {bngData.length === 0
                        ? "Belum ada data BNG. Silakan import file Excel/CSV."
                        : "Tidak ada data yang sesuai dengan pencarian."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.slice(0, 100).map((bng, index) => (
                    <TableRow key={bng.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{bng.provinsi}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.hostname}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.ipAddress}</TableCell>
                      <TableCell>{bng.lokasi}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredData.length > 100 ? (
              <>Menampilkan 100 dari {filteredData.length} hasil pencarian (Total: {bngData.length} data BNG)</>
            ) : (
              <>Total: {filteredData.length} dari {bngData.length} data BNG</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BNGList;