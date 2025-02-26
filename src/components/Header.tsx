
import React from 'react';

const Header = () => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-brand-500 font-bold text-2xl">AiGent Compass</span>
              <span className="text-gray-500 text-sm ml-2">by chatsites.ai</span>
            </div>
          </div>
          <div className="flex items-center">
            <button className="bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
