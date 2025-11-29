'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { 
  logBarcodeScan, 
  getBarcodeDetails, 
  getCurrentLocation,
  updateBarcodeStatus 
} from '@/lib/barcode-utils';
import { uploadProofPhoto } from '@/lib/supabase/storage';
import { BarcodeStatus, ScanType } from '@/lib/types';
import { 
  CheckCircle, 
  XCircle, 
  Camera,
  Package,
  Truck,
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function DriverScanPage() {
  const router = useRouter();
  const supabase = createClient();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [barcodeDetails, setBarcodeDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BarcodeStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const handleScan = async (barcode: string) => {
    setError(null);
    setSuccess(null);
    setScannedBarcode(barcode);
    setScannerOpen(false);
    setLoading(true);

    try {
      // Get barcode details
      const result = await getBarcodeDetails(barcode);
      
      if (!result.success) {
        setError(result.error || 'Barcode not found');
        setScannedBarcode(null);
        return;
      }

      setBarcodeDetails(result.data);
      
      // Auto-select next status based on current status
      const currentStatus = result.data.status;
      if (currentStatus === 'pending' || currentStatus === 'printed') {
        setSelectedStatus('loading');
      } else if (currentStatus === 'loading') {
        setSelectedStatus('in_transit');
      } else if (currentStatus === 'in_transit') {
        setSelectedStatus('delivered');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch barcode details');
      setScannedBarcode(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!scannedBarcode || !selectedStatus) {
      setError('Please select a status');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current location
      const location = await getCurrentLocation();
      
      // Determine scan type based on status
      let scanType: ScanType = 'verification';
      if (selectedStatus === 'loading') scanType = 'loading';
      else if (selectedStatus === 'in_transit') scanType = 'departure';
      else if (selectedStatus === 'delivered') scanType = 'delivery';

      // Update status
      const result = await updateBarcodeStatus(
        scannedBarcode,
        selectedStatus,
        scanType,
        {
          latitude: location.latitude,
          longitude: location.longitude,
          notes: notes || undefined,
          photoUrl: photoUrl || undefined,
        }
      );

      if (result.success) {
        setSuccess(`✅ Status updated to: ${selectedStatus.toUpperCase()}`);
        
        // Reset form
        setTimeout(() => {
          setScannedBarcode(null);
          setBarcodeDetails(null);
          setSelectedStatus(null);
          setNotes('');
          setPhotoUrl(null);
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = () => {
    // Open camera for photo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // @ts-ignore: capture hint supported on mobile browsers
    input.capture = 'environment';

    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (file && scannedBarcode) {
        // Upload to Supabase Storage
        const res = await uploadProofPhoto(file, { prefix: `barcode/${scannedBarcode}` });
        if (res.success && res.url) {
          setPhotoUrl(res.url);
        } else {
          console.error('Photo upload failed:', res.error);
        }
      }
    };

    input.click();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      printed: 'bg-blue-100 text-blue-700',
      loading: 'bg-yellow-100 text-yellow-700',
      in_transit: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      printed: Package,
      loading: Package,
      in_transit: Truck,
      delivered: CheckCircle,
      failed: XCircle,
    };
    return icons[status] || Clock;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Scan Barcode</h1>
        <p className="text-sm text-gray-600 mt-1">Update delivery status</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Scan Button */}
        {!scannedBarcode && (
          <button
            onClick={() => setScannerOpen(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
          >
            <Camera size={28} />
            <span className="text-lg font-semibold">Scan Barcode</span>
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-green-900">Success!</p>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Barcode Details */}
        {scannedBarcode && barcodeDetails && (
          <div className="space-y-4">
            {/* Barcode Info Card */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Barcode</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{scannedBarcode}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(barcodeDetails.status)}`}>
                  {barcodeDetails.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-gray-400" />
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-semibold text-gray-900">{barcodeDetails.customer_name}</span>
                </div>

                {barcodeDetails.customer_phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📞</span>
                    <a 
                      href={`tel:${barcodeDetails.customer_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {barcodeDetails.customer_phone}
                    </a>
                  </div>
                )}

                {barcodeDetails.delivery_location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-gray-900">{barcodeDetails.delivery_location}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-semibold">{barcodeDetails.quantity_kg} kg</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">KSh {barcodeDetails.total_amount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Scans:</span>
                  <span className="font-semibold">{barcodeDetails.scan_count}</span>
                </div>
              </div>
            </div>

            {/* Status Update Section */}
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>

              {/* Status Options */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['loading', 'in_transit', 'delivered', 'failed'] as BarcodeStatus[]).map((status) => {
                  const Icon = getStatusIcon(status);
                  const isSelected = selectedStatus === status;
                  
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Icon size={24} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                        {status.replace('_', ' ').toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this delivery..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Photo Capture */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo {selectedStatus === 'delivered' && '(Required for delivery)'}
                </label>
                {photoUrl ? (
                  <div className="relative">
                    <img src={photoUrl} alt="Delivery proof" className="w-full rounded-lg" />
                    <button
                      onClick={() => setPhotoUrl(null)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePhotoCapture}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Camera size={20} className="text-gray-400" />
                    <span className="text-gray-600">Take Photo</span>
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || loading || (selectedStatus === 'delivered' && !photoUrl)}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg shadow-lg"
              >
                {loading ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => {
                setScannedBarcode(null);
                setBarcodeDetails(null);
                setSelectedStatus(null);
                setNotes('');
                setPhotoUrl(null);
                setError(null);
              }}
              className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel / Scan Another
            </button>
          </div>
        )}

        {/* Quick Instructions */}
        {!scannedBarcode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Tap "Scan Barcode" to open camera</li>
              <li>Point camera at barcode label</li>
              <li>Select new status (Loading, In Transit, Delivered)</li>
              <li>Take photo (required for delivery)</li>
              <li>Add notes if needed</li>
              <li>Tap "Confirm Update"</li>
            </ol>
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onScan={handleScan}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}
