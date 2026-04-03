import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import {
  LayoutDashboard,
  CircleDollarSign,
  ClipboardList,
  BarChart3,
  CheckCircle,
  XCircle,
  Table,
  Trophy,
  Clock,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const StatCard = React.memo(({ icon, label, value, sub, color = "amber" }) => {
  const colors = {
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    green: "border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400",
    blue: "border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400",
    red: "border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400",
    purple: "border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400",
  };
  return (
    <div className={`card border shadow-sm ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[14px] font-normal text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-[32px] font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-[12px] font-normal text-gray-500 dark:text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
});

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get("/orders/analytics/summary"),
        api.get("/orders?limit=10"),
      ]);
      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data);
    } catch (err) {
      console.error("Dashboard error:", err);
      Toast.fire({
        icon: 'error',
        title: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statusBadge = (status) => {
    const map = {
      pending: "badge-pending",
      preparing: "badge-preparing",
      partially_ready: "badge-preparing",
      ready: "badge-ready",
      served: "badge-available",
      cancelled: "badge-occupied",
    };
    return `inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-normal border ${map[status] || "badge-pending"}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        subtitle="Restaurant overview & analytics" 
        icon={LayoutDashboard} 
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={<CircleDollarSign size={24} />}
          label="Total Revenue"
          value={`$${stats?.totalRevenue?.toFixed(2) || "0.00"}`}
          sub="From served orders"
          color="amber"
        />
        <StatCard
          icon={<ClipboardList size={24} />}
          label="Total Orders"
          value={stats?.totalOrders || 0}
          sub="All time"
          color="blue"
        />
        <StatCard
          icon={<BarChart3 size={24} />}
          label="Avg Order Value"
          value={`$${stats?.avgRevenue?.toFixed(2) || "0.00"}`}
          sub="Per served order"
          color="purple"
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          label="Served Orders"
          value={stats?.servedOrders || 0}
          sub="Completed successfully"
          color="green"
        />
        <StatCard
          icon={<XCircle size={24} />}
          label="Cancelled"
          value={stats?.cancelledOrders || 0}
          sub="Cancelled orders"
          color="red"
        />
        <StatCard
          icon={<Table size={24} />}
          label="Available Tables"
          value={stats?.availableTables || 0}
          sub="Ready for customers"
          color="green"
        />
      </div>

      {/* Top Items + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="card shadow-sm p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-amber-500" size={20} />
            <h3 className="text-[20px] font-semibold text-orange-500 dark:text-white">
              Top Selling Items
            </h3>
          </div>
          {stats?.topItems?.length > 0 ? (
            <div className="space-y-3">
              {stats.topItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[12px] flex items-center justify-center font-normal">
                      {i + 1}
                    </span>
                    <span className="text-[14px] text-gray-700 dark:text-gray-300 font-normal">{item._id}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-semibold text-gray-900 dark:text-white">
                      {item.totalOrdered} sold
                    </p>
                    <p className="text-[12px] font-normal text-gray-500 dark:text-gray-500">
                      ${item.revenue?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No sales data yet</p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card shadow-sm p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-blue-500" size={20} />
            <h3 className="text-[20px] font-semibold text-blue-500 dark:text-white">
              Recent Orders
            </h3>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900 dark:text-white">
                      Table {order.tableId?.tableNumber} · {order.items?.length}{" "}
                      items
                    </p>
                    <p className="text-[12px] font-normal text-gray-500 dark:text-gray-400">
                      {order.waiterId?.name} ·{" "}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={statusBadge(order.status)}>
                      {order.status}
                    </span>
                    <p className="text-[12px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                      ${order.totalAmount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

