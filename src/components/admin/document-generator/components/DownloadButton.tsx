
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from "lucide-react";

interface DownloadButtonProps {
  hasDownloaded: boolean;
  label: string;
  downloadedLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  loading?: boolean;
}

export const DownloadButton = ({
  hasDownloaded,
  label,
  downloadedLabel,
  icon,
  onClick,
  className,
  loading = false
}: DownloadButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant={hasDownloaded ? "secondary" : "default"}
      size="sm"
      className={cn("flex items-center", className)}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        icon
      )}
      {hasDownloaded ? downloadedLabel : label}
    </Button>
  );
};
