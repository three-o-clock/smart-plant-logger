import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
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
      { theme: "outline", size: "large" }
    );
  }, [login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="bg-slate-900 p-6 rounded-xl shadow-lg w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold mb-4">
          Smart Plant Watering – Login
        </h1>
        <div id="googleSignInDiv" className="flex justify-center"></div>
      </div>
    </div>
  );
};

export default Login;
