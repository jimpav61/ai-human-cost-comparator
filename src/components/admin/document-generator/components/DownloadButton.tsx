
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DownloadButtonProps {
  hasDownloaded: boolean;
  label: string;
  downloadedLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export const DownloadButton = ({
  hasDownloaded,
  label,
  downloadedLabel,
  icon,
  onClick,
  className
}: DownloadButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant={hasDownloaded ? "secondary" : "default"}
      size="sm"
      className={cn("flex items-center", className)}
    >
      {icon}
      {hasDownloaded ? downloadedLabel : label}
    </Button>
  );
};
