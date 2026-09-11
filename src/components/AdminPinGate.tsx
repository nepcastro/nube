import React, { useState } from 'react';
import { Lock, ShieldCheck, RotateCcw, KeyRound } from 'lucide-react';

interface AdminPinGateProps {
  onSubmit: (pin: string) => Promise<void> | void;
isVerifying: boolean;
error: string | null;
}

export const AdminPinGate: React.FC<AdminPinGateProps> = ({ onSubmit, isVerifying, error }) => {
const [pin, setPin] = useState('');

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
if (!pin.trim() || isVerifying) return;
onSubmit(pin.trim());
};

return (
<div
id="admin-pin-gate"
className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 p-4"
>
<div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-fadeIn">
<div className="flex flex-col items-center text-center gap-2">
<div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
<Lock className="w-5 h-5" />
</div>
<h1 className="text-base sm:text-lg font-bold text-white">Acceso de Moderador</h1>
<p className="text-xs text-slate-400 leading-relaxed">
Ingresa el PIN del evento para administrar esta sesión. Los participantes NO necesitan este PIN: pueden enviar palabras libremente desde el enlace o código QR.
</p>
</div>

<form onSubmit={handleSubmit} className="space-y-3">
<div className="relative">
<KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
<input
id="admin-pin-input"
type="password"
inputMode="numeric"
autoFocus
value={pin}
onChange={(e) => setPin(e.target.value)}
placeholder="PIN del moderador"
className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all tracking-widest"
/>
</div>

{error && <p className="text-xs text-rose-400">{error}</p>}

<button
id="admin-pin-submit-btn"
type="submit"
disabled={!pin.trim() || isVerifying}
className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
  >
  {isVerifying ? (
  <RotateCcw className="w-4 h-4 animate-spin" />
  ) : (
  <ShieldCheck className="w-4 h-4" />
  )}
  <span>Ingresar</span>
</button>
</form>
</div>
</div>
);
};
