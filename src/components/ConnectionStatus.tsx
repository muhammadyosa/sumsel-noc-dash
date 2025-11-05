import { Cloud, CloudOff, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface ConnectionStatusProps {
  online: boolean;
  lastUpdate: Date | null;
  syncing?: boolean;
}

export function ConnectionStatus({ online, lastUpdate, syncing }: ConnectionStatusProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all ${
        online 
          ? 'bg-success/10 border border-success/20 text-success' 
          : 'bg-destructive/10 border border-destructive/20 text-destructive'
      }`}>
        {online ? (
          <>
            <Cloud className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium">Online</span>
          </>
        ) : (
          <>
            <CloudOff className="h-4 w-4" />
            <span className="text-sm font-medium">Offline, menunggu koneksi...</span>
          </>
        )}
        
        {lastUpdate && online && (
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-current/20">
            <Clock className="h-3 w-3" />
            <span className="text-xs">
              {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: id })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
