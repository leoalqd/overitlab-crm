import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  X,
  MessageCircle,
  MapPin,
  Calendar,
  Package,
  Wrench,
  CheckCircle2,
  Truck,
  DollarSign,
  ChevronRight,
  ArrowLeftRight,
  Camera,
  LogOut,
} from "lucide-react";
import { supabase, supabaseConfigured } from "./supabaseClient";
import Login from "./Login";

// ---------------------------------------------------------------------------
// OVER IT LAB — Panel de control de la Clínica de Zapas
// Conectado a Supabase (tabla "servicios")
// ---------------------------------------------------------------------------

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
`;

const STATUS = {
  "En local": {
    dot: "#9A9AA3",
    text: "#C7C7CE",
    bg: "rgba(154,154,163,0.12)",
    border: "rgba(154,154,163,0.28)",
    icon: Package,
  },
  "En taller": {
    dot: "#F5A623",
    text: "#F5C168",
    bg: "rgba(245,166,35,0.12)",
    border: "rgba(245,166,35,0.30)",
    icon: Wrench,
  },
  "Listo para entregar": {
    dot: "#C6FF3D",
    text: "#D6FF7A",
    bg: "rgba(198,255,61,0.12)",
    border: "rgba(198,255,61,0.30)",
    icon: CheckCircle2,
  },
  Entregado: {
    dot: "#4EA1F5",
    text: "#8CC4F8",
    bg: "rgba(78,161,245,0.12)",
    border: "rgba(78,161,245,0.30)",
    icon: Truck,
  },
};

const STATUS_ORDER = ["En local", "En taller", "Listo para entregar", "Entregado"];

// -----------------------------------------------------------------
// Traducción entre las columnas de la base (snake_case) y la app (camelCase)
// -----------------------------------------------------------------
function dbToApp(row) {
  return {
    id: row.id,
    serviceNumber: row.numero_servicio,
    clientName: row.nombre_cliente,
    phone: row.celular,
    address: row.direccion || "",
    mapsUrl: row.maps_url || "",
    depositDate: row.fecha_deposito || "",
    deliveryDate: row.fecha_entrega || "",
    status: row.estado,
    totalPrice: Number(row.precio_total) || 0,
    deposit: Number(row.sena) || 0,
    shoeDetails: row.detalles_calzado || "",
    photoBefore: row.foto_antes || "",
    photoAfter: row.foto_despues || "",
  };
}

function appToDb(order) {
  return {
    numero_servicio: order.serviceNumber,
    nombre_cliente: order.clientName,
    celular: order.phone,
    direccion: order.address,
    maps_url: order.mapsUrl,
    fecha_deposito: order.depositDate || null,
    fecha_entrega: order.deliveryDate || null,
    estado: order.status,
    precio_total: order.totalPrice,
    sena: order.deposit,
    detalles_calzado: order.shoeDetails,
    foto_antes: order.photoBefore,
    foto_despues: order.photoAfter,
  };
}

function formatMoney(n) {
  return "$" + Number(n || 0).toLocaleString("es-AR");
}

function waLink(phone, clientName, serviceNumber) {
  const digits = String(phone).replace(/\D/g, "");
  const local = digits.startsWith("54") ? digits.slice(2) : digits;
  const full = "549" + local;
  const msg = encodeURIComponent(
    `Hola ${clientName}! Te escribimos de OVER IT LAB por tu servicio ${serviceNumber} 👟`
  );
  return `https://wa.me/${full}?text=${msg}`;
}

function mapsLink(order) {
  if (order.mapsUrl) return order.mapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    order.address
  )}`;
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function nextServiceNumber(orders) {
  const max = orders.reduce((m, o) => {
    const n = parseInt(o.serviceNumber.replace("#", ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return "#" + String(max + 1).padStart(3, "0");
}

// ---------------------------------------------------------------------------
// UI PRIMITIVES
// ---------------------------------------------------------------------------

function StatusBadge({ status, size = "sm" }) {
  const s = STATUS[status] || STATUS["En local"];
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
      }`}
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      <Icon size={size === "sm" ? 12 : 13} strokeWidth={2.5} />
      {status}
    </span>
  );
}

function MetricCard({ label, value, icon: Icon, accent }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 flex flex-col justify-between min-h-[110px]"
      style={{ background: "#141416", borderColor: "#26262A" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: "#8A8A93" }}>
          {label}
        </span>
        <Icon size={16} style={{ color: accent }} strokeWidth={2.5} />
      </div>
      <div
        className="text-3xl font-bold mt-2"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: "#F5F5F2" }}
      >
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NEW SERVICE MODAL
// ---------------------------------------------------------------------------

function NewServiceModal({ onClose, onSave, suggestedNumber }) {
  const [form, setForm] = useState({
    serviceNumber: suggestedNumber,
    clientName: "",
    phone: "",
    address: "",
    mapsUrl: "",
    depositDate: new Date().toISOString().slice(0, 10),
    deliveryDate: "",
    status: "En local",
    totalPrice: "",
    deposit: "",
    shoeDetails: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const saldo = Math.max(0, (Number(form.totalPrice) || 0) - (Number(form.deposit) || 0));

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.clientName || !form.phone || submitting) return;
    setSubmitting(true);
    await onSave({
      ...form,
      totalPrice: Number(form.totalPrice) || 0,
      deposit: Number(form.deposit) || 0,
      photoBefore: "",
      photoAfter: "",
    });
    setSubmitting(false);
  }

  const inputCls =
    "w-full rounded-lg px-3 py-2.5 text-sm outline-none border transition-colors focus:border-[#C6FF3D]";
  const inputStyle = { background: "#0F0F11", borderColor: "#2A2A2E", color: "#F0F0EC" };
  const labelCls = "text-[11px] font-semibold uppercase tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border p-6"
        style={{ background: "#141416", borderColor: "#26262A" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-2xl"
            style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#F5F5F2", letterSpacing: "0.02em" }}
          >
            Nuevo servicio
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "#9A9AA3" }}>
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={{ color: "#8A8A93" }}>N° de servicio</label>
            <input
              className={inputCls}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              value={form.serviceNumber}
              onChange={(e) => set("serviceNumber", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#8A8A93" }}>Estado</label>
            <select className={inputCls} style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className={labelCls} style={{ color: "#8A8A93" }}>Nombre del cliente</label>
          <input
            required
            className={inputCls}
            style={inputStyle}
            placeholder="Ej: Juan Pérez"
            value={form.clientName}
            onChange={(e) => set("clientName", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className={labelCls} style={{ color: "#8A8A93" }}>Celular</label>
            <input required className={inputCls} style={inputStyle} placeholder="388 4XXXXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#8A8A93" }}>Fecha depósito</label>
            <input type="date" className={inputCls} style={inputStyle} value={form.depositDate} onChange={(e) => set("depositDate", e.target.value)} />
          </div>
        </div>

        <div className="mt-3">
          <label className={labelCls} style={{ color: "#8A8A93" }}>Dirección</label>
          <input className={inputCls} style={inputStyle} placeholder="Calle, número, ciudad" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>

        <div className="mt-3">
          <label className={labelCls} style={{ color: "#8A8A93" }}>Fecha estimada de entrega</label>
          <input type="date" className={inputCls} style={inputStyle} value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <label className={labelCls} style={{ color: "#8A8A93" }}>Precio total</label>
            <input type="number" className={inputCls} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} placeholder="0" value={form.totalPrice} onChange={(e) => set("totalPrice", e.target.value)} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#8A8A93" }}>Seña</label>
            <input type="number" className={inputCls} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} placeholder="0" value={form.deposit} onChange={(e) => set("deposit", e.target.value)} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#8A8A93" }}>Saldo</label>
            <div className={inputCls + " flex items-center"} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", color: "#C6FF3D", borderColor: "#2A2A2E" }}>
              {formatMoney(saldo)}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className={labelCls} style={{ color: "#8A8A93" }}>Detalles del calzado</label>
          <textarea rows={3} className={inputCls + " resize-none"} style={inputStyle} placeholder="Marca, modelo, tipo de lavado, observaciones..." value={form.shoeDetails} onChange={(e) => set("shoeDetails", e.target.value)} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-6 rounded-xl py-3 font-bold text-sm uppercase tracking-wider transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{ background: "#C6FF3D", color: "#0A0A0B" }}
        >
          {submitting ? "Guardando..." : "Registrar servicio"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ORDER DETAIL DRAWER
// ---------------------------------------------------------------------------

function OrderDrawer({ order, onClose, onUpdateStatus, onPhotoUploaded }) {
  const [uploadingSlot, setUploadingSlot] = useState(null); // "before" | "after" | null

  if (!order) return null;
  const saldo = order.totalPrice - order.deposit;
  const s = STATUS[order.status];

  async function handleCapture(slot, file) {
    setUploadingSlot(slot);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${order.serviceNumber.replace("#", "")}-${slot}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("fotos").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("fotos").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const column = slot === "before" ? "foto_antes" : "foto_despues";
      const { error: updateError } = await supabase.from("servicios").update({ [column]: publicUrl }).eq("id", order.id);
      if (updateError) throw updateError;
      onPhotoUploaded(order.id, slot, publicUrl);
    } catch (err) {
      console.error(err);
      alert("No se pudo subir la foto. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setUploadingSlot(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-md h-full overflow-y-auto border-l p-6" style={{ background: "#141416", borderColor: "#26262A" }}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-[13px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#C6FF3D" }}>
              {order.serviceNumber}
            </div>
            <h2 className="text-3xl leading-none mt-1" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#F5F5F2", letterSpacing: "0.02em" }}>
              {order.clientName}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "#9A9AA3" }}>
            <X size={20} />
          </button>
        </div>

        <div className="mt-4">
          <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#8A8A93" }}>Estado del servicio</label>
          <select
            value={order.status}
            onChange={(e) => onUpdateStatus(order.id, e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border font-semibold"
            style={{ background: s.bg, borderColor: s.border, color: s.text }}
          >
            {STATUS_ORDER.map((st) => (
              <option key={st} value={st} style={{ background: "#141416", color: "#F0F0EC" }}>{st}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <a href={waLink(order.phone, order.clientName, order.serviceNumber)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold" style={{ background: "#25D366", color: "#0A0A0B" }}>
            <MessageCircle size={16} strokeWidth={2.5} />
            WhatsApp
          </a>
          <a href={mapsLink(order)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border" style={{ borderColor: "#2A2A2E", color: "#F0F0EC" }}>
            <MapPin size={16} strokeWidth={2.5} />
            Ver mapa
          </a>
        </div>

        <div className="mt-6 space-y-3">
          <Row label="Celular" value={order.phone} />
          <Row label="Dirección" value={order.address || "—"} />
          <Row label="Fecha de depósito" value={formatDate(order.depositDate)} icon={Calendar} />
          <Row label="Fecha de entrega" value={formatDate(order.deliveryDate)} icon={Calendar} />
        </div>

        <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "#26262A", background: "#0F0F11" }}>
          <div className="flex justify-between items-center text-sm">
            <span style={{ color: "#9A9AA3" }}>Precio total</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#F0F0EC" }}>{formatMoney(order.totalPrice)}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span style={{ color: "#9A9AA3" }}>Seña</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#F0F0EC" }}>{formatMoney(order.deposit)}</span>
          </div>
          <div className="h-px my-3" style={{ background: "#26262A" }} />
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold" style={{ color: "#F5F5F2" }}>Saldo pendiente</span>
            <span className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: saldo > 0 ? "#C6FF3D" : "#4EA1F5" }}>{formatMoney(saldo)}</span>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#8A8A93" }}>Detalles del calzado</label>
          <p className="text-sm leading-relaxed" style={{ color: "#D3D3D8" }}>{order.shoeDetails || "Sin detalles cargados."}</p>
        </div>

        <div className="mt-6">
          <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#8A8A93" }}>
            <ArrowLeftRight size={12} />
            Antes / Después
          </label>
          <div className="grid grid-cols-2 gap-2">
            <PhotoSlot label="ANTES" url={order.photoBefore} onCapture={(file) => handleCapture("before", file)} uploading={uploadingSlot === "before"} />
            <PhotoSlot label="DESPUÉS" url={order.photoAfter} accent onCapture={(file) => handleCapture("after", file)} uploading={uploadingSlot === "after"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="flex items-center gap-1.5" style={{ color: "#8A8A93" }}>
        {Icon && <Icon size={13} />}
        {label}
      </span>
      <span style={{ color: "#F0F0EC" }}>{value}</span>
    </div>
  );
}

function PhotoSlot({ label, url, accent, onCapture, uploading }) {
  const inputId = `photo-${label}-${Math.random().toString(36).slice(2)}`;
  return (
    <div>
      <label
        htmlFor={inputId}
        className="aspect-square rounded-xl border flex items-center justify-center overflow-hidden cursor-pointer relative block"
        style={{ borderColor: accent ? "rgba(198,255,61,0.35)" : "#2A2A2E", background: "#0F0F11" }}
      >
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : uploading ? (
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#26262A", borderTopColor: "#C6FF3D" }} />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Camera size={22} style={{ color: "#3A3A3E" }} />
            <span className="text-[10px]" style={{ color: "#3A3A3E" }}>Tocar para subir</span>
          </div>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files && e.target.files[0];
            if (file) onCapture(file);
            e.target.value = "";
          }}
        />
      </label>
      <div className="text-[10px] font-bold uppercase tracking-widest text-center mt-1.5" style={{ color: accent ? "#C6FF3D" : "#6A6A6F" }}>{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN APP
// ---------------------------------------------------------------------------

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = verificando, null = sin sesión
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorMsg, setLoadErrorMsg] = useState("");

  // Verificar sesión de administrador al abrir la app
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Cargar pedidos desde Supabase al abrir la app
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setLoadError(true);
      setLoadErrorMsg(error.message || "");
    } else {
      setOrders(data.map(dbToApp));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) loadOrders();
  }, [session, loadOrders]);

  function onPhotoUploaded(orderId, slot, url) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, [slot === "before" ? "photoBefore" : "photoAfter"]: url } : o
      )
    );
    setSelectedOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, [slot === "before" ? "photoBefore" : "photoAfter"]: url } : prev
    );
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.clientName.toLowerCase().includes(search.toLowerCase()) ||
        o.serviceNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "Todos" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const metrics = useMemo(() => {
    const active = orders.filter((o) => o.status !== "Entregado").length;
    const enTaller = orders.filter((o) => o.status === "En taller").length;
    const listos = orders.filter((o) => o.status === "Listo para entregar").length;
    const pendiente = orders.reduce((sum, o) => sum + Math.max(0, o.totalPrice - o.deposit), 0);
    return { active, enTaller, listos, pendiente };
  }, [orders]);

  async function updateStatus(id, status) {
    // Actualización optimista para que se sienta instantáneo
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setSelectedOrder((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    const { error } = await supabase.from("servicios").update({ estado: status }).eq("id", id);
    if (error) {
      console.error(error);
      loadOrders(); // si falla, volvemos a traer el estado real de la base
    }
  }

  async function addOrder(newOrder) {
    const { data, error } = await supabase
      .from("servicios")
      .insert([appToDb(newOrder)])
      .select();
    if (error) {
      console.error(error);
      alert("No se pudo guardar el servicio. Revisá la conexión con la base de datos.");
      return;
    }
    setOrders((prev) => [dbToApp(data[0]), ...prev]);
    setShowNewModal(false);
  }

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: "#0A0A0B" }}>
        <style>{FONTS}</style>
        <div className="text-center max-w-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          <h1 className="text-3xl mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#F5F5F2", letterSpacing: "0.02em" }}>
            OVER IT <span style={{ color: "#C6FF3D" }}>LAB</span>
          </h1>
          <p className="text-sm font-semibold" style={{ color: "#F5C168" }}>
            Faltan las variables de entorno.
          </p>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: "#8A8A93" }}>
            En Vercel: Settings → Environment Variables → agregá <code>VITE_SUPABASE_URL</code> y{" "}
            <code>VITE_SUPABASE_ANON_KEY</code>, asegurate de tildar "Production", y después hacé Redeploy
            (los cambios de variables no se aplican solos, necesitan un nuevo deploy).
          </p>
        </div>
      </div>
    );
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#0A0A0B" }}>
        <style>{FONTS}</style>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#26262A", borderTopColor: "#C6FF3D" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ background: "#0A0A0B" }}>
        <style>{FONTS}</style>
        <Login />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#0A0A0B" }}>
        <style>{FONTS}</style>
        <div className="flex flex-col items-center gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#26262A", borderTopColor: "#C6FF3D" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6A6A6F" }}>Cargando base de datos...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: "#0A0A0B" }}>
        <style>{FONTS}</style>
        <div className="text-center max-w-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          <p className="text-sm font-semibold" style={{ color: "#F5C168" }}>No se pudo cargar la base de datos.</p>
          <p className="text-xs mt-2 font-mono break-words" style={{ color: "#D3D3D8", fontFamily: "'JetBrains Mono', monospace" }}>
            {loadErrorMsg || "Error desconocido."}
          </p>
          <p className="text-xs mt-3" style={{ color: "#8A8A93" }}>
            Si dice algo como "relation \"servicios\" does not exist", falta ejecutar el script
            supabase-schema.sql en el SQL Editor de Supabase. Si dice algo sobre "permission" o
            "policy", revisá las políticas de seguridad de la tabla.
          </p>
          <button
            onClick={loadOrders}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-bold"
            style={{ background: "#C6FF3D", color: "#0A0A0B" }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#0A0A0B" }}>
      <style>{FONTS}</style>
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#F5F5F2", letterSpacing: "0.03em" }}>
              OVER IT <span style={{ color: "#C6FF3D" }}>LAB</span>
            </h1>
            <p className="text-xs sm:text-sm mt-1.5 font-medium" style={{ color: "#8A8A93" }}>
              Clínica de zapas — Panel de gestión de servicios
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-full border px-3 py-1.5" style={{ borderColor: "#26262A", color: "#6A6A6F" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#C6FF3D" }} />
              San Salvador de Jujuy
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-full border px-3 py-1.5"
              style={{ borderColor: "#26262A", color: "#6A6A6F" }}
              title="Cerrar sesión"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <MetricCard label="Servicios activos" value={metrics.active} icon={Package} accent="#C6FF3D" />
          <MetricCard label="En taller" value={metrics.enTaller} icon={Wrench} accent="#F5A623" />
          <MetricCard label="Listos para entregar" value={metrics.listos} icon={CheckCircle2} accent="#7ED957" />
          <MetricCard label="Pendiente por cobrar" value={formatMoney(metrics.pendiente)} icon={DollarSign} accent="#4EA1F5" />
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#6A6A6F" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente o N° de servicio..."
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border"
              style={{ background: "#141416", borderColor: "#26262A", color: "#F0F0EC" }}
            />
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-transform active:scale-[0.98]"
            style={{ background: "#C6FF3D", color: "#0A0A0B" }}
          >
            <Plus size={16} strokeWidth={3} />
            Nuevo servicio
          </button>
        </div>

        {/* STATUS FILTER CHIPS */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["Todos", ...STATUS_ORDER].map((s) => {
            const active = statusFilter === s;
            const st = STATUS[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors"
                style={active ? { background: "#C6FF3D", borderColor: "#C6FF3D", color: "#0A0A0B" } : { background: "transparent", borderColor: "#26262A", color: "#9A9AA3" }}
              >
                {st && <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "#0A0A0B" : st.dot }} />}
                {s}
              </button>
            );
          })}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block rounded-2xl border overflow-hidden" style={{ borderColor: "#26262A" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#141416" }}>
                {["N°", "Cliente", "Calzado", "Entrega", "Estado", "Saldo", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6A6A6F" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const saldo = o.totalPrice - o.deposit;
                return (
                  <tr key={o.id} onClick={() => setSelectedOrder(o)} className="cursor-pointer border-t transition-colors hover:bg-white/[0.03]" style={{ borderColor: "#1E1E22", background: "#0F0F11" }}>
                    <td className="px-4 py-3.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#C6FF3D" }}>{o.serviceNumber}</td>
                    <td className="px-4 py-3.5 font-semibold" style={{ color: "#F0F0EC" }}>{o.clientName}</td>
                    <td className="px-4 py-3.5 max-w-[220px] truncate" style={{ color: "#9A9AA3" }}>{o.shoeDetails}</td>
                    <td className="px-4 py-3.5" style={{ color: "#9A9AA3" }}>{formatDate(o.deliveryDate)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3.5 font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: saldo > 0 ? "#F5C168" : "#4EA1F5" }}>{formatMoney(saldo)}</td>
                    <td className="px-4 py-3.5 text-right"><ChevronRight size={16} style={{ color: "#4A4A4E" }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState />}
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden space-y-3">
          {filtered.map((o) => {
            const saldo = o.totalPrice - o.deposit;
            return (
              <div key={o.id} onClick={() => setSelectedOrder(o)} className="rounded-2xl border p-4 cursor-pointer" style={{ background: "#141416", borderColor: "#26262A" }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#C6FF3D", fontSize: 12 }}>{o.serviceNumber}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="font-semibold text-base" style={{ color: "#F0F0EC" }}>{o.clientName}</div>
                <div className="text-xs mt-0.5 truncate" style={{ color: "#8A8A93" }}>{o.shoeDetails}</div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "#1E1E22" }}>
                  <span className="text-xs" style={{ color: "#6A6A6F" }}>Entrega {formatDate(o.deliveryDate)}</span>
                  <span className="font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: saldo > 0 ? "#F5C168" : "#4EA1F5" }}>{formatMoney(saldo)}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <EmptyState />}
        </div>
      </div>

      {selectedOrder && <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdateStatus={updateStatus} onPhotoUploaded={onPhotoUploaded} />}
      {showNewModal && (
        <NewServiceModal suggestedNumber={nextServiceNumber(orders)} onClose={() => setShowNewModal(false)} onSave={addOrder} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Package size={28} style={{ color: "#3A3A3E" }} />
      <p className="mt-3 text-sm font-semibold" style={{ color: "#8A8A93" }}>No hay servicios que coincidan</p>
      <p className="text-xs mt-1" style={{ color: "#5A5A5E" }}>Probá con otro nombre, número de servicio o filtro de estado.</p>
    </div>
  );
}
