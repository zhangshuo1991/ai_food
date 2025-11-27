import React, { useState } from 'react';
import { X, Check, Utensils, Flame, Sparkles } from 'lucide-react';
import { FoodItem, Nutrition } from '../types';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: FoodItem) => void;
}

// 常用食物快捷选项
const QUICK_OPTIONS = [
  { name: '米饭', portion: '1碗 (150g)', calories: 174, protein: 4, carbs: 38, fat: 0 },
  { name: '煎鸡蛋', portion: '1个', calories: 90, protein: 6, carbs: 0, fat: 7 },
  { name: '香蕉', portion: '1根', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: '拿铁', portion: '1杯', calories: 150, protein: 10, carbs: 15, fat: 6 },
  { name: '鸡胸肉', portion: '100g', calories: 165, protein: 31, carbs: 0, fat: 4 },
];

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [portion, setPortion] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const nutrition: Nutrition = {
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    };

    const newItem: FoodItem = {
      name,
      portion: portion || '1份',
      nutrition,
      healthTip: '手动添加的记录',
    };

    onSubmit(newItem);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setPortion('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  const applyQuickOption = (opt: typeof QUICK_OPTIONS[0]) => {
    setName(opt.name);
    setPortion(opt.portion);
    setCalories(opt.calories.toString());
    setProtein(opt.protein.toString());
    setCarbs(opt.carbs.toString());
    setFat(opt.fat.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[90vh]">
        
        {/* Handle Bar (Visual Cue for Mobile) */}
        <div className="w-12 h-1.5 bg-gray-200/80 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-xl rounded-t-[32px]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center shadow-inner">
              <Utensils className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 leading-tight">手动记录</h3>
              <p className="text-[10px] text-gray-400 font-medium">补充 AI 未识别的食物</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 scroll-smooth no-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Quick Add Chips */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> 快速填充
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
                {QUICK_OPTIONS.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyQuickOption(opt)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-700 text-xs font-medium text-gray-600 transition-all active:scale-95 whitespace-nowrap"
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Name & Portion */}
            <div className="grid grid-cols-3 gap-3">
               <div className="col-span-2 space-y-1.5">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">食物名称</label>
                 <input
                   type="text"
                   required
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   placeholder="例如：红烧牛肉面"
                   className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 placeholder:font-normal"
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">分量</label>
                 <input
                   type="text"
                   value={portion}
                   onChange={(e) => setPortion(e.target.value)}
                   placeholder="1份"
                   className="w-full px-3 py-3 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-gray-800 text-center placeholder:text-gray-300"
                 />
               </div>
            </div>

            {/* Calories Highlighted */}
            <div className="p-1 rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50">
              <div className="bg-white/60 rounded-[20px] p-4 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                      <Flame className="w-5 h-5 fill-current" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase">总热量</span>
                      <span className="text-[10px] text-gray-400">kcal</span>
                   </div>
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className="w-24 bg-transparent text-right text-3xl font-black text-gray-900 outline-none placeholder:text-gray-200"
                />
              </div>
            </div>

            {/* Macros */}
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">营养成分 (可选)</label>
               <div className="grid grid-cols-3 gap-3">
                  <MacroInput label="蛋白质" value={protein} onChange={setProtein} type="emerald" unit="g" />
                  <MacroInput label="碳水" value={carbs} onChange={setCarbs} type="amber" unit="g" />
                  <MacroInput label="脂肪" value={fat} onChange={setFat} type="red" unit="g" />
               </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-gray-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              <Check className="w-5 h-5" />
              <span>确认添加</span>
            </button>
          </form>
          {/* Safe area spacer */}
          <div className="h-6 sm:h-2" />
        </div>
      </div>
    </div>
  );
};

// Helper for Macro Inputs with colored accents
const MacroInput = ({ label, value, onChange, type, unit }: { label: string, value: string, onChange: (v: string) => void, type: 'emerald' | 'amber' | 'red', unit: string }) => {
  const styles = {
    emerald: {
      text: 'text-emerald-700',
      ring: 'focus:border-emerald-500/30 focus:ring-emerald-500/10',
      bg: 'group-hover:bg-emerald-50'
    },
    amber: {
      text: 'text-amber-700',
      ring: 'focus:border-amber-500/30 focus:ring-amber-500/10',
      bg: 'group-hover:bg-amber-50'
    },
    red: {
      text: 'text-red-700',
      ring: 'focus:border-red-500/30 focus:ring-red-500/10',
      bg: 'group-hover:bg-red-50'
    }
  };

  const currentStyle = styles[type];

  return (
    <div className="relative group">
       <div className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity pointer-events-none ${currentStyle.bg}`} />
       <label className="absolute top-2 left-0 right-0 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider z-10">{label}</label>
       <input
         type="number"
         min="0"
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className={`w-full pt-6 pb-2 px-1 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:ring-4 outline-none transition-all text-center text-lg font-bold z-0 relative ${currentStyle.text} ${currentStyle.ring}`}
         placeholder="0"
       />
       <span className="absolute bottom-2.5 right-3 text-[9px] text-gray-300 font-bold pointer-events-none">{unit}</span>
    </div>
  );
}

export default ManualEntryModal;