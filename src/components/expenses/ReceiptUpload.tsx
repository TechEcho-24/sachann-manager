"use client";

import { useCallback, useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Camera, Loader2 } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { compressImage } from "@/lib/imageUtils";
import { toast } from "sonner";

export interface ExistingReceipt {
  secureUrl: string;
  bytes: number;
  publicId?: string;
}

interface ReceiptUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingReceipts?: ExistingReceipt[];
  onRemoveExisting?: (index: number) => void;
  maxFiles?: number;
}

export function ReceiptUpload({
  files,
  onFilesChange,
  existingReceipts = [],
  onRemoveExisting,
  maxFiles = 5,
}: ReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  // Generate previews for selected files
  useEffect(() => {
    const objectUrls = files.map((file) => URL.createObjectURL(file));
    setPreviews(objectUrls);

    // Cleanup memory
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const totalFiles = files.length + existingReceipts.length;
  const canAddMore = totalFiles < maxFiles;

  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      if (!canAddMore) return;
      
      const fileArray = Array.from(newFiles).filter((file) =>
        file.type.startsWith("image/")
      );

      if (fileArray.length === 0) return;

      const availableSlots = maxFiles - totalFiles;
      const filesToProcess = fileArray.slice(0, availableSlots);

      if (fileArray.length > availableSlots) {
        toast.warning(`Only up to ${maxFiles} images can be uploaded.`);
      }

      setIsCompressing(true);
      try {
        const compressedFiles = await Promise.all(
          filesToProcess.map((f) => compressImage(f))
        );

        let originalSize = 0;
        let compressedSize = 0;
        filesToProcess.forEach((f) => { originalSize += f.size; });
        compressedFiles.forEach((f) => { compressedSize += f.size; });

        if (originalSize > 0 && compressedSize < originalSize) {
          const savings = ((originalSize - compressedSize) / originalSize) * 100;
          if (savings > 1) {
            toast.success(`Images auto-compressed by ${savings.toFixed(0)}%!`);
          }
        }

        onFilesChange([...files, ...compressedFiles]);
      } catch (error) {
        console.error("Failed to compress images", error);
        toast.error("Error processing images. Please try again.");
      } finally {
        setIsCompressing(false);
      }
    },
    [canAddMore, files, maxFiles, onFilesChange, totalFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = ""; // reset input
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Existing Receipts */}
        {existingReceipts.map((receipt, index) => (
          <div
            key={receipt.publicId || index}
            className="border border-border rounded-xl p-3 bg-muted/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receipt.secureUrl}
                  alt={`Receipt ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Saved Receipt
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(receipt.bytes)}
                </p>
              </div>
            </div>
            {onRemoveExisting && (
              <button
                type="button"
                onClick={() => onRemoveExisting(index)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {/* New Files Previews */}
        {files.map((file, index) => (
          <div
            key={index}
            className="border border-border rounded-xl p-3 bg-muted/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previews[index]}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                  {file.name}
                </p>
                <p className="text-xs text-brand-success">
                  {formatFileSize(file.size)} (Compressed)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      {canAddMore && (
        <div
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors",
            isDragging
              ? "border-brand-green bg-brand-green/5"
              : "border-border hover:border-brand-green/40 hover:bg-muted/30",
            isCompressing && "opacity-70 pointer-events-none"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              {isCompressing ? (
                <Loader2 className="w-5 h-5 text-brand-green animate-spin" />
              ) : isDragging ? (
                <ImageIcon className="w-5 h-5 text-brand-green" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isCompressing
                  ? "Compressing images..."
                  : isDragging
                  ? "Drop your receipts"
                  : `Upload up to ${maxFiles} receipts`}
              </p>
              {!isCompressing && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Images will be auto-compressed
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-brand-green-light transition-colors shadow-sm">
              <Camera className="w-4 h-4" />
              Take Photo
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={handleChange}
                disabled={isCompressing}
              />
            </label>
            <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-card text-foreground rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-muted transition-colors border border-border shadow-sm">
              <ImageIcon className="w-4 h-4" />
              Gallery
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleChange}
                disabled={isCompressing}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
