import React from 'react';
import ThemeToggle from './ThemeToggle';
import UserDropdown from './UserDropdown';

const PageHeader = ({ title, subtitle, icon: Icon, actions }) => {

  return (
    <div className="flex justify-between items-center mb-8">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            {React.isValidElement(Icon) ? Icon : <Icon size={20} />}
          </div>
        )}
        <div>
          <h2 className="text-[32px] font-bold text-gray-900 dark:text-white leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[16px] font-normal text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Actions if any (e.g. search/filter) */}
        {actions && <div className="flex items-center gap-3">{actions}</div>}
        
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <UserDropdown />
        </div>
      </div>
    </div>
  );
};

export default PageHeader;

