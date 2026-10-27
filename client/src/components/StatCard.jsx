import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'brand', subtext, trend }) => {
  const colorMap = {
    brand: {
      bg: 'bg-brand-50 text-brand-600 border-brand-100',
      iconBg: 'bg-brand-500 text-white',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconBg: 'bg-emerald-500 text-white',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-800 border-amber-100',
      iconBg: 'bg-amber-500 text-white',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-700 border-blue-100',
      iconBg: 'bg-blue-500 text-white',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      iconBg: 'bg-indigo-600 text-white',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-700 border-rose-100',
      iconBg: 'bg-rose-500 text-white',
    },
  };

  const selectedColor = colorMap[color] || colorMap.brand;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        {subtext && <p className="text-xs text-slate-500 font-medium">{subtext}</p>}
      </div>

      <div className={`p-3 rounded-2xl ${selectedColor.iconBg} shadow-sm`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
    </div>
  );
};

export default StatCard;
