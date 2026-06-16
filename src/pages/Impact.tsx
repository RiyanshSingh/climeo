import { 
  ArrowLeft, 
  MoreVertical, 
  Download, 
  Car, 
  Utensils, 
  ShoppingBag, 
  Zap, 
  Monitor,
  TrendingDown,
  TrendingUp,
  Activity,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { jsPDF } from 'jspdf';

export default function Impact() {
  const { emissions, profile } = useAppContext();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [prediction, setPrediction] = useState<{predicted_next_month_kg: number, expected_trend_percentage: number} | null>(null);

  const currentData = useMemo(() => {
    const now = new Date();
    const filterDate = new Date();
    if (timeframe === 'week') filterDate.setDate(now.getDate() - 7);
    if (timeframe === 'month') filterDate.setDate(now.getDate() - 30);
    if (timeframe === 'year') filterDate.setFullYear(now.getFullYear() - 1);

    const filtered = emissions.filter(e => new Date(e.date) >= filterDate);
    const total = filtered.reduce((sum, e) => sum + e.amount, 0);

    const categories = {
      transport: { title: "Transport", value: 0, color: "blue" as const, icon: Car },
      food: { title: "Food", value: 0, color: "orange" as const, icon: Utensils },
      shopping: { title: "Shopping", value: 0, color: "purple" as const, icon: ShoppingBag },
      energy: { title: "Home Energy", value: 0, color: "emerald" as const, icon: Zap },
      waste: { title: "Digital & Other", value: 0, color: "gray" as const, icon: Monitor }
    };

    filtered.forEach(e => {
      const cat = e.category.toLowerCase();
      if (categories[cat as keyof typeof categories]) {
        categories[cat as keyof typeof categories].value += e.amount;
      } else {
        categories.waste.value += e.amount;
      }
    });

    const breakdown = Object.values(categories).map(cat => ({
      ...cat,
      value: Math.round(cat.value),
      trend: "down",
      trendValue: "Live",
      progress: total > 0 ? `${Math.round((cat.value / total) * 100)}%` : "0%",
    })).sort((a, b) => b.value - a.value);

    const buckets = [0,0,0,0,0,0];
    if (filtered.length > 0) {
      const timeSpan = now.getTime() - filterDate.getTime();
      const bucketSize = timeSpan / 6;
      filtered.forEach(e => {
        const eTime = new Date(e.date).getTime();
        const bucketIdx = Math.min(5, Math.floor((eTime - filterDate.getTime()) / bucketSize));
        if (bucketIdx >= 0) {
          const val = buckets[bucketIdx];
          if (val !== undefined) {
            buckets[bucketIdx] = val + e.amount;
          }
        }
      });
    }
    const maxBucket = Math.max(...buckets, 1);
    const trendHeights = buckets.map(b => Math.max(5, Math.round((b / maxBucket) * 100)));

    return {
      total: Math.round(total),
      trendText: "Live Data",
      trendDir: "down",
      weeklyAvgLabel: timeframe === 'week' ? "Daily avg" : timeframe === 'month' ? "Weekly avg" : "Monthly avg",
      subtitle: `By category this ${timeframe}`,
      btnLabel: `Download ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}ly Report`,
      trendHeights,
      breakdown
    };
  }, [emissions, timeframe]);

  useEffect(() => {
    // Send the user's REAL categorical breakdown to the ML API
    const payload = {
      transport: currentData.breakdown.find(b => b.title === 'Transport')?.value || 0,
      food: currentData.breakdown.find(b => b.title === 'Food')?.value || 0,
      energy: currentData.breakdown.find(b => b.title === 'Home Energy')?.value || 0,
      shopping: currentData.breakdown.find(b => b.title === 'Shopping')?.value || 0,
      waste: currentData.breakdown.find(b => b.title === 'Digital & Other')?.value || 0,
    };

    fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
       if(!data.error) setPrediction(data);
    })
    .catch(err => console.error("ML API Error:", err));
  }, [emissions, currentData.breakdown]);

  const handleDownload = () => {
    setToastMessage(`Generating ${timeframe}ly report...`);
    setShowToast(true);
    setTimeout(() => {
      setToastMessage("Report downloaded successfully!");

      const userName = profile?.name || 'Climeo User';
      const reportId = 'CLM-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
      const dateStr = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const timeframeTitle = timeframe.charAt(0).toUpperCase() + timeframe.slice(1);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Logo & Branding (Monochrome)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0);
      doc.text('Climeo', 20, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('CARBON FOOTPRINT AUDIT', 190, 20, { align: 'right' });
      
      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.text(`ID: ${reportId}`, 190, 25, { align: 'right' });

      // 2. Divider
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.7);
      doc.line(20, 30, 190, 30);

      // 3. User details (No colored background box, just clean metadata columns)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Prepared For: ${userName}`, 20, 42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Reporting Range: ${timeframeTitle} Audit`, 20, 48);
      doc.text(`Issued: ${dateStr}`, 190, 42, { align: 'right' });

      // Secondary divider line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.4);
      doc.line(20, 55, 190, 55);

      // 4. Metrics Cards (Clean black border, white background)
      // Card 1: Net Carbon Load
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.roundedRect(20, 62, 80, 30, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('NET CARBON LOAD', 26, 70);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(`${currentData.total} kg CO2`, 26, 80);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Total recorded emissions', 26, 86);

      // Card 2: Standing Trend
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.roundedRect(110, 62, 80, 30, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('STANDING TREND', 116, 70);

      const trendText = currentData.trendText || 'Stable';
      const trendFontSize = trendText.length > 15 ? 10 : 13;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(trendFontSize);
      doc.setTextColor(0, 0, 0);
      doc.text(trendText, 116, 79);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Comparative change over period', 116, 86);

      // 5. Emissions Breakdown
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('EMISSIONS BREAKDOWN', 20, 106);

      // We list the items as plain lines with spacing: category on left, value on right
      // (No progress bar rects drawn!)
      currentData.breakdown.forEach((item, i) => {
        const yOffset = 116 + (i * 12);

        // Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.text(item.title, 20, yOffset + 3);

        // Value & Percentage
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(`${item.value} kg CO2   (${item.progress})`, 190, yOffset + 3, { align: 'right' });

        // Faint border separator under the row
        doc.setDrawColor(240, 240, 240);
        doc.line(20, yOffset + 6, 190, yOffset + 6);
      });

      // 6. Forward Outlook
      if (prediction) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('FORWARD OUTLOOK', 20, 185);

        // Simple thin black border card
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.roundedRect(20, 192, 170, 22, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('Predictive Intelligence Forecast', 26, 198);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Based on your activity patterns, Climeo's predictive model estimates your emissions for next`, 26, 204);
        
        const trendSymbol = prediction.expected_trend_percentage >= 0 ? '+' : '';
        doc.text(`month at ${Math.round(prediction.predicted_next_month_kg)} kg CO2, representing a trend deviation of ${trendSymbol}${Math.round(prediction.expected_trend_percentage)}%.`, 26, 209);
      }

      // 7. Footer
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, 260, 190, 260);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('AUTHENTICATED BY CLIMEO', 20, 270);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Verifiable Sustainability Audit Document', 190, 270, { align: 'right' });
      doc.text(`© ${new Date().getFullYear()} Climeo Inc. All rights reserved.`, 190, 274, { align: 'right' });

      // Save PDF
      doc.save(`Climeo_${timeframe}_Report_${userName.replace(/\s+/g, '_')}.pdf`);

      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }, 1200);
  };

  return (
    <div className="px-6 pt-12 pb-24 overflow-y-auto h-full scrollbar-hide">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate(-1)} aria-label="Go back to dashboard" className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 hover:scale-105 transition-transform focus:outline-none cursor-pointer">
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight">Your Impact</h2>
        <button aria-label="More options" className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 hover:scale-105 transition-transform focus:outline-none cursor-pointer" onClick={() => {
          setToastMessage("More options coming soon!");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2000);
        }}>
          <MoreVertical size={18} className="text-gray-700" />
        </button>
      </div>

      {/* Time Toggle - Premium Apple Style */}
      <div className="bg-gray-200/50 p-1 flex justify-between items-center mb-8 max-w-[300px] mx-auto rounded-[20px] backdrop-blur-xl">
        <button 
          onClick={() => setTimeframe('week')}
          className={`flex-1 py-1.5 text-[13px] font-medium text-center rounded-[16px] transition-all focus:outline-none cursor-pointer ${
            timeframe === 'week' 
              ? 'text-gray-900 bg-white font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Week
        </button>
        <button 
          onClick={() => setTimeframe('month')}
          className={`flex-1 py-1.5 text-[13px] font-medium text-center rounded-[16px] transition-all focus:outline-none cursor-pointer ${
            timeframe === 'month' 
              ? 'text-gray-900 bg-white font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Month
        </button>
        <button 
          onClick={() => setTimeframe('year')}
          className={`flex-1 py-1.5 text-[13px] font-medium text-center rounded-[16px] transition-all focus:outline-none cursor-pointer ${
            timeframe === 'year' 
              ? 'text-gray-900 bg-white font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Year
        </button>
      </div>

      {/* Main Impact Card - Premium Mesh/Glass */}
      <div className="rounded-[32px] p-6 mb-8 relative overflow-hidden flex justify-between items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 bg-gradient-to-br from-white to-[#F8FAF9]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8F8EA] rounded-full blur-[60px] opacity-60 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E0F2FE] rounded-full blur-[50px] opacity-40 translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10 pl-2">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-[50px] leading-[0.9] font-bold text-gray-900 tracking-tighter">
              {currentData.total.toLocaleString()}
            </span>
            <span className="text-[16px] font-semibold text-gray-500">kg</span>
          </div>
          <p className="text-[13px] font-medium text-gray-400 mb-4 ml-1 tracking-wide uppercase">CO₂ Emitted</p>
          
          {prediction ? (
            <div className="flex flex-col gap-0.5">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap ${prediction.expected_trend_percentage > 0 ? 'text-rose-500' : 'text-[#10B981]'}`}>
                {prediction.expected_trend_percentage > 0 ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                {prediction.expected_trend_percentage > 0 ? '+' : ''}{prediction.expected_trend_percentage}% next month
              </span>
              <span className="text-[10px] font-medium text-gray-500 ml-1">Expected: {prediction.predicted_next_month_kg} kg</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 whitespace-nowrap">
              <Activity size={14} className="animate-pulse" />
              Loading AI Forecast...
            </span>
          )}
        </div>
        
        <div className="w-32 h-32 flex justify-center items-center shrink-0 relative z-10">
          <img src="/mountains.png" alt="Mountains" className="w-full h-full object-contain animate-fade-in drop-shadow-xl" />
        </div>
      </div>

      {/* Emission Trend - Sleek minimalist bars */}
      <div className="mb-8">
         <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">Emission Trend</h3>
            <span className="text-[12px] font-medium text-gray-400 flex items-center gap-1"><Activity size={12}/> {currentData.weeklyAvgLabel}</span>
         </div>
         <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex items-end justify-between gap-3 h-44">
            {currentData.trendHeights.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5 flex-1 group">
                 <div className="w-full max-w-[28px] bg-gray-100/80 rounded-full relative flex items-end overflow-hidden" style={{height: '110px'}}>
                   <div 
                     className="w-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80" 
                     style={{
                       height: `${h}%`,
                       background: i === 5 ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)' : 'linear-gradient(180deg, #E5E7EB 0%, #D1D5DB 100%)'
                     }}
                   ></div>
                 </div>
                 <span className={`text-[11px] font-medium ${i === 5 ? 'text-[#10B981]' : 'text-gray-400'}`}>
                   {timeframe === 'week' ? `Day ${i+1}` : timeframe === 'month' ? `W${i+1}` : `M${(i*2)+1}`}
                 </span>
              </div>
            ))}
         </div>
      </div>

      {/* Carbon Breakdown - Vercel/Linear Style */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">Carbon Breakdown</h3>
            <p className="text-[12px] font-medium text-gray-400 mt-0.5">{currentData.subtitle}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-[28px] p-2.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col gap-1">
          {currentData.breakdown.map((item, idx) => {
            const Icon = item.icon;
            return (
              <BreakdownItem 
                key={idx}
                icon={<Icon size={18} />} 
                title={item.title} 
                value={item.value} 
                trend={item.trend} 
                trendValue={item.trendValue} 
                progress={item.progress} 
                color={item.color} 
              />
            );
          })}
        </div>
      </div>

      {/* Download Report Button - Minimalist Dark Mode Style */}
      <button 
        onClick={handleDownload}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-[14px] flex justify-center items-center gap-2.5 mb-6 cursor-pointer focus:outline-none"
      >
        <Download size={18} className="opacity-90" />
        {currentData.btnLabel}
      </button>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-[#124C2E]/95 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
          <div className="w-5 h-5 rounded-full bg-white text-[#124C2E] flex justify-center items-center shrink-0">
            <Check size={11} className="stroke-[3]" />
          </div>
          <span className="text-[11px] font-bold whitespace-nowrap">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

const colorStyles = {
  blue: {
    bg: "bg-blue-500",
    lightBg: "bg-blue-50",
    text: "text-blue-600",
    gradient: "from-blue-400 to-blue-600"
  },
  orange: {
    bg: "bg-orange-500",
    lightBg: "bg-orange-50",
    text: "text-orange-600",
    gradient: "from-orange-400 to-orange-600"
  },
  purple: {
    bg: "bg-purple-500",
    lightBg: "bg-purple-50",
    text: "text-purple-600",
    gradient: "from-purple-400 to-purple-600"
  },
  emerald: {
    bg: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    text: "text-emerald-600",
    gradient: "from-emerald-400 to-emerald-600"
  },
  gray: {
    bg: "bg-gray-600",
    lightBg: "bg-gray-100",
    text: "text-gray-700",
    gradient: "from-gray-500 to-gray-700"
  }
} as const;

interface BreakdownItemProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend: string;
  trendValue: string;
  progress: string | number;
  color: keyof typeof colorStyles;
}

function BreakdownItem({ icon, title, value, trend, trendValue, progress, color }: BreakdownItemProps) {
  const isUp = trend === 'up';
  const theme = colorStyles[color];

  return (
    <div className="group flex flex-col gap-3 p-3.5 rounded-[20px] hover:bg-gray-50/80 transition-all duration-300 cursor-pointer">
      
      <div className="flex items-center gap-3.5">
        {/* Sleek Icon Frame */}
        <div className={`w-11 h-11 rounded-[14px] ${theme.lightBg} ${theme.text} flex justify-center items-center shrink-0 shadow-sm border border-white`}>
          {icon}
        </div>

        {/* Info */}
        <div className="flex-1 flex justify-between items-center min-w-0">
          <div>
            <span className="font-semibold text-gray-900 text-[14px] block mb-0.5">{title}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-gray-500">{value} kg CO₂</span>
            </div>
          </div>
          
          {/* Trend Pill */}
          <div className="flex flex-col items-end gap-1">
             <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${
               isUp 
                 ? 'bg-rose-50 text-rose-600' 
                 : 'bg-emerald-50 text-emerald-600'
             }`}>
               {isUp ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
               {trendValue}
             </span>
          </div>
        </div>
      </div>

      {/* Premium Thin Progress Bar */}
      <div className="pl-[58px] w-full">
        <div className="relative w-full bg-gray-100 rounded-full h-[6px] overflow-hidden">
          <div 
            className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${theme.gradient} transition-all duration-1000 ease-out`}
            style={{ width: progress }}
          />
        </div>
      </div>
    </div>
  );
}
