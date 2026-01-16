import * as XLSX from "xlsx";
import { ExcelRecord } from "@/types/ticket";
import { OLT } from "@/types/olt";
import { saveExcelData, saveOLTData } from "./indexedDB";

// Types for each data category
export interface UPERecord {
  id: string;
  hostnameOLT: string;
  hostnameUPE: string;
  createdAt: string;
}

export interface BNGRecord {
  id: string;
  bng: string;
  vlan: string;
  hostnameOLT: string;
  hostnameUPE: string;
  port: string;
  provinsi: string;
  createdAt: string;
}

export interface ImportResult {
  userRecords: ExcelRecord[];
  oltRecords: OLT[];
  upeRecords: UPERecord[];
  bngRecords: BNGRecord[];
  summary: {
    user: number;
    olt: number;
    upe: number;
    bng: number;
    totalSheets: number;
    processedSheets: string[];
    skippedSheets: string[];
  };
}

// Sheet detection patterns
const SHEET_PATTERNS = {
  user: ["user", "pelanggan", "customer", "data user"],
  fat: ["fat", "olt", "data fat", "data olt"],
  upe: ["upe", "data upe"],
  bng: ["bng", "data bng"],
};

// Column mapping for each sheet type
const COLUMN_MAPPINGS = {
  user: {
    customer: ["Customer Name", "customer", "nama pelanggan", "nama", "pelanggan"],
    service: ["Service ID", "service", "id service", "service_id"],
    hostname: ["Hostname OLT", "hostname", "hostname_olt", "olt"],
    fat: ["ID FAT", "fat", "fat_id", "id_fat"],
    sn: ["SN ONT", "sn", "sn_ont", "ont"],
  },
  fat: {
    provinsi: ["Provinsi", "provinsi", "province", "nama provinsi"],
    fatId: ["FAT ID", "fat", "fat_id", "id fat", "id_fat"],
    hostname: ["Hostname OLT", "hostname", "hostname_olt", "olt", "hostname olt"],
    tikor: ["Tikor FAT", "tikor", "koordinat", "coordinate", "tikor_fat"],
  },
  upe: {
    hostnameOLT: ["Hostname OLT", "hostname_olt", "olt", "hostname olt"],
    hostnameUPE: ["Hostname UPE", "hostname_upe", "upe", "hostname upe"],
  },
  bng: {
    bng: ["BNG", "bng", "hostname bng"],
    vlan: ["VLAN", "vlan", "vlan_id"],
    hostnameOLT: ["Hostname OLT", "hostname_olt", "olt"],
    hostnameUPE: ["Hostname UPE", "hostname_upe", "upe"],
    port: ["Port", "port", "port_id"],
    provinsi: ["Provinsi", "provinsi", "province"],
  },
};

// Helper to find column value with multiple possible headers
function getColumnValue(row: any, possibleHeaders: string[]): string {
  for (const header of possibleHeaders) {
    // Check exact match first
    if (row[header] !== undefined && row[header] !== null) {
      return String(row[header]).trim();
    }
    // Check case-insensitive
    const keys = Object.keys(row);
    for (const key of keys) {
      if (key.toLowerCase() === header.toLowerCase()) {
        return String(row[key] ?? "").trim();
      }
    }
  }
  return "";
}

// Helper to detect sheet type based on name or content
function detectSheetType(sheetName: string, sampleData: any[]): keyof typeof SHEET_PATTERNS | null {
  const normalizedName = sheetName.toLowerCase().trim();
  
  // Check by name patterns
  for (const [type, patterns] of Object.entries(SHEET_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalizedName.includes(pattern) || normalizedName === pattern) {
        return type as keyof typeof SHEET_PATTERNS;
      }
    }
  }
  
  // If name doesn't match, try to detect by column headers
  if (sampleData.length > 0) {
    const headers = Object.keys(sampleData[0]).map(h => h.toLowerCase());
    
    // Check for UPE-specific columns
    if (headers.some(h => h.includes("upe")) && headers.some(h => h.includes("olt"))) {
      // Check if it looks like BNG data (has more columns)
      if (headers.some(h => h.includes("bng") || h.includes("vlan") || h.includes("port"))) {
        return "bng";
      }
      return "upe";
    }
    
    // Check for FAT/OLT data
    if (headers.some(h => h.includes("provinsi")) && 
        headers.some(h => h.includes("fat") || h.includes("tikor"))) {
      return "fat";
    }
    
    // Check for User data
    if (headers.some(h => h.includes("customer") || h.includes("pelanggan")) ||
        (headers.some(h => h.includes("service")) && headers.some(h => h.includes("sn")))) {
      return "user";
    }
  }
  
  return null;
}

// Process User sheet
function processUserSheet(data: any[]): ExcelRecord[] {
  return data
    .map((row) => ({
      customer: getColumnValue(row, COLUMN_MAPPINGS.user.customer),
      service: getColumnValue(row, COLUMN_MAPPINGS.user.service),
      hostname: getColumnValue(row, COLUMN_MAPPINGS.user.hostname),
      fat: getColumnValue(row, COLUMN_MAPPINGS.user.fat),
      sn: getColumnValue(row, COLUMN_MAPPINGS.user.sn),
    }))
    .filter((r) => r.customer || r.service || r.hostname || r.fat || r.sn);
}

// Process FAT/OLT sheet
function processFATSheet(data: any[]): OLT[] {
  return data
    .map((row, index) => ({
      id: `olt-${Date.now()}-${index}`,
      provinsi: getColumnValue(row, COLUMN_MAPPINGS.fat.provinsi),
      fatId: getColumnValue(row, COLUMN_MAPPINGS.fat.fatId),
      hostname: getColumnValue(row, COLUMN_MAPPINGS.fat.hostname),
      tikor: getColumnValue(row, COLUMN_MAPPINGS.fat.tikor),
      createdAt: new Date().toISOString(),
    }))
    .filter((r) => r.provinsi || r.fatId || r.hostname || r.tikor);
}

// Process UPE sheet
function processUPESheet(data: any[]): UPERecord[] {
  return data
    .map((row, index) => ({
      id: `upe-${Date.now()}-${index}`,
      hostnameOLT: getColumnValue(row, COLUMN_MAPPINGS.upe.hostnameOLT),
      hostnameUPE: getColumnValue(row, COLUMN_MAPPINGS.upe.hostnameUPE),
      createdAt: new Date().toISOString(),
    }))
    .filter((r) => r.hostnameOLT || r.hostnameUPE);
}

// Process BNG sheet
function processBNGSheet(data: any[]): BNGRecord[] {
  return data
    .map((row, index) => ({
      id: `bng-${Date.now()}-${index}`,
      bng: getColumnValue(row, COLUMN_MAPPINGS.bng.bng),
      vlan: getColumnValue(row, COLUMN_MAPPINGS.bng.vlan),
      hostnameOLT: getColumnValue(row, COLUMN_MAPPINGS.bng.hostnameOLT),
      hostnameUPE: getColumnValue(row, COLUMN_MAPPINGS.bng.hostnameUPE),
      port: getColumnValue(row, COLUMN_MAPPINGS.bng.port),
      provinsi: getColumnValue(row, COLUMN_MAPPINGS.bng.provinsi),
      createdAt: new Date().toISOString(),
    }))
    .filter((r) => r.bng || r.hostnameOLT || r.hostnameUPE);
}

// Main function to import multi-sheet Excel file
export async function importMultiSheetExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        
        const result: ImportResult = {
          userRecords: [],
          oltRecords: [],
          upeRecords: [],
          bngRecords: [],
          summary: {
            user: 0,
            olt: 0,
            upe: 0,
            bng: 0,
            totalSheets: workbook.SheetNames.length,
            processedSheets: [],
            skippedSheets: [],
          },
        };
        
        // Process each sheet
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          
          if (jsonData.length === 0) {
            result.summary.skippedSheets.push(`${sheetName} (empty)`);
            continue;
          }
          
          const sheetType = detectSheetType(sheetName, jsonData);
          
          if (!sheetType) {
            result.summary.skippedSheets.push(`${sheetName} (unknown format)`);
            continue;
          }
          
          switch (sheetType) {
            case "user":
              result.userRecords = processUserSheet(jsonData);
              result.summary.user = result.userRecords.length;
              result.summary.processedSheets.push(`${sheetName} → User (${result.userRecords.length})`);
              break;
              
            case "fat":
              result.oltRecords = processFATSheet(jsonData);
              result.summary.olt = result.oltRecords.length;
              result.summary.processedSheets.push(`${sheetName} → OLT (${result.oltRecords.length})`);
              break;
              
            case "upe":
              result.upeRecords = processUPESheet(jsonData);
              result.summary.upe = result.upeRecords.length;
              result.summary.processedSheets.push(`${sheetName} → UPE (${result.upeRecords.length})`);
              break;
              
            case "bng":
              result.bngRecords = processBNGSheet(jsonData);
              result.summary.bng = result.bngRecords.length;
              result.summary.processedSheets.push(`${sheetName} → BNG (${result.bngRecords.length})`);
              break;
          }
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Gagal membaca file"));
    };
    
    reader.readAsBinaryString(file);
  });
}

// Get available sheets from Excel file
export async function getExcelSheets(file: File): Promise<{ name: string; rowCount: number; type: string | null }[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        
        const sheets = workbook.SheetNames.map((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          const type = detectSheetType(sheetName, jsonData);
          
          return {
            name: sheetName,
            rowCount: jsonData.length,
            type: type,
          };
        });
        
        resolve(sheets);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Gagal membaca file"));
    };
    
    reader.readAsBinaryString(file);
  });
}
