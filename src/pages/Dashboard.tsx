import { Activity, AlertTriangle, Zap, Server } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { useTickets } from "@/hooks/useTickets";
import { FEEDER_CONSTRAINTS } from "@/types/ticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

export default function Dashboard() {
  const { tickets, excelData } = useTickets();

  const totalIncidents = tickets.length;
  const overSLA = tickets.filter((t) => {
    const ageMs = new Date().getTime() - new Date(t.createdISO).getTime();
    return ageMs > 24 * 60 * 60 * 1000 && t.status !== "Resolved";
  }).length;
  const feederImpact = tickets.filter((t) => FEEDER_CONSTRAINTS.has(t.constraint)).length;
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
                      <p className="text-sm font-medium truncate">{ticket.id}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ticket.customerName}
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
