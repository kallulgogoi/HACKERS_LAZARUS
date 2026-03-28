import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Activity, Heart, Droplets } from "lucide-react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Live Telemetry
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="h-3 w-3 text-red-500" />
            <span className="text-xs text-muted-foreground">Heart Rate:</span>
            <span className="text-sm font-bold">{payload[0].value} BPM</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">SpO2 Level:</span>
            <span className="text-sm font-bold">{payload[1].value}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const VitalsChart = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Biometric Telemetry
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time patient vital signs monitoring
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                hide
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="bpm"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#colorBpm)"
              />
              <Area
                type="monotone"
                dataKey="spo2"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorSpo2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Heart Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">
              Oxygen Saturation
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VitalsChart;
