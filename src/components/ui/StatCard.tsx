'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: 'green' | 'red' | 'blue' | 'orange' | 'purple';
  /** @deprecated kept for backwards compat — no longer used */
  trend?: { value: string; isPositive: boolean };
  /** @deprecated kept for backwards compat — no longer used */
  delay?: number;
  className?: string;
}

const ICON_CLASS: Record<string, string> = {
  green:  'g',
  blue:   'b',
  orange: 'o',
  red:    'r',
  purple: 'g',
};
const VAL_CLASS: Record<string, string> = {
  green:  'green',
  blue:   '',
  orange: '',
  red:    'red',
  purple: '',
};

const StatCardComponent: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, iconColor, className }) => (
  <div className={`stat ${className ?? ''}`}>
    <div>
      <div className="stat-lbl">{title}</div>
      <div className={`stat-val ${VAL_CLASS[iconColor]}`}>{value}</div>
      {subtitle && <div className="stat-sub">{subtitle}</div>}
    </div>
    <div className={`stat-ico ${ICON_CLASS[iconColor]}`}>
      <Icon />
    </div>
  </div>
);

const propsAreEqual = (prev: StatCardProps, next: StatCardProps) =>
  prev.title === next.title &&
  prev.value === next.value &&
  prev.subtitle === next.subtitle &&
  prev.icon === next.icon &&
  prev.iconColor === next.iconColor &&
  prev.className === next.className;

const StatCard = React.memo(StatCardComponent, propsAreEqual);

export default StatCard;
