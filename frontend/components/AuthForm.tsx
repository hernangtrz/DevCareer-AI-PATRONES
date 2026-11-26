"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleAlert,
  Loader2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  MailCheck,
  X,
} from "lucide-react";

import {
  signUpCognito,
  confirmSignUpCognito,
  signInCognito,
} from "@/lib/cognito";
import { signIn, signUp } from "@/lib/api";
import { mapAuthError, type MappedAuthError } from "@/lib/auth-errors";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FadeIn, ShakeOnError } from "@/components/ui/motion";
import { useAuthShutter } from "@/components/DiagonalShutterTransition";
import FormField from "./FormField";

const authFormSchema = (type: FormType) => {
  return z.object({
    name:
      type === "sign-up"
        ? z.string().min(3, "El nombre debe tener al menos 3 caracteres")
        : z.string().optional(),
    email: z.string().email("Ingresa un correo electrónico válido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const { navigateWithShutter, isTransitioning } = useAuthShutter();
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  const handleShutterLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    navigateWithShutter(href);
  };
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [pendingSub, setPendingSub] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Estado para alerta inline persistente y animación de error
  const [authError, setAuthError] = useState<MappedAuthError | null>(null);
  const [errorShakeKey, setErrorShakeKey] = useState(0);

  const isSignIn = type === "sign-in";
  const formSchema = authFormSchema(type);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { name: "", email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  const triggerErrorFeedback = (mapped: MappedAuthError) => {
    setAuthError(mapped);
    setErrorShakeKey((k) => k + 1);
    toast.error(mapped.title, {
      description: mapped.message,
      duration: 5500,
    });
  };

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    const firstField = (Object.keys(errors)[0] as keyof FormValues) || "email";
    const firstMsg =
      errors[firstField]?.message ||
      "Revisa los campos marcados en rojo antes de continuar.";

    triggerErrorFeedback({
      title: "Datos incompletos o inválidos",
      message: String(firstMsg),
      field: firstField === "name" ? "name" : firstField === "email" ? "email" : "password",
    });

    setTimeout(() => {
      form.setFocus(firstField);
    }, 40);
  };

  const onSubmit = async (data: FormValues) => {
    setAuthError(null);

    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        // 1. Registrar usuario en Cognito / Supabase
        const { userSub, session } = await signUpCognito(email, password!, name!);

        // Si hay sesión directa (auto-confirmación activada en Supabase o desarrollo)
        if (session) {
          localStorage.setItem("cognitoIdToken", session.access_token);

          await signUp({
            uid: userSub,
            name: name!,
            email: email,
          });

          const result = await signIn({ idToken: session.access_token });
          if (result.success && result.sessionCookie) {
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionCookie: result.sessionCookie }),
            });
            toast.success("¡Cuenta creada con éxito!", {
              description: "Bienvenido a DevCareer AI. Redirigiendo a tu panel...",
            });
            router.refresh();
            router.push("/dashboard");
            return;
          }
        }

        // 2. Mostrar formulario de confirmación de código
        setPendingEmail(email);
        setPendingName(name!);
        setPendingSub(userSub);
        setPendingConfirmation(true);

        toast.info("Verifica tu correo electrónico", {
          description: `Enviamos un código de 6 dígitos a ${email}.`,
        });
      } else {
        const { email, password } = data;

        // 1. Autenticar en Cognito / Supabase y obtener ID Token
        const { idToken, refreshToken } = await signInCognito(email, password);

        // 2. Guardar token en localStorage para Client Components
        localStorage.setItem("cognitoIdToken", idToken);
        if (refreshToken) {
          localStorage.setItem("cognitoRefreshToken", refreshToken);
        }

        // 3. Pedir sessionCookie al backend
        const result = await signIn({ idToken });

        if (!result.success || !result.sessionCookie) {
          const mapped = mapAuthError(
            result.message || "Error al iniciar sesión.",
            type
          );
          triggerErrorFeedback(mapped);
          if (mapped.field && mapped.field !== "root") {
            form.setError(mapped.field, {
              type: "server",
              message: mapped.message,
            });
          }
          return;
        }

        // 4. Guardar sessionCookie como cookie httpOnly para Server Components
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionCookie: result.sessionCookie }),
        });

        toast.success("¡Sesión iniciada correctamente!", {
          description: "Cargando tu espacio de preparación...",
        });
        router.refresh();
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      console.error("[AuthForm] Error de autenticación:", error);
      const mapped = mapAuthError(error, type);
      triggerErrorFeedback(mapped);

      if (mapped.field === "password") {
        form.setValue("password", "", { shouldValidate: false });
        form.setError("password", {
          type: "server",
          message: mapped.message,
        });
        setTimeout(() => form.setFocus("password"), 50);
      } else if (mapped.field === "email") {
        form.setError("email", {
          type: "server",
          message: mapped.message,
        });
        setTimeout(() => form.setFocus("email"), 50);
      }
    }
  };

  // ─── Confirmar código de verificación de Cognito / Supabase ─────────────
  const handleConfirmCode = async () => {
    if (!confirmCode || confirmCode.length < 6) {
      triggerErrorFeedback({
        title: "Código incompleto",
        message: "Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.",
      });
      return;
    }

    setConfirmLoading(true);
    setAuthError(null);
    try {
      await confirmSignUpCognito(pendingEmail, confirmCode);

      const result = await signUp({
        uid: pendingSub,
        name: pendingName,
        email: pendingEmail,
      });

      if (!result.success) {
        if (result.message?.includes("ya existe")) {
          toast.success("Cuenta confirmada", {
            description: "Ya puedes iniciar sesión con tus credenciales.",
          });
        } else {
          triggerErrorFeedback(mapAuthError(result.message, "sign-up"));
          return;
        }
      } else {
        toast.success("¡Cuenta verificada con éxito!", {
          description: "Inicia sesión para comenzar tu entrenamiento.",
        });
      }

      navigateWithShutter("/sign-in");
    } catch (error: unknown) {
      triggerErrorFeedback({
        title: "Código inválido o expirado",
        message:
          (error as { message?: string })?.message ||
          "Verifica el código de 6 dígitos enviado a tu correo e inténtalo de nuevo.",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  // ─── Pantalla de confirmación de código ─────────────────────────────────
  if (pendingConfirmation) {
    return (
      <FadeIn className="relative w-full max-w-[520px]">
        <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-indigo-500/15 via-violet-500/10 to-indigo-500/15 blur-2xl" />
        <div className="card-border relative w-full">
          <div className="flex flex-col gap-6 card py-12 px-8 sm:px-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-400/30 text-primary-200">
                <MailCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex flex-row items-center gap-2 justify-center">
                <Image src="/logo.svg" alt="logo DevCareer AI" height={28} width={28} />
                <h2 className="text-xl font-bold text-primary-100 tracking-tight">
                  DevCareer AI
                </h2>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Confirma tu correo electrónico
              </h3>
              <p className="text-sm text-light-100/80 max-w-sm leading-relaxed">
                Enviamos un código de 6 dígitos a{" "}
                <strong className="text-white font-semibold">{pendingEmail}</strong>.
                Ingrésalo a continuación para activar tu cuenta.
              </p>
            </div>

            {authError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 rounded-2xl border border-destructive-100/40 bg-destructive-100/10 p-4 text-left animate-fadeIn"
              >
                <CircleAlert
                  className="h-5 w-5 text-destructive-100 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{authError.title}</p>
                  <p className="text-xs text-light-100/90 mt-0.5 leading-relaxed">
                    {authError.message}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="otp-code-input"
                className="text-xs font-semibold text-light-100/90 flex items-center gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5 text-primary-200" aria-hidden="true" />
                <span>Código de verificación (6 dígitos)</span>
              </label>
              <input
                id="otp-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="000000"
                maxLength={6}
                value={confirmCode}
                onChange={(e) =>
                  setConfirmCode(e.target.value.replace(/\D/g, ""))
                }
                className="bg-dark-200 border border-white/10 focus-visible:border-primary-200/70 focus-visible:ring-2 focus-visible:ring-primary-200/20 focus-visible:outline-none rounded-full px-6 py-3.5 text-center font-mono text-lg font-bold tracking-[0.35em] text-white placeholder:text-light-100/35 w-full transition-all"
              />
            </div>

            <Button
              type="button"
              className="btn flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              onClick={handleConfirmCode}
              disabled={confirmLoading}
            >
              {confirmLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Verificando código...</span>
                </>
              ) : (
                <>
                  <span>Verificar cuenta</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-light-100/75">
              ¿Ya tienes cuenta activa?{" "}
              <Link
                href="/sign-in"
                onClick={(e) => handleShutterLinkClick(e, "/sign-in")}
                aria-disabled={isTransitioning || undefined}
                className="font-bold text-primary-200 hover:text-primary-100 underline-offset-4 hover:underline transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </FadeIn>
    );
  }

  // ─── Formulario principal de login / registro ─────────────────────────
  return (
    <FadeIn className="relative w-full max-w-[540px]">
      {/* Resplandor ambiental manteniendo la paleta oficial */}
      <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-tr from-indigo-600/15 via-violet-500/10 to-primary-200/10 blur-2xl" />

      <ShakeOnError triggerKey={errorShakeKey}>
        <div className="card-border relative w-full lg:min-w-[520px] shadow-2xl">
          <div className="flex flex-col gap-6 card py-11 px-7 sm:px-10">
            {/* Encabezado y marca */}
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-200/10 border border-primary-200/25 text-primary-200 text-[11px] font-semibold tracking-wide">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Plataforma IA de Entrevistas & Empleabilidad
              </span>

              <div className="flex flex-row items-center gap-2.5 justify-center mt-1">
                <Image
                  src="/logo.svg"
                  alt="logo de DevCareer AI"
                  height={34}
                  width={34}
                />
                <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-100 tracking-tight">
                  DevCareer AI
                </h2>
              </div>

              <h3 className="text-lg sm:text-xl font-semibold text-white/95 tracking-tight">
                {isSignIn
                  ? "Inicia sesión en tu cuenta"
                  : "Crea tu cuenta profesional"}
              </h3>
              <p className="text-xs sm:text-sm text-light-100/75 max-w-sm leading-relaxed">
                {isSignIn
                  ? "Accede a tus simulacros de entrevista por voz, análisis ATS y portal de vacantes."
                  : "Practica entrevistas técnicas con IA, optimiza tu CV y mide tu preparación."}
              </p>
            </div>

            {/* Banner de error inline persistente y accesible */}
            {authError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start justify-between gap-3 rounded-2xl border border-destructive-100/45 bg-destructive-100/10 px-4 py-3.5 text-left shadow-lg shadow-destructive-100/5 animate-fadeIn"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <CircleAlert
                    className="h-5 w-5 text-destructive-100 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-bold text-white">
                      {authError.title}
                    </span>
                    <span className="text-xs text-light-100/90 leading-relaxed">
                      {authError.message}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  aria-label="Cerrar alerta de error"
                  className="p-1 rounded-lg text-light-100/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                onChange={() => {
                  if (authError) setAuthError(null);
                }}
                noValidate
                className="w-full space-y-5 mt-1 form"
              >
                {!isSignIn && (
                  <FormField
                    control={form.control}
                    name="name"
                    label="Nombre completo"
                    placeholder="Ej. Andrés Martínez"
                    type="text"
                    autoComplete="name"
                    disabled={isSubmitting}
                  />
                )}

                <FormField
                  control={form.control}
                  name="email"
                  label="Correo electrónico"
                  placeholder="nombre@correo.com"
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                />

                <FormField
                  control={form.control}
                  name="password"
                  label="Contraseña"
                  placeholder="Mínimo 8 caracteres"
                  type="password"
                  autoComplete={isSignIn ? "current-password" : "new-password"}
                  disabled={isSubmitting}
                />

                <Button
                  className="btn flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(202,197,254,0.3)] active:scale-[0.99] disabled:opacity-60"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>
                        {isSignIn
                          ? "Verificando credenciales..."
                          : "Creando cuenta..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{isSignIn ? "Iniciar sesión" : "Crear cuenta"}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="pt-2 border-t border-white/10 text-center">
              <p className="text-sm text-light-100/80">
                {isSignIn ? "¿Aún no tienes una cuenta?" : "¿Ya tienes una cuenta?"}
                <Link
                  href={!isSignIn ? "/sign-in" : "/sign-up"}
                  onClick={(e) =>
                    handleShutterLinkClick(e, !isSignIn ? "/sign-in" : "/sign-up")
                  }
                  aria-disabled={isTransitioning || undefined}
                  className="font-bold text-primary-200 hover:text-primary-100 ml-1.5 underline-offset-4 hover:underline transition-colors"
                >
                  {!isSignIn ? "Inicia sesión" : "Regístrate gratis"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </ShakeOnError>
    </FadeIn>
  );
};

export default AuthForm;
