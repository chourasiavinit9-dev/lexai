'use client';

import { useState, useRef } from 'react';
import { bodhanOcr } from '@/lib/bodhan';
import { Loader } from './Loader';

interface DocumentDropzoneProps {
  readonly onTextExtracted: (text: string, fileName: string, source: 'bodhan' | 'file') => void;
  readonly onError?: (msg: string) => void;
  readonly compact?: boolean;
}

export function DocumentDropzone({ onTextExtracted, onError, compact = false }: DocumentDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastUploadedName, setLastUploadedName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setErrorMessage(null);
    setStatusMessage(null);

    const isImage = file.type.startsWith('image/');
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isImage && !isText && !isPdf) {
      const err = 'Unsupported file type. Please upload an image (PNG, JPG, WebP), PDF, or text file.';
      setErrorMessage(err);
      onError?.(err);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      const err = 'File is too large. Maximum size is 15MB.';
      setErrorMessage(err);
      onError?.(err);
      return;
    }

    setIsProcessing(true);
    setLastUploadedName(file.name);

    try {
      if (isText) {
        setStatusMessage('Reading text file…');
        const text = await file.text();
        if (!text.trim()) {
          throw new Error('The uploaded text file is empty.');
        }
        onTextExtracted(text, file.name, 'file');
        setStatusMessage(`✓ Loaded "${file.name}" (${text.length.toLocaleString()} characters)`);
        return;
      }

      // Convert to base64 for OCR
      setStatusMessage('Preparing document for OCR…');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1] || '');
        };
        reader.onerror = () => reject(new Error('Failed to read file into memory.'));
        reader.readAsDataURL(file);
      });

      setStatusMessage('Extracting legal text with Bodhan AI Indic-OCR…');
      const ocrResult = await bodhanOcr(base64, file.type || 'image/png');
      
      if (!ocrResult.extractedText || !ocrResult.extractedText.trim()) {
        throw new Error('No readable legal text could be found. Please ensure the document is clear.');
      }

      onTextExtracted(ocrResult.extractedText, file.name, 'bodhan');
      setStatusMessage(`✓ Extracted via Bodhan Indic-OCR (${ocrResult.extractedText.length.toLocaleString()} characters)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Document processing failed.';
      setErrorMessage(msg);
      onError?.(msg);
    } finally {
      setIsProcessing(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      void handleFile(e.dataTransfer.files[0]);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  return (
    <div className={`doc-dropzone-wrapper ${compact ? 'compact' : ''}`}>
      <div
        className={`doc-dropzone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload legal document, scan, or image for OCR"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.txt,.md"
          className="visually-hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              void handleFile(e.target.files[0]);
            }
          }}
        />

        {isProcessing ? (
          <div className="doc-dropzone-loading">
            <Loader size="2.6rem" color="var(--gold)" />
            <p className="doc-dropzone-stage">{statusMessage ?? 'Processing document…'}</p>
            <p className="doc-dropzone-sub">Bodhan AI Indic-OCR is reading document clauses and statutory citations</p>
          </div>
        ) : (
          <div className="doc-dropzone-content">
            <div className="doc-dropzone-icon" aria-hidden="true">
              📷
            </div>
            <div className="doc-dropzone-text">
              <p className="doc-dropzone-title">
                {compact ? 'Upload document photo, scan, or PDF (OCR)' : 'Upload legal document or photo for instant OCR'}
              </p>
              <p className="doc-dropzone-sub">
                Supports photos, contract scans, leases, notices (PNG, JPG, WebP), PDFs, and text files up to 15MB
              </p>
            </div>
            <button
              type="button"
              className="doc-dropzone-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose Document / Image
            </button>
          </div>
        )}
      </div>

      {statusMessage && !isProcessing && (
        <div className="doc-dropzone-success" role="status">
          <span className="doc-dropzone-success-icon" aria-hidden="true">✓</span>
          <span>{statusMessage}</span>
          {lastUploadedName && (
            <span className="doc-dropzone-file-tag">{lastUploadedName}</span>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="ocr-error" role="alert">
          <span aria-hidden="true">⚠</span> {errorMessage}
          <button
            type="button"
            className="ocr-error-dismiss"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
