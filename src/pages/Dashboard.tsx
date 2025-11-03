import { Activity, AlertTriangle, Zap, Server, Calendar, Clock, User, X, ExternalLink } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { useTickets } from "@/hooks/useTickets";
import { FEEDER_CONSTRAINTS_SET, Ticket } from "@/types/ticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useState, useEffect } from "react";
import { OLT } from "@/types/olt";
import { loadOLTData } from "@/lib/indexedDB";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShiftReport {
  id: string;
  date: string;
  shift: string;
  officer: string;
  oltDown?: string;
  portDown?: string;
  fatLoss?: string;
  summary?: string;
  issues: string;
  notes: string;
  createdAt: string;
}

export default function Dashboard() {
  const { tickets, excelData } = useTickets();
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [oltData, setOltData] = useState<OLT[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Load shift reports from localStorage
  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem("shiftReports") || "[]");
    setShiftReports(reports);
  }, []);

  // Load OLT data
  useEffect(() => {
    loadOLTData().then(setOltData).catch(console.error);
  }, []);

  const totalIncidents = tickets.length;
  const overSLA = tickets.filter((t) => {
    const ageMs = new Date().getTime() - new Date(t.createdISO).getTime();
    return ageMs > 24 * 60 * 60 * 1000 && t.status !== "Resolved";
  }).length;
  const feederImpact = tickets.filter((t) => FEEDER_CONSTRAINTS_SET.has(t.constraint)).length;
  // Count unique OLT hostnames only
  const totalOLT = new Set(oltData.map((olt) => olt.hostname).filter(Boolean)).size || 0;

  const recentTickets = tickets.slice(0, 5);
  
  const filteredTickets = tickets.filter((ticket) => {
    if (selectedStatus && ticket.status !== selectedStatus) return false;
    if (selectedCategory && ticket.category !== selectedCategory) return false;
    
    // Metric-based filters
    if (selectedMetric === "overSLA") {
      const ageMs = new Date().getTime() - new Date(ticket.createdISO).getTime();
      return ageMs > 24 * 60 * 60 * 1000 && ticket.status !== "Resolved";
    }
    if (selectedMetric === "feeder") {
      return FEEDER_CONSTRAINTS_SET.has(ticket.constraint);
    }
    if (selectedMetric === "total") {
      return true; // Show all tickets
    }
    if (selectedMetric === "olt") {
      return ticket.constraint === "OLT DOWN";
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Monitoring incident NOC RITEL SBU SUMBAGSEL
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div 
          onClick={() => setSelectedMetric(selectedMetric === "total" ? null : "total")}
          className={`cursor-pointer transition-all ${selectedMetric === "total" ? "ring-2 ring-primary" : ""}`}
        >
          <MetricCard
            title="Total Incident"
            value={totalIncidents}
            icon={Activity}
            variant="default"
          />
        </div>
        <div 
          onClick={() => setSelectedMetric(selectedMetric === "overSLA" ? null : "overSLA")}
          className={`cursor-pointer transition-all ${selectedMetric === "overSLA" ? "ring-2 ring-destructive" : ""}`}
        >
          <MetricCard
            title="Over SLA (>24h)"
            value={overSLA}
            icon={AlertTriangle}
            variant="destructive"
          />
        </div>
        <div 
          onClick={() => setSelectedMetric(selectedMetric === "feeder" ? null : "feeder")}
          className={`cursor-pointer transition-all ${selectedMetric === "feeder" ? "ring-2 ring-warning" : ""}`}
        >
          <MetricCard
            title="Impact Feeder"
            value={feederImpact}
            icon={Zap}
            variant="warning"
          />
        </div>
        <div 
          onClick={() => setSelectedMetric(selectedMetric === "olt" ? null : "olt")}
          className={`cursor-pointer transition-all ${selectedMetric === "olt" ? "ring-2 ring-success" : ""}`}
        >
          <MetricCard
            title="Total OLT"
            value={totalOLT}
            icon={Server}
            variant="success"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-elevated overflow-hidden border-2">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="h-6 w-1 bg-primary rounded-full" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["On Progress", "Critical", "Resolved", "Pending"].map((status) => {
                const count = tickets.filter((t) => t.status === status).length;
                const percentage = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
                
                const getStatusGradient = (s: string) => {
                  switch (s) {
                    case "On Progress": return "from-blue-500 to-blue-600";
                    case "Critical": return "from-red-500 to-red-600";
                    case "Resolved": return "from-green-500 to-green-600";
                    case "Pending": return "from-amber-500 to-amber-600";
                    default: return "from-primary to-accent";
                  }
                };
                
                const getStatusIcon = (s: string) => {
                  switch (s) {
                    case "On Progress": return "⚙️";
                    case "Critical": return "🚨";
                    case "Resolved": return "✅";
                    case "Pending": return "⏳";
                    default: return "📊";
                  }
                };
                
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                    className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl group ${
                      selectedStatus === status 
                        ? "ring-4 ring-primary ring-offset-2 shadow-2xl scale-105" 
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${getStatusGradient(status)} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    
                    <div className="relative p-5 text-left">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl drop-shadow-lg">{getStatusIcon(status)}</span>
                        <StatusBadge status={status as any} />
                      </div>
                      
                      <div className="text-4xl font-bold mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                        {count}
                      </div>
                      
                      <div className="text-xs text-muted-foreground font-medium mb-3">
                        {percentage.toFixed(1)}% dari total
                      </div>
                      
                      <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getStatusGradient(status)} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevated overflow-hidden border-2">
          <CardHeader className="bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="h-6 w-1 bg-accent rounded-full" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["RITEL", "FEEDER"].map((category) => {
                const count = tickets.filter((t) => t.category === category).length;
                const percentage = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
                const circumference = 2 * Math.PI * 60;
                const strokeDashoffset = circumference - (percentage / 100) * circumference;
                
                const categoryGradient = category === "FEEDER" 
                  ? "from-amber-500 to-orange-600" 
                  : "from-blue-500 to-indigo-600";
                
                const categoryColor = category === "FEEDER" 
                  ? "text-warning" 
                  : "text-primary";
                
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                    className={`relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl group ${
                      selectedCategory === category 
                        ? "ring-4 ring-accent ring-offset-2 shadow-2xl scale-105" 
                        : "hover:border-accent/50"
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                    
                    <div className="relative flex items-center gap-6">
                      <div className="relative flex-shrink-0">
                        <svg className="w-32 h-32 transform -rotate-90 drop-shadow-lg">
                          {/* Background circle */}
                          <circle
                            cx="64"
                            cy="64"
                            r="60"
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="none"
                            className="text-secondary/50"
                          />
                          {/* Animated progress circle */}
                          <circle
                            cx="64"
                            cy="64"
                            r="60"
                            stroke="url(#gradient-${category})"
                            strokeWidth="10"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out drop-shadow-lg"
                          />
                          <defs>
                            <linearGradient id={`gradient-${category}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" className={categoryColor} stopOpacity="1" />
                              <stop offset="100%" className={categoryColor} stopOpacity="0.6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold">{percentage.toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${categoryGradient} shadow-lg`} />
                          <span className="text-xl font-bold">{category}</span>
                        </div>
                        
                        <div className="text-4xl font-bold mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                          {count}
                        </div>
                        
                        <div className="text-sm text-muted-foreground font-medium">
                          tiket dalam kategori ini
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {shiftReports.length > 0 && (
          <Card className="shadow-card md:col-span-2 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                Laporan Shift Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {shiftReports.slice(-3).reverse().map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-lg bg-card border border-primary/10 shadow-sm hover:shadow-md transition-all hover:border-primary/30"
                  >
                    <div className="space-y-3 mb-4 pb-3 border-b border-border/50">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-semibold text-xs md:text-sm">
                          {new Date(report.date).toLocaleDateString("id-ID", { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-medium capitalize px-2 py-1 bg-primary/10 rounded-md text-xs">
                            Shift {report.shift}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-xs truncate max-w-[120px]">{report.officer}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {report.oltDown && (
                        <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                          <div className="text-xs font-bold text-destructive mb-2 flex items-center gap-1">
                            📡 LAPORAN OLT DOWN
                          </div>
                          <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
                            {report.oltDown}
                          </pre>
                        </div>
                      )}
                      
                      {report.portDown && (
                        <div className="bg-warning/5 p-3 rounded-lg border border-warning/20">
                          <div className="text-xs font-bold text-warning mb-2 flex items-center gap-1">
                            🔌 LAPORAN PORT DOWN
                          </div>
                          <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
                            {report.portDown}
                          </pre>
                        </div>
                      )}
                      
                      {report.fatLoss && (
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                          <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                            📊 LAPORAN FAT LOSS SBS
                          </div>
                          <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
                            {report.fatLoss}
                          </pre>
                        </div>
                      )}

                      {report.issues && (
                        <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            ⚠️ Kendala/Masalah
                          </div>
                          <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground/80">
                            {report.issues}
                          </pre>
                        </div>
                      )}

                      {report.notes && (
                        <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            📝 Catatan
                          </div>
                          <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-muted-foreground">
                            {report.notes}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-card md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {selectedMetric === "olt" ? "List OLT" : 
                 selectedStatus || selectedCategory || selectedMetric ? "Detail Tiket" : "Recent Tickets"}
              </span>
              {(selectedStatus || selectedCategory || selectedMetric) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStatus(null);
                    setSelectedCategory(null);
                    setSelectedMetric(null);
                  }}
                >
                  Clear Filter
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMetric === "olt" ? (
              // Display OLT List when Total OLT is selected
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Provinsi</TableHead>
                      <TableHead>ID FAT</TableHead>
                      <TableHead>Hostname OLT</TableHead>
                      <TableHead>Tikor FAT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oltData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                          Belum ada data OLT
                        </TableCell>
                      </TableRow>
                    ) : (
                      oltData.slice(0, 50).map((olt, index) => (
                        <TableRow key={olt.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{olt.provinsi}</TableCell>
                          <TableCell className="font-mono text-xs">{olt.fatId}</TableCell>
                          <TableCell className="font-mono text-xs">{olt.hostname}</TableCell>
                          <TableCell>{olt.tikor}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {oltData.length > 50 && (
                  <div className="p-3 text-sm text-muted-foreground text-center border-t">
                    Menampilkan 50 dari {oltData.length} OLT. Lihat semua di halaman List OLT.
                  </div>
                )}
              </div>
            ) : (
              // Display Detailed Tickets
              <div className="space-y-3">
                {(selectedStatus || selectedCategory || selectedMetric ? filteredTickets : recentTickets).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {selectedStatus || selectedCategory || selectedMetric ? "Tidak ada tiket yang sesuai filter" : "Belum ada tiket"}
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">No</TableHead>
                          <TableHead>Tiket ID</TableHead>
                          <TableHead>Service ID</TableHead>
                          <TableHead>Customer / Info</TableHead>
                          <TableHead>SERPO</TableHead>
                          <TableHead>Hostname</TableHead>
                          <TableHead>FAT ID</TableHead>
                          <TableHead>SN ONT</TableHead>
                          <TableHead>Constraint</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(selectedStatus || selectedCategory || selectedMetric ? filteredTickets : recentTickets).map((ticket, index) => (
                          <TableRow 
                            key={ticket.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-mono text-xs">{ticket.id}</TableCell>
                            <TableCell className="font-mono text-xs">{ticket.serviceId}</TableCell>
                            <TableCell>
                              {ticket.category === "FEEDER" ? (
                                <div className="text-xs">
                                  {ticket.constraint === "OLT DOWN" && (
                                    <span className="font-medium">{ticket.hostname}</span>
                                  )}
                                  {ticket.constraint === "PORT DOWN" && (
                                    <>
                                      <div className="font-medium">{ticket.ticketResult.match(/PORT - (.*?) - DOWN/)?.[1] || "PORT"}</div>
                                      <div className="text-muted-foreground">{ticket.hostname}</div>
                                    </>
                                  )}
                                  {(ticket.constraint === "FAT LOSS" || ticket.constraint === "FAT LOW RX") && (
                                    <>
                                      <div className="font-medium">{ticket.fatId}</div>
                                      <div className="text-muted-foreground">{ticket.hostname}</div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs">{ticket.customerName}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">{ticket.serpo}</TableCell>
                            <TableCell className="font-mono text-xs">{ticket.hostname}</TableCell>
                            <TableCell className="font-mono text-xs">{ticket.fatId}</TableCell>
                            <TableCell className="font-mono text-xs">{ticket.snOnt}</TableCell>
                            <TableCell>
                              <span className="text-xs px-2 py-1 rounded-md bg-muted">
                                {ticket.constraint}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  ticket.category === "FEEDER"
                                    ? "bg-warning/20 text-warning"
                                    : "bg-primary/20 text-primary"
                                }`}
                              >
                                {ticket.category}
                              </span>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={ticket.status} />
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(ticket.createdISO).toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-5 w-5 text-primary" />
              Detail Tiket
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6 mt-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="text-2xl font-bold">{selectedTicket.id}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dibuat pada {new Date(selectedTicket.createdISO).toLocaleString("id-ID", {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <StatusBadge status={selectedTicket.status} />
              </div>

              {/* Main Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service ID</label>
                    <p className="text-lg font-mono mt-1">{selectedTicket.serviceId}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTicket.category === "FEEDER"
                          ? "bg-warning/20 text-warning"
                          : "bg-primary/20 text-primary"
                      }`}>
                        {selectedTicket.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Constraint</label>
                    <p className="text-lg font-medium mt-1 px-3 py-2 bg-muted rounded-md inline-block">
                      {selectedTicket.constraint}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SERPO</label>
                    <p className="text-lg mt-1">{selectedTicket.serpo}</p>
                  </div>

                  {selectedTicket.category === "RITEL" && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer Name</label>
                      <p className="text-lg mt-1">{selectedTicket.customerName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Details */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Technical Information
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Hostname OLT</label>
                    <p className="text-sm font-mono mt-1">{selectedTicket.hostname}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">FAT ID</label>
                    <p className="text-sm font-mono mt-1">{selectedTicket.fatId}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">SN ONT</label>
                    <p className="text-sm font-mono mt-1">{selectedTicket.snOnt}</p>
                  </div>
                </div>
              </div>

              {/* Ticket Result */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2 text-primary">Ticket Result</h4>
                <pre className="text-sm whitespace-pre-wrap font-mono bg-background p-3 rounded border">
                  {selectedTicket.ticketResult}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Tutup
                </Button>
                <Button onClick={() => {
                  // Navigate to ticket management
                  window.location.href = '/ticket-management';
                }}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Edit Tiket
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
