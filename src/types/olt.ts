export interface OLT {
  id: string;
  provinsi: string;
  idOlt: string;
  hostnameOlt: string;
  hostnameUpe: string;
  ipNmsOlt: string;
  tikorOlt: string;
  createdAt: string;
}

export interface OLTExcelRecord {
  provinsi?: string;
  "id olt"?: string;
  "id_olt"?: string;
  idolt?: string;
  "hostname olt"?: string;
  "hostname_olt"?: string;
  hostnameolt?: string;
  "hostname upe"?: string;
  "hostname_upe"?: string;
  hostnameupe?: string;
  "ip nms olt"?: string;
  "ip_nms_olt"?: string;
  ipnmsolt?: string;
  "tikor olt"?: string;
  "tikor_olt"?: string;
  tikr?: string;
  [key: string]: any;
}
