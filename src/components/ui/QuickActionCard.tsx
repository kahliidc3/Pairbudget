'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray';
  onClick: () => void;
  /** @deprecated kept for backwards compat — no longer used */
  delay?: number;
  disabled?: boolean;
  badge?: string;
}

const COLOR_QA: Record<string, string> = {
  blue:   'b',
  green:  'g',
  orange: 'o',
  purple: 'm',
  red:    'r',
  gray:   's',
};

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title, subtitle, icon: Icon, color, onClick, disabled = false, badge,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`qa ${COLOR_QA[color] || 's'}`}
    style={{ position: 'relative' }}
  >
    {badge && (
      <span className="tag tag-red" style={{ position: 'absolute', top: -6, right: -6, fontSize: '.6rem' }}>
        {badge}
      </span>
    )}
    <div className="qa-ico"><Icon /></div>
    <div>
      <div className="qa-n">{title}</div>
      <div className="qa-d">{subtitle}</div>
    </div>
  </button>
);

export default QuickActionCard;
