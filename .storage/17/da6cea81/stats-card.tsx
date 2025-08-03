import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  trendValue 
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        <div className="mt-2">
          <h2 className="text-3xl font-bold">{value}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {trend && trendValue && (
          <div className="mt-3 flex items-center gap-1">
            <span className={`text-xs font-medium
              ${trend === 'up' ? 'text-green-600' : 
               trend === 'down' ? 'text-red-600' : 'text-gray-500'}
            `}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}