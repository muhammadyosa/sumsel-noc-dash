import { useState, useEffect } from "react";
import { Ticket, ExcelRecord } from "@/types/ticket";
import { toast } from "sonner";

const STORAGE_KEY = "noc_tickets";

export function useTickets() {
  // Clean up old Excel data from localStorage on first mount
  useEffect(() => {
    try {
      localStorage.removeItem("noc_excel_data");
    } catch (error) {
      console.error("Error cleaning up old data:", error);
    }
  }, []);

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading tickets from localStorage:", error);
      return [];
    }
  });

  // Excel data is only stored in memory (session only)
  // Users can re-import if needed after page refresh
  const [excelData, setExcelData] = useState<ExcelRecord[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch (error) {
      console.error("Error saving tickets to localStorage:", error);
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

  const importExcelData = (data: ExcelRecord[]) => {
    setExcelData(data);
  };

  return {
    tickets,
    excelData,
    addTicket,
    updateTicket,
    deleteTicket,
    importExcelData,
  };
}
