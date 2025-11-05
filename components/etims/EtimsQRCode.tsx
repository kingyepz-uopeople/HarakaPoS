'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface EtimsQRCodeProps {
  data: string;
  size?: number;
  className?: string;
}

/**
 * QR Code component for eTIMS receipts
 * Displays KRA verification QR code
 */
export default function EtimsQRCode({ data, size = 150, className = '' }: EtimsQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    QRCode.toCanvas(
      canvasRef.current,
      data,
      {
        width: size,
        margin: 1,
        errorCorrectionLevel: 'M',
      },
      (error) => {
        if (error) {
          console.error('Error generating QR code:', error);
        }
      }
    );
  }, [data, size]);

  if (!data) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ width: size, height: size }}>
        <p className="text-xs text-gray-400">No QR Code</p>
      </div>
    );
  }

  return <canvas ref={canvasRef} className={className} />;
}
