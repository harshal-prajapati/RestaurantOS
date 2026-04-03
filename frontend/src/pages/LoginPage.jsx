import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, LogIn, Lock, Mail, ChefHat } from "lucide-react";
import ThemeToggle from "../components/common/ThemeToggle";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      Toast.fire({
        icon: 'success',
        title: 'Logged in successfully'
      });
      const redirects = {
        admin: "/admin",
        waiter: "/waiter",
        kitchen: "/kitchen",
      };
      navigate(redirects[user.role] || "/");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
      Toast.fire({
        icon: 'error',
        title: msg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-500 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] animate-pulse"></div>
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Theme Toggle in Corner */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo/Brand Section */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-[2rem] text-amber-500 mb-6 inline-flex shadow-xl shadow-amber-500/10 border border-gray-100 dark:border-gray-800 transition-all hover:scale-110 duration-500 group">
            <ChefHat
              size={48}
              className="transition-transform group-hover:rotate-12"
            />
          </div>
          <h1 className="text-[32px] font-bold text-gray-900 dark:text-white tracking-tight">
            Restaurant<span className="text-amber-500">OS</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-[16px] font-normal">
            Empowering your culinary operations
          </p>
        </div>

        {/* Authentication Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white dark:border-gray-800 rounded-[2.5rem] p-10 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 transition-all duration-500">
          <h2 className="text-[12px] font-normal text-gray-900 dark:text-white mb-8 text-center uppercase tracking-widest">
            Secure Sign In
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold animate-shake flex items-center gap-3">
              <AlertTriangle size={18} /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="label text-[12px] font-normal uppercase mb-2 ml-1 block text-gray-500 transition-colors">
                Email Identity
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  className="input-field pl-12 bg-gray-50/50 dark:bg-gray-950/50 border-gray-100 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500 h-12 text-[16px] font-normal"
                  placeholder="you@restaurant.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="label text-[12px] font-normal uppercase mb-2 ml-1 block text-gray-500 transition-colors">
                Security Key
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  className="input-field pl-12 bg-gray-50/50 dark:bg-gray-950/50 border-gray-100 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-500 h-12 text-[16px] font-normal"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-2xl font-medium text-[14px] uppercase tracking-widest shadow-xl shadow-blue-500/20 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3 mt-8"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Logging In...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <LogIn
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
