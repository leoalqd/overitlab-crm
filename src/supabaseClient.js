import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las variables, createClient con "undefined" rompe toda la app
// (pantalla en blanco, sin ningún mensaje). Usamos un valor de relleno para
// que la app arranque igual, y mostramos un aviso claro en pantalla en su lugar.
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
