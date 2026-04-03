import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import api from "../../services/api";
import {
  Utensils,
  ArrowLeft,
  ChefHat,
  CheckCircle,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import ThemeToggle from "../../components/common/ThemeToggle";
import UserDropdown from "../../components/common/UserDropdown";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const WaiterDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [view, setView] = useState(searchParams.get("view") || "tables"); // 'tables' | 'order'
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [placing, setPlacing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const { socket } = useSocket();

  const fetchTables = useCallback(async () => {
    try {
      const { data } = await api.get("/tables");
      setTables(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        api.get("/menu?available=true"),
        api.get("/categories"),
      ]);
      setMenuItems(menuRes.data.data);
      setCategories(catRes.data.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    fetchMenu();
  }, [fetchTables, fetchMenu]);

  const openTable = useCallback(async (table, isRestoration = false) => {
    // Load persisted cart/notes for this specific table
    const savedCart = localStorage.getItem(`cart_${table._id}`);
    const savedNotes = localStorage.getItem(`notes_${table._id}`);
    
  
    setCart(savedCart ? JSON.parse(savedCart) : []);
    setNotes(savedNotes || "");
    setSelectedTable(table);
    
   
    if (!isRestoration) {
      setActiveCategory("all");
    }

    // If occupied, fetch current order
    if (table.currentOrderId) {
      try {
        const { data } = await api.get(`/orders?tableId=${table._id}`);
        const activeOrder = data.data.find(
          (o) => !["served", "cancelled"].includes(o.status),
        );
        setCurrentOrder(activeOrder || null);
      } catch (e) {
        setCurrentOrder(null);
      }
    } else {
      setCurrentOrder(null);
    }
    setView("order");
  }, []);

  // Sync state with URL params
  useEffect(() => {
    const params = {};
    if (view !== "tables") params.view = view;
    if (activeCategory !== "all") params.category = activeCategory;
    if (selectedTable) params.tableId = selectedTable._id;
    setSearchParams(params, { replace: true });
  }, [view, activeCategory, selectedTable, setSearchParams]);

 
  useEffect(() => {
    const tableId = searchParams.get("tableId");
    if (tableId && tables.length > 0 && !selectedTable) {
      const table = tables.find(t => t._id === tableId);
      if (table) openTable(table, true);
    }
  }, [tables, searchParams, selectedTable, openTable]);

 
  useEffect(() => {
    if (selectedTable) {
      if (cart.length > 0) {
        localStorage.setItem(`cart_${selectedTable._id}`, JSON.stringify(cart));
      } else {
        localStorage.removeItem(`cart_${selectedTable._id}`);
      }
    }
  }, [cart, selectedTable]);
 
  useEffect(() => {
    if (selectedTable) {
      if (notes) {
        localStorage.setItem(`notes_${selectedTable._id}`, notes);
      } else {
        localStorage.removeItem(`notes_${selectedTable._id}`);
      }
    }
  }, [notes, selectedTable]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    socket.on("tableUpdated", () => fetchTables());
    socket.on("orderReady", (order) => {
      Toast.fire({
        icon: 'success',
        title: `Order for Table ${order.tableId?.tableNumber} is READY!`
      });
      fetchTables();
    });
    socket.on("orderStatusUpdated", () => fetchTables());
    return () => {
      socket.off("tableUpdated");
      socket.off("orderReady");
      socket.off("orderStatusUpdated");
    };
  }, [socket, fetchTables]);



  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.itemId === item._id);
      if (exists)
        return prev.map((i) =>
          i.itemId === item._id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [
        ...prev,
        { itemId: item._id, name: item.name, price: item.price, quantity: 1 },
      ];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.itemId === itemId);
      if (exists?.quantity === 1)
        return prev.filter((i) => i.itemId !== itemId);
      return prev.map((i) =>
        i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i,
      );
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      await api.post("/orders", {
        tableId: selectedTable._id,
        items: cart.map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
        notes,
      });
      await fetchTables();
      
      // Clear persistence after successful order
      localStorage.removeItem(`cart_${selectedTable._id}`);
      localStorage.removeItem(`notes_${selectedTable._id}`);
      
      setView("tables");
      Toast.fire({
        icon: 'success',
        title: `Order placed for Table ${selectedTable.tableNumber}`
      });
    } catch (err) {
      console.error(err);
      Toast.fire({
        icon: 'error',
        title: 'Failed to place order'
      });
    } finally {
      setPlacing(false);
    }
  };

  const markServed = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: "served" });
      await fetchTables();
      setView("tables");
    } catch (e) {
      console.error(e);
    }
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const filteredMenu =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((i) => i.categoryId?._id === activeCategory);

  const statusColor = {
    available: "bg-green-50 border-green-300 hover:border-green-400 dark:bg-green-900/10 dark:border-green-500/30 dark:hover:border-green-400",
    occupied: "bg-yellow-50 border-yellow-300 hover:border-yellow-400 dark:bg-yellow-900/10 dark:border-yellow-500/30 dark:hover:border-yellow-400",
    reserved: "bg-red-50 border-red-200 hover:border-red-400 dark:bg-red-900/10 dark:border-red-500/30 dark:hover:border-red-400",
  };

  if (view === "order") {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col transition-colors">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <button
            onClick={() => setView("tables")}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} /> Tables
          </button>
          <h1 className="font-display font-bold text-gray-900 dark:text-white">
            Table {selectedTable?.tableNumber} · {selectedTable?.capacity} seats
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserDropdown />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Menu side */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category tabs */}
            <div className="flex gap-2 p-4 overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  activeCategory === "all"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat._id
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat.categoryName}
                </button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Current order if exists */}
              {currentOrder && (
                <div
                  className={`mb-6 p-4 rounded-2xl border-2 ${
                    currentOrder.status === "ready"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/5"
                      : currentOrder.status === "preparing"
                        ? "border-red-500/30 bg-red-50 dark:bg-red-500/5"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">Current Order</h3>
                    <span
                      className={currentOrder.status === "ready" ? "badge-ready" : currentOrder.status === "preparing" ? "badge-preparing" : "badge-pending"}
                    >
                      {currentOrder.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {currentOrder.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {item.name} × {item.quantity}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            item.preparationStatus === "ready"
                              ? "bg-blue-100 text-blue-600"
                              : item.preparationStatus === "preparing"
                                ? "bg-red-100 text-red-600"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {item.preparationStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                  {currentOrder.status === "ready" && (
                    <button
                      onClick={() => markServed(currentOrder._id)}
                      className="w-full mt-4 btn-success flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> Mark as Served
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMenu.map((item) => {
                  const inCart = cart.find((i) => i.itemId === item._id);
                  return (
                    <div
                      key={item._id}
                      className={`card cursor-pointer group transition-all duration-300 hover:shadow-md hover:-translate-y-1 p-4 ${inCart ? "border-amber-500 ring-1 ring-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5" : "border-gray-200 dark:border-gray-800"}`}
                      onClick={() => addToCart(item)}
                    >
                      {item.image && (
                        <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            loading="lazy" 
                            width="200"
                            height="128"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                        </div>
                      )}
                      <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {item.categoryId?.categoryName}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-amber-600 dark:text-amber-500 font-bold text-base">
                          ${item.price?.toFixed(2)}
                        </span>
                        {inCart && (
                          <span className="bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart side */}
          <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-display font-bold text-gray-900 dark:text-white">
                Order Cart
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Utensils size={40} className="mb-3 opacity-20" />
                  <p className="text-sm">Empty cart</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                        {item.name}
                      </p>
                      <p className="text-xs text-amber-600 font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.itemId)}
                        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="text-gray-900 dark:text-white font-bold text-sm w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          addToCart({
                            _id: item.itemId,
                            name: item.name,
                            price: item.price,
                          })
                        }
                        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                <textarea
                  className="input-field text-sm resize-none"
                  rows={2}
                  placeholder="Notes (allergies, preferences...)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex justify-between items-center px-1">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Total Amount</span>
                  <span className="text-amber-600 dark:text-amber-500 font-bold text-xl">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  <ChefHat size={20} />
                  {placing ? "Sending..." : "Send to Kitchen"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <div className="px-6 py-4">
        <PageHeader
          title="Waiter Dashboard"
          subtitle="Manage tables & orders"
          icon={Utensils}
          actions={
            <div className="flex items-center gap-4 text-sm font-bold">
              <span className="flex items-center gap-1.5 text-green-600 bg-green-100 dark:bg-green-500/10 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {tables.filter((t) => t.status === "available").length} Available
              </span>
              <span className="flex items-center gap-1.5 text-yellow-600 bg-yellow-100 dark:bg-yellow-500/10 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                {tables.filter((t) => t.status === "occupied").length} Occupied
              </span>
            </div>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {tables.map((table) => (
              <button
                key={table._id}
                onClick={() => openTable(table)}
                className={`relative p-6 rounded-3xl border-2 text-left transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-sm group ${statusColor[table.status]}`}
              >
              
                {table.currentOrderId?.status === "ready" && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 border-4 border-white dark:border-gray-950 rounded-full flex items-center justify-center text-white text-[10px] font-bold animate-bounce shadow-lg">
                    !
                  </span>
                )}
                <p className="font-display text-4xl font-bold text-gray-900 dark:text-white mb-2 group-hover:scale-110 transition-transform origin-left">
                  T{table.tableNumber}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{table.capacity} seats</p>
                <div className="mt-4">
                  <span
                    className={`text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-lg font-bold ${
                      table.status === "available"
                        ? "bg-green-500 text-white"
                        : table.status === "occupied"
                          ? "bg-yellow-500 text-white"
                          : "bg-red-500 text-white"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterDashboard;

