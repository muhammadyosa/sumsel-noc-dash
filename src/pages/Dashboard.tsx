import { Activity, AlertTriangle, Zap, Server, Calendar, Clock, User } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { useTickets } from "@/hooks/useTickets";
import { FEEDER_CONSTRAINTS_SET } from "@/types/ticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useState, useEffect } from "react";

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

  // Load shift reports from localStorage
  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem("shiftReports") || "[]");
    setShiftReports(reports);
  }, []);

  const totalIncidents = tickets.length;
  const overSLA = tickets.filter((t) => {
    const ageMs = new Date().getTime() - new Date(t.createdISO).getTime();
    return ageMs > 24 * 60 * 60 * 1000 && t.status !== "Resolved";
  }).length;
  const feederImpact = tickets.filter((t) => FEEDER_CONSTRAINTS_SET.has(t.constraint)).length;
  const totalOLT = new Set(excelData.map((r) => r.hostname).filter(Boolean)).size || 0;

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
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {["On Progress", "Critical", "Resolved", "Pending"].map((status) => {
                const count = tickets.filter((t) => t.status === status).length;
                const percentage = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
                const getStatusColor = (s: string) => {
                  switch (s) {
                    case "On Progress": return "bg-blue-500";
                    case "Critical": return "bg-destructive";
                    case "Resolved": return "bg-success";
                    case "Pending": return "bg-warning";
                    default: return "bg-primary";
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
                  <div key={status} className="relative group">
                    <button
                      onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                      className={`w-full p-4 rounded-lg border bg-card hover:shadow-lg transition-all hover:scale-105 text-left ${
                        selectedStatus === status ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getStatusIcon(status)}</span>
                          <StatusBadge status={status as any} />
                        </div>
                      </div>
                      <div className="text-3xl font-bold mb-1">{count}</div>
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% of total
                      </div>
                      <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getStatusColor(status)} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {["RITEL", "FEEDER"].map((category) => {
                const count = tickets.filter((t) => t.category === category).length;
                const percentage = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
                const circumference = 2 * Math.PI * 45;
                const strokeDashoffset = circumference - (percentage / 100) * circumference;
                
                return (
                  <div key={category} className="relative">
                    <button
                      onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-lg transition-all text-left ${
                        selectedCategory === category ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-secondary"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className={category === "FEEDER" ? "text-warning" : "text-primary"}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 1s ease" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{percentage.toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              category === "FEEDER" ? "bg-warning" : "bg-primary"
                            }`}
                          />
                          <span className="text-lg font-semibold">{category}</span>
                        </div>
                        <div className="text-3xl font-bold mb-1">{count}</div>
                        <div className="text-sm text-muted-foreground">
                          tickets in this category
                        </div>
                      </div>
                    </button>
                  </div>
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
                {selectedStatus || selectedCategory || selectedMetric ? "Filtered Tickets" : "Recent Tickets"}
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
            <div className="space-y-3">
              {(selectedStatus || selectedCategory || selectedMetric ? filteredTickets : recentTickets).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {selectedStatus || selectedCategory || selectedMetric ? "Tidak ada tiket yang sesuai filter" : "Belum ada tiket"}
                </p>
              ) : (
                (selectedStatus || selectedCategory || selectedMetric ? filteredTickets : recentTickets).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{ticket.id}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            ticket.category === "FEEDER"
                              ? "bg-warning/20 text-warning"
                              : "bg-primary/20 text-primary"
                          }`}
                        >
                          {ticket.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {ticket.category === "FEEDER" ? (
                          ticket.constraint === "OLT DOWN" ? ticket.hostname :
                          ticket.constraint === "PORT DOWN" ? `${ticket.ticketResult.match(/PORT - (.*?) - DOWN/)?.[1] || "PORT"} - ${ticket.hostname}` :
                          ticket.constraint === "FAT LOSS" || ticket.constraint === "FAT LOW RX" ? `${ticket.fatId} - ${ticket.hostname}` :
                          ticket.constraint
                        ) : ticket.customerName}
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
