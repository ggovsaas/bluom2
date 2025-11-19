import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Utensils, Dumbbell, Heart, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Navigation: React.FC = () => {
  const navItems = [
    { path: '/app', icon: Home, label: 'Home' },
    { path: '/fuel', icon: Utensils, label: 'Fuel' },
    { path: '/move', icon: Dumbbell, label: 'Move' },
    { path: '/wellness', icon: Heart, label: 'Wellness' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 min-w-[60px] relative ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      color: isActive ? '#3B82F6' : '#6B7280',
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon size={24} />
                  </motion.div>
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;