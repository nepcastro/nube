import React from 'react';
import { GEN_LOGO_DATA_URL } from '../constants/genBrand';

interface BrandLockupProps {
  /** Client/company logo for this session, uploaded via "Configurar Pregunta y Actividad" */
  clientLogoUrl?: string;
  /** 'lg' for the main landing hero, 'sm' for compact contexts */
  size?: 'lg' | 'sm';
  className?: string;
}

/**
 * Co-branded logo lockup: Gen Consultores (fixed, "nosotros") + the client's
 * own logo for this session ("ellos"). Used on every "front door" screen —
 * the presentation landing and the participant welcome — so the tool always
 * reads as personalized: from Gen, for this specific client/event.
 */
export const BrandLockup: React.FC<BrandLockupProps> = ({
  clientLogoUrl,
  size = 'lg',
  className = '',
}) => {
  const boxSize = size === 'lg' ? 'w-24 h-24 sm:w-36 sm:h-36' : 'w-14 h-14 sm:w-16 sm:h-16';
  const padding = size === 'lg' ? 'p-3 sm:p-4' : 'p-2 sm:p-2.5';
  const dividerSize = size === 'lg' ? 'text-xl sm:text-2xl' : 'text-base';

  return (
    <div className={`flex items-center justify-center gap-2.5 sm:gap-4 ${className}`}>
      <div
        className={`${boxSize} rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0`}
      >
        <img
          src={GEN_LOGO_DATA_URL}
          alt="Gen Consultores"
          className={`w-full h-full object-contain ${padding}`}
        />
      </div>

      {clientLogoUrl && (
        <>
          <span className={`${dividerSize} font-light text-slate-500 select-none shrink-0`}>×</span>
          <div
            className={`${boxSize} rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0`}
          >
            <img
              src={clientLogoUrl}
              alt="Logo del cliente"
              className={`w-full h-full object-contain ${padding}`}
            />
          </div>
        </>
      )}
    </div>
  );
};
