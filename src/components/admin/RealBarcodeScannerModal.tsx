import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Flashlight, RefreshCw, Barcode, CheckCircle2, AlertCircle, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { useProductStore } from '@/store/productStore';

interface RealBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export const RealBarcodeScannerModal: React.FC<RealBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const { products } = useProductStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [showHelperList, setShowHelperList] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'real-barcode-scanner-viewport';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio beep feedback
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio context might be restricted
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    const cleanText = decodedText.trim();
    if (!cleanText) return;

    playBeep();
    setLastScannedCode(cleanText);
    setIsScanning(false);

    await stopScanner();
    onScan(cleanText);
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMessage(null);
    setLastScannedCode(null);

    async function initScanner() {
      try {
        const availableCameras = await Html5Qrcode.getCameras().catch(() => []);
        if (!isMounted) return;

        if (availableCameras && availableCameras.length > 0) {
          setCameras(availableCameras);
          const backCam = availableCameras.find((c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment') ||
            c.label.toLowerCase().includes('belakang')
          );
          const initialCamId = backCam ? backCam.id : availableCameras[0].id;
          setSelectedCameraId(initialCamId);
          startCamera(initialCamId);
        } else {
          startCamera({ facingMode: 'environment' });
        }
      } catch (err: any) {
        console.warn('Camera enumeration note:', err);
        startCamera({ facingMode: 'environment' });
      }
    }

    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const startCamera = async (cameraSource: string | { facingMode: string }) => {
    try {
      await stopScanner();

      // Configure multi-format scanner with retail & book barcode formats
      const scanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });

      scannerRef.current = scanner;

      // 10 FPS optimal for ZXing barcode processing across mobile and desktop
      const config = {
        fps: 10,
        aspectRatio: 1.333333,
      };

      await scanner.start(
        cameraSource,
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Scan cycle frame
        }
      );

      setIsScanning(true);
      setErrorMessage(null);
    } catch (err: any) {
      console.warn('Camera barcode scan start attempt failed:', err);
      // Fallback: If camera ID failed, attempt general environment or user facing mode
      if (typeof cameraSource === 'string') {
        try {
          await scannerRef.current?.start(
            { facingMode: 'environment' },
            { fps: 10 },
            (decodedText) => handleScanSuccess(decodedText),
            () => {}
          );
          setIsScanning(true);
          setErrorMessage(null);
          return;
        } catch (fbErr) {
          console.warn('Fallback camera failed:', fbErr);
        }
      }
      setIsScanning(false);
      setErrorMessage(
        'Kamera belum dapat dibuka. Pastikan izin kamera aktif pada browser atau gunakan tombol "Foto Barcode" / ketik manual di bawah.'
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setSelectedCameraId(nextCamId);
    startCamera(nextCamId);
  };

  const handleToggleTorch = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as any],
      });
      setTorchOn(!torchOn);
    } catch {
      alert('Senter/Flash tidak didukung oleh perangkat kamera ini.');
    }
  };

  // Decode barcode directly from captured photo or gallery image
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      // Must safely stop active camera stream before scanning a static image
      await stopScanner();

      const fileScanner = new Html5Qrcode(scannerContainerId, { verbose: false });
      const decodedText = await fileScanner.scanFile(file, true);
      if (decodedText) {
        handleScanSuccess(decodedText);
      } else {
        throw new Error('Barcode tidak terdeteksi');
      }
    } catch (err: any) {
      alert('Barcode tidak terbaca dari foto tersebut. Harap pastikan garis barcode tajam, fokus, dan tidak terpotong.');
      // Restart camera stream
      startCamera(selectedCameraId || { facingMode: 'environment' });
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-hairline flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-hairline flex items-center justify-between bg-neutral-2/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#101519]">Scanner Barcode & ISBN</h3>
              <p className="text-[11px] text-body">Arahkan kamera atau foto langsung garis barcode</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScanner().then(onClose);
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          <div
            id={scannerContainerId}
            className="w-full h-full min-h-[300px] flex items-center justify-center"
          />

          {/* Scanner Overlay Visual Guidelines */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-[88%] h-44 border-2 border-emerald-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center overflow-hidden">
                {/* Red Laser Sweep Line */}
                <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse" />
                <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full mt-auto mb-2 backdrop-blur-xs">
                  Posisikan Barcode di Kotak Ini
                </span>
              </div>
            </div>
          )}

          {/* Processing Photo Indicator */}
          {isProcessingPhoto && (
            <div className="absolute inset-0 bg-neutral-900/90 text-white flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-xs">Menganalisis barcode dari foto...</p>
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="absolute inset-0 bg-neutral-900/95 text-white p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <p className="text-xs font-semibold leading-relaxed">{errorMessage}</p>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => startCamera({ facingMode: 'environment' })}
                  className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors"
                >
                  Coba Akses Kamera Lagi
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ambil Foto Barcode</span>
                </button>
              </div>
            </div>
          )}

          {/* Scanned Success Flash */}
          {lastScannedCode && (
            <div className="absolute inset-0 bg-emerald-600/95 text-white flex flex-col items-center justify-center p-6 text-center space-y-2 z-30 animate-in fade-in zoom-in duration-200">
              <CheckCircle2 className="w-12 h-12" />
              <h4 className="font-extrabold text-base">Barcode Berhasil Terbaca!</h4>
              <p className="font-mono text-sm font-bold bg-white/20 px-3 py-1 rounded-lg">
                {lastScannedCode}
              </p>
            </div>
          )}

          {/* Top Floating Controls */}
          {isScanning && (
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Foto Barcode</span>
              </button>

              <div className="flex items-center gap-2">
                {cameras.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-sm border border-white/20 transition-colors"
                    title="Ganti Kamera Belakang / Depan"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-xl backdrop-blur-sm border transition-colors ${
                    torchOn
                      ? 'bg-amber-400 text-black border-amber-300'
                      : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
                  }`}
                  title="Nyalakan Senter / Flash"
                >
                  <Flashlight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden Camera Shutter / Gallery Picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* Action Controls & Manual Input */}
        <div className="p-4 border-t border-hairline bg-white space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-body flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-primary" />
              Ketik Barcode / ISBN / SKU:
            </span>
            <button
              type="button"
              onClick={() => setShowHelperList(!showHelperList)}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Barcode className="w-3 h-3" />
              <span>{showHelperList ? 'Tutup Daftar' : 'Lihat Produk Toko'}</span>
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: 9786020633176 atau SKU-BOOK-01"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 h-9 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              Cari
            </button>
          </form>

          {/* Quick Helper List of Current Products */}
          {showHelperList && (
            <div className="p-2.5 bg-neutral-2/60 rounded-xl border border-hairline space-y-1.5 max-h-40 overflow-y-auto text-xs">
              <span className="text-[10px] font-bold text-body block uppercase">
                Pilih langsung dari produk toko:
              </span>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleScanSuccess(p.isbn || p.sku_master)}
                  className="w-full text-left p-1.5 hover:bg-white rounded-lg flex items-center justify-between transition-colors font-medium"
                >
                  <span className="truncate pr-2">{p.name}</span>
                  <span className="font-mono text-primary font-bold text-[11px] shrink-0">
                    {p.isbn || p.sku_master}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
