"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  CircleAlertIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      richColors
      closeButton
      expand={false}
      duration={5000}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-400" />,
        info: <InfoIcon className="size-4 text-indigo-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error: <CircleAlertIcon className="size-4 text-rose-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-indigo-300" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !rounded-2xl !border !border-white/15 !bg-[#12141f]/95 !backdrop-blur-xl !shadow-2xl !text-white",
          title: "!font-bold !text-xs sm:!text-sm",
          description: "!text-xs !text-light-100/85",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
