import { useState, useEffect } from "react";
import { Ticket, ExcelRecord } from "@/types/ticket";
import { toast } from "sonner";

const STORAGE_KEY = "noc_tickets";

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading tickets from localStorage:", error);
      return [];
    }
  });

  // Excel data persists in localStorage for the session
  const [excelData, setExcelData] = useState<ExcelRecord[]>(() => {
    try {
      const saved = localStorage.getItem("noc_excel_data");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading Excel data from localStorage:", error);
      return [];
    }
  });

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
    try {
      localStorage.setItem("noc_excel_data", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving Excel data to localStorage:", error);
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        toast.error("Storage penuh! Excel data tidak dapat disimpan.");
      }
    }
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
