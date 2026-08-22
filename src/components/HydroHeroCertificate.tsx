import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, Sparkles, X, Check, Droplets, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/audio';

interface CertificateProps {
  isOpen: boolean;
  onClose: () => void;
  totalScore: number;
  harvestedLiters: number;
}

export const HydroHeroCertificate: React.FC<CertificateProps> = ({
  isOpen,
  onClose,
  totalScore,
  harvestedLiters,
}) => {
  const [studentName, setStudentName] = useState<string>('Junior Hydro Engineer');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-full max-w-2xl bg-amber-50 rounded-3xl border-8 border-yellow-500 shadow-[10px_16px_0px_#0F172A] p-6 sm:p-8 text-slate-900 my-8 overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 bg-slate-200 hover:bg-slate-300 rounded-full border-2 border-slate-900 transition z-10"
        >
          <X className="w-5 h-5 text-slate-900" />
        </button>

        {/* Certificate Frame & Ornaments */}
        <div className="relative border-4 border-dashed border-amber-600 rounded-2xl p-6 sm:p-8 text-center bg-white/70 shadow-inner">
          {/* Header Seal */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-yellow-400 border-4 border-slate-950 shadow-md flex items-center justify-center mb-3 text-3xl sm:text-4xl">
            🏆
          </div>

          <span className="text-xs font-black text-amber-800 uppercase tracking-widest block mb-1">
            Official Certification of Excellence
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase mb-2">
            All-India Hydro Hero Award
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-md mx-auto mb-4">
            This certificate is proudly awarded for completing the All-India Groundwater Expedition from Kashmir to Tamil Nadu with Oggy:
          </p>

          {/* Student Name Display & Edit */}
          <div className="my-4">
            {isEditing ? (
              <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border-2 border-slate-900 font-black text-lg text-center w-full bg-white"
                  autoFocus
                />
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 bg-emerald-500 text-white rounded-xl border-2 border-slate-900"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer group inline-block"
                title="Click to edit name"
              >
                <h3 className="text-2xl sm:text-3xl font-black text-blue-700 underline decoration-amber-400 decoration-4 underline-offset-4 group-hover:text-blue-800">
                  {studentName}
                </h3>
                <span className="text-[10px] text-slate-500 font-bold block mt-1">
                  ✏️ (Click to customize your name)
                </span>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-700 max-w-lg mx-auto mb-6">
            For reviving alpine snowmelt gutters in Kashmir, restoring ancient Thar Desert Baori stepwells in Rajasthan, engineering bamboo drip irrigation channels in Meghalaya, and revitalizing 40,000 temple tanks and recharge wells in Tamil Nadu!
          </p>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto mb-6 text-center text-xs font-black">
            <div className="bg-sky-100 border-2 border-sky-400 p-2 rounded-xl text-sky-900">
              <Droplets className="w-4 h-4 mx-auto mb-0.5 text-blue-600" />
              <span>{harvestedLiters.toLocaleString()} L Recharged</span>
            </div>
            <div className="bg-emerald-100 border-2 border-emerald-400 p-2 rounded-xl text-emerald-900">
              <ShieldCheck className="w-4 h-4 mx-auto mb-0.5 text-emerald-600" />
              <span>4 / 4 States Cleared</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-yellow-100 border-2 border-yellow-400 p-2 rounded-xl text-amber-900">
              <Sparkles className="w-4 h-4 mx-auto mb-0.5 text-amber-600" />
              <span>{totalScore} Coins &amp; Points</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-slate-400 text-slate-700 text-xs font-bold px-4">
            <div>
              <span className="block font-black text-sky-600">Oggy &amp; Jack</span>
              <span className="text-[10px] text-slate-500">Chief Expedition Leaders</span>
            </div>
            <div>
              <span className="block font-black text-emerald-600">All-India Hydro Board</span>
              <span className="text-[10px] text-slate-500">National Aquifer Mission</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
