import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import Swal from "sweetalert2";
import {
  Tags,
  Utensils,
  Plus,
  Edit,
  Trash,
  Delete,
  DeleteIcon,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const MenuCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data.data);
    } catch (e) {
      console.error(e);
      Toast.fire({
        icon: 'error',
        title: 'Failed to fetch categories'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const openModal = (cat = null) => {
    setSelected(cat);
    setName(cat ? cat.categoryName : "");
    setError("");
    setModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (selected) {
        await api.put(`/categories/${selected._id}`, { categoryName: name });
      } else {
        await api.post("/categories", { categoryName: name });
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
      title: "Delete Category",
      text: "Are you sure you want to delete this category? This action cannot be undone.",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/categories/${id}`);
      await fetch();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Delete failed",
        icon: "error",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Menu Categories"
        subtitle={`Organizing your menu into ${categories.length} segments`}
        icon={Tags}
        actions={
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
            <span className="font-bold">New Category</span>
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="group card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-gray-200 flex items-center justify-center text-blue-600 dark:text-gray-500 mb-4 transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-500">
                <Utensils size={24} />
              </div>
              <h3 className="text-[20px] font-semibold text-gray-900 dark:text-white transition-colors">
                {cat.categoryName}
              </h3>
              <p className="text-[12px] font-normal text-gray-400 dark:text-gray-500 mt-2 uppercase">
                Added {new Date(cat.createdAt).toLocaleDateString()}
              </p>

              <div className="flex gap-2 mt-6 transition-all duration-300">
                <button
                  onClick={() => openModal(cat)}
                  className="flex-1 btn-secondary text-[12px] py-2 font-medium flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all shadow-sm"
                >
                  <Edit size={14} />
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all flex items-center justify-center shadow-sm"
                  title="Delete Category"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full text-center py-24 bg-white/50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors">
              <Tags
                size={64}
                className="mx-auto mb-4 text-gray-200 dark:text-gray-800"
              />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Categories Created
              </h3>
              <p className="text-gray-500">
                Start organizing your menu by adding a new category
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-sm p-8 shadow-2xl transition-all animate-slide-in">
            <h3 className="text-[24px] font-semibold text-gray-900 dark:text-white mb-6">
              {selected ? "Edit Category Name" : "Create New Category"}
            </h3>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}
            <div>
              <label className="label text-gray-900 dark:text-gray-400 text-[12px] font-normal uppercase">
                Category Title
              </label>
              <input
                type="text"
                className="input-field mt-1 text-[16px] font-normal"
                placeholder="Ex: Main Course"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <p className="text-[12px] text-gray-400 mt-2">
                Pick a clear name that waiters will recognize instantly.
              </p>
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
                {saving ? "Saving..." : selected ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCategories;
