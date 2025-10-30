import { Activity, AlertTriangle, Zap, Server, Calendar, Clock, User } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { useTickets } from "@/hooks/useTickets";
import { FEEDER_CONSTRAINTS_SET } from "@/types/ticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useState, useEffect } from "react";

interface ShiftReport {
  id: string;
  date: string;
  shift: string;
  officer: string;
  summary: string;
  issues: string;
  notes: string;
  createdAt: string;
}

export default function Dashboard() {
  const { tickets, excelData } = useTickets();
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>([]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Monitoring incident NOC RITEL SBU SUMBAGSEL
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Incident"
          value={totalIncidents}
          icon={Activity}
          variant="default"
        />
        <MetricCard
          title="Over SLA (>24h)"
          value={overSLA}
          icon={AlertTriangle}
          variant="destructive"
        />
        <MetricCard
          title="Impact Feeder"
          value={feederImpact}
          icon={Zap}
          variant="warning"
        />
        <MetricCard
          title="Total OLT"
          value={totalOLT}
          icon={Server}
          variant="success"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["On Progress", "Critical", "Resolved", "Pending"].map((status) => {
                const count = tickets.filter((t) => t.status === status).length;
                const percentage = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <StatusBadge status={status as any} />
                      <span className="font-medium">{count} tickets</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
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
            <div className="space-y-4">
              {["RITEL", "FEEDER"].map((category) => {
                const count = tickets.filter((t) => t.category === category).length;
                const percentage = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            category === "FEEDER" ? "bg-warning" : "bg-primary"
                          }`}
                        />
                        <span className="font-medium">{category}</span>
                      </div>
                      <span className="font-medium">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          category === "FEEDER" ? "bg-warning" : "bg-primary"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
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
              <div className="space-y-4">
                {shiftReports.slice(-3).reverse().map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-lg bg-card border border-primary/10 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-wrap items-center gap-4 mb-3 pb-3 border-b border-border/50">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{new Date(report.date).toLocaleDateString("id-ID", { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium capitalize px-2 py-1 bg-primary/10 rounded-md">
                          Shift {report.shift}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">{report.officer}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Ringkasan Shift
                        </h4>
                        <p className="text-sm leading-relaxed">{report.summary}</p>
                      </div>

                      {report.issues && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Kendala/Masalah
                          </h4>
                          <p className="text-sm leading-relaxed text-destructive/90">{report.issues}</p>
                        </div>
                      )}

                      {report.notes && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Catatan
                          </h4>
                          <p className="text-sm leading-relaxed text-muted-foreground">{report.notes}</p>
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
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada tiket
                </p>
              ) : (
                recentTickets.map((ticket) => (
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
                        {ticket.constraint} - {ticket.customerName}
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
