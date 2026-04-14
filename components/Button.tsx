import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3.5 font-semibold transition-all duration-200 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985]";
  
  const variants = {
    primary: "bg-[#0a84ff] hover:bg-[#0077ed] text-white focus:ring-blue-400 shadow-[0_10px_24px_rgba(10,132,255,0.24)] border border-transparent",
    secondary: "bg-white/88 backdrop-blur text-slate-700 focus:ring-slate-300 border border-white/80 shadow-[0_4px_18px_rgba(15,23,42,0.08)] hover:bg-white",
    danger: "bg-[#ff3b30] hover:bg-[#e0352b] text-white focus:ring-red-400 shadow-[0_10px_24px_rgba(255,59,48,0.22)] border border-transparent",
    ghost: "bg-transparent hover:bg-white/70 text-slate-600 hover:text-slate-900",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>处理中...</span>
        </span>
      ) : children}
    </button>
  );
};
