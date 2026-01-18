import { Users, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { useTickets } from "@/hooks/useTickets";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--primary))",
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--success))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--warning))",
  },
  critical: {
    label: "Critical",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

export default function Teams() {
  const { tickets } = useTickets();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const teamStats = tickets.reduce((acc, ticket) => {
    if (!ticket.serpo) return acc;
    if (!acc[ticket.serpo]) {
      acc[ticket.serpo] = {
        total: 0,
        resolved: 0,
        pending: 0,
        critical: 0,
        tickets: [],
      };
    }
    acc[ticket.serpo].total++;
    acc[ticket.serpo].tickets.push(ticket);
    if (ticket.status === "Resolved") acc[ticket.serpo].resolved++;
    if (ticket.status === "Pending" || ticket.status === "On Progress")
      acc[ticket.serpo].pending++;
    if (ticket.status === "Critical") acc[ticket.serpo].critical++;
    return acc;
  }, {} as Record<string, { total: number; resolved: number; pending: number; critical: number; tickets: any[] }>);

  const chartData = Object.entries(teamStats).map(([team, stats]) => ({
    team,
    total: stats.total,
    resolved: stats.resolved,
    pending: stats.pending,
    critical: stats.critical,
    tickets: stats.tickets,
  }));

  const selectedTeamData = selectedTeam ? teamStats[selectedTeam] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">👥 List Team</h1>
        <p className="text-muted-foreground">Statistik ticket per tim dalam bentuk grafik batang</p>
      </div>

      {Object.keys(teamStats).length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data tim. Buat tiket untuk melihat statistik tim.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bar Chart */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Statistik Ticket per Tim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px] w-full transition-all duration-500 ease-out">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  barCategoryGap="20%"
                  barGap={2}
                  onClick={(data) => {
                    if (data?.activePayload?.[0]?.payload?.team) {
                      setSelectedTeam(data.activePayload[0].payload.team);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis 
                    dataKey="team" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    height={70}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => `Tim: ${value}`}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
                  <Bar 
                    dataKey="total" 
                    name="Total"
                    fill="hsl(var(--primary))" 
                    radius={[3, 3, 0, 0]}
                    cursor="pointer"
                    maxBarSize={24}
                  />
                  <Bar 
                    dataKey="resolved" 
                    name="Resolved"
                    fill="hsl(var(--success))" 
                    radius={[3, 3, 0, 0]}
                    cursor="pointer"
                    maxBarSize={24}
                  />
                  <Bar 
                    dataKey="pending" 
                    name="Pending"
                    fill="hsl(var(--warning))" 
                    radius={[3, 3, 0, 0]}
                    cursor="pointer"
                    maxBarSize={24}
                  />
                  <Bar 
                    dataKey="critical" 
                    name="Critical"
                    fill="hsl(var(--destructive))" 
                    radius={[3, 3, 0, 0]}
                    cursor="pointer"
                    maxBarSize={24}
                  />
                </BarChart>
              </ChartContainer>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Klik pada bar untuk melihat detail tickets tim
              </p>
            </CardContent>
          </Card>

          {/* Detail Panel */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {selectedTeam ? `Detail: ${selectedTeam}` : "Detail Tim"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTeamData ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Tickets:</span>
                      <span className="font-bold">{selectedTeamData.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-success">Resolved:</span>
                      <span className="font-medium text-success">{selectedTeamData.resolved}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warning">In Progress/Pending:</span>
                      <span className="font-medium text-warning">{selectedTeamData.pending}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-destructive">Critical:</span>
                      <span className="font-medium text-destructive">{selectedTeamData.critical}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Resolution Rate:</span>
                        <span className="text-primary">
                          {selectedTeamData.total > 0
                            ? Math.round((selectedTeamData.resolved / selectedTeamData.total) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat Detail Tickets
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-2xl">
                      <SheetHeader>
                        <SheetTitle>Detail Tickets - {selectedTeam}</SheetTitle>
                        <SheetDescription>
                          Daftar semua tickets yang ditangani oleh tim {selectedTeam}
                        </SheetDescription>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                        <div className="space-y-4 pr-4">
                          {selectedTeamData.tickets.map((ticket) => (
                            <Card key={ticket.id} className="shadow-sm">
                              <CardContent className="pt-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="font-bold text-sm">{ticket.id}</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {ticket.createdAt}
                                      </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <StatusBadge status={ticket.status} />
                                      <Badge
                                        variant="outline"
                                        className={
                                          ticket.category === "FEEDER"
                                            ? "bg-warning/10 text-warning border-warning/20"
                                            : "bg-primary/10 text-primary border-primary/20"
                                        }
                                      >
                                        {ticket.category}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Customer/Type:</span>
                                      <p className="font-medium">
                                        {ticket.category === "FEEDER" ? (
                                          ticket.constraint === "OLT DOWN" ? ticket.hostname :
                                          ticket.constraint === "PORT DOWN" ? (ticket.ticketResult.match(/PORT - (.*?) - DOWN/)?.[1] || "PORT INFO") :
                                          ticket.constraint === "FAT LOSS" || ticket.constraint === "FAT LOW RX" ? ticket.fatId :
                                          ticket.constraint
                                        ) : ticket.customerName}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Service ID:</span>
                                      <p className="font-medium font-mono">{ticket.serviceId}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Constraint:</span>
                                      <p className="font-medium">{ticket.constraint}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Hostname:</span>
                                      <p className="font-medium font-mono text-[10px]">
                                        {ticket.hostname}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">FAT ID:</span>
                                      <p className="font-medium font-mono">{ticket.fatId}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">SN ONT:</span>
                                      <p className="font-medium font-mono">{ticket.snOnt}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="pt-2 border-t">
                                    <span className="text-xs text-muted-foreground">Ticket Result:</span>
                                    <p className="text-xs font-mono mt-1 p-2 bg-muted/50 rounded">
                                      {ticket.ticketResult}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Klik pada grafik untuk melihat detail tim</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
