export interface OLT {
  id: string;
  provinsi: string;
  fatId: string;
  hostname: string;
  tikor: string;
  createdAt: string;
}

export interface OLTExcelRecord {
  provinsi?: string;
  "id fat"?: string;
  "fat id"?: string;
  fatid?: string;
  hostname?: string;
  "hostname olt"?: string;
  tikor?: string;
  "tikor olt"?: string;
  [key: string]: any;
}
