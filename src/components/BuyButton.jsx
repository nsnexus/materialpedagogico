'use client';

export default function BuyButton({ children, className = '' }) {
  return (
    <button
      type="button"
      className={`btn-buy ${className}`}
      onClick={() => window.dispatchEvent(new Event('abrir-checkout'))}
    >
      {children}
    </button>
  );
}
