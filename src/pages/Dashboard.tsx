import { Activity, AlertTriangle, Zap, Server, Calendar, Clock, User, ExternalLink, TrendingUp, BarChart3, FileText } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import { FEEDER_CONSTRAINTS_SET, Ticket, ALL_CONSTRAINTS } from "@/types/ticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useState, useEffect } from "react";
import { OLT } from "@/types/olt";
import { loadOLTData } from "@/lib/indexedDB";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

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
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterDialogTitle, setFilterDialogTitle] = useState("");
  const [filterDialogTickets, setFilterDialogTickets] = useState<Ticket[]>([]);
  const [showOltList, setShowOltList] = useState(false);
  const [selectedConstraint, setSelectedConstraint] = useState<string>("all");

  // Load shift reports from localStorage
  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem("shiftReports") || "[]");
    setShiftReports(reports);
  }, []);

  // Load OLT data
  useEffect(() => {
    loadOLTData().then(setOltData).catch((error) => {
      if (import.meta.env.DEV) {
        console.error("Error loading OLT data:", error);
      }
    });
  }, []);

  const totalIncidents = tickets.length;
  const overSLA = tickets.filter((t) => {
    const ageMs = new Date().getTime() - new Date(t.createdISO).getTime();
    return ageMs > 24 * 60 * 60 * 1000 && t.status !== "Resolved";
  }).length;
  const feederImpact = tickets.filter((t) => FEEDER_CONSTRAINTS_SET.has(t.constraint)).length;
  // Count unique OLT hostnames from tickets (impact)
  const totalOLT = new Set(tickets.map((t) => t.hostname).filter(Boolean)).size || 0;

  const recentTickets = tickets
    .filter((t) => selectedConstraint === "all" || t.constraint === selectedConstraint)
    .slice(0, 10);
  
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
    <div className="min-h-screen space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-3xl font-bold">
              🖥️ Dashboard Overview
            </h1>
            <p className="text-muted-foreground text-sm">
              Monitoring incident NOC RITEL
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Section */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 w-full">
        {[
          { 
            title: "Total Incident", 
            value: totalIncidents, 
            emoji: "🗃️", 
            metric: "total",
            gradient: "from-blue-500 to-blue-700",
            glowColor: "shadow-blue-500/50"
          },
          { 
            title: "Over SLA (>24h)", 
            value: overSLA, 
            emoji: "⚠️", 
            metric: "overSLA",
            gradient: "from-red-500 to-red-700",
            glowColor: "shadow-red-500/50"
          },
          { 
            title: "Impact OLT", 
            value: totalOLT, 
            emoji: "📟", 
            metric: "olt",
            gradient: "from-green-500 to-emerald-700",
            glowColor: "shadow-green-500/50"
          },
          { 
            title: "Impact Feeder", 
            value: feederImpact, 
            emoji: "⛓️‍💥", 
            metric: "feeder",
            gradient: "from-amber-500 to-orange-600",
            glowColor: "shadow-amber-500/50"
          }
        ].map((card, index) => (
          <motion.div
            key={card.metric}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => {
              let filtered: Ticket[] = [];
              let title = "";
              
              if (card.metric === "total") {
                filtered = tickets;
                title = "Semua Tiket";
              } else if (card.metric === "overSLA") {
                filtered = tickets.filter((t) => {
                  const ageMs = new Date().getTime() - new Date(t.createdISO).getTime();
                  return ageMs > 24 * 60 * 60 * 1000 && t.status !== "Resolved";
                });
                title = "Tiket Over SLA (>24h)";
              } else if (card.metric === "feeder") {
                filtered = tickets.filter((t) => FEEDER_CONSTRAINTS_SET.has(t.constraint));
                title = "Tiket Impact Feeder";
              } else if (card.metric === "olt") {
                setShowOltList(true);
                setFilterDialogTitle("Daftar OLT Terdampak");
                setFilterDialogOpen(true);
                return;
              }
              
              setShowOltList(false);
              setFilterDialogTickets(filtered);
              setFilterDialogTitle(title);
              setFilterDialogOpen(true);
            }}
            className={`
              relative cursor-pointer group
              rounded-2xl border-2 overflow-hidden
              transition-all duration-300
              hover:scale-105 hover:shadow-2xl ${card.glowColor}
              hover:border-primary/50
            `}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
            
            {/* Content */}
            <div className="relative p-3 sm:p-4 md:p-6">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <span className="text-2xl sm:text-3xl drop-shadow-lg">{card.emoji}</span>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1 truncate">{card.title}</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                  {card.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section - Bar Charts */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2 w-full">
        {/* Status Distribution Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="shadow-2xl overflow-hidden border-2 backdrop-blur-lg bg-card/70">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:pt-6">
              {(() => {
                const statusData = [
                  { name: "⚙️ On Progress", value: tickets.filter((t) => t.status === "On Progress").length, fill: "hsl(217, 91%, 60%)", status: "On Progress" },
                  { name: "🚨 Critical", value: tickets.filter((t) => t.status === "Critical").length, fill: "hsl(0, 84%, 60%)", status: "Critical" },
                  { name: "✅ Resolved", value: tickets.filter((t) => t.status === "Resolved").length, fill: "hsl(142, 71%, 45%)", status: "Resolved" },
                  { name: "⏳ Pending", value: tickets.filter((t) => t.status === "Pending").length, fill: "hsl(38, 92%, 50%)", status: "Pending" },
                ];

                const chartConfig: ChartConfig = {
                  value: { label: "Jumlah" },
                };

                return (
                  <ChartContainer config={chartConfig} className="h-[200px] sm:h-[240px] md:h-[280px] w-full transition-all duration-500 ease-out">
                    <BarChart
                      data={statusData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                      onClick={(data) => {
                        if (data?.activePayload?.[0]?.payload?.status) {
                          const status = data.activePayload[0].payload.status;
                          setSelectedStatus(selectedStatus === status ? null : status);
                          const filtered = tickets.filter((t) => t.status === status);
                          setShowOltList(false);
                          setFilterDialogTickets(filtered);
                          setFilterDialogTitle(`Tiket dengan Status: ${status}`);
                          setFilterDialogOpen(true);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        interval={0}
                        height={40}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} cursor="pointer">
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                );
              })()}
              <p className="text-xs text-muted-foreground text-center mt-2">
                Klik pada bar untuk melihat detail tiket
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="shadow-2xl overflow-hidden border-2 backdrop-blur-lg bg-card/70">
            <CardHeader className="bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:pt-6">
              {(() => {
                const ritelCount = tickets.filter((t) => t.category === "RITEL").length;
                const feederCount = tickets.filter((t) => t.category === "FEEDER").length;

                const categoryData = [
                  { name: "🏠 RITEL", value: ritelCount, fill: "hsl(217, 91%, 60%)", category: "RITEL" },
                  { name: "🏬 FEEDER", value: feederCount, fill: "hsl(38, 92%, 50%)", category: "FEEDER" },
                ];

                const chartConfig: ChartConfig = {
                  value: { label: "Jumlah" },
                };

                return (
                  <ChartContainer config={chartConfig} className="h-[200px] sm:h-[240px] md:h-[280px] w-full transition-all duration-500 ease-out">
                    <BarChart
                      data={categoryData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      onClick={(data) => {
                        if (data?.activePayload?.[0]?.payload?.category) {
                          const category = data.activePayload[0].payload.category;
                          setSelectedCategory(selectedCategory === category ? null : category);
                          const filtered = tickets.filter((t) => t.category === category);
                          setShowOltList(false);
                          setFilterDialogTickets(filtered);
                          setFilterDialogTitle(`Tiket dengan Category: ${category}`);
                          setFilterDialogOpen(true);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} cursor="pointer">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                );
              })()}
              <p className="text-xs text-muted-foreground text-center mt-2">
                Klik pada bar untuk melihat detail tiket
              </p>
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
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {shiftReports.slice(-3).reverse().map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-lg bg-card border border-primary/10 shadow-sm hover:shadow-md transition-all hover:border-primary/30"
                  >
                    <div className="space-y-2 mb-4 pb-3 border-b border-border/50">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-semibold text-xs">
                          {new Date(report.date).toLocaleDateString("id-ID", { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="font-medium capitalize px-2 py-0.5 bg-primary/10 rounded-md">
                            Shift {report.shift}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="font-medium truncate max-w-[100px]">{report.officer}</span>
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
                            📊 LAPORAN FAT LOSS
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

      {/* Recent Tickets Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card className="shadow-2xl border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Recent Tickets</CardTitle>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedConstraint} onValueChange={setSelectedConstraint}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Filter Constraint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Constraint</SelectItem>
                  {ALL_CONSTRAINTS.map((constraint) => (
                    <SelectItem key={constraint} value={constraint}>
                      {constraint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada tiket
                </p>
              ) : (
                <div className="rounded-md border overflow-auto max-h-96">
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
                      {recentTickets.map((ticket, index) => (
                        <TableRow 
                          key={ticket.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-semibold text-primary">{ticket.id}</TableCell>
                            <TableCell className="font-mono text-xs">{ticket.serviceId}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {ticket.category === "FEEDER" 
                                ? (ticket.constraint === "FAT LOSS" || ticket.constraint === "FAT LOW RX"
                                    ? `${ticket.fatId} - ${ticket.hostname}`
                                    : ticket.constraint === "PORT DOWN"
                                      ? (() => {
                                          const match = ticket.ticketResult.match(/PORT - (.+?) - DOWN/);
                                          const portInfo = match ? match[1] : "PORT";
                                          return `${portInfo} - ${ticket.hostname}`;
                                        })()
                                      : ticket.customerName || "-")
                                : (ticket.customerName || "-")
                              }
                            </TableCell>
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
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filter Dialog - Shows tickets by Status or Category or OLT List */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full lg:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="h-5 w-5 text-primary" />
              {filterDialogTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 flex-1 overflow-auto min-h-0">
            {showOltList ? (
              /* OLT List View */
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 whitespace-nowrap">No</TableHead>
                      <TableHead className="whitespace-nowrap">Hostname OLT</TableHead>
                      <TableHead className="whitespace-nowrap">Jumlah Tiket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const oltMap = new Map<string, number>();
                      tickets.forEach(ticket => {
                        if (ticket.hostname) {
                          oltMap.set(ticket.hostname, (oltMap.get(ticket.hostname) || 0) + 1);
                        }
                      });
                      
                      const uniqueOlts = Array.from(oltMap.entries())
                        .sort((a, b) => a[0].localeCompare(b[0]));
                      
                      return uniqueOlts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            Tidak ada data OLT
                          </TableCell>
                        </TableRow>
                      ) : (
                        uniqueOlts.map(([hostname, count], index) => (
                          <TableRow key={hostname} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-semibold font-mono">{hostname}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary">{count}</span>
                                <span className="text-xs text-muted-foreground">tiket</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      );
                    })()}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Ticket List View - Card Layout for mobile, Table for desktop */
              filterDialogTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tidak ada tiket dalam kategori ini
                </p>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block lg:hidden space-y-3">
                    {filterDialogTickets.map((ticket, index) => (
                      <div 
                        key={ticket.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setFilterDialogOpen(false);
                          setSelectedTicket(ticket);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                            <span className="font-semibold text-primary">{ticket.id}</span>
                          </div>
                          <StatusBadge status={ticket.status} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">Customer</span>
                            <span className="font-medium truncate block">
                              {ticket.category === "FEEDER" 
                                ? (ticket.constraint === "FAT LOSS" || ticket.constraint === "FAT LOW RX"
                                    ? `${ticket.fatId} - ${ticket.hostname}`
                                    : ticket.constraint === "PORT DOWN"
                                      ? (() => {
                                          const match = ticket.ticketResult.match(/PORT - (.+?) - DOWN/);
                                          const portInfo = match ? match[1] : "PORT";
                                          return `${portInfo} - ${ticket.hostname}`;
                                        })()
                                      : ticket.customerName || "-")
                                : (ticket.customerName || "-")
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Service ID</span>
                            <span className="font-mono text-xs truncate block">{ticket.serviceId}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">Hostname</span>
                            <span className="font-mono text-xs truncate block">{ticket.hostname}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">SERPO</span>
                            <span className="font-medium text-xs">{ticket.serpo}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                            {ticket.constraint}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              ticket.category === "FEEDER"
                                ? "bg-warning/20 text-warning"
                                : "bg-primary/20 text-primary"
                            }`}
                          >
                            {ticket.category}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(ticket.createdISO).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden lg:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 whitespace-nowrap">No</TableHead>
                          <TableHead className="whitespace-nowrap">Tiket ID</TableHead>
                          <TableHead className="whitespace-nowrap">Service ID</TableHead>
                          <TableHead className="whitespace-nowrap min-w-[150px]">Customer / Info</TableHead>
                          <TableHead className="whitespace-nowrap">SERPO</TableHead>
                          <TableHead className="whitespace-nowrap">Hostname</TableHead>
                          <TableHead className="whitespace-nowrap">FAT ID</TableHead>
                          <TableHead className="whitespace-nowrap">SN ONT</TableHead>
                          <TableHead className="whitespace-nowrap">Constraint</TableHead>
                          <TableHead className="whitespace-nowrap">Category</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="whitespace-nowrap">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterDialogTickets.map((ticket, index) => (
                          <TableRow 
                            key={ticket.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setFilterDialogOpen(false);
                              setSelectedTicket(ticket);
                            }}
                          >
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-semibold text-primary whitespace-nowrap">{ticket.id}</TableCell>
                            <TableCell className="font-mono text-xs whitespace-nowrap">{ticket.serviceId}</TableCell>
                            <TableCell className="max-w-[200px]">
                              <span className="block truncate">
                                {ticket.category === "FEEDER" 
                                  ? (ticket.constraint === "FAT LOSS" || ticket.constraint === "FAT LOW RX"
                                      ? `${ticket.fatId} - ${ticket.hostname}`
                                      : ticket.constraint === "PORT DOWN"
                                        ? (() => {
                                            const match = ticket.ticketResult.match(/PORT - (.+?) - DOWN/);
                                            const portInfo = match ? match[1] : "PORT";
                                            return `${portInfo} - ${ticket.hostname}`;
                                          })()
                                        : ticket.customerName || "-")
                                  : (ticket.customerName || "-")
                                }
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-xs whitespace-nowrap">{ticket.serpo}</TableCell>
                            <TableCell className="font-mono text-xs whitespace-nowrap">{ticket.hostname}</TableCell>
                            <TableCell className="font-mono text-xs whitespace-nowrap">{ticket.fatId}</TableCell>
                            <TableCell className="font-mono text-xs whitespace-nowrap">{ticket.snOnt}</TableCell>
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
                </>
              )
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t mt-4 flex-shrink-0">
            <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
