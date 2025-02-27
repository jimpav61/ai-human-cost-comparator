
import React from 'react';

interface FooterProps {
  onAdminClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <div className="mt-16 text-center">
      <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
        <a 
          href="https://chatsites.ai/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-500 transition-colors"
        >
          Terms of Service
        </a>
        <span className="text-gray-300">|</span>
        <a 
          href="https://chatsites.ai/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-500 transition-colors"
        >
          Privacy Policy
        </a>
        <span className="text-gray-300">|</span>
        <a 
          href="https://chatsites.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-500 transition-colors"
        >
          Powered by ChatSites.ai
        </a>
        <span className="text-gray-300">|</span>
        <button
          onClick={onAdminClick}
          className="text-gray-600 hover:text-brand-500 transition-colors text-sm"
        >
          Admin
        </button>
      </div>
    </div>
  );
};

export default Footer;
