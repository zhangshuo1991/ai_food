import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Nutrition } from '../types';

interface NutritionChartProps {
  nutrition: Nutrition;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Protein (Green), Carbs (Yellow), Fat (Red)

const NutritionChart: React.FC<NutritionChartProps> = ({ nutrition }) => {
  const data = [
    { name: '蛋白质', value: nutrition.protein, unit: 'g' },
    { name: '碳水', value: nutrition.carbs, unit: 'g' },
    { name: '脂肪', value: nutrition.fat, unit: 'g' },
  ];

  // Prevent rendering empty chart if all zeros
  if (nutrition.protein === 0 && nutrition.carbs === 0 && nutrition.fat === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full rounded-2xl border-2 border-dashed border-gray-100">
        <span className="text-xs text-gray-300 font-medium">无数据</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={55}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [`${value}${props.payload.unit}`, name]}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold' }}
            itemStyle={{ color: '#374151' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
         {/* Center label could go here, but omitted to keep clean */}
      </div>
    </div>
  );
};

export default NutritionChart;