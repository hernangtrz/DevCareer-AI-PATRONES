/**
 * lib/api.ts
 * Funciones HTTP para CLIENT COMPONENTS.
 * No importa "next/headers" — es seguro usarlo en el browser.
 */

const API_URL = typeof window !== "undefined"
  ? "/api/proxy"
  : process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
// ─────────────────────────────────────────────
// Helper interno
// ─────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  bearerToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (bearerToken) {
    headers["Authorization"] = `Bearer ${bearerToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// AUTH (client-safe)
// ─────────────────────────────────────────────

export async function signUp(params: {
  uid: string;
  name: string;
  email: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    return await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify(params),
    });
  } catch (e: any) {
    return { success: false, message: e.message || "Error al crear la cuenta" };
  }
}

export async function signIn(params: {
  idToken: string;
}): Promise<{ success: boolean; sessionCookie?: string; message?: string }> {
  try {
    return await apiFetch("/auth/signin", {
      method: "POST",
      body: JSON.stringify(params),
    });
  } catch (e: any) {
    return { success: false, message: e.message || "Error al iniciar sesión" };
  }
}

// ─────────────────────────────────────────────
// ENTREVISTAS (client-safe, requieren bearerToken)
// ─────────────────────────────────────────────

export async function getInterviewsByUserId(
  bearerToken: string,
): Promise<Interview[]> {
  try {
    const res = await apiFetch<{ success: boolean; interviews: Interview[] }>(
      "/interviews/mine",
      { method: "GET" },
      bearerToken,
    );
    return res.interviews ?? [];
  } catch {
    return [];
  }
}

export async function getLatestInterviews(params: {
  limit?: number;
  bearerToken: string;
}): Promise<Interview[]> {
  const { limit = 20, bearerToken } = params;
  try {
    const res = await apiFetch<{ success: boolean; interviews: Interview[] }>(
      `/interviews/latest?limit=${limit}`,
      { method: "GET" },
      bearerToken,
    );
    return res.interviews ?? [];
  } catch {
    return [];
  }
}

export async function getInterviewById(
  id: string,
  bearerToken?: string,
): Promise<Interview | null> {
  try {
    const res = await apiFetch<{ success: boolean; interview: Interview }>(
      `/interviews/${id}`,
      { method: "GET" },
      bearerToken,
    );
    return res.interview ?? null;
  } catch {
    return null;
  }
}

export async function createInterviewFromTemplate(
  templateId: string,
  bearerToken: string,
): Promise<string | null> {
  try {
    const res = await apiFetch<{ success: boolean; interviewId: string }>(
      "/interviews/from-template",
      {
        method: "POST",
        body: JSON.stringify({ templateId }),
      },
      bearerToken,
    );
    return res.interviewId ?? null;
  } catch {
    return null;
  }
}

/**
 * Patrón Prototype: Clona una entrevista previa para reintentar la práctica.
 */
export async function cloneInterview(
  interviewId: string,
  bearerToken: string,
): Promise<string | null> {
  try {
    const res = await apiFetch<{ success: boolean; interviewId: string }>(
      '/interviews/' + interviewId + '/clone',
      {
        method: "POST",
      },
      bearerToken,
    );
    return res.interviewId ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// FEEDBACK (client-safe, requieren bearerToken)
// ─────────────────────────────────────────────

export async function createFeedback(
  params: {
    interviewId: string;
    transcript: { role: string; content: string }[];
    language?: string;
  },
  bearerToken: string,
): Promise<{ success: boolean; feedbackId?: string; feedback?: any }> {
  try {
    const res = await apiFetch<{ success: boolean; feedbackId?: string; feedback?: { id: string } }>(
      "/feedback",
      {
        method: "POST",
        body: JSON.stringify(params),
      },
      bearerToken,
    );
    return {
      success: res.success,
      feedbackId: res.feedbackId || res.feedback?.id,
      feedback: res.feedback,
    };
  } catch (err) {
    console.error("[api.createFeedback] Error:", err);
    return { success: false };
  }
}

export async function getFeedbackByInterviewId(
  params: { interviewId: string },
  bearerToken: string,
): Promise<Feedback | null> {
  try {
    const res = await apiFetch<{ success: boolean; feedback: Feedback }>(
      `/feedback/${params.interviewId}`,
      { method: "GET" },
      bearerToken,
    );
    return res.feedback ?? null;
  } catch {
    return null;
  }
}


export async function updateInterview(
  id: string,
  data: Partial<{ role: string; level: string; techstack: string[]; finalized: boolean }>
): Promise<{ success: boolean; interview?: Interview; message?: string }> {
  try {
    return await apiFetch<{ success: boolean; interview?: Interview; message?: string }>(
      `/interviews/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  } catch (err: any) {
    return { success: false, message: err.message || "Error al actualizar entrevista" };
  }
}

export async function deleteInterview(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    return await apiFetch<{ success: boolean; message?: string }>(
      `/interviews/${id}`,
      {
        method: "DELETE",
      }
    );
  } catch (err: any) {
    return { success: false, message: err.message || "Error al eliminar entrevista" };
  }
}


export interface JobOfferDto {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requiredSkills: string[];
  seniority: string;
  platform: string;
  url?: string;
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  createdAt: string;
}

export interface JobApplicationDto {
  userId?: string;
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  platform: string;
  location: string;
  salary?: string;
  appliedAt: string;
  status: "applied" | "interviewing" | "offered" | "rejected";
  coverLetter?: string;
  adaptedResumeSummary?: string;
  matchScore?: number;
  interviewId?: string;
  notes?: string;
  url?: string;
  techstack?: string[];
}

export async function getJobs(params?: { query?: string; platform?: string; skills?: string[] }): Promise<JobOfferDto[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.platform) searchParams.set("platform", params.platform);
    if (params?.skills && params.skills.length > 0) searchParams.set("skills", params.skills.join(","));

    const queryStr = searchParams.toString();
    const res = await apiFetch<{ success: boolean; jobs: JobOfferDto[] }>(
      `/jobs${queryStr ? "?" + queryStr : ""}`
    );
    return res.jobs || [];
  } catch (err) {
    console.error("Error fetching jobs:", err);
    return [];
  }
}

export async function applyToJob(params: {
  job: JobOfferDto;
  userSkills?: string[];
  userExperienceSummary?: string;
  notes?: string;
}): Promise<{ success: boolean; application?: JobApplicationDto; interviewId?: string; message?: string }> {
  try {
    return await apiFetch<{ success: boolean; application?: JobApplicationDto; interviewId?: string; message?: string }>(
      "/jobs/apply",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  } catch (err: any) {
    return { success: false, message: err.message || "Error al procesar postulación" };
  }
}

export async function getUserJobApplications(): Promise<JobApplicationDto[]> {
  try {
    const res = await apiFetch<{ success: boolean; applications: JobApplicationDto[] }>("/jobs/applications");
    return res.applications || [];
  } catch (err) {
    console.error("Error fetching applications:", err);
    return [];
  }
}


export async function createJobInterview(params: {
  jobTitle: string;
  company: string;
  description?: string;
  requiredSkills: string[];
  seniority?: string;
}): Promise<{ success: boolean; interviewId?: string; message?: string }> {
  try {
    return await apiFetch<{ success: boolean; interviewId?: string; message?: string }>(
      "/jobs/create-interview",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  } catch (err: any) {
    return { success: false, message: err.message || "Error al crear entrevista para el empleo" };
  }
}

export async function updateJobApplicationStatus(
  id: string,
  status: "applied" | "interviewing" | "offered" | "rejected"
): Promise<{ success: boolean; message?: string }> {
  try {
    return await apiFetch<{ success: boolean; message?: string }>(
      `/jobs/applications/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateJobApplicationNotes(
  id: string,
  notes: string
): Promise<{ success: boolean; message?: string }> {
  try {
    return await apiFetch<{ success: boolean; message?: string }>(
      `/jobs/applications/${id}/notes`,
      {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      }
    );
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deleteJobApplication(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    return await apiFetch<{ success: boolean; message?: string }>(
      `/jobs/applications/${id}`,
      {
        method: "DELETE",
      }
    );
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
