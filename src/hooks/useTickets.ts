import { useState, useEffect } from "react";
import { Ticket, ExcelRecord } from "@/types/ticket";

const STORAGE_KEY = "noc_tickets";
const EXCEL_DATA_KEY = "noc_excel_data";

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [excelData, setExcelData] = useState<ExcelRecord[]>(() => {
    const saved = localStorage.getItem(EXCEL_DATA_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(EXCEL_DATA_KEY, JSON.stringify(excelData));
  }, [excelData]);

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
