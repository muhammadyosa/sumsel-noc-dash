import { Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UPEList = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">List UPE</h1>
        <p className="text-muted-foreground">
          Daftar Universal Platform Equipment (UPE)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Data UPE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Belum ada data UPE. Fitur import data akan segera tersedia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UPEList;
