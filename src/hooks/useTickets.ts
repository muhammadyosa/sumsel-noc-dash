import { useState, useEffect } from "react";
import { Ticket, ExcelRecord } from "@/types/ticket";
import { toast } from "sonner";
import { loadExcelData, saveExcelData } from "@/lib/indexedDB";

const STORAGE_KEY = "noc_tickets";

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
