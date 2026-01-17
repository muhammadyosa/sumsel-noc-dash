import { useState, useEffect } from "react";
import { Download, FileText, Info } from "lucide-react";
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
import { FAT } from "@/types/fat";
import { loadFATData } from "@/lib/indexedDB";
import { sanitizeForCSV } from "@/lib/validation";
import { Link } from "react-router-dom";

const FAT_FIELDS = [
  { value: "all", label: "Semua Field" },
  { value: "provinsi", label: "Nama Provinsi" },
  { value: "fatId", label: "ID FAT" },
  { value: "hostname", label: "Hostname OLT" },
  { value: "tikor", label: "Tikor FAT" },
];

const FATList = () => {
  const [fatData, setFatData] = useState<FAT[]>([]);
  const [searchField, setSearchField] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFATData()
      .then((data) => {
        setFatData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error("Error loading FAT data:", error);
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

    const exportData = filteredData.map((fat) => ({
      "Nama Provinsi": sanitizeForCSV(fat.provinsi),
      "ID FAT": sanitizeForCSV(fat.fatId),
      "Hostname OLT": sanitizeForCSV(fat.hostname),
      "Tikor FAT": sanitizeForCSV(fat.tikor),
      "Tanggal Import": sanitizeForCSV(new Date(fat.createdAt).toLocaleString("id-ID")),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "List FAT");
    XLSX.writeFile(wb, `List_FAT_${new Date().toISOString().split("T")[0]}.xlsx`);

    toast({
      title: "Export berhasil",
      description: "Data FAT berhasil diekspor ke Excel.",
    });
  };

  const filteredData = fatData.filter((fat) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    if (searchField === "all") {
      return (
        String(fat.provinsi || "").toLowerCase().includes(query) ||
        String(fat.fatId || "").toLowerCase().includes(query) ||
        String(fat.hostname || "").toLowerCase().includes(query) ||
        String(fat.tikor || "").toLowerCase().includes(query)
      );
    }
    
    const fieldValue = String(fat[searchField as keyof FAT] || "").toLowerCase();
    return fieldValue.includes(query);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📍 List FAT</h1>
        <p className="text-muted-foreground">
          Data FAT diimport melalui <Link to="/settings" className="text-primary underline hover:no-underline">Settings</Link>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span>Data FAT</span>
              <p className="text-xs text-muted-foreground font-normal mt-1">
                {isLoading ? (
                  "Memuat data FAT..."
                ) : fatData.length > 0 ? (
                  `✓ ${fatData.length} data tersimpan dari Import Master Data`
                ) : (
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Belum ada data. Import melalui{" "}
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
            Kolom: Nama Provinsi, ID FAT, Hostname OLT, Tikor FAT
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
                  {FAT_FIELDS.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 w-full sm:max-w-md">
              <Input
                placeholder={`Cari ${FAT_FIELDS.find(f => f.value === searchField)?.label || "data"}...`}
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
                      Memuat data FAT...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {fatData.length === 0
                        ? "Belum ada data FAT. Silakan import file Excel/CSV."
                        : "Tidak ada data yang sesuai dengan pencarian."}
                    </TableCell>
                  </TableRow>
                 ) : (
                  filteredData.slice(0, 100).map((fat, index) => (
                    <TableRow key={fat.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{fat.provinsi}</TableCell>
                      <TableCell className="font-mono text-xs">{fat.fatId}</TableCell>
                      <TableCell className="font-mono text-xs">{fat.hostname}</TableCell>
                      <TableCell>{fat.tikor}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredData.length > 100 ? (
              <>Menampilkan 100 dari {filteredData.length} hasil pencarian (Total: {fatData.length} data FAT)</>
            ) : (
              <>Total: {filteredData.length} dari {fatData.length} data FAT</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FATList;
