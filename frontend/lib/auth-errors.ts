/**
 * Mapea errores crudos de Supabase Auth, AWS Cognito o red a mensajes claros
 * y accionables en español para el usuario final.
 */
export interface MappedAuthError {
  title: string;
  message: string;
  field?: "email" | "password" | "name" | "root";
}

export function mapAuthError(error: unknown, mode: "sign-in" | "sign-up" = "sign-in"): MappedAuthError {
  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : (error as { message?: string })?.message || "";

  const lower = raw.toLowerCase().trim();

  // 1. Credenciales incorrectas (Supabase: "Invalid login credentials", Cognito: "NotAuthorizedException" / "Incorrect username or password")
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid_credentials") ||
    lower.includes("notauthorizedexception") ||
    lower.includes("incorrect username or password") ||
    lower.includes("invalid email or password") ||
    lower.includes("contraseña incorrecta") ||
    lower.includes("credenciales inválidas")
  ) {
    return {
      title: "Credenciales incorrectas",
      message:
        "El correo electrónico o la contraseña que ingresaste no son correctos. Verifica tus datos e inténtalo de nuevo.",
      field: "password",
    };
  }

  // 2. Usuario no encontrado
  if (
    lower.includes("usernotfoundexception") ||
    lower.includes("user not found") ||
    lower.includes("no user found") ||
    lower.includes("usuario no encontrado")
  ) {
    return {
      title: "Cuenta no encontrada",
      message:
        "No existe ninguna cuenta registrada con este correo electrónico. Verifica el correo o crea una cuenta nueva.",
      field: "email",
    };
  }

  // 3. Correo no confirmado
  if (
    lower.includes("usernotconfirmedexception") ||
    lower.includes("email not confirmed") ||
    lower.includes("not confirmed")
  ) {
    return {
      title: "Correo pendiente de confirmación",
      message:
        "Tu cuenta aún no ha sido verificada. Revisa tu bandeja de entrada o spam para confirmar tu correo electrónico.",
      field: "email",
    };
  }

  // 4. Usuario ya registrado (en Sign-Up)
  if (
    lower.includes("user already registered") ||
    lower.includes("usernameexistsexception") ||
    lower.includes("already exists") ||
    lower.includes("ya existe") ||
    lower.includes("already been registered")
  ) {
    return {
      title: "Correo ya registrado",
      message:
        "Ya existe una cuenta asociada a este correo electrónico. Inicia sesión con tu contraseña.",
      field: "email",
    };
  }

  // 5. Política de contraseña débil
  if (
    lower.includes("invalidpasswordexception") ||
    lower.includes("password should be") ||
    lower.includes("weak_password") ||
    lower.includes("password is too weak")
  ) {
    return {
      title: "Contraseña insegura",
      message:
        "La contraseña debe tener al menos 8 caracteres e incluir letras y números para mayor seguridad.",
      field: "password",
    };
  }

  // 6. Formato de correo inválido
  if (
    lower.includes("unable to validate email") ||
    lower.includes("invalid email") ||
    lower.includes("correo inválido")
  ) {
    return {
      title: "Correo electrónico inválido",
      message: "Ingresa una dirección de correo electrónico válida (ejemplo: nombre@dominio.com).",
      field: "email",
    };
  }

  // 7. Límite de intentos / Rate limit
  if (
    lower.includes("toomanyrequestsexception") ||
    lower.includes("limitexceededexception") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return {
      title: "Demasiados intentos",
      message:
        "Has realizado demasiados intentos seguidos. Por seguridad, espera unos minutos antes de volver a intentarlo.",
      field: "root",
    };
  }

  // 8. Errores de red / conexión con el servidor
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    lower.includes("econnrefused")
  ) {
    return {
      title: "Error de conexión",
      message:
        "No pudimos conectar con el servidor de autenticación. Verifica tu conexión a internet o que el backend esté activo.",
      field: "root",
    };
  }

  // 9. Fallback en español conservando mensaje si ya viene en español
  const isLikelySpanish = /[áéíóúñ¿¡]|error al|sesión|cuenta|correo|contraseña|código/i.test(raw);
  return {
    title: mode === "sign-in" ? "No se pudo iniciar sesión" : "No se pudo completar el registro",
    message:
      isLikelySpanish && raw.length > 0
        ? raw
        : mode === "sign-in"
        ? "Correo electrónico o contraseña incorrectos. Verifica tus datos e intenta nuevamente."
        : "Ocurrió un inconveniente al crear tu cuenta. Verifica los datos e intenta nuevamente.",
    field: mode === "sign-in" ? "password" : "root",
  };
}
