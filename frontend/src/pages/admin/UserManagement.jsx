import { useState, useEffect } from "react";
import api from "../../services/api";
import Swal from "sweetalert2";
import { Edit, Trash, Users, Plus } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";

const ROLES = ["admin", "waiter", "kitchen"];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "waiter",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/users");
      setUsers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setForm({ name: "", email: "", password: "", role: "waiter" });
    setSelected(null);
    setError("");
    setModal("create");
  };

  const openEdit = (user) => {
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setSelected(user);
    setError("");
    setModal("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (modal === "create") {
        await api.post("/users", form);
      } else {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        await api.put(`/users/${selected._id}`, updateData);
      }
      await fetchUsers();
      setModal(null);
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete User",
      text: "Are you sure you want to delete this user? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete user",
    });
    if (!result.isConfirmed) return;
    const previousUsers = [...users];
    setUsers((prev) => prev.filter((u) => u._id !== id));
    try {
      await api.delete(`/users/${id}`);
      // fetchUsers() omitted for optimistic speed
    } catch (err) {
      setUsers(previousUsers);
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Delete failed",
        icon: "error",
      });
    }
  };

  const roleBadge = (role) => {
    const map = {
      admin: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30",
      waiter: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30",
      kitchen: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/30",
    };
    return `px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${map[role] || ""}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} staff members total`}
        icon={Users}
        actions={
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
            <span className="font-bold">Add Staff member</span>
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 transition-colors">
                  {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-6 py-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 transition-colors">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-base border border-amber-200 dark:border-amber-500/20">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={roleBadge(user.role)}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${user.isActive ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 opacity-100 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-lg bg-gray-200 dark:bg-blue-800 text-gray-600 dark:text-gray-300 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-2 rounded-lg bg-red-500 dark:bg-red-500 text-white dark:text-white hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Delete User"
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
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md p-8 shadow-2xl transition-all animate-slide-in">
            <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {modal === "create" ? "Add New Staff" : "Edit Staff Info"}
            </h3>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}
            <div className="space-y-5">
              {[
                {
                  key: "name",
                  label: "Full Name",
                  type: "text",
                  placeholder: "John Doe",
                },
                {
                  key: "email",
                  label: "Email Address",
                  type: "email",
                  placeholder: "john@restaurant.com",
                },
                {
                  key: "password",
                  label:
                    modal === "create"
                      ? "Password"
                      : "New Password (leave blank to keep)",
                  type: "password",
                  placeholder: "••••••••",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="label text-gray-900 dark:text-gray-400 font-bold">{f.label}</label>
                  <input
                    type={f.type}
                    className="input-field mt-1"
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                    required={f.key !== "password" || modal === "create"}
                  />
                </div>
              ))}
              <div>
                <label className="label text-gray-900 dark:text-gray-400 font-bold">Role Assignment</label>
                <select
                  className="input-field mt-1 font-medium"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-white dark:bg-gray-800">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setModal(null)}
                className="flex-1 btn-secondary py-3 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-primary py-3 font-bold disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

