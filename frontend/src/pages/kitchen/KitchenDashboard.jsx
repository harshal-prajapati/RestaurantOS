import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../../context/SocketContext";
import api from "../../services/api";
import { ChefHat, CheckCircle, Play } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const { socket } = useSocket();

  const fetchOrders = useCallback(async () => {
    try {
      const [pendingRes, preparingRes, partialRes] = await Promise.all([
        api.get("/orders?status=pending"),
        api.get("/orders?status=preparing"),
        api.get("/orders?status=partially_ready")
      ]);
      const all = [...pendingRes.data.data, ...preparingRes.data.data, ...partialRes.data.data];
      // Deduplicate
      const unique = all.filter(
        (o, i, self) => self.findIndex((x) => x._id === o._id) === i,
      );
      setOrders(
        unique.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      );
    } catch (e) {
      console.error(e);
      Toast.fire({
        icon: 'error',
        title: 'Failed to fetch orders'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    socket.on("orderPlaced", (order) => {
      setOrders((prev) => {
        const exists = prev.find((o) => o._id === order._id);
        if (exists) return prev;
        return [order, ...prev].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
      });
    });
    socket.on("orderStatusUpdated", fetchOrders);
    return () => {
      socket.off("orderPlaced");
      socket.off("orderStatusUpdated");
    };
  }, [socket, fetchOrders]);

  const updateItemStatus = async (orderId, itemIndex, newStatus) => {
    // Optimistic update
    const previousOrders = [...orders];
    setOrders((prev) => 
      prev.map((o) => {
        if(o._id === orderId) {
          const newItems = [...o.items];
          newItems[itemIndex] = { ...newItems[itemIndex], preparationStatus: newStatus };
          return { ...o, items: newItems };
        }
        return o;
      })
    );

    const key = `${orderId}-${itemIndex}`;
    setUpdating(key);
    try {
      await api.patch(`/orders/${orderId}/status`, {
        itemIndex,
        itemStatus: newStatus,
      });
      // Optionally fetchOrders(); omitted for speed
    } catch (e) {
      console.error(e);
      setOrders(previousOrders);
      Toast.fire({
        icon: 'error',
        title: 'Failed to update status'
      });
    } finally {
      setUpdating(null);
    }
  };

  const getElapsed = (createdAt) => {
    const mins = Math.floor((Date.now() - new Date(createdAt)) / 60000);
    if (mins < 1) return "Just now";
    if (mins === 1) return "1 min ago";
    return `${mins} mins ago`;
  };

  const getUrgency = (createdAt) => {
    const mins = Math.floor((Date.now() - new Date(createdAt)) / 60000);
    if (mins >= 15) return "border-red-500 bg-red-50 dark:bg-red-500/5 ring-2 ring-red-500/20";
    if (mins >= 8) return "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/5";
    return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50";
  };

  const itemStatusNext = { pending: "preparing", preparing: "ready" };
  const itemStatusLabel = {
    pending: (
      <div className="flex items-center gap-1 justify-center">
        <Play size={14} />
        <span>Start</span>
      </div>
    ),
    preparing: (
      <div className="flex items-center gap-1 justify-center">
        <CheckCircle size={14} />
        <span>Ready</span>
      </div>
    ),
  };
  const itemStatusColor = {
    pending: "bg-gray-200 dark:bg-gray-700 hover:bg-red-600 text-gray-700 dark:text-white hover:text-white",
    preparing: "bg-red-600 hover:bg-green-600 text-white",
    ready: "bg-green-600 text-white cursor-default",
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <div className="px-6 py-4">
        <PageHeader 
          title="Kitchen Display" 
          subtitle={`Live · ${orders.length} active orders`} 
          icon={ChefHat} 
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500">
            <CheckCircle
              size={64}
              className="text-green-500 mb-6 opacity-100"
            />
            <h3 className="font-display text-2xl text-gray-900 dark:text-white mb-2 font-bold">
              All caught up!
            </h3>
            <p>No pending orders in the kitchen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => {
              const allReady = order.items?.every(
                (i) => i.preparationStatus === "ready",
              );
              return (
                <div
                  key={order._id}
                  className={`rounded-3xl border-2 overflow-hidden transition-all shadow-sm ${getUrgency(order.createdAt)} ${allReady ? "border-blue-500 bg-blue-50 dark:bg-blue-500/5 shadow-blue-500/10" : ""}`}
                >
                  {/* Order header */}
                  <div
                    className={`px-5 py-4 ${allReady ? "bg-blue-500/10" : "bg-gray-50 dark:bg-gray-900/80"} border-b border-gray-100 dark:border-gray-800 transition-colors`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-3xl font-bold text-gray-900 dark:text-white transition-colors">
                            T{order.tableId?.tableNumber}
                          </span>
                          {allReady && (
                            <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                              READY
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                          Waiter: {order.waiterId?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {getElapsed(order.createdAt)}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-medium">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {order.notes && (
                      <div className="mt-3 p-2.5 bg-amber-50 dark:bg-yellow-500/10 text-amber-700 dark:text-yellow-300 border border-amber-200 dark:border-yellow-500/20 rounded-xl text-xs font-medium">
                        <span className="font-bold opacity-60 uppercase text-[9px] block mb-0.5">Note:</span>
                        {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="p-4 space-y-2 bg-white/50 dark:bg-gray-900/50 transition-colors">
                    {order.items?.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                          item.preparationStatus === "ready"
                            ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
                            : item.preparationStatus === "preparing"
                              ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
                              : "bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p
                            className={`text-xs mt-1 font-bold flex items-center gap-1.5 ${
                              item.preparationStatus === "ready"
                                ? "text-blue-600 dark:text-blue-400"
                                : item.preparationStatus === "preparing"
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-500 dark:text-gray-500"
                            }`}
                          >
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 rounded-md text-[10px]">× {item.quantity}</span>
                            <span className="uppercase tracking-tighter">{item.preparationStatus}</span>
                          </p>
                        </div>
                        {item.preparationStatus !== "ready" ? (
                          <button
                            onClick={() =>
                              updateItemStatus(
                                order._id,
                                i,
                                itemStatusNext[item.preparationStatus],
                              )
                            }
                            disabled={updating === `${order._id}-${i}`}
                            className={`text-[11px] px-4 py-2 rounded-xl font-bold transition-all active:scale-95 shadow-sm ${itemStatusColor[item.preparationStatus]} disabled:opacity-50`}
                          >
                            {updating === `${order._id}-${i}`
                              ? "..."
                              : itemStatusLabel[item.preparationStatus]}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-bold border border-blue-200 dark:border-blue-500/30">
                            <CheckCircle size={14} />
                            <span>Done</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDashboard;

