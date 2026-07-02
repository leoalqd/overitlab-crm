import React, { useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.includes("@") ? email : `${email}@overitlab.com`,
      password,
    });
    if (error) setError("Usuario o contraseña incorrectos.");
    setLoading(false);
  }

  const inputCls =
    "w-full rounded-lg px-3 py-2.5 text-sm outline-none border transition-colors focus:border-[#C6FF3D]";
  const inputStyle = { background: "#0F0F11", borderColor: "#2A2A2E", color: "#F0F0EC" };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: "#0A0A0B" }}>
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1
            className="text-4xl leading-none"
            style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#F5F5F2", letterSpacing: "0.03em" }}
          >
            OVER IT <span style={{ color: "#C6FF3D" }}>LAB</span>
          </h1>
          <p className="text-xs mt-1.5 font-medium" style={{ color: "#8A8A93" }}>
            Ingresá con tu cuenta de administrador
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border p-6"
          style={{ background: "#141416", borderColor: "#26262A" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
            style={{ background: "rgba(198,255,61,0.12)" }}
          >
            <Lock size={18} style={{ color: "#C6FF3D" }} />
          </div>

          <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#8A8A93" }}>
            Usuario
          </label>
          <input
            className={inputCls}
            style={inputStyle}
            placeholder="leoalqd"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
          />

          <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 mt-3 block" style={{ color: "#8A8A93" }}>
            Contraseña
          </label>
          <input
            type="password"
            className={inputCls}
            style={inputStyle}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-xs mt-3" style={{ color: "#F5A623" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 rounded-xl py-3 font-bold text-sm uppercase tracking-wider transition-transform active:scale-[0.98] disabled:opacity-60"
            style={{ background: "#C6FF3D", color: "#0A0A0B" }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
