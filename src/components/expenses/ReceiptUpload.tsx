"use client";

import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

interface ReceiptUploadProps {
  onFileSelect: (file: File | null) => void;
  currentReceipt?: { secureUrl: string; bytes: number } | null;
  onRemoveExisting?: () => void;
}

export function ReceiptUpload({
  onFileSelect,
  currentReceipt,
  onRemoveExisting,
}: ReceiptUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        return; // 10MB limit
      }

      setFileName(file.name);
      onFileSelect(file);

      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    setPreview(null);
    setFileName(null);
    onFileSelect(null);
  };

  // Show existing receipt
  if (currentReceipt && !preview) {
    return (
      <div className="border border-border rounded-xl p-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentReceipt.secureUrl}
                alt="Receipt"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Current receipt
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(currentReceipt.bytes)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-brand-green hover:underline cursor-pointer">
              Replace
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
            </label>
            {onRemoveExisting && (
              <button
                type="button"
                onClick={onRemoveExisting}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show new preview
  if (preview) {
    return (
      <div className="border border-border rounded-xl p-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {fileName}
              </p>
              <p className="text-xs text-brand-success">Ready to upload</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // Upload zone
  return (
    <label
      className={cn(
        "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors",
        isDragging
          ? "border-brand-green bg-brand-green/5"
          : "border-border hover:border-brand-green/40 hover:bg-muted/30"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          {isDragging ? (
            <ImageIcon className="w-5 h-5 text-brand-green" />
          ) : (
            <Upload className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {isDragging ? "Drop your receipt" : "Upload receipt"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag & drop or click to browse • Max 10MB
          </p>
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </label>
  );
}
