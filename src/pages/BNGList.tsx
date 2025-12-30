import { useState, useEffect } from "react";
import { Upload, Download, Trash2, Network, FileText } from "lucide-react";
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

interface BNG {
  id: string;
  ipRadius: string;
  hostnameRadius: string;
  ipBng: string;
  hostnameBng: string;
  npe: string;
  vlan: string;
  hostnameOlt: string;
  upe: string;
  portUpe: string;
  kotaKabupaten: string;
  createdAt: string;
}

const BNG_STORE_NAME = "bng_data";

const BNG_FIELDS = [
  { value: "all", label: "Semua Field" },
  { value: "ipRadius", label: "IP RADIUS" },
  { value: "hostnameRadius", label: "HOSTNAME RADIUS" },
  { value: "ipBng", label: "IP BNG" },
  { value: "hostnameBng", label: "HOSTNAME BNG" },
  { value: "npe", label: "NPE" },
  { value: "vlan", label: "VLAN" },
  { value: "hostnameOlt", label: "HOSTNAME OLT" },
  { value: "upe", label: "UPE" },
  { value: "portUpe", label: "PORT UPE" },
  { value: "kotaKabupaten", label: "KOTA/KABUPATEN" },
];

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
  const [searchField, setSearchField] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
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
            const ipRadius = row["IP RADIUS"] || row["ip radius"] || row["IP_RADIUS"] || row.ipRadius || "";
            const hostnameRadius = row["HOSTNAME RADIUS"] || row["hostname radius"] || row["HOSTNAME_RADIUS"] || row.hostnameRadius || "";
            const ipBng = row["IP BNG"] || row["ip bng"] || row["IP_BNG"] || row.ipBng || "";
            const hostnameBng = row["HOSTNAME BNG"] || row["hostname bng"] || row["HOSTNAME_BNG"] || row.hostnameBng || "";
            const npe = row["NPE"] || row["npe"] || row.npe || "";
            const vlan = row["VLAN"] || row["vlan"] || row.vlan || "";
            const hostnameOlt = row["HOSTNAME OLT"] || row["hostname olt"] || row["HOSTNAME_OLT"] || row.hostnameOlt || "";
            const upe = row["UPE"] || row["upe"] || row.upe || "";
            const portUpe = row["PORT UPE"] || row["port upe"] || row["PORT_UPE"] || row.portUpe || "";
            const kotaKabupaten = row["KOTA/KABUPATEN"] || row["kota/kabupaten"] || row["KOTA_KABUPATEN"] || row.kotaKabupaten || row["Kota/Kabupaten"] || "";

            if (!ipRadius && !hostnameRadius && !ipBng && !hostnameBng && !hostnameOlt) return null;

            return {
              id: `BNG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ipRadius: String(ipRadius).trim(),
              hostnameRadius: String(hostnameRadius).trim(),
              ipBng: String(ipBng).trim(),
              hostnameBng: String(hostnameBng).trim(),
              npe: String(npe).trim(),
              vlan: String(vlan).trim(),
              hostnameOlt: String(hostnameOlt).trim(),
              upe: String(upe).trim(),
              portUpe: String(portUpe).trim(),
              kotaKabupaten: String(kotaKabupaten).trim(),
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
      "IP RADIUS": sanitizeForCSV(bng.ipRadius),
      "HOSTNAME RADIUS": sanitizeForCSV(bng.hostnameRadius),
      "IP BNG": sanitizeForCSV(bng.ipBng),
      "HOSTNAME BNG": sanitizeForCSV(bng.hostnameBng),
      "NPE": sanitizeForCSV(bng.npe),
      "VLAN": sanitizeForCSV(bng.vlan),
      "HOSTNAME OLT": sanitizeForCSV(bng.hostnameOlt),
      "UPE": sanitizeForCSV(bng.upe),
      "PORT UPE": sanitizeForCSV(bng.portUpe),
      "KOTA/KABUPATEN": sanitizeForCSV(bng.kotaKabupaten),
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
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    if (searchField === "all") {
      return (
        String(bng.ipRadius || "").toLowerCase().includes(query) ||
        String(bng.hostnameRadius || "").toLowerCase().includes(query) ||
        String(bng.ipBng || "").toLowerCase().includes(query) ||
        String(bng.hostnameBng || "").toLowerCase().includes(query) ||
        String(bng.npe || "").toLowerCase().includes(query) ||
        String(bng.vlan || "").toLowerCase().includes(query) ||
        String(bng.hostnameOlt || "").toLowerCase().includes(query) ||
        String(bng.upe || "").toLowerCase().includes(query) ||
        String(bng.portUpe || "").toLowerCase().includes(query) ||
        String(bng.kotaKabupaten || "").toLowerCase().includes(query)
      );
    }
    
    const fieldValue = String(bng[searchField as keyof BNG] || "").toLowerCase();
    return fieldValue.includes(query);
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
            Upload file Excel/CSV dengan kolom: IP RADIUS, HOSTNAME RADIUS, IP BNG, HOSTNAME BNG, NPE, VLAN, HOSTNAME OLT, UPE, PORT UPE, KOTA/KABUPATEN
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
                  {BNG_FIELDS.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 w-full sm:max-w-md">
              <Input
                placeholder={`Cari ${BNG_FIELDS.find(f => f.value === searchField)?.label || "data"}...`}
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
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>IP RADIUS</TableHead>
                  <TableHead>HOSTNAME RADIUS</TableHead>
                  <TableHead>IP BNG</TableHead>
                  <TableHead>HOSTNAME BNG</TableHead>
                  <TableHead>NPE</TableHead>
                  <TableHead>VLAN</TableHead>
                  <TableHead>HOSTNAME OLT</TableHead>
                  <TableHead>UPE</TableHead>
                  <TableHead>PORT UPE</TableHead>
                  <TableHead>KOTA/KABUPATEN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      Memuat data BNG...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      {bngData.length === 0
                        ? "Belum ada data BNG. Silakan import file Excel/CSV."
                        : "Tidak ada data yang sesuai dengan pencarian."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.slice(0, 100).map((bng, index) => (
                    <TableRow key={bng.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.ipRadius}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.hostnameRadius}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.ipBng}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.hostnameBng}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.npe}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.vlan}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.hostnameOlt}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.upe}</TableCell>
                      <TableCell className="font-mono text-xs">{bng.portUpe}</TableCell>
                      <TableCell>{bng.kotaKabupaten}</TableCell>
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
