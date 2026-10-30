import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

interface DigitalSignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  height?: number;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  onSignatureChange,
  height = 140,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Setup canvas with high DPI for crisp stroke lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F172A'; // dark slate
    ctx.lineWidth = 2.5;

    // Fill white background so exported PNG is not transparent black
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, height);
  }, [height]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault(); // Stop mobile screen scrolling while signing
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    if (!hasSignature) {
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  const clearCanvas = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-body flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-primary" />
          <span>Tanda Tangan Digital Penerima *</span>
        </label>
        {hasSignature && (
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-bold transition-colors"
          >
            <Eraser className="w-3 h-3" />
            <span>Hapus / Ulangi</span>
          </button>
        )}
      </div>

      <div className="relative border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden bg-white touch-none">
        <canvas
          ref={canvasRef}
          style={{ height: `${height}px`, width: '100%' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair w-full block"
        />

        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400 text-xs font-medium">
            <span className="bg-white/80 px-3 py-1 rounded-full border border-gray-200 shadow-xs">
              Goreskan tanda tangan di sini (Jari / Stylus / Mouse)
            </span>
          </div>
        )}

        {hasSignature && (
          <div className="absolute bottom-2 right-2 pointer-events-none bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Check className="w-3 h-3" />
            <span>Tanda Tangan Terisi</span>
          </div>
        )}
      </div>
    </div>
  );
};
