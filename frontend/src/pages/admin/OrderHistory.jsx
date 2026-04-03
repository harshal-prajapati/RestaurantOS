import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import {
  ClipboardList,
  MessageSquare,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  DollarSign
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

const statusBadge = (status) => {
  const map = {
    pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    preparing: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    ready: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/20",
    served: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
  };
  return `inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-normal uppercase border transition-colors ${map[status] || map.pending}`;
};

const OrderHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get("status") || "");
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  // Sync state with URL
  useEffect(() => {
    const params = {};
    if (filter) params.status = filter;
    setSearchParams(params, { replace: true });
  }, [filter, setSearchParams]);

  const fetch = useCallback(async () => {
    try {
      const url = filter ? `/orders?status=${filter}` : "/orders";
      const { data } = await api.get(url);
      setOrders(data.data);
    } catch (e) {
      console.error(e);
      Toast.fire({
        icon: 'error',
        title: 'Failed to fetch orders'
      });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateStatus = async (orderId, status) => {
    // Optimistic update
    const originalOrders = [...orders];
    setOrders((prev) => prev.map(o => o._id === orderId ? { ...o, status } : o));
    setUpdating(orderId);
    
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
    } catch (e) {
      console.error(e);
      setOrders(originalOrders);
      Toast.fire({
        icon: 'error',
        title: 'Failed to update order status'
      });
    } finally {
      setUpdating(null);
    }
  };

  const STATUSES = ["", "pending", "preparing", "ready", "served", "cancelled"];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Order History"
        subtitle={`Reviewing ${orders.length} order entries`}
        icon={ClipboardList}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-normal text-gray-500 dark:text-gray-400">
              Filter By:
            </span>
            <select
              className="input-field w-44 font-normal text-[14px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 h-10"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.slice(1).map((s) => (
                <option key={s} value={s} className="bg-white dark:bg-gray-900">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className={`card border-2 transition-all duration-300 ${expanded === order._id ? "bg-white dark:bg-gray-950 border-blue-500/20 shadow-xl" : "bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 border-gray-100 dark:border-gray-800"}`}
            >
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() =>
                  setExpanded(expanded === order._id ? null : order._id)
                }
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-[24px] border border-amber-200 dark:border-amber-500/20 shadow-sm transition-colors">
                    T{order.tableId?.tableNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-900 dark:text-white text-[16px] transition-colors">
                        {order.items?.length} Items Ordered
                      </p>
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-500 font-semibold px-2 py-0.5 bg-green-50 dark:bg-green-500/5 rounded-lg border border-green-100 dark:border-green-500/10 text-[14px]">
                        <DollarSign size={14} />
                        {order.totalAmount?.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                       <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 transition-colors uppercase tracking-wider">
                          <User size={14} className="text-gray-400" />
                          Waiter: {order.waiterId?.name}
                       </span>
                       <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 transition-colors uppercase tracking-wider">
                          <Clock size={14} className="text-gray-400" />
                          {new Date(order.createdAt).toLocaleString()}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <span className={statusBadge(order.status)}>
                    {order.status.replace("_", " ")}
                  </span>
                  <div className={`p-2 rounded-full transition-colors cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 ${expanded === order._id ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-blue-400 text-blue-600 dark:bg-gray-800 dark:text-gray-600"}`}>
                    {expanded === order._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {expanded === order._id && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 animate-slide-down">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden mb-6">
                    <table className="w-full text-left">
                       <thead className="bg-gray-100/50 dark:bg-black/20 border-b border-gray-200 dark:border-gray-800 text-[12px] font-normal uppercase text-gray-500">
                          <tr>
                             <th className="px-5 py-3">Menu Item</th>
                             <th className="px-5 py-3 text-center">Qty</th>
                             <th className="px-5 py-3">Status</th>
                             <th className="px-5 py-3 text-right">Subtotal</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {order.items?.map((item, i) => (
                            <tr key={i} className="text-[14px]">
                              <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">{item.name}</td>
                              <td className="px-5 py-4 text-center font-normal text-gray-500 dark:text-gray-400">×{item.quantity}</td>
                              <td className="px-5 py-4">
                                <span className={`px-2 py-0.5 rounded text-[12px] font-normal uppercase border ${
                                  item.preparationStatus === "ready"
                                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/20"
                                    : item.preparationStatus === "preparing"
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                                }`}>
                                  {item.preparationStatus}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right font-semibold text-amber-600 dark:text-amber-500">
                                ${(item.price * item.quantity).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {order.notes && (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10 flex-1 max-w-md">
                        <MessageSquare size={18} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                           <p className="text-[10px] font-black uppercase text-amber-600/60 dark:text-amber-500/40 mb-1">Kitchen Instruction</p>
                           <p className="text-sm font-bold text-amber-900 dark:text-amber-200 italic">"{order.notes}"</p>
                        </div>
                      </div>
                    )}
                    
                    {!["served", "cancelled"].includes(order.status) && (
                      <div className="flex gap-3 shrink-0">
                        {order.status !== "served" && (
                          <button
                            onClick={() => updateStatus(order._id, "served")}
                            disabled={updating === order._id}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium text-[14px] px-5 py-3 rounded-xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50"
                          >
                            <CheckCircle size={16} /> Mark Served
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(order._id, "cancelled")}
                          disabled={updating === order._id}
                          className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20 font-medium text-[14px] px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transform active:scale-95 transition-all disabled:opacity-50"
                        >
                          <XCircle size={16} /> Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-24 bg-white/50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors">
              <ClipboardList size={64} className="mx-auto mb-4 text-gray-200 dark:text-gray-800" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Records Found</h3>
              <p className="text-gray-500">There are no orders matching your current criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;

