import React, { useEffect, useState } from 'react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    // @ts-ignore - Html5QrcodeScanner is loaded via script tag in index.html
    if (!window.Html5QrcodeScanner) {
      setScanError("Scanner library not loaded. Please refresh.");
      return;
    }

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
        // Success callback
        onScan(decodedText);
    };

    const onScanFailure = (error: any) => {
        // Failure callback - frequent, usually ignored as it means "no code found in this frame"
    };

    // @ts-ignore
    const html5QrcodeScanner = new window.Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false);
    
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    // Cleanup function
    return () => {
        try {
            html5QrcodeScanner.clear().catch((error: any) => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        } catch (e) {
            console.error("Error cleaning up scanner", e);
        }
    };
  }, [onScan]);

  return (
      <div className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md relative shadow-2xl animate-fade-in-up">
             <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-10"
             >
                 <i className="fas fa-times text-xl"></i>
             </button>
             
             <div className="text-center mb-4">
               <h3 className="font-bold text-lg text-gray-800">Scan Visitor Badge</h3>
               <p className="text-xs text-gray-500">Align the QR code within the frame</p>
             </div>

             {scanError ? (
               <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
                 {scanError}
               </div>
             ) : (
               <div id="reader" className="w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300"></div>
             )}

             <div className="mt-4 flex justify-center">
                <button onClick={onClose} className="text-sm text-gray-500 underline hover:text-indigo-600">
                  Cancel Scan
                </button>
             </div>
          </div>
      </div>
  );
};

export default QRScanner;