import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({ label, value, trend, icon, className }: MetricCardProps) {
  return (
    <Card className={cn("bg-card/80", className)}>
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
