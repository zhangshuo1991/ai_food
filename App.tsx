
import React, { useState, useEffect, useRef } from 'react';
import { Utensils, Calendar, Clock, ChevronDown, Trash2, Leaf, Flame, Sparkles, ArrowDown, Keyboard, AlertCircle, Search, Filter, X, Camera, Home, History, Plus, FileText, Activity, ChevronRight, TrendingUp, Carrot, GlassWater, ScanLine } from 'lucide-react';
import { analyzeFoodImage, generateHealthReport } from './services/geminiService';
import { FoodItem, MealRecord, AnalysisStatus, HealthReport } from './types';
import CameraInput from './components/CameraInput';
import NutritionChart from './components/NutritionChart';
import ManualEntryModal from './components/ManualEntryModal';

// Placeholder image for manual entries
const MANUAL_IMAGE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%2310B981' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2'/%3E%3Cpath d='M7 2v20'/%3E%3Cpath d='M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'/%3E%3C/svg%3E";

const App: React.FC = () => {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });

  // Health Report State
  const [reportStatus, setReportStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mealRecords');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    } else {
        // Init Mock Data
         const mockData: MealRecord[] = [
          {
            id: 'mock-1',
            timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
            imageUri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
            mealType: 'Lunch',
            totalNutrition: { calories: 650, protein: 25, carbs: 80, fat: 20 },
            items: [
              { name: '牛油果沙拉', portion: '1份', nutrition: { calories: 350, protein: 8, carbs: 20, fat: 25 }, healthTip: '牛油果富含健康的不饱和脂肪酸，有助于心血管健康。' },
              { name: '全麦面包', portion: '2片', nutrition: { calories: 300, protein: 17, carbs: 60, fat: 5 }, healthTip: '全麦面包比白面包含有更多的膳食纤维，饱腹感更强。' }
            ]
          },
          {
            id: 'mock-2',
            timestamp: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
            imageUri: 'https://images.unsplash.com/photo-1504754524776-3503a1955cf2?w=400&h=400&fit=crop',
            mealType: 'Breakfast',
            totalNutrition: { calories: 420, protein: 15, carbs: 55, fat: 12 },
            items: [
              { name: '燕麦粥', portion: '1碗', nutrition: { calories: 250, protein: 8, carbs: 45, fat: 4 }, healthTip: '燕麦富含β-葡聚糖，有助于调节血糖水平。' },
              { name: '蓝莓', portion: '50g', nutrition: { calories: 30, protein: 0.5, carbs: 7, fat: 0.2 }, healthTip: '蓝莓是抗氧化剂之王，有助于延缓衰老。' },
               { name: '煮鸡蛋', portion: '1个', nutrition: { calories: 140, protein: 6.5, carbs: 3, fat: 7.8 }, healthTip: '鸡蛋是优质蛋白质的来源，且吸收率极高。' }
            ]
          },
          {
            id: 'mock-3',
            timestamp: Date.now() - 1000 * 60 * 60 * 26, // 26 hours ago (Yesterday)
            imageUri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
            mealType: 'Dinner',
            totalNutrition: { calories: 550, protein: 30, carbs: 40, fat: 25 },
            items: [
              { name: '玛格丽特披萨', portion: '2片', nutrition: { calories: 550, protein: 30, carbs: 40, fat: 25 }, healthTip: '披萨热量较高，建议搭配蔬菜沙拉食用以增加饱腹感。' }
            ]
          }
        ];
        setRecords(mockData);
    }
  }, []);

  // Save to local storage whenever records change
  useEffect(() => {
    localStorage.setItem('mealRecords', JSON.stringify(records));
  }, [records]);

  // Helper to determine meal type based on time
  const getMealTypeByTime = (): MealRecord['mealType'] => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return 'Breakfast';
    if (hour >= 10 && hour < 16) return 'Lunch';
    if (hour >= 16 && hour < 22) return 'Dinner';
    return 'Snack';
  };

  const handleImageSelected = async (base64Image: string) => {
    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    setActiveTab('home');

    try {
      const items = await analyzeFoodImage(base64Image);

      if (items.length === 0) {
        throw new Error("未能识别出食物，请尝试更清晰的角度。");
      }

      const totalNutrition = items.reduce(
        (acc, item) => ({
          calories: acc.calories + item.nutrition.calories,
          protein: acc.protein + item.nutrition.protein,
          carbs: acc.carbs + item.nutrition.carbs,
          fat: acc.fat + item.nutrition.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const newRecord: MealRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUri: `data:image/jpeg;base64,${base64Image}`,
        items,
        totalNutrition,
        mealType: getMealTypeByTime(),
      };

      setRecords((prev) => [newRecord, ...prev]);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "分析失败，请重试。");
      setStatus(AnalysisStatus.ERROR);
    } finally {
      setTimeout(() => {
        if (status !== AnalysisStatus.ERROR) {
          setStatus(AnalysisStatus.IDLE);
        }
      }, 2000);
    }
  };

  const handleManualSubmit = (item: FoodItem) => {
    const newRecord: MealRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      imageUri: MANUAL_IMAGE_PLACEHOLDER,
      items: [item],
      totalNutrition: item.nutrition,
      mealType: getMealTypeByTime(),
    };

    setRecords((prev) => [newRecord, ...prev]);
    setShowManualModal(false);
    setError(null);
    setActiveTab('home');
  };

  const deleteRecord = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleGenerateReport = async () => {
    if (records.length < 2) {
      alert("记录太少，无法生成有意义的报告。请多记录几餐后再试。");
      return;
    }
    
    setReportStatus(AnalysisStatus.ANALYZING);
    try {
      // Analyze last 30 records or filtered list
      const dataToAnalyze = historyList.slice(0, 30); 
      const report = await generateHealthReport(dataToAnalyze);
      setHealthReport(report);
      setShowReportModal(true);
      setReportStatus(AnalysisStatus.SUCCESS);
    } catch (e) {
      alert("生成周报失败，请稍后重试");
      setReportStatus(AnalysisStatus.ERROR);
    } finally {
      setReportStatus(AnalysisStatus.IDLE);
    }
  };

  // --- Derived Data ---
  
  // 1. Daily Totals (Today)
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todaysRecords = records.filter(r => r.timestamp >= todayStart.getTime());
  
  const dailyTotal = todaysRecords.reduce(
    (acc, record) => ({
      calories: acc.calories + record.totalNutrition.calories,
      protein: acc.protein + record.totalNutrition.protein,
      carbs: acc.carbs + record.totalNutrition.carbs,
      fat: acc.fat + record.totalNutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // 2. Filtered History List
  const historyList = records.filter(record => {
    const matchesSearch = searchTerm.trim() === '' || record.items.some(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    let matchesDate = true;
    if (dateRange.start) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && record.timestamp >= start.getTime();
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && record.timestamp <= end.getTime();
    }
    return matchesSearch && matchesDate;
  }).sort((a, b) => b.timestamp - a.timestamp);

  // Grouping logic
  const getRecordDateString = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === yesterday.toDateString()) return '昨天';
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-36 font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-5 py-3 flex justify-between items-center transition-all duration-300 border-b border-gray-100">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-200">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-none">
              智食记
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">SmartEat AI</p>
          </div>
        </div>
        
        {/* Top Action: Manual Entry */}
        <button 
          onClick={() => setShowManualModal(true)}
          className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 border border-gray-200 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 container mx-auto max-w-md px-5 pt-4 space-y-6 overflow-hidden">
        
        {/* --- VIEW: HOME --- */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            
            {/* 1. Daily Stats Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-70 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">今日摄入</h2>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold text-gray-900 tracking-tight">{dailyTotal.calories}</span>
                      <span className="text-sm font-bold text-gray-400">kcal</span>
                    </div>
                </div>
                {/* Status Indicator */}
                <div className="flex flex-col items-end">
                   <div className="px-2 py-1 bg-emerald-50 rounded-lg text-[10px] font-bold text-emerald-600 mb-1">
                     {dailyTotal.calories > 0 ? '正在记录' : '新的一天'}
                   </div>
                   <div className="flex gap-1">
                      <div className="h-1.5 w-4 bg-emerald-400 rounded-full"></div>
                      <div className="h-1.5 w-4 bg-amber-400 rounded-full"></div>
                      <div className="h-1.5 w-4 bg-red-400 rounded-full"></div>
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 items-center relative z-10">
                <div className="col-span-1 h-32 -ml-4">
                  <NutritionChart nutrition={dailyTotal} />
                </div>
                <div className="col-span-1 space-y-2.5">
                  <NutrientRow label="蛋白质" value={dailyTotal.protein} color="bg-emerald-500" />
                  <NutrientRow label="碳水" value={dailyTotal.carbs} color="bg-amber-500" />
                  <NutrientRow label="脂肪" value={dailyTotal.fat} color="bg-red-500" />
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">
                  <p className="font-bold mb-1">识别失败</p>
                  <p className="opacity-90 text-xs">{error}</p>
                </div>
              </div>
            )}

            {/* Onboarding Empty State */}
            {todaysRecords.length === 0 && !error && (
              <div className="py-8 text-center">
                 <div className="w-16 h-16 bg-gradient-to-b from-emerald-50 to-transparent rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100/50">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                 </div>
                 <h3 className="text-gray-900 font-bold mb-1">开启今日记录</h3>
                 <p className="text-xs text-gray-400 max-w-[200px] mx-auto">
                   点击下方相机拍摄您的第一餐，AI 将为您计算热量。
                 </p>
              </div>
            )}

            {/* Today's Timeline */}
            {todaysRecords.length > 0 && (
              <div className="space-y-5">
                 <div className="flex items-center gap-4">
                    <h3 className="text-sm font-bold text-gray-800">今日时间线</h3>
                    <div className="h-[1px] flex-1 bg-gray-100"></div>
                 </div>
                 <div className="relative pl-6 border-l border-gray-100 space-y-8">
                    {todaysRecords.map(record => (
                       <div key={record.id} className="relative">
                          <div className="absolute -left-[30px] top-5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10"></div>
                          <MealCard record={record} onDelete={deleteRecord} />
                       </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: HISTORY --- */}
        {activeTab === 'history' && (
           <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              
              {/* Search Bar */}
              <div className="flex gap-2 sticky top-0 z-20">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索历史记录..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-sm font-medium shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 rounded-2xl border transition-colors ${showFilters || dateRange.start ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-gray-100 text-gray-400'}`}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              {/* Weekly Report Trigger Card */}
              {!searchTerm && !dateRange.start && (
                <button 
                  onClick={handleGenerateReport}
                  disabled={reportStatus === AnalysisStatus.ANALYZING}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl p-4 text-white shadow-lg shadow-violet-200 flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                       {reportStatus === AnalysisStatus.ANALYZING ? (
                         <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                       ) : (
                         <Activity className="w-5 h-5 text-white" />
                       )}
                     </div>
                     <div className="text-left">
                       <h3 className="font-bold text-sm">生成健康周报</h3>
                       <p className="text-[10px] text-white/80 font-medium">AI 深度分析 · 蔬果 · 水分</p>
                     </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Filters */}
              {(showFilters || dateRange.start || dateRange.end) && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">开始</label>
                      <input type="date" className="w-full bg-gray-50 rounded-lg px-2 py-1.5 text-xs font-medium" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">结束</label>
                      <input type="date" className="w-full bg-gray-50 rounded-lg px-2 py-1.5 text-xs font-medium" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} />
                   </div>
                </div>
              )}

              {/* History List */}
              <div className="pb-10 space-y-6">
                {historyList.length > 0 ? (
                  historyList.map((record, index) => {
                    const currentDate = getRecordDateString(record.timestamp);
                    const prevRecord = historyList[index - 1];
                    const prevDate = prevRecord ? getRecordDateString(prevRecord.timestamp) : null;
                    const showHeader = currentDate !== prevDate;
                    
                    return (
                      <div key={record.id}>
                        {showHeader && (
                          <div className="sticky top-0 z-10 py-2 bg-gray-50/95 backdrop-blur-sm mb-3 mt-4 first:mt-0 flex items-center">
                             <div className="text-xs font-bold text-gray-500 bg-gray-200/50 px-3 py-1 rounded-full">{currentDate}</div>
                             <div className="h-[1px] flex-1 bg-gray-200/50 ml-3"></div>
                          </div>
                        )}
                        <MealCard record={record} onDelete={deleteRecord} />
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                     <Utensils className="w-10 h-10 mb-2 opacity-20" />
                     <p className="text-sm">没有找到相关记录</p>
                  </div>
                )}
              </div>
           </div>
        )}

      </main>

      {/* --- NEW BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[90%] sm:max-w-xs">
         <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] rounded-3xl p-1.5 flex items-center justify-between relative">
            
            {/* Nav: Home */}
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex-1 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeTab === 'home' ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-emerald-600' : ''}`} />
              <span className="text-[10px] font-bold">今天</span>
            </button>

            {/* Nav: Camera (Center) */}
            <div className="relative -mt-10 mx-2">
               {/* Tooltip */}
               {todaysRecords.length === 0 && !error && activeTab === 'home' && (
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex flex-col items-center w-max pointer-events-none animate-bounce">
                    <div className="bg-gray-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                      拍一拍
                    </div>
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-t-[6px] border-t-gray-800 border-r-[4px] border-r-transparent mt-[-1px]"></div>
                  </div>
               )}
               
               <div className="p-1.5 bg-white rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                  <CameraInput 
                    onImageSelected={handleImageSelected} 
                    isProcessing={status === AnalysisStatus.ANALYZING} 
                  />
               </div>
            </div>

            {/* Nav: History */}
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeTab === 'history' ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <History className="w-6 h-6" />
              <span className="text-[10px] font-bold">历史</span>
            </button>
         </div>
      </div>
      
      {/* Loading Overlay */}
      {status === AnalysisStatus.ANALYZING && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
           <div className="bg-gray-900 p-8 rounded-[2rem] flex flex-col items-center shadow-2xl border border-white/10 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-purple-500/20 animate-pulse"></div>
             <div className="relative z-10 flex flex-col items-center">
               <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-500 mb-6"></div>
               <p className="font-bold text-lg mb-1">AI 正在分析...</p>
               <p className="text-gray-400 text-xs">识别食物种类与营养成分</p>
             </div>
           </div>
        </div>
      )}

      {/* Modal: Manual Entry */}
      <ManualEntryModal 
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSubmit={handleManualSubmit}
      />

      {/* Modal: Health Report */}
      {showReportModal && healthReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setShowReportModal(false)} />
           <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
              
              {/* Header */}
              <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 pb-8 text-white relative flex-shrink-0">
                 <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                    <X className="w-6 h-6" />
                 </button>
                 <div className="flex items-center gap-2 mb-2 opacity-80">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium tracking-wide">{healthReport.dateRange}</span>
                 </div>
                 <h2 className="text-2xl font-bold">健康饮食周报</h2>
                 
                 {/* Score Bubble */}
                 <div className="absolute -bottom-10 right-6 w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white">
                    <span className={`text-2xl font-black ${healthReport.score >= 80 ? 'text-emerald-500' : healthReport.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                      {healthReport.score}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">健康分</span>
                 </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-10 overflow-y-auto">
                 {/* Summary */}
                 <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                       <Activity className="w-4 h-4 text-violet-500" />
                       分析总结
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {healthReport.summary}
                    </p>
                 </div>

                 {/* Detailed Analysis (New Section) */}
                 {healthReport.specificAnalysis && (
                    <div className="mb-6 grid gap-3">
                       <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                                <Carrot className="w-4 h-4" />
                             </div>
                             <span className="text-xs font-bold text-gray-800">蔬果摄入</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{healthReport.specificAnalysis.fruitVeggie}</p>
                       </div>
                       
                       <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                <GlassWater className="w-4 h-4" />
                             </div>
                             <span className="text-xs font-bold text-gray-800">水分与补给</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{healthReport.specificAnalysis.hydration}</p>
                       </div>

                       <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600">
                                <ScanLine className="w-4 h-4" />
                             </div>
                             <span className="text-xs font-bold text-gray-800">食材多样性</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{healthReport.specificAnalysis.variety}</p>
                       </div>
                    </div>
                 )}

                 {/* Trends */}
                 <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-blue-500" />
                       饮食趋势
                    </h3>
                    <div className="space-y-2">
                      {healthReport.trends.map((trend, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 flex-shrink-0" />
                           <span>{trend}</span>
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Suggestions */}
                 <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                       <Leaf className="w-4 h-4 text-emerald-500" />
                       改进建议
                    </h3>
                    <div className="space-y-3">
                      {healthReport.suggestions.map((suggestion, i) => (
                        <div key={i} className="bg-emerald-50/50 p-3 rounded-xl flex gap-3 border border-emerald-100/50">
                           <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                             {i + 1}
                           </div>
                           <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                             {suggestion}
                           </p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Footer Button */}
              <div className="p-4 border-t border-gray-50 bg-white flex-shrink-0">
                 <button 
                   onClick={() => setShowReportModal(false)}
                   className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-transform"
                 >
                   我知道了
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

// Helper Components

const NutrientRow = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="flex items-center justify-between text-xs">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-gray-500 font-bold">{label}</span>
    </div>
    <span className="font-bold text-gray-800">{value}g</span>
  </div>
);

const MealCard = ({ record, onDelete }: { record: MealRecord; onDelete: (id: string) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const isManual = record.imageUri === MANUAL_IMAGE_PLACEHOLDER;

  const mealTypeLabels: Record<string, string> = {
    Breakfast: '早餐', Lunch: '午餐', Dinner: '晚餐', Snack: '加餐'
  };

  return (
    <div className="bg-white rounded-[1.5rem] shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100/60 overflow-hidden group transition-all duration-300 hover:shadow-md">
       <div className="p-3 flex gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          {/* Image */}
          <div className={`w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative ${isManual ? 'bg-emerald-50 p-5' : 'bg-gray-100'}`}>
             <img src={record.imageUri} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="food" />
             <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-between py-1">
             <div>
                <div className="flex justify-between items-start">
                   <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-md uppercase tracking-wide">
                      {mealTypeLabels[record.mealType]}
                   </span>
                   <span className="text-[10px] text-gray-300 font-medium font-mono">
                      {new Date(record.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
                <h3 className="font-bold text-gray-800 mt-2 leading-tight line-clamp-2">
                  {record.items.map(i => i.name).join(', ')}
                </h3>
             </div>

             <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1">
                   <span className="text-xl font-extrabold text-emerald-600 font-mono tracking-tight">{record.totalNutrition.calories}</span>
                   <span className="text-[10px] text-gray-400 font-bold">kcal</span>
                </div>
                <div className={`w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center transition-transform duration-300 ${expanded ? 'rotate-180 bg-gray-100' : ''}`}>
                   <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
             </div>
          </div>
       </div>

       {/* Details */}
       <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden bg-gray-50/50">
             <div className="p-4 space-y-6">
                {record.items.map((item, idx) => (
                   <div key={idx} className={idx !== 0 ? 'border-t border-gray-200/50 pt-4' : ''}>
                      <div className="flex justify-between items-center mb-3">
                         <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                           <span className="font-bold text-gray-700 text-sm">{item.name}</span>
                         </div>
                         <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded text-center min-w-[3rem]">
                           {item.portion}
                         </span>
                      </div>
                      
                      {/* Dashboard Grid for Macros */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                         <MacroCard label="热量" value={item.nutrition.calories} unit="" />
                         <MacroCard label="蛋白" value={item.nutrition.protein} unit="g" accent="emerald" />
                         <MacroCard label="碳水" value={item.nutrition.carbs} unit="g" accent="amber" />
                         <MacroCard label="脂肪" value={item.nutrition.fat} unit="g" accent="red" />
                      </div>

                      {item.healthTip && (
                        <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-3 flex gap-3 items-start">
                           <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                           <p className="text-xs text-emerald-800/80 leading-relaxed font-medium">
                             {item.healthTip}
                           </p>
                        </div>
                      )}
                   </div>
                ))}

                <div className="flex justify-end pt-2">
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                     className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                     删除记录
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const MacroCard = ({ label, value, unit, accent }: { label: string, value: number, unit: string, accent?: 'emerald' | 'amber' | 'red' }) => {
   const colors = {
      emerald: 'text-emerald-600',
      amber: 'text-amber-600',
      red: 'text-red-600',
      default: 'text-gray-900'
   };
   const colorClass = accent ? colors[accent] : colors.default;

   return (
      <div className="bg-white rounded-xl p-2 flex flex-col items-center justify-center border border-gray-100/80 shadow-sm">
         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</span>
         <span className={`text-sm font-black ${colorClass}`}>
            {value}<span className="text-[9px] font-normal opacity-60 ml-0.5">{unit}</span>
         </span>
      </div>
   );
}

export default App;
