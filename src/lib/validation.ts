import { z } from "zod";

// File upload - unlimited size and records

// Excel record validation schemas
export const excelRecordSchema = z.object({
  customer: z.string().trim().max(200, "Customer name too long"),
  service: z.string().trim().max(100, "Service ID too long"),
  hostname: z.string().trim().max(255, "Hostname too long"),
  fat: z.string().trim().max(100, "FAT ID too long"),
  sn: z.string().trim().max(100, "SN ONT too long"),
});

// OLT record schema - only validates the data fields, not id/createdAt
export const oltDataSchema = z.object({
  provinsi: z.string().trim().max(100, "Provinsi name too long"),
  fatId: z.string().trim().max(100, "FAT ID too long"),
  hostname: z.string().trim().max(255, "Hostname too long"),
  tikor: z.string().trim().max(500, "Tikor too long"),
});

// CSV formula injection prevention
export const sanitizeForCSV = (value: string | number): string => {
  const str = String(value ?? "");
  // Prefix formula-starting characters with single quote
  if (/^[=+@-]/.test(str)) {
    return `'${str}`;
  }
  return str;
};
