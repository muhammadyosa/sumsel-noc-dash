import { useState } from "react";
import { Download, Plus, Search, FileUp, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTickets } from "@/hooks/useTickets";
import { Ticket, CONSTRAINTS, ExcelRecord } from "@/types/ticket";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function TicketManagement() {
  const { tickets, excelData, addTicket, updateTicket, deleteTicket, importExcelData } =
    useTickets();

  const [searchFilters, setSearchFilters] = useState({
    customer: "",
    service: "",
    hostname: "",
    fat: "",
    sn: "",
  });

  const [selectedRecord, setSelectedRecord] = useState<ExcelRecord | null>(null);
  const [formData, setFormData] = useState({
    serpo: "",
    constraint: "",
    ticketResult: "",
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const mapped = jsonData.map((row: any) => ({
        customer: row["Customer Name"] || row["customer"] || "",
        service: row["Service ID"] || row["service"] || "",
        hostname: row["Hostname OLT"] || row["hostname"] || "",
        fat: row["ID FAT"] || row["fat"] || "",
        sn: row["SN ONT"] || row["sn"] || "",
      }));

      importExcelData(mapped);
      toast.success(`Berhasil import ${mapped.length} data`);
    };
    reader.readAsBinaryString(file);
  };

  const filteredData = excelData.filter((r) => {
    return (
      (!searchFilters.customer ||
        (r.customer || "").toLowerCase().includes(searchFilters.customer.toLowerCase())) &&
      (!searchFilters.service ||
        (r.service || "").toLowerCase().includes(searchFilters.service.toLowerCase())) &&
      (!searchFilters.hostname ||
        (r.hostname || "").toLowerCase().includes(searchFilters.hostname.toLowerCase())) &&
      (!searchFilters.fat ||
        (r.fat || "").toLowerCase().includes(searchFilters.fat.toLowerCase())) &&
      (!searchFilters.sn ||
        (r.sn || "").toLowerCase().includes(searchFilters.sn.toLowerCase()))
    );
  });

  const handleSubmitTicket = () => {
    if (!formData.constraint) {
      toast.error("Constraint wajib dipilih");
      return;
    }
    if (!selectedRecord) {
      toast.error("Pilih record pada Preview Data");
      return;
    }
    if (!formData.serpo.trim()) {
      toast.error("Serpo/Tim wajib diisi");
      return;
    }

    const now = new Date();
    const ticket: Ticket = {
      id: `INC-${Date.now()}`,
      serviceId: selectedRecord.service || "",
      customerName: selectedRecord.customer || "",
      serpo: formData.serpo.trim(),
      hostname: selectedRecord.hostname || "",
      fatId: selectedRecord.fat || "",
      snOnt: selectedRecord.sn || "",
      constraint: formData.constraint,
      category: "RITEL",
      ticketResult: formData.ticketResult || "",
      status: "On Progress",
      createdAt: now.toLocaleString("id-ID"),
      createdISO: now.toISOString(),
    };

    addTicket(ticket);
    toast.success("Tiket berhasil dibuat");
    setIsFormOpen(false);
    setFormData({ serpo: "", constraint: "", ticketResult: "" });
    setSelectedRecord(null);
  };

  const handleExportCSV = () => {
    const headers = [
      "Ticket ID",
      "Service ID",
      "Customer Name",
      "Serpo",
      "Hostname OLT",
      "ID FAT",
      "SN ONT",
      "Constraint",
      "Category",
      "Status",
      "Created",
    ];
    const rows = tickets.map((t) => [
      t.id,
      t.serviceId,
      t.customerName,
      t.serpo,
      t.hostname,
      t.fatId,
      t.snOnt,
      t.constraint,
      t.category,
      t.status,
      t.createdAt,
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noc_tickets_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil diexport");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ticket Management</h1>
          <p className="text-muted-foreground">Kelola tiket incident NOC</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Buat Tiket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buat Tiket Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Serpo / Tim</Label>
                  <Input
                    value={formData.serpo}
                    onChange={(e) => setFormData({ ...formData, serpo: e.target.value })}
                    placeholder="Masukkan nama tim"
                  />
                </div>
                <div>
                  <Label>Constraint</Label>
                  <Select
                    value={formData.constraint}
                    onValueChange={(value) => setFormData({ ...formData, constraint: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih constraint" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSTRAINTS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hasil Tiket (Optional)</Label>
                  <Textarea
                    value={formData.ticketResult}
                    onChange={(e) => setFormData({ ...formData, ticketResult: e.target.value })}
                    placeholder="Deskripsi hasil..."
                    rows={4}
                  />
                </div>
                {selectedRecord && (
                  <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
                    <p className="text-sm font-medium">Selected Record:</p>
                    <p className="text-xs text-muted-foreground">
                      Customer: {selectedRecord.customer} | Service: {selectedRecord.service}
                    </p>
                  </div>
                )}
                <Button onClick={handleSubmitTicket} className="w-full">
                  Simpan Tiket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search & Filter</span>
            <label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <FileUp className="h-4 w-4 mr-2" />
                  Import Excel
                </span>
              </Button>
            </label>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label>Customer Name</Label>
              <Input
                placeholder="Search..."
                value={searchFilters.customer}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, customer: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Service ID</Label>
              <Input
                placeholder="Search..."
                value={searchFilters.service}
                onChange={(e) => setSearchFilters({ ...searchFilters, service: e.target.value })}
              />
            </div>
            <div>
              <Label>Hostname OLT</Label>
              <Input
                placeholder="Search..."
                value={searchFilters.hostname}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, hostname: e.target.value })
                }
              />
            </div>
            <div>
              <Label>ID FAT</Label>
              <Input
                placeholder="Search..."
                value={searchFilters.fat}
                onChange={(e) => setSearchFilters({ ...searchFilters, fat: e.target.value })}
              />
            </div>
            <div>
              <Label>SN ONT</Label>
              <Input
                placeholder="Search..."
                value={searchFilters.sn}
                onChange={(e) => setSearchFilters({ ...searchFilters, sn: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredData.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Preview Data ({filteredData.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service ID</TableHead>
                    <TableHead>Hostname</TableHead>
                    <TableHead>ID FAT</TableHead>
                    <TableHead>SN ONT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 50).map((record, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsFormOpen(true);
                          }}
                        >
                          Pilih
                        </Button>
                      </TableCell>
                      <TableCell>{record.customer}</TableCell>
                      <TableCell>{record.service}</TableCell>
                      <TableCell>{record.hostname}</TableCell>
                      <TableCell>{record.fat}</TableCell>
                      <TableCell>{record.sn}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Daftar Tiket ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service ID</TableHead>
                  <TableHead>Serpo</TableHead>
                  <TableHead>Constraint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Belum ada tiket
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>{ticket.customerName}</TableCell>
                      <TableCell>{ticket.serviceId}</TableCell>
                      <TableCell>{ticket.serpo}</TableCell>
                      <TableCell>{ticket.constraint}</TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell className="text-sm">{ticket.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={ticket.status}
                            onValueChange={(value: any) =>
                              updateTicket(ticket.id, { status: value })
                            }
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="On Progress">On Progress</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              deleteTicket(ticket.id);
                              toast.success("Tiket dihapus");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
