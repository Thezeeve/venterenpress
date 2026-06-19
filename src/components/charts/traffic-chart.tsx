"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrafficChart({
  data,
}: {
  data: { day: string; readers: number; subscribers: number }[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[300px] w-full rounded-[24px] bg-[var(--muted)]" />;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="readers" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#b42318" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#b42318" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="subscribers" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#155eef" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#155eef" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={64} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="readers"
            stroke="#b42318"
            fillOpacity={1}
            fill="url(#readers)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="subscribers"
            stroke="#155eef"
            fillOpacity={1}
            fill="url(#subscribers)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
