"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, Check, X } from "lucide-react";
import { deleteInterview, updateInterview } from "@/lib/api";

interface Props {
  interviewId: string;
  initialRole: string;
  initialTechstack: string[];
}

export default function InterviewCardActions({ interviewId, initialRole, initialTechstack }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [role, setRole] = useState(initialRole);
  const [techstackStr, setTechstackStr] = useState(initialTechstack.join(", "));
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteInterview(interviewId);
      if (res.success) {
        setShowConfirmDelete(false);
        router.refresh();
      } else {
        alert(res.message || "Error al eliminar");
      }
    } catch (e: any) {
      alert(e.message || "Error eliminando entrevista");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const parsedTech = techstackStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await updateInterview(interviewId, {
        role,
        techstack: parsedTech,
      });

      if (res.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert(res.message || "Error al guardar");
      }
    } catch (e: any) {
      alert(e.message || "Error actualizando entrevista");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setIsEditing(true)}
          title="Editar entrevista"
          className="p-1.5 rounded-lg text-light-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowConfirmDelete(true)}
          title="Eliminar entrevista"
          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h4 className="text-lg font-semibold text-white">¿Eliminar entrevista?</h4>
            <p className="text-sm text-light-400 mt-2">
              Esta acción no se puede deshacer. Se eliminarán los datos y el feedback asociado.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-light-300 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 transition"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12141a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-white">Editar Entrevista</h4>
              <button
                onClick={() => setIsEditing(false)}
                className="text-light-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-light-400 uppercase tracking-wider mb-1">
                  Rol / Título
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-primary-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-light-400 uppercase tracking-wider mb-1">
                  Tecnologías (separadas por coma)
                </label>
                <input
                  type="text"
                  value={techstackStr}
                  onChange={(e) => setTechstackStr(e.target.value)}
                  placeholder="React, Node.js, TypeScript"
                  className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-primary-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-light-300 hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-200 text-dark-100 hover:bg-primary-300 flex items-center gap-2 transition"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
