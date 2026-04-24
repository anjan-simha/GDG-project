import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DemandForecast } from '../../types/meter';
import { format } from 'date-fns';

interface Props {
  data: DemandForecast[];
}

export const DemandForecastChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
          <XAxis 
            dataKey="forecastTimestamp" 
            tickFormatter={(val) => format(new Date(val), 'HH:mm')}
            stroke="var(--color-text-muted)"
            fontSize={11}
            tickMargin={10}
          />
          <YAxis 
            stroke="var(--color-text-muted)"
            fontSize={11}
            tickFormatter={(val) => `${val.toFixed(0)}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--color-grid-slate)', borderColor: 'var(--color-border-active)', borderRadius: '4px', fontFamily: 'DM Sans' }}
            itemStyle={{ fontFamily: 'JetBrains Mono' }}
            labelFormatter={(label) => format(new Date(label as string), 'dd MMM HH:mm')}
          />
          <Line 
            type="monotone" 
            dataKey="baselineKWh" 
            stroke="var(--color-baseline-line)" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Baseline (kWh)"
          />
          <Line 
            type="monotone" 
            dataKey="predictedKWh" 
            stroke="var(--color-forecast-line)" 
            strokeWidth={3}
            dot={false}
            name="Predicted (kWh)"
          />
          <Line 
            type="monotone" 
            dataKey="confidenceHigh" 
            stroke="var(--color-forecast-line)" 
            strokeWidth={1}
            strokeOpacity={0.3}
            dot={false}
            name="Upper Bound"
          />
          <Line 
            type="monotone" 
            dataKey="confidenceLow" 
            stroke="var(--color-forecast-line)" 
            strokeWidth={1}
            strokeOpacity={0.3}
            dot={false}
            name="Lower Bound"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
