import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  CircleDollarSign,
  CheckCircle,
  BarChart3,
  XCircle,
  Trophy,
  PieChart,
  ChevronRight,
  Target
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [categorySales, setCategorySales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, catRes] = await Promise.all([
          api.get("/orders/analytics/summary"),
          api.get("/orders/analytics/category-sales"),
        ]);
        setStats(statsRes.data.data);
        setCategorySales(catRes.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  const maxSales = Math.max(...categorySales.map((c) => c.totalSales || 0), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Reports & Analytics" 
        subtitle="Comprehensive breakdown of business performance" 
        icon={BarChart3} 
      />

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Revenue",
            value: `$${stats?.totalRevenue?.toFixed(2) || "0.00"}`,
            icon: <CircleDollarSign size={24} />,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-50 dark:bg-green-500/10",
            border: "border-green-100 dark:border-green-500/20"
          },
          {
            label: "Orders Served",
            value: stats?.servedOrders || 0,
            icon: <CheckCircle size={24} />,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-500/10",
            border: "border-blue-100 dark:border-blue-500/20"
          },
          {
            label: "Avg Order Value",
            value: `$${stats?.avgRevenue?.toFixed(2) || "0.00"}`,
            icon: <Target size={24} />,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-500/10",
            border: "border-amber-100 dark:border-amber-500/20"
          },
          {
            label: "Cancelled",
            value: stats?.cancelledOrders || 0,
            icon: <XCircle size={24} />,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-500/10",
            border: "border-red-100 dark:border-red-500/20"
          },
        ].map((s) => (
          <div key={s.label} className="card p-6 flex flex-col items-center text-center transition-all hover:shadow-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-4 border ${s.border}`}>
              {s.icon}
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Sales */}
        <div className="card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <PieChart size={20} />
            </div>
            <h3 className="font-display font-black text-xl text-gray-900 dark:text-white">
              Revenue by Category
            </h3>
          </div>
          
          {categorySales.length > 0 ? (
            <div className="space-y-6">
              {categorySales.map((cat, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        {cat._id || "Unknown"}
                      </span>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.totalItems} items sold</p>
                    </div>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-500/20">
                      ${cat.totalSales?.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000 shadow-lg"
                      style={{ width: `${(cat.totalSales / maxSales) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
               <BarChart3 size={48} className="mx-auto mb-4 text-gray-100 dark:text-gray-800" />
               <p className="text-gray-500 font-bold italic">Awaiting sales data...</p>
            </div>
          )}
        </div>

        {/* Popular Items */}
        <div className="card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <Trophy size={20} />
            </div>
            <h3 className="font-display font-black text-xl text-gray-900 dark:text-white">
              Trending Top Sellers
            </h3>
          </div>
          
          {stats?.topItems?.length > 0 ? (
            <div className="space-y-3">
              {stats.topItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-all group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${
                      i === 0
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500 dark:text-black"
                        : i === 1
                          ? "bg-gray-100 text-gray-700 dark:bg-gray-400 dark:text-black"
                          : i === 2
                            ? "bg-amber-50 text-amber-900 dark:bg-amber-900 dark:text-white"
                            : "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-gray-900 dark:text-white transition-colors uppercase tracking-tight">{item._id}</p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                      Revenue Contribution: <span className="text-green-600 dark:text-green-400">${item.revenue?.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-gray-900 dark:text-white">
                      {item.totalOrdered}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sold</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-200 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-12">
                <Trophy size={48} className="mx-auto mb-4 text-gray-100 dark:text-gray-800" />
                <p className="text-gray-500 font-bold italic">No rankings yet...</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

