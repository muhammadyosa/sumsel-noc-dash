import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { GitHubTokenDialog } from "@/components/GitHubTokenDialog";
import { Button } from "@/components/ui/button";
import { Zap, Key } from "lucide-react";
import { isOnline } from "@/lib/github";
import Dashboard from "./pages/Dashboard";
import TicketManagement from "./pages/TicketManagement";
import Teams from "./pages/Teams";
import OLTList from "./pages/OLTList";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [online, setOnline] = useState(isOnline());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                  <header className="sticky top-0 z-10 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-14 items-center px-4 gap-3">
                      <SidebarTrigger />
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-lg">NOC RITEL</span>
                      </div>
                    </div>
                  </header>
                  <main className="flex-1 p-6">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/tickets" element={<TicketManagement />} />
                      <Route path="/teams" element={<Teams />} />
                      <Route path="/olt" element={<OLTList />} />
                      <Route path="/report" element={<Report />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
            
            <ConnectionStatus online={online} lastUpdate={lastUpdate} />
            
            <Button
              size="icon"
              variant="outline"
              className="fixed bottom-4 left-4 z-50 rounded-full shadow-lg"
              onClick={() => setTokenDialogOpen(true)}
            >
              <Key className="h-4 w-4" />
            </Button>
            
            <GitHubTokenDialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen} />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
