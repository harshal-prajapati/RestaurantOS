import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown, Settings, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const UserDropdown = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    Swal.fire({
      title: 'Sign Out',
      text: 'Are you sure you want to sign out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, sign out',
      cancelButtonText: 'Cancel',
      background: document.documentElement.classList.contains('dark') ? '#111827' : '#fff',
      color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/login');
      }
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
      >
        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 font-bold text-lg">
          {user?.name?.charAt(0).toUpperCase() || <User size={20} />}
        </div>
        <div className="hidden md:block text-left mr-1">
          <p className="text-[14px] font-medium text-gray-900 dark:text-white leading-none">
            {user?.name}
          </p>
          <p className="text-[12px] font-normal text-gray-500 dark:text-gray-400 capitalize mt-1">
            {user?.role}
          </p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[16px] font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-[12px] font-normal text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
            <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-normal uppercase bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              {user?.role}
            </div>
          </div>
          
          <div className="py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 text-[14px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
