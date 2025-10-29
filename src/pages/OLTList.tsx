import { useState } from "react";
import { Upload, Download, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const OLTList = () => {
  const [oltData, setOltData] = useState<OLT[]>(() => {
    const saved = localStorage.getItem("oltData");
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState("");

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

        const newData = [...oltData, ...processedData];
        setOltData(newData);
        localStorage.setItem("oltData", JSON.stringify(newData));

        toast({
          title: "Import berhasil",
          description: `${processedData.length} data OLT berhasil diimport.`,
        });
      } catch (error) {
        console.error("Error processing file:", error);
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

    const exportData = filteredData.map((olt) => ({
      "Nama Provinsi": olt.provinsi,
      "ID FAT": olt.fatId,
      "Hostname OLT": olt.hostname,
      "Tikor OLT": olt.tikor,
      "Tanggal Import": new Date(olt.createdAt).toLocaleString("id-ID"),
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

  const handleClearData = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua data OLT?")) {
      setOltData([]);
      localStorage.removeItem("oltData");
      toast({
        title: "Data dihapus",
        description: "Semua data OLT berhasil dihapus.",
      });
    }
  };

  const filteredData = oltData.filter(
    (olt) =>
      olt.provinsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      olt.fatId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      olt.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      olt.tikor.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <CardTitle>Data OLT</CardTitle>
          <CardDescription>
            Upload file Excel/CSV dengan kolom: Nama Provinsi, ID FAT, Hostname OLT, Tikor OLT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan provinsi, FAT ID, hostname, atau tikor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Provinsi</TableHead>
                  <TableHead>ID FAT</TableHead>
                  <TableHead>Hostname OLT</TableHead>
                  <TableHead>Tikor OLT</TableHead>
                  <TableHead>Tanggal Import</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {oltData.length === 0
                        ? "Belum ada data OLT. Silakan import file Excel/CSV."
                        : "Tidak ada data yang sesuai dengan pencarian."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((olt, index) => (
                    <TableRow key={olt.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{olt.provinsi}</TableCell>
                      <TableCell>{olt.fatId}</TableCell>
                      <TableCell>{olt.hostname}</TableCell>
                      <TableCell>{olt.tikor}</TableCell>
                      <TableCell>
                        {new Date(olt.createdAt).toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Total: {filteredData.length} dari {oltData.length} data OLT
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OLTList;
