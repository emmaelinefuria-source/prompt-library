"use client";

import { useEffect, useRef, useState } from "react";

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string>("");
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted || !scannerRef.current) return;

        const scanner = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop().catch(console.error);
          },
          () => {} // ignore scan failures (no QR in frame)
        );
      } catch (err) {
        if (mounted) {
          setError(
            "Could not access camera. Please allow camera permissions and try again."
          );
          console.error(err);
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {error ? (
          <div className="text-red-600 text-center py-8">{error}</div>
        ) : (
          <>
            <div
              id="qr-reader"
              ref={scannerRef}
              className="rounded-lg overflow-hidden"
            />
            <p className="text-sm text-gray-500 text-center mt-4">
              Point your camera at a prompt card&apos;s QR code
            </p>
          </>
        )}
      </div>
    </div>
  );
}
