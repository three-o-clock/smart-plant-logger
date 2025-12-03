import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    /* global google */
    if (!window.google || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const res = await api.post("/auth/google", {
            credential: response.credential,
          });
          login(res.data.user, res.data.token);
          navigate("/");
        } catch (err) {
          console.error(err);
          alert("Login failed");
        }
      },
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleSignInDiv"),
      { theme: "outline", size: "large", width: 260 }
    );
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center px-4">

      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-emerald-100 blur-3xl opacity-70" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-sky-100 blur-3xl opacity-70" />
      </div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl overflow-hidden">

          {/* LEFT SIDE */}
          <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-emerald-500 via-emerald-600 to-sky-500 text-white p-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-white/10 border border-white/20 mb-4">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Smart Plant Watering System
              </div>

              <h1 className="text-2xl font-semibold mb-3">Smart Plant Logger</h1>
              <p className="text-sm text-emerald-50/90 leading-relaxed">
                Monitor soil moisture, light, temperature and humidity in real time.
                Every watering event is logged so you always know how your plant is doing.
              </p>
            </div>

            <div className="space-y-2 text-xs text-emerald-50/90">
              <div className="flex items-center gap-2">
                🌱 <span>Automatic watering events with detailed logs.</span>
              </div>
              <div className="flex items-center gap-2">
                📊 <span>ThingSpeak graphs for all sensor data.</span>
              </div>
              <div className="flex items-center gap-2">
                🔔 <span>Plant health indicators and low moisture alerts.</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="p-8 flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Sign in to continue
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Use your Google account to access your plant dashboard.
            </p>

            {/* GOOGLE BUTTON RENDER TARGET */}
            <div className="flex justify-center mb-5">
              <div id="googleSignInDiv"></div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Secure login powered by Google Authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
