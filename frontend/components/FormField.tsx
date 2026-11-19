"use client";

import React, { useState } from "react";
import {
  FormControl,
  FormField as UIFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FieldValues, Path, Control } from "react-hook-form";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "file";
  autoComplete?: string;
  disabled?: boolean;
}

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  disabled = false,
}: FormFieldProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const isEmail = type === "email";
  const isIdentifier = isPassword || isEmail;

  const resolvedAutoComplete =
    autoComplete ||
    (isEmail ? "email" : isPassword ? "current-password" : name === "name" ? "name" : undefined);

  const LeftIcon = isEmail ? Mail : isPassword ? Lock : name === "name" ? User : null;

  return (
    <UIFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className="label text-xs font-semibold tracking-wide text-light-100/90">
            {label}
          </FormLabel>
          <div className="relative group flex items-center">
            {LeftIcon && (
              <LeftIcon
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-light-400 group-focus-within:text-primary-200 transition-colors z-10"
              />
            )}
            <FormControl>
              <Input
                className={`input ${LeftIcon ? "pl-11" : "px-5"} ${
                  isPassword ? "pr-12" : ""
                } transition-all duration-200 border border-white/10 focus-visible:!border-primary-200/70 focus-visible:!ring-2 focus-visible:!ring-primary-200/20 aria-[invalid=true]:!border-destructive-100 aria-[invalid=true]:!ring-2 aria-[invalid=true]:!ring-destructive-100/20`}
                style={{
                  paddingLeft: LeftIcon ? "2.85rem" : "1.25rem",
                  paddingRight: isPassword ? "3rem" : "1.25rem",
                }}
                placeholder={placeholder}
                type={isPassword ? (showPassword ? "text" : "password") : type}
                autoComplete={resolvedAutoComplete}
                autoCorrect={isIdentifier ? "off" : undefined}
                autoCapitalize={isIdentifier ? "none" : undefined}
                spellCheck={isIdentifier ? false : undefined}
                disabled={disabled}
                {...field}
              />
            </FormControl>
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-light-400 hover:text-primary-100 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200/50 transition-colors cursor-pointer z-10"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormField;
