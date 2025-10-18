export interface Ticket {
  id: string;
  serviceId: string;
  customerName: string;
  serpo: string;
  hostname: string;
  fatId: string;
  snOnt: string;
  constraint: string;
  category: string;
  ticketResult: string;
  status: "On Progress" | "Critical" | "Resolved" | "Pending";
  createdAt: string;
  createdISO: string;
}

export interface ExcelRecord {
  customer?: string;
  service?: string;
  hostname?: string;
  fat?: string;
  sn?: string;
  [key: string]: any;
}

export const CONSTRAINTS = [
  "Feeder Putus",
  "Feeder Redaman Tinggi",
  "OLT Down",
  "Port OLT Full",
  "ONT Offline",
  "Redaman Tinggi",
  "Kabel Putus",
  "Other",
];

export const FEEDER_CONSTRAINTS = new Set([
  "Feeder Putus",
  "Feeder Redaman Tinggi",
]);
