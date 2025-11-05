import { useState } from "react";
import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setGitHubToken, getGitHubToken } from "@/lib/github";
import { toast } from "sonner";

interface GitHubTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GitHubTokenDialog({ open, onOpenChange }: GitHubTokenDialogProps) {
  const [token, setToken] = useState(getGitHubToken() || "");

  const handleSave = () => {
    if (!token.trim()) {
      toast.error("Token tidak boleh kosong");
      return;
    }
    
    setGitHubToken(token.trim());
    toast.success("GitHub token tersimpan!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            GitHub Personal Access Token
          </DialogTitle>
          <DialogDescription>
            Token diperlukan untuk menyimpan data ke GitHub. Data akan tersinkron otomatis setiap 5 detik.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">GitHub Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Buat token di: Settings → Developer settings → Personal access tokens → Tokens (classic)
              <br />
              Permissions: <code className="text-xs">repo</code> (Full control of private repositories)
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Simpan Token
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
