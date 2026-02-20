'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray';
  onClick: () => void;
  delay?: number;
  disabled?: boolean;
  badge?: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  color,
  onClick,
  delay = 0,
  disabled = false,
  badge
}) => {
  const colorVariants = {
    blue: 'bg-blue-50 border-blue-100 hover:bg-blue-100 text-blue-600',
    green: 'bg-green-50 border-green-100 hover:bg-green-100 text-green-600',
    orange: 'bg-orange-50 border-orange-100 hover:bg-orange-100 text-orange-600',
    purple: 'bg-purple-50 border-purple-100 hover:bg-purple-100 text-purple-600',
    red: 'bg-red-50 border-red-100 hover:bg-red-100 text-red-600',
    gray: 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-600'
  };

  const iconColorVariants = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-4 border rounded-2xl transition-all duration-200 text-left relative group",
        disabled 
          ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
          : colorVariants[color],
        "active:scale-95"
      )}
    >
      {badge && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
          {badge}
        </div>
      )}
      
      <div className="flex items-center space-x-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
          disabled 
            ? "bg-gray-200 text-gray-400"
            : iconColorVariants[color]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-semibold text-base mb-1",
            disabled ? "text-gray-400" : "text-gray-900"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-sm",
            disabled ? "text-gray-400" : "text-gray-600"
          )}>
            {subtitle}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

export default QuickActionCard;