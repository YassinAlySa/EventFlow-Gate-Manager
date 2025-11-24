import React from 'react';
import { Visitor } from '../types';

interface BadgeProps {
  visitor: Visitor;
  eventName: string;
}

const Badge: React.FC<BadgeProps> = ({ visitor, eventName }) => {
  // Using a QR code API for visual representation
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ id: visitor.id, name: visitor.fullName }))}`;

  return (
    <div className="w-[350px] h-[500px] border-2 border-black rounded-lg p-6 flex flex-col items-center justify-between bg-white shadow-xl mx-auto print:shadow-none print:border-none">
      <div className="text-center w-full border-b-4 border-indigo-600 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-widest text-gray-500">{eventName}</h2>
        <div className="mt-2 bg-indigo-600 text-white text-xs font-bold py-1 px-3 rounded-full inline-block uppercase">
          {visitor.role || 'Attendee'}
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center text-center w-full py-8">
        <h1 className="text-4xl font-extrabold text-black mb-2 break-words w-full leading-tight">
          {visitor.fullName}
        </h1>
        <p className="text-xl text-gray-600 font-medium uppercase tracking-wide">
          {visitor.company}
        </p>
      </div>

      <div className="w-full flex flex-col items-center border-t border-gray-200 pt-6">
        <img src={qrUrl} alt="QR Code" className="w-32 h-32 mb-2" />
        <p className="text-xs text-gray-400 font-mono">{visitor.id}</p>
      </div>
    </div>
  );
};

export default Badge;
