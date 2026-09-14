"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️ Advertencia: Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en las variables de entorno.");
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl || "", supabaseServiceKey || "");
//# sourceMappingURL=supabase.js.map