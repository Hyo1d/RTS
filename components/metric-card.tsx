import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
}

export function MetricCard({ label, value, trend, icon }: MetricCardProps) {
  return (
    <Card className="bg-card/80">
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
        <div className="rounded-2xl bg-primary/10 p-2.5 text-primary sm:p-3">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold sm:text-2xl">{value}</p>
          {trend && <p className="text-xs text-success">{trend}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
