import { Activity, AlertTriangle, Zap, Server, Calendar, Clock, User, ExternalLink, TrendingUp, BarChart3 } from "lucide-react";
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
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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
    <div className="min-h-screen space-y-8 p-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground text-sm">
              Monitoring incident NOC RITEL SBU SUMBAGSEL
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            title: "Total Incident", 
            value: totalIncidents, 
            icon: Activity, 
            metric: "total",
            gradient: "from-blue-500 to-blue-700",
            glowColor: "shadow-blue-500/50"
          },
          { 
            title: "Over SLA (>24h)", 
            value: overSLA, 
            icon: AlertTriangle, 
            metric: "overSLA",
            gradient: "from-red-500 to-red-700",
            glowColor: "shadow-red-500/50"
          },
          { 
            title: "Impact Feeder", 
            value: feederImpact, 
            icon: Zap, 
            metric: "feeder",
            gradient: "from-amber-500 to-orange-600",
            glowColor: "shadow-amber-500/50"
          },
          { 
            title: "Total OLT", 
            value: totalOLT, 
            icon: Server, 
            metric: "olt",
            gradient: "from-green-500 to-emerald-700",
            glowColor: "shadow-green-500/50"
          }
        ].map((card, index) => (
          <motion.div
            key={card.metric}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => setSelectedMetric(selectedMetric === card.metric ? null : card.metric)}
            className={`
              relative cursor-pointer group
              rounded-2xl border-2 overflow-hidden
              transition-all duration-300
              hover:scale-105 hover:shadow-2xl ${card.glowColor}
              ${selectedMetric === card.metric ? `ring-4 ring-primary shadow-2xl ${card.glowColor}` : "hover:border-primary/50"}
            `}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
            
            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">{card.title}</p>
                <p className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                  {card.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="shadow-2xl overflow-hidden border-2 backdrop-blur-lg bg-card/70">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="h-6 w-1 bg-primary rounded-full" />
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { status: "On Progress", icon: "⚙️", gradient: "from-blue-500 to-blue-600" },
                  { status: "Critical", icon: "🚨", gradient: "from-red-500 to-red-600" },
                  { status: "Resolved", icon: "✅", gradient: "from-green-500 to-green-600" },
                  { status: "Pending", icon: "⏳", gradient: "from-amber-500 to-amber-600" }
                ].map((item, index) => {
                  const count = tickets.filter((t) => t.status === item.status).length;
                  const percentage = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
                  
                  return (
                    <motion.button
                      key={item.status}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      onClick={() => setSelectedStatus(selectedStatus === item.status ? null : item.status)}
                      className={`
                        relative overflow-hidden rounded-xl border-2 
                        transition-all duration-300 hover:scale-105 hover:shadow-2xl
                        backdrop-blur-lg bg-card/50 group
                        ${selectedStatus === item.status 
                          ? "ring-4 ring-primary ring-offset-2 shadow-2xl scale-105" 
                          : "hover:border-primary/50"}
                      `}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                      
                      <div className="relative p-5 text-left">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-3xl drop-shadow-lg">{item.icon}</span>
                          <StatusBadge status={item.status as any} />
                        </div>
                        
                        <div className="text-3xl font-bold mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                          {count}
                        </div>
                        
                        <div className="text-xs text-muted-foreground font-medium mb-3">
                          {percentage.toFixed(1)}% dari total
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.6 + index * 0.1, ease: "easeOut" }}
                            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.gradient} rounded-full shadow-lg`}
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution with Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="shadow-2xl overflow-hidden border-2 backdrop-blur-lg bg-card/70">
            <CardHeader className="bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="h-6 w-1 bg-accent rounded-full" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {(() => {
                const ritelCount = tickets.filter((t) => t.category === "RITEL").length;
                const feederCount = tickets.filter((t) => t.category === "FEEDER").length;
                const ritelPercentage = totalIncidents > 0 ? (ritelCount / totalIncidents) * 100 : 0;
                const feederPercentage = totalIncidents > 0 ? (feederCount / totalIncidents) * 100 : 0;
                
                const pieData = [
                  { name: "RITEL", value: ritelCount, color: "hsl(217, 91%, 60%)" },
                  { name: "FEEDER", value: feederCount, color: "hsl(38, 92%, 50%)" }
                ];

                return (
                  <div className="space-y-6">
                    {/* Pie Chart */}
                    {totalIncidents > 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="h-64"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </motion.div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Tidak ada data tiket
                      </div>
                    )}
                    
                    {/* Category Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { category: "RITEL", count: ritelCount, percentage: ritelPercentage, gradient: "from-blue-500 to-indigo-600", icon: "🔵" },
                        { category: "FEEDER", count: feederCount, percentage: feederPercentage, gradient: "from-amber-500 to-orange-600", icon: "🟠" }
                      ].map((item, index) => (
                        <motion.button
                          key={item.category}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                          onClick={() => setSelectedCategory(selectedCategory === item.category ? null : item.category)}
                          className={`
                            relative overflow-hidden rounded-xl border-2 p-4
                            transition-all duration-300 hover:scale-105 hover:shadow-2xl
                            backdrop-blur-lg bg-card/50 group
                            ${selectedCategory === item.category 
                              ? "ring-4 ring-accent ring-offset-2 shadow-2xl scale-105" 
                              : "hover:border-accent/50"}
                          `}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                          
                          <div className="relative text-center">
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <div className="text-lg font-bold mb-1">{item.category}</div>
                            <div className="text-3xl font-bold mb-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                              {item.count}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.percentage.toFixed(0)}% dari total
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Shift Reports Section */}
      {shiftReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="shadow-2xl border-2 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
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
                        <div className="bg-accent/5 p-3 rounded-lg border border-accent/20">
                          <div className="text-xs font-bold text-accent mb-2 flex items-center gap-1">
                            ⚠️ PERMASALAHAN
                          </div>
                          <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
                            {report.issues}
                          </pre>
                        </div>
                      )}

                      {report.notes && (
                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                          <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                            📝 CATATAN
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
        </motion.div>
      )}

      {/* Tickets/OLT List Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card className="shadow-2xl border-2">
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
                            <TableCell className="font-semibold text-primary">{ticket.id}</TableCell>
                            <TableCell className="font-mono text-xs">{ticket.serviceId}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{ticket.customerName || ticket.info || "-"}</TableCell>
                            <TableCell className="font-medium text-xs">{ticket.serpo}</TableCell>
                            <TableCell className="font-mono text-xs">{ticket.hostname}</TableCell>
                            <TableCell className="font-mono text-xs">{ticket.fatId}</TableCell>
                            <TableCell className="font-mono text-xs">{ticket.snOnt}</TableCell>
                            <TableCell>
                              <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium whitespace-nowrap">
                                {ticket.constraint}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
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
      </motion.div>

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

              {/* Category & Constraint */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <span
                    className={`inline-block text-sm px-3 py-1 rounded-full font-semibold ${
                      selectedTicket.category === "FEEDER"
                        ? "bg-warning/20 text-warning"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {selectedTicket.category}
                  </span>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Constraint</p>
                  <span className="text-sm font-semibold text-accent">
                    {selectedTicket.constraint}
                  </span>
                </div>
              </div>

              {/* Customer Information */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-3 text-primary">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Service ID</p>
                    <p className="text-sm font-mono">{selectedTicket.serviceId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Customer Name</p>
                    <p className="text-sm">{selectedTicket.customerName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Info</p>
                    <p className="text-sm">{selectedTicket.info || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">SERPO</p>
                    <p className="text-sm font-semibold">{selectedTicket.serpo}</p>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                <h4 className="font-semibold mb-3 text-accent">Technical Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Hostname</p>
                    <p className="text-sm font-mono">{selectedTicket.hostname}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">FAT ID</p>
                    <p className="text-sm font-mono">{selectedTicket.fatId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Port/Slot</p>
                    <p className="text-sm font-mono">{selectedTicket.port}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">SN ONT</p>
                    <p className="text-sm font-mono">{selectedTicket.snOnt}</p>
                  </div>
                </div>
              </div>

              {/* Ticket Result */}
              <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                <h4 className="font-semibold mb-2 text-success">Ticket Result</h4>
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
