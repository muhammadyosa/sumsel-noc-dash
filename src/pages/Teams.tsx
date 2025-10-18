import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTickets } from "@/hooks/useTickets";

export default function Teams() {
  const { tickets } = useTickets();

  const teamStats = tickets.reduce((acc, ticket) => {
    if (!ticket.serpo) return acc;
    if (!acc[ticket.serpo]) {
      acc[ticket.serpo] = {
        total: 0,
        resolved: 0,
        pending: 0,
        critical: 0,
      };
    }
    acc[ticket.serpo].total++;
    if (ticket.status === "Resolved") acc[ticket.serpo].resolved++;
    if (ticket.status === "Pending" || ticket.status === "On Progress")
      acc[ticket.serpo].pending++;
    if (ticket.status === "Critical") acc[ticket.serpo].critical++;
    return acc;
  }, {} as Record<string, { total: number; resolved: number; pending: number; critical: number }>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">List Team</h1>
        <p className="text-muted-foreground">Daftar tim dan statistik ticket</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.keys(teamStats).length === 0 ? (
          <Card className="shadow-card col-span-full">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada data tim. Buat tiket untuk melihat statistik tim.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(teamStats).map(([team, stats]) => (
            <Card key={team} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {team}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tickets:</span>
                    <span className="font-bold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-success">Resolved:</span>
                    <span className="font-medium text-success">{stats.resolved}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-warning">In Progress:</span>
                    <span className="font-medium text-warning">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-destructive">Critical:</span>
                    <span className="font-medium text-destructive">{stats.critical}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Resolution Rate:</span>
                      <span className="text-primary">
                        {stats.total > 0
                          ? Math.round((stats.resolved / stats.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
