import { useState, useEffect, useCallback } from "react";
import { Ticket, ExcelRecord } from "@/types/ticket";
import { toast } from "sonner";
import { loadExcelData, saveExcelData } from "@/lib/indexedDB";

const STORAGE_KEY = "noc_tickets";
const AUTO_DELETE_INTERVAL = 60 * 1000; // Check every minute
const SLA_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading tickets from localStorage:", error);
      }
      return [];
    }
  });

  // Excel data persists in IndexedDB
  const [excelData, setExcelData] = useState<ExcelRecord[]>([]);
  const [isLoadingExcel, setIsLoadingExcel] = useState(true);

  // Auto-delete resolved tickets after 24 hours
  const cleanupResolvedTickets = useCallback(() => {
    const now = new Date().getTime();
    setTickets((prev) => {
      const filtered = prev.filter((ticket) => {
        if (ticket.status === "Resolved") {
          const ticketAge = now - new Date(ticket.createdISO).getTime();
          return ticketAge < SLA_THRESHOLD_MS;
        }
        return true;
      });
      if (filtered.length < prev.length) {
        const deletedCount = prev.length - filtered.length;
        toast.info(`${deletedCount} tiket resolved (>24h) dihapus otomatis`);
      }
      return filtered;
    });
  }, []);

  // Auto-update ticket status to Critical when over SLA (24 hours)
  const updateOverSLATickets = useCallback(() => {
    const now = new Date().getTime();
    setTickets((prev) => {
      let updated = false;
      const newTickets = prev.map((ticket) => {
        if (ticket.status !== "Resolved" && ticket.status !== "Critical") {
          const ticketAge = now - new Date(ticket.createdISO).getTime();
          if (ticketAge >= SLA_THRESHOLD_MS) {
            updated = true;
            return { ...ticket, status: "Critical" as const };
          }
        }
        return ticket;
      });
      return updated ? newTickets : prev;
    });
  }, []);

  // Run cleanup and SLA check on mount and periodically
  useEffect(() => {
    // Run immediately on mount
    cleanupResolvedTickets();
    updateOverSLATickets();
    
    // Set up interval for periodic checks
    const interval = setInterval(() => {
      cleanupResolvedTickets();
      updateOverSLATickets();
    }, AUTO_DELETE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [cleanupResolvedTickets, updateOverSLATickets]);

  // Load Excel data from IndexedDB on mount
  useEffect(() => {
    loadExcelData()
      .then((data) => {
        setExcelData(data);
        setIsLoadingExcel(false);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error("Error loading Excel data from IndexedDB:", error);
        }
        setIsLoadingExcel(false);
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error saving tickets to localStorage:", error);
      }
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        toast.error(
          "Storage penuh! Silakan export dan hapus tiket lama untuk membuat ruang."
        );
      }
    }
  }, [tickets]);

  const addTicket = (ticket: Ticket) => {
    setTickets((prev) => [ticket, ...prev]);
  };

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((ticket) => (ticket.id === id ? { ...ticket, ...updates } : ticket))
    );
  };

  const deleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
  };

  const importExcelData = async (data: ExcelRecord[]) => {
    try {
      await saveExcelData(data);
      setExcelData(data);
      toast.success("Data Excel berhasil disimpan secara permanen!");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error saving Excel data to IndexedDB:", error);
      }
      toast.error("Gagal menyimpan data Excel.");
    }
  };

  return {
    tickets,
    excelData,
    isLoadingExcel,
    addTicket,
    updateTicket,
    deleteTicket,
    importExcelData,
  };
}
