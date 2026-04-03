import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Utensils,
  Table,
  BarChart3,
  LogOut,
  ChefHat,
  X,
  Menu
} from "lucide-react";
import Swal from "sweetalert2";

const navItems = [
  {
    path: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    end: true,
  },
  { path: "/admin/users", label: "Users", icon: <Users size={20} /> },
  {
    path: "/admin/categories",
    label: "Categories",
    icon: <ClipboardList size={20} />,
  },
  { path: "/admin/menu", label: "Menu Items", icon: <Utensils size={20} /> },
  { path: "/admin/tables", label: "Tables", icon: <Table size={20} /> },
  {
    path: "/admin/orders",
    label: "Order History",
    icon: <ClipboardList size={20} />,
  },
  { path: "/admin/reports", label: "Reports", icon: <BarChart3 size={20} /> },
];

const Sidebar = ({ isOpen, closeSidebar, isExpanded, toggleExpanded }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: "Sign Out",
      text: "Are you sure you want to sign out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, sign out",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate("/login");
      }
    });
  };

  return (
    <div className={`
      min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
      flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out
      ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      md:translate-x-0 md:shadow-none
      ${isExpanded ? "w-64" : "w-20"}
    `}>
      {/* Logo */}
      <div className={`border-b border-gray-200 dark:border-gray-800 flex items-center ${isExpanded ? "p-6 justify-between" : "p-4 pt-6 justify-center flex-col gap-6"}`}>
        {isExpanded ? (
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <ChefHat size={24} className="shrink-0" />
              <h1 className="text-[20px] font-semibold whitespace-nowrap">RestaurantOS</h1>
            </div>
            <p className="text-[12px] whitespace-nowrap font-normal text-gray-500 dark:text-gray-400 mt-1">Management System</p>
          </div>
        ) : (
          <ChefHat size={28} className="text-amber-600 dark:text-amber-400 shrink-0" />
        )}
        
        {/* Desktop Hamburger */}
        <button 
          onClick={toggleExpanded}
          className={`hidden md:flex p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500`}
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Close */}
        <button 
          onClick={closeSidebar}
          className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 absolute top-4 right-4"
          aria-label="Close Sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={() => {
              if (window.innerWidth < 768) {
                closeSidebar();
              }
            }}
            title={!isExpanded ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all ${isExpanded ? "gap-3" : "justify-center"} ${
                isActive
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              }`
            }
          >
            <div className="flex-shrink-0">{item.icon}</div>
            {isExpanded && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

    </div>
  );
};

export default Sidebar;
