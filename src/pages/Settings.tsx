import { Settings as SettingsIcon, Github, Key, Database, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { getGitHubToken, setGitHubToken } from "@/lib/github";

export default function Settings() {
  const [githubToken, setGithubTokenState] = useState(getGitHubToken() || "");
  const [showToken, setShowToken] = useState(false);

  const handleSaveToken = () => {
    setGitHubToken(githubToken);
    toast.success("GitHub Token berhasil disimpan");
  };

  const handleClearToken = () => {
    setGitHubToken("");
    setGithubTokenState("");
    toast.success("GitHub Token berhasil dihapus");
  };

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
            Konfigurasi aplikasi dan integrasi
          </p>
        </div>
      </div>

      {/* GitHub Integration */}
      <Card className="shadow-lg border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Konfigurasi GitHub Personal Access Token untuk sinkronisasi data otomatis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github-token" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Personal Access Token
            </Label>
            <div className="flex gap-2">
              <Input
                id="github-token"
                type={showToken ? "text" : "password"}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubTokenState(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? "Hide" : "Show"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Token diperlukan untuk menyimpan data ke GitHub. 
              <a 
                href="https://github.com/settings/tokens/new?scopes=repo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                Buat token baru →
              </a>
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSaveToken} disabled={!githubToken}>
              Simpan Token
            </Button>
            <Button variant="outline" onClick={handleClearToken}>
              Hapus Token
            </Button>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-blue-500">Cara membuat GitHub Token:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Klik link "Buat token baru" di atas</li>
                  <li>Beri nama token (contoh: "NOC Dashboard")</li>
                  <li>Pilih scope "repo" (akses penuh ke repository)</li>
                  <li>Klik "Generate token"</li>
                  <li>Copy token dan paste di form di atas</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                Disimpan di localStorage & GitHub
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Excel Data</span>
              <span className="text-xs text-muted-foreground">
                Disimpan di IndexedDB & GitHub
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">OLT Data</span>
              <span className="text-xs text-muted-foreground">
                Disimpan di IndexedDB & GitHub
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
                  <li>Data otomatis di-sync ke GitHub setiap 5 detik jika online</li>
                  <li>Jika offline, data tetap tersimpan di browser</li>
                  <li>Saat online kembali, data akan otomatis ter-sync</li>
                  <li>GitHub Token diperlukan untuk write operations</li>
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
        </CardContent>
      </Card>
    </div>
  );
}
