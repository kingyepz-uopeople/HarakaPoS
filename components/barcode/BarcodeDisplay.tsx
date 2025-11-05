'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC';
  fontSize?: number;
  className?: string;
}

/**
 * Barcode Display Component
 * Generates and displays a barcode using JsBarcode
 */
export default function BarcodeDisplay({
  value,
  width = 2,
  height = 100,
  displayValue = true,
  format = 'CODE128',
  fontSize = 20,
  className = '',
}: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!value) return;

    // Use SVG for better print quality
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [value, width, height, displayValue, format, fontSize]);

  if (!value) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 p-4 ${className}`}>
        <p className="text-gray-400">No barcode value</p>
      </div>
    );
  }

  return (
    <div className={`barcode-container ${className}`}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
