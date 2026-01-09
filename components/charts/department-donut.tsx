"use client";

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--foreground))",
  "#6B6B6B",
  "#9E9E9E",
  "#D6D6D6"
];

interface DepartmentDatum {
  name: string;
  value: number;
}

interface TooltipPayload {
  name: string;
  value: number;
  percent?: number;
}

const MAX_SLICES = 5;

function DonutTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayload }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 px-3 py-2 text-xs shadow-soft">
      <p className="font-semibold text-foreground">{name}</p>
      <p className="text-muted-foreground">
        {value} empleados {percent ? `(${Math.round(percent * 100)}%)` : ""}
      </p>
    </div>
  );
}

function compactData(data: DepartmentDatum[]) {
  const filtered = data.filter((item) => item.value > 0);
  const sorted = [...filtered].sort((a, b) => b.value - a.value);
  if (sorted.length <= MAX_SLICES) return sorted;
  const head = sorted.slice(0, MAX_SLICES - 1);
  const tail = sorted.slice(MAX_SLICES - 1);
  const others = tail.reduce((sum, item) => sum + item.value, 0);
  return [...head, { name: "Otros", value: others }];
}

export function DepartmentDonut({ data }: { data: DepartmentDatum[] }) {
  const chartData = compactData(data);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Empleados por empresa</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground sm:h-[260px]">
            Sin datos suficientes.
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="h-[220px] w-full sm:h-[240px] sm:w-[55%]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={86}
                    dataKey="value"
                    paddingAngle={2}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <Label
                      position="center"
                      content={({ viewBox }) => {
                        if (!viewBox || !("cx" in viewBox)) return null;
                        const cx = viewBox.cx ?? 0;
                        const cy = viewBox.cy ?? 0;
                        return (
                          <g>
                            <text
                              x={cx}
                              y={cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              style={{ fill: "hsl(var(--foreground))", fontSize: 18, fontWeight: 600 }}
                            >
                              {total}
                            </text>
                            <text
                              x={cx}
                              y={cy + 18}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              style={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                            >
                              Total
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-1 flex-col gap-2 text-sm">
              {chartData.map((item, index) => {
                const percent = total ? Math.round((item.value / total) * 100) : 0;
                const color = COLORS[index % COLORS.length];
                return (
                  <div
                    key={item.name}
                    className="rounded-lg border border-border/60 bg-background/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm text-foreground">{item.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.value} ({percent}%)
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
