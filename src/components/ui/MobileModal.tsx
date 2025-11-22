'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  fullScreen?: boolean;
  showCloseButton?: boolean;
}

const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  fullScreen = false,
  showCloseButton = true
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ 
              opacity: 0, 
              y: fullScreen ? '100%' : 50, 
              scale: fullScreen ? 1 : 0.95 
            }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              y: fullScreen ? '100%' : 50, 
              scale: fullScreen ? 1 : 0.95 
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`bg-white shadow-xl max-w-md w-full mx-4 overflow-hidden ${
              fullScreen 
                ? 'fixed inset-0 sm:relative sm:inset-auto sm:rounded-2xl sm:max-h-[90vh]' 
                : 'rounded-t-2xl sm:rounded-2xl max-h-[90vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileModal;