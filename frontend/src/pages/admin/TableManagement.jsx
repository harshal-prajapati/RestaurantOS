import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import Swal from "sweetalert2";
import { LayoutGrid, Plus, Edit, Trash, Users } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const TableManagementAdmin = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ tableNumber: "", capacity: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get("/tables");
      setTables(data.data);
    } catch (e) {
      console.error(e);
      Toast.fire({
        icon: 'error',
        title: 'Failed to fetch tables'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const openModal = (table = null) => {
    setSelected(table);
    setForm(
      table
        ? { tableNumber: table.tableNumber, capacity: table.capacity }
        : { tableNumber: "", capacity: "" },
    );
    setError("");
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        tableNumber: parseInt(form.tableNumber),
        capacity: parseInt(form.capacity),
      };
      if (selected) {
        await api.patch(`/tables/${selected._id}`, payload);
      } else {
        await api.post("/tables", payload);
      }
      await fetch();
      setModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Table",
      text: "Are you sure you want to delete this table? This action cannot be undone.",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/tables/${id}`);
      await fetch();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Delete failed",
        icon: "error",
      });
    }
  };

  const statusIcons = {
    available:
      "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-200 dark:border-green-500/20",
    occupied:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    reserved:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Table Management"
        subtitle={`${tables.length} tables total in the system`}
        icon={LayoutGrid}
        actions={
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
            <span className="font-bold">Add New Table</span>
          </button>
        }
      />

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: "Available",
            count: tables.filter((t) => t.status === "available").length,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-100 dark:bg-green-500/5",
            border: "border-green-800/50 dark:border-green-500/30",
          },
          {
            label: "Occupied",
            count: tables.filter((t) => t.status === "occupied").length,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-100 dark:bg-amber-500/5",
            border: "border-amber-800/50 dark:border-amber-500/30",
          },
          {
            label: "Reserved",
            count: tables.filter((t) => t.status === "reserved").length,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-100 dark:bg-blue-500/5",
            border: "border-blue-800/50 dark:border-blue-500/50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`card ${s.bg} ${s.border} border text-center py-6 transition-all hover:shadow-md`}
          >
            <p className={`text-[32px] font-bold ${s.color}`}>
              {s.count}
            </p>
            <p className="text-[12px] font-normal text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-widest">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map((table) => (
            <div
              key={table._id}
              className={`group card border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                table.status === "occupied"
                  ? "border-amber-200 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5"
                  : table.status === "reserved"
                    ? "border-blue-200 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5"
                    : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[20px] font-semibold text-gray-900 dark:text-white leading-tight">
                      Table {table.tableNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-gray-500 dark:text-gray-400">
                    <Users size={14} />
                    <span className="text-[12px] font-normal uppercase tracking-wider">
                      Seats: {table.capacity}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[12px] font-normal uppercase tracking-widest border transition-colors ${statusIcons[table.status]}`}
                >
                  {table.status}
                </span>
              </div>

              <div className="flex gap-2 transition-all duration-300">
                <button
                  onClick={() => openModal(table)}
                  className="flex-1 bg-blue-100 text-blue-600 dark:text-white hover:bg-blue-600 hover:text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition-all rounded-xl text-[12px] py-2 font-medium flex items-center justify-center gap-2"
                >
                  <Edit size={14} />
                  
                </button>
                <button
                  onClick={() => handleDelete(table._id)}
                  className="flex-1 bg-red-100 text-red-600 dark:text-white hover:bg-red-600 hover:text-white dark:bg-red-500 dark:hover:bg-red-600 transition-all rounded-xl text-[12px] py-2 font-medium flex items-center justify-center gap-2"
                >
                  <Trash size={14} />
                  
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-sm p-8 shadow-2xl transition-all animate-slide-in">
            <h3 className="text-[24px] font-semibold text-gray-900 dark:text-white mb-6">
              {selected ? "Edit Table Details" : "New Table Setup"}
            </h3>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label className="label text-gray-900 dark:text-gray-400 text-[12px] font-normal uppercase tracking-widest">
                  Table Number
                </label>
                <input
                  type="number"
                  min="1"
                  className="input-field mt-1 text-[16px] font-normal"
                  placeholder="Ex: 5"
                  value={form.tableNumber}
                  onChange={(e) =>
                    setForm({ ...form, tableNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label text-gray-900 dark:text-gray-400 text-[12px] font-normal uppercase tracking-widest">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="input-field mt-1 text-xl font-black"
                  placeholder="Ex: 4"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={() => setModal(false)}
                className="btn-secondary py-3 text-[14px] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary py-3 text-[14px] font-medium disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {saving ? "Creating..." : "Save Table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagementAdmin;
