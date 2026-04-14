import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div
      className="app-safe-screen flex flex-col items-center justify-center w-full h-screen bg-slate-50"
      style={{
        paddingBottom: 'max(20px, var(--safe-bottom))',
      }}
    >
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">正在访问病例文件...</h3>
      <p className="text-slate-400 text-sm">解密中...</p>
    </div>
  );
};
