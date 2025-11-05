'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, FlashlightOff, Flashlight } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

/**
 * Barcode Scanner Component
 * Uses device camera to scan barcodes
 */
export default function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef('barcode-scanner-' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      setScanning(true);

      const scanner = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778,
      };

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        config,
        (decodedText) => {
          console.log('Barcode scanned:', decodedText);
          onScan(decodedText);
          // Don't stop scanner - allow continuous scanning
        },
        (errorMessage) => {
          // Scanning errors (no barcode found) - ignore these
        }
      );

      setScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError(err.message || 'Failed to start scanner');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      setScanning(false);
    }
  };

  const toggleTorch = async () => {
    if (scannerRef.current) {
      try {
        const track = scannerRef.current.getRunningTrackCameraCapabilities();
        if (track) {
          // @ts-ignore - Torch API may not be available on all devices
          if ('torch' in track) {
            // @ts-ignore
            await track.applyConstraints({
              advanced: [{ torch: !torch }],
            });
            setTorch(!torch);
          }
        }
      } catch (err) {
        console.error('Torch error:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scan Delivery Barcode</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleTorch}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title={torch ? 'Turn off flashlight' : 'Turn on flashlight'}
          >
            {torch ? <Flashlight size={24} /> : <FlashlightOff size={24} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {error ? (
          <div className="bg-red-500 text-white p-4 rounded-lg max-w-md">
            <p className="font-semibold">Scanner Error</p>
            <p className="text-sm mt-2">{error}</p>
            <button
              onClick={() => {
                setError(null);
                startScanner();
              }}
              className="mt-4 px-4 py-2 bg-white text-red-500 rounded-lg hover:bg-gray-100"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <div 
              id={scannerIdRef.current}
              className="rounded-lg overflow-hidden shadow-2xl"
              style={{ width: '100%' }}
            />
            
            <div className="mt-6 bg-gray-800 text-white p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Camera size={24} className="text-blue-400" />
                <div>
                  <p className="font-semibold">Point camera at barcode</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Align the barcode within the frame
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">
                Format: HWS-YYYYMMDD-NNNN
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Example: HWS-20251105-0001
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Fallback */}
      <div className="bg-gray-900 p-4">
        <button
          onClick={() => {
            const manualBarcode = prompt('Enter barcode manually (if scanner not working):');
            if (manualBarcode) {
              onScan(manualBarcode.trim());
            }
          }}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Enter Barcode Manually
        </button>
      </div>
    </div>
  );
}
