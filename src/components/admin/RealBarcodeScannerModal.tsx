import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Flashlight, RefreshCw, Barcode, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'real-barcode-scanner-viewport';

  // Sound feedback on successful barcode read
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
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    setErrorMessage(null);
    setLastScannedCode(null);

    async function initScanner() {
      try {
        const availableCameras = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (availableCameras && availableCameras.length > 0) {
          setCameras(availableCameras);
          // Prefer back/rear camera for physical product barcode scanning
          const backCam = availableCameras.find((c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
          );
          const initialCamId = backCam ? backCam.id : availableCameras[0].id;
          setSelectedCameraId(initialCamId);
          startCamera(initialCamId);
        } else {
          // Fallback to environment facingMode
          startCamera({ facingMode: 'environment' });
        }
      } catch (err: any) {
        console.warn('Failed to enumerate cameras:', err);
        startCamera({ facingMode: 'environment' });
      }
    }

    // Small delay to ensure modal DOM is mounted
    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const startCamera = async (cameraSource: string | MediaTrackConstraints) => {
    try {
      await stopScanner();

      const scanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });

      scannerRef.current = scanner;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.333,
      };

      await scanner.start(
        cameraSource,
        config,
        (decodedText) => {
          // BARCODE SUCCESSFULLY DECODED IN REAL TIME!
          playBeep();
          setLastScannedCode(decodedText);
          setIsScanning(false);
          stopScanner().then(() => {
            onScan(decodedText.trim());
          });
        },
        () => {
          // Frame evaluation callback, ignore frames with no barcode
        }
      );

      setIsScanning(true);
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Camera barcode scan error:', err);
      setIsScanning(false);
      setErrorMessage(
        err?.message ||
        'Kamera tidak dapat diakses. Harap periksa izin akses kamera di browser Anda.'
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
      alert('Senter/Flash tidak didukung oleh browser atau perangkat kamera ini.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playBeep();
    stopScanner().then(() => {
      onScan(manualCode.trim());
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-hairline flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-neutral-2/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#101519]">Scan Barcode / ISBN Langsung</h3>
              <p className="text-[11px] text-body">Arahkan kamera ke barcode produk fisik atau buku</p>
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

        {/* Viewport Scanner */}
        <div className="relative bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          <div
            id={scannerContainerId}
            className="w-full h-full min-h-[300px] flex items-center justify-center"
          />

          {/* Scanner Overlay Visual Guidelines */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-36 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center overflow-hidden">
                {/* Red Laser Sweep Line */}
                <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-bounce" />
                <span className="text-[11px] font-bold text-white/90 bg-black/60 px-2 py-0.5 rounded-full mt-auto mb-2">
                  Posisikan Barcode di Sini
                </span>
              </div>
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="absolute inset-0 bg-neutral-900/90 text-white p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <p className="text-xs font-semibold">{errorMessage}</p>
              <button
                type="button"
                onClick={() => startCamera({ facingMode: 'environment' })}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors"
              >
                Coba Akses Kamera Lagi
              </button>
            </div>
          )}

          {/* Scanned Success Notification Flash */}
          {lastScannedCode && (
            <div className="absolute inset-0 bg-emerald-600/95 text-white flex flex-col items-center justify-center p-6 text-center space-y-2 z-30 animate-in fade-in zoom-in duration-200">
              <CheckCircle2 className="w-12 h-12" />
              <h4 className="font-extrabold text-base">Barcode Berhasil Dibaca!</h4>
              <p className="font-mono text-sm font-bold bg-white/20 px-3 py-1 rounded-lg">
                {lastScannedCode}
              </p>
            </div>
          )}

          {/* Bottom Floating Controls */}
          {isScanning && (
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-10">
              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 backdrop-blur-sm border border-white/20 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ganti Kamera</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 backdrop-blur-sm border transition-colors ${
                  torchOn
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
                }`}
              >
                <Flashlight className="w-3.5 h-3.5" />
                <span>{torchOn ? 'Matikan Senter' : 'Senter'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Barcode Input Fallback */}
        <div className="p-4 border-t border-hairline bg-white space-y-2">
          <label className="text-[11px] font-bold text-body flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5 text-primary" />
            <span>Atau ketik Barcode / ISBN / SKU manual:</span>
          </label>
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
              Gunakan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
