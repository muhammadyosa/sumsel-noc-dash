import { useState, useEffect } from "react";
import { Download, Info, Server } from "lucide-react";
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
import { loadOLTData } from "@/lib/indexedDB";
import { sanitizeForCSV } from "@/lib/validation";
import { Link } from "react-router-dom";

interface OLTDevice {
  id: string;
  hostname: string;
  provinsi: string;
  createdAt: string;
}

const OLT_FIELDS = [
  { value: "all", label: "Semua Field" },
  { value: "hostname", label: "Hostname OLT" },
  { value: "provinsi", label: "Nama Provinsi" },
];

const OLTDeviceList = () => {
  const [oltDevices, setOltDevices] = useState<OLTDevice[]>([]);
  const [searchField, setSearchField] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOLTData()
      .then((data) => {
        // Extract unique OLT hostnames from FAT data
        const uniqueOLTs = new Map<string, OLTDevice>();
        data.forEach((item) => {
          if (item.hostname && !uniqueOLTs.has(item.hostname)) {
            uniqueOLTs.set(item.hostname, {
              id: item.hostname,
              hostname: item.hostname,
              provinsi: item.provinsi || "",
              createdAt: item.createdAt,
            });
          }
        });
        setOltDevices(Array.from(uniqueOLTs.values()));
        setIsLoading(false);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error("Error loading OLT data:", error);
        }
        setIsLoading(false);
      });
  }, []);

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk diekspor.",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredData.map((olt, index) => ({
      "No": index + 1,
      "Hostname OLT": sanitizeForCSV(olt.hostname),
      "Nama Provinsi": sanitizeForCSV(olt.provinsi),
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

  const filteredData = oltDevices.filter((olt) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    if (searchField === "all") {
      return (
        String(olt.hostname || "").toLowerCase().includes(query) ||
        String(olt.provinsi || "").toLowerCase().includes(query)
      );
    }
    
    const fieldValue = String(olt[searchField as keyof OLTDevice] || "").toLowerCase();
    return fieldValue.includes(query);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📟 List OLT</h1>
        <p className="text-muted-foreground">
          Data OLT diambil dari data FAT yang diimport melalui{" "}
          <Link to="/settings" className="text-primary underline hover:no-underline">
            Settings
          </Link>
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
                ) : oltDevices.length > 0 ? (
                  `✓ ${oltDevices.length} perangkat OLT unik ditemukan`
                ) : (
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Belum ada data. Import data FAT melalui{" "}
                    <Link to="/settings" className="text-primary underline hover:no-underline">
                      Settings
                    </Link>
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </CardTitle>
          <CardDescription>
            Daftar perangkat OLT unik berdasarkan Hostname
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="w-[180px] h-9 bg-background">
                  <SelectValue placeholder="Pilih Field" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg z-50">
                  {OLT_FIELDS.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 w-full sm:max-w-md">
              <Input
                placeholder={`Cari ${OLT_FIELDS.find(f => f.value === searchField)?.label || "data"}...`}
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
                  <TableHead>Hostname OLT</TableHead>
                  <TableHead>Nama Provinsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Memuat data OLT...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {oltDevices.length === 0
                        ? "Belum ada data OLT. Silakan import data FAT terlebih dahulu."
                        : "Tidak ada data yang sesuai dengan pencarian."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.slice(0, 100).map((olt, index) => (
                    <TableRow key={olt.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{olt.hostname}</TableCell>
                      <TableCell>{olt.provinsi}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredData.length > 100 ? (
              <>Menampilkan 100 dari {filteredData.length} hasil pencarian (Total: {oltDevices.length} perangkat OLT)</>
            ) : (
              <>Total: {filteredData.length} dari {oltDevices.length} perangkat OLT</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OLTDeviceList;
