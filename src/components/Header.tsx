import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, User } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  
  // Check if user is logged in
  const user = localStorage.getItem('aifit_user');
  const isLoggedIn = !!user;

  const handleLogout = () => {
    localStorage.removeItem('aifit_user');
    localStorage.removeItem('aifit_signed_up');
    localStorage.removeItem('aifit_onboarding_completed');
    localStorage.removeItem('aifit_profile');
    localStorage.removeItem('aifit_daily_data');
    localStorage.removeItem('aifit_food_entries');
    localStorage.removeItem('aifit_exercise_entries');
    localStorage.removeItem('aifit_last_active_date');
    // Note: We keep aifit_accounts so users can login again
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/app" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">✨</span>
          </div>
          <span className="text-xl font-bold text-gray-900">BloomYou</span>
        </Link>

        {/* Right side - Simple avatar or login button */}
        <div className="flex items-center">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              <User size={16} />
            </button>
          ) : (
            <Link
              to="/login"
              className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <LogIn size={16} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
