import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleExpanded = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} isExpanded={isSidebarExpanded} toggleExpanded={toggleExpanded} />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen max-w-full overflow-hidden transition-all duration-300 ease-in-out ${isSidebarExpanded ? "md:ml-64" : "md:ml-20"}`}>
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <button 
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Toggle Sidebar"
            aria-expanded={isSidebarOpen}
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-semibold text-gray-900 dark:text-white">Admin Panel</span>
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
