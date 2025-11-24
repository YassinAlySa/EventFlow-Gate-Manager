import React, { useEffect } from 'react';

interface SimulatedEmailToastProps {
  emailData: { subject: string; body: string; to: string } | null;
  onClose: () => void;
}

const SimulatedEmailToast: React.FC<SimulatedEmailToastProps> = ({ emailData, onClose }) => {
  useEffect(() => {
    if (emailData) {
      // Keep it open a bit longer so user sees it
      const timer = setTimeout(onClose, 8000);
      return () => clearTimeout(timer);
    }
  }, [emailData, onClose]);

  if (!emailData) return null;

  const handleOpenMail = () => {
    const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] w-96 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden animate-slide-in-right ring-2 ring-indigo-500 ring-offset-2">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-3 flex items-center text-white px-4">
        <i className="fas fa-check-circle mr-2 text-lg"></i>
        <div>
           <p className="font-bold text-sm">Email Generated</p>
           <p className="text-xs text-green-100 opacity-90">Ready to send</p>
        </div>
        <button onClick={onClose} className="ml-auto text-white hover:text-gray-200">
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="p-4 bg-white">
        <div className="mb-2">
          <div className="flex justify-between items-baseline">
             <span className="text-xs font-bold text-gray-500 uppercase">To: {emailData.to}</span>
          </div>
          <p className="text-sm font-semibold text-gray-800 mt-1 truncate">{emailData.subject}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 whitespace-pre-line border border-gray-100 max-h-32 overflow-y-auto mb-3 font-mono">
          {emailData.body}
        </div>
        <button 
          onClick={handleOpenMail}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded flex items-center justify-center transition-colors"
        >
          <i className="fas fa-external-link-alt mr-2"></i> Open in Mail App
        </button>
      </div>
    </div>
  );
};

export default SimulatedEmailToast;