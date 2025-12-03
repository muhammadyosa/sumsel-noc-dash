import { Settings as SettingsIcon, Database, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="min-h-screen space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
          <SettingsIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground text-sm">
            Konfigurasi aplikasi
          </p>
        </div>
      </div>

      {/* Data Storage Info */}
      <Card className="shadow-lg border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Storage
          </CardTitle>
          <CardDescription>
            Informasi penyimpanan data aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Tickets</span>
              <span className="text-xs text-muted-foreground">
                Disimpan di localStorage
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Excel Data</span>
              <span className="text-xs text-muted-foreground">
                Disimpan di IndexedDB
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">OLT Data</span>
              <span className="text-xs text-muted-foreground">
                Disimpan di IndexedDB
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Shift Reports</span>
              <span className="text-xs text-muted-foreground">
                Disimpan di localStorage
              </span>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-amber-500">Catatan Penting:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Data disimpan secara lokal di browser</li>
                  <li>Data akan tetap tersimpan meskipun browser ditutup</li>
                  <li>Menghapus data browser akan menghapus semua data aplikasi</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="shadow-lg border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informasi Aplikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Versi</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Organisasi</span>
            <span className="text-sm font-medium">PLN Icon Plus</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Departemen</span>
            <span className="text-sm font-medium">NOC RITEL</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Jumlah Petugas</span>
            <span className="text-sm font-medium">14 Orang</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
