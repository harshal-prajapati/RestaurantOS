import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import Swal from "sweetalert2";
import { Edit, Trash, Utensils, Search, Plus, Filter } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";

const defaultForm = {
  name: "",
  categoryId: "",
  price: "",
  availability: true,
  description: "",
  image: "",
};

const MenuItems = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterCat, setFilterCat] = useState(searchParams.get("category") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // Sync state with URL
  useEffect(() => {
    const params = {};
    if (filterCat) params.category = filterCat;
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params, { replace: true });
  }, [filterCat, searchQuery, setSearchParams]);

  const fetchAll = useCallback(async () => {
    try {
      const [itemsRes, catRes] = await Promise.all([
        api.get("/menu" + (filterCat ? `?category=${filterCat}` : "")),
        api.get("/categories"),
      ]);
      setItems(itemsRes.data.data);
      setCategories(catRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterCat]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openModal = (item = null) => {
    setSelected(item);
    setForm(
      item
        ? {
            name: item.name,
            categoryId: item.categoryId?._id || item.categoryId,
            price: item.price,
            availability: item.availability,
            description: item.description || "",
            image: item.image || "",
          }
        : defaultForm,
    );
    setError("");
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (selected) {
        await api.put(`/menu/${selected._id}`, payload);
      } else {
        await api.post("/menu", payload);
      }
      await fetchAll();
      setModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Item",
      text: "Are you sure you want to delete this item? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/menu/${id}`);
      await fetchAll();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Delete failed",
        icon: "error",
      });
    }
  };

  const toggleAvail = async (item) => {
    // Optimistic update
    setItems((prev) => 
      prev.map((i) => 
        i._id === item._id ? { ...i, availability: !i.availability } : i
      )
    );

    try {
      await api.put(`/menu/${item._id}`, {
        ...item,
        categoryId: item.categoryId?._id,
        availability: !item.availability,
      });
      // Optionally fetchAll() silently, but we assume success
    } catch (e) {
      console.error(e);
      // Revert if error
      setItems((prev) => 
        prev.map((i) => 
          i._id === item._id ? { ...i, availability: item.availability } : i
        )
      );
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        icon: 'error',
        title: 'Failed to update availability'
      });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryId?.categoryName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Menu Items"
        subtitle={`${items.length} items available in total`}
        icon={Utensils}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search items..."
                className="input-field pl-10 w-full sm:w-48 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                className="input-field pl-10 pr-8 h-10 appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl transition-all font-normal text-[14px]"
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => openModal()}
              className="btn-primary h-10 flex items-center gap-2 shadow-lg shadow-blue-500/20 text-[14px] font-medium"
            >
              <Plus size={20} />
              <span>Add Item</span>
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 transition-colors">
                  {[
                    "Item Details",
                    "Category",
                    "Price ($)",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-[12px] font-normal text-gray-500 dark:text-gray-400 uppercase px-6 py-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 transition-colors">
                {filteredItems.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="text-[14px] font-semibold text-gray-900 dark:text-white transition-colors">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-[12px] font-normal text-gray-500 dark:text-gray-500 mt-1 line-clamp-1 max-w-xs">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-normal bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                        {item.categoryId?.categoryName || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] font-semibold text-amber-600 dark:text-amber-500 transition-colors">
                      ${item.price?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAvail(item)}
                        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${item.availability ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`}
                        title={item.availability ? "Available" : "Unavailable"}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm transform ${item.availability ? "translate-x-5" : "translate-x-0"}`}
                        ></span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 opacity-100 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openModal(item)}
                          className="p-2 rounded-lg bg-gray-200 dark:bg-blue-500 text-gray-600 dark:text-white hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Edit Item"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-lg bg-red-500 dark:bg-red-500 text-white dark:text-white hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Delete Item"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-gray-900 transition-colors">
              <Utensils
                size={48}
                className="mx-auto mb-4 text-gray-400 dark:text-gray-200"
              />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No menu items found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md p-8 shadow-2xl transition-all animate-slide-in">
            <h3 className="text-[24px] font-semibold text-gray-900 dark:text-white mb-6">
              {selected ? "Modify Item" : "Create New Item"}
            </h3>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label className="label text-gray-900 dark:text-gray-400 text-[12px] font-normal">
                  Menu Item Name
                </label>
                <input
                  type="text"
                  className="input-field mt-1"
                  placeholder="Grilled Chicken Pasta"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label text-gray-900 dark:text-gray-400 text-[12px] font-normal">
                  Category Assignment
                </label>
                <div className="relative">
                  <select
                    className="input-field mt-1 appearance-none pr-10 font-normal text-[14px]"
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: e.target.value })
                    }
                  >
                    <option value="" className="bg-white dark:bg-gray-800">
                      Select category
                    </option>
                    {categories.map((c) => (
                      <option
                        key={c._id}
                        value={c._id}
                        className="bg-white dark:bg-gray-800"
                      >
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                  <Filter
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
              <div>
                <label className="label text-gray-900 dark:text-gray-400 text-[12px] font-normal">
                  Unit Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field mt-1 font-semibold dark:text-gray-200 text-[14px]"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <label className="label text-gray-900 dark:text-gray-400 text-[12px] font-normal">
                  Image URL
                </label>
                <input
                  type="url"
                  className="input-field mt-1 text-[14px]"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
              </div>
              <div>
                <label className="label text-gray-900 dark:text-gray-400 text-[12px] font-normal">
                  Item Description
                </label>
                <textarea
                  className="input-field mt-1 resize-none font-normal text-[14px] h-24"
                  placeholder="What's special about this dish? (ingredients, spice level...)"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl cursor-pointer hover:bg-green-50 dark:hover:bg-green-500/5 transition-colors group">
                <input
                  type="checkbox"
                  checked={form.availability}
                  onChange={(e) =>
                    setForm({ ...form, availability: e.target.checked })
                  }
                  className="w-5 h-5 accent-green-500 rounded-lg cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    Available for ordering
                  </span>
                  <span className="text-[12px] font-normal text-gray-500">
                    Toggle visibility on the waiter dashboard
                  </span>
                </div>
              </label>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setModal(false)}
                className="flex-1 btn-secondary py-3 text-[14px] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-primary py-3 text-[14px] font-medium disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {saving ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItems;
