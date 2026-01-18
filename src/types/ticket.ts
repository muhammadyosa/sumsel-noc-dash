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

// RITEL Constraints - masuk bucket RITEL
export const RITEL_CONSTRAINTS = [
  "LINK LOSS",
  "LOW RX",
  "ONT PROBLEM",
  "GANGGUAN ICONPLAY",
  "GANGGUAN BERULANG",
  "PENGECEKAN BERSAMA",
  "CABLE PROBLEM",
];

// FEEDER Constraints - masuk bucket FEEDER (PROACTIVE NOC RETAIL)
export const FEEDER_CONSTRAINTS = [
  "FAT LOW RX",
  "FAT LOSS",
  "PORT DOWN",
  "OLT DOWN",
];

export const ALL_CONSTRAINTS = [...RITEL_CONSTRAINTS, ...FEEDER_CONSTRAINTS];

export const FEEDER_CONSTRAINTS_SET = new Set(FEEDER_CONSTRAINTS);

// Generate ticket result format based on constraint
export function generateTicketFormat(
  constraint: string,
  customerName: string,
  serpo: string,
  fatId: string,
  hostname: string,
  snOnt: string,
  portText?: string
): string {
  // FEEDER Format
  if (constraint === "FAT LOW RX") {
    return `[PROACTIVE NOC RETAIL] FAT LOW RX - ${fatId} - UNDER - ${hostname} - ${serpo}`;
  }
  
  if (constraint === "FAT LOSS") {
    return `[PROACTIVE NOC RETAIL] FAT LOSS - ${fatId} - UNDER - ${hostname} - ${serpo}`;
  }
  
  if (constraint === "PORT DOWN") {
    const portInfo = portText || "[TEXT]";
    return `[PROACTIVE NOC RETAIL] PORT - ${portInfo} - DOWN UNDER - ${hostname} - ${serpo}`;
  }
  
  if (constraint === "OLT DOWN") {
    return `[PROACTIVE NOC RETAIL] OLT DOWN UNDER - ${hostname} - ${serpo}`;
  }
  
  // RITEL Format (default)
  return `${customerName} // ${constraint} - ${serpo} // ${fatId} // ${hostname} // ${snOnt} //`;
}
