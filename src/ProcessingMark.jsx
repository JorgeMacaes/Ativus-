import React from 'react';

export function SevenMMark({size=46,className='',label='A processar'}) {
 return <svg className={`seven-m-mark ${className}`} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label}>
  <path className="seven-m-depth" d="M18 12 V88 M18 12 L50 52 L82 12 V88 H38" />
  <path className="seven-m-face" d="M18 12 V88 M18 12 L50 52 L82 12 V88 H38" />
 </svg>;
}

export function ProcessingMark({message='A processar informação…',compact=false}) {
 return <div className={compact?'processing-mark compact':'processing-mark'} role="status" aria-live="polite">
  <SevenMMark size={compact?22:54} />
  {message&&<span>{message}</span>}
 </div>;
}
