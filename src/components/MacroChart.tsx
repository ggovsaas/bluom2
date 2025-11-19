import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const MACRO_COLORS = ['#ef4444', '#3b82f6', '#eab308']; // Protein, Carbs, Fat

export type MacroChartMode = 'perServing' | 'total';

interface MacroChartProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings?: number;
  mode: MacroChartMode;
  onModeChange?: (mode: MacroChartMode) => void;
  showSwitcher?: boolean;
  size?: number;
}

export const MacroChart: React.FC<MacroChartProps> = ({
  calories,
  protein,
  carbs,
  fat,
  servings = 1,
  mode,
  onModeChange,
  showSwitcher = false,
  size = 180,
}) => {
  // Calculate per serving or total
  const isPerServing = mode === 'perServing';
  const displayCalories = isPerServing ? Math.round(calories / servings) : Math.round(calories);
  const displayProtein = isPerServing ? Math.round(protein / servings) : Math.round(protein);
  const displayCarbs = isPerServing ? Math.round(carbs / servings) : Math.round(carbs);
  const displayFat = isPerServing ? Math.round(fat / servings) : Math.round(fat);

  const macroChartData = [
    { name: 'Protein', value: displayProtein },
    { name: 'Carbs', value: displayCarbs },
    { name: 'Fat', value: displayFat },
  ];

  return (
    <div className="flex flex-col items-center justify-center">
      {showSwitcher && (
        <div className="mb-2 flex space-x-2">
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${isPerServing ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => onModeChange && onModeChange('perServing')}
          >
            Per Serving
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${!isPerServing ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => onModeChange && onModeChange('total')}
          >
            Recipe Total
          </button>
        </div>
      )}
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart width={size} height={size}>
            <Pie
              data={macroChartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={size * 0.32}
              outerRadius={size * 0.48}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              labelLine={false}
            >
              {MACRO_COLORS.map((color, idx) => (
                <Cell key={idx} fill={color} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
        {/* Centered calories text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-3xl font-extrabold text-blue-700 leading-tight">{displayCalories}</span>
          <span className="text-base font-medium text-gray-500 -mt-1">kcal</span>
        </div>
      </div>
      {/* Macro labels with color dots */}
      <div className="flex flex-row items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: MACRO_COLORS[0] }}></span>
          <span className="text-sm">Protein</span>
          <span className="font-bold ml-1">{displayProtein}g</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: MACRO_COLORS[1] }}></span>
          <span className="text-sm">Carbs</span>
          <span className="font-bold ml-1">{displayCarbs}g</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: MACRO_COLORS[2] }}></span>
          <span className="text-sm">Fat</span>
          <span className="font-bold ml-1">{displayFat}g</span>
        </div>
      </div>
    </div>
  );
};

export default MacroChart; 