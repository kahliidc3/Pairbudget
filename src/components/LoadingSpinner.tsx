'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-transparent rounded-full`}
        style={{
          background: 'linear-gradient(45deg, #8B5FBF, #4F7EF7)',
          backgroundClip: 'padding-box',
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <div 
          className="w-full h-full rounded-full border-2 border-transparent"
          style={{
            background: 'linear-gradient(45deg, transparent, transparent, #FFFFFF)',
            backgroundClip: 'padding-box',
          }}
        />
      </motion.div>
    </div>
  );
};

export default LoadingSpinner; 