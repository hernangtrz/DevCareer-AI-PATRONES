export const dynamic = "force-dynamic";

import { getCurrentUser, getSessionCookie } from "@/lib/api.server";
import { getInterviewById } from "@/lib/api";
import { redirect } from "next/navigation";
import Agent from "@/components/Agent";

const Page = async ({ params }: RouteParams) => {
  const { id } = await params;
  const sessionCookie = await getSessionCookie();
  const user = await getCurrentUser();
  const interview = await getInterviewById(id, sessionCookie);

  if (!interview) redirect("/dashboard");

  const typeTranslations: Record<string, string> = {
    Technical: "Técnica",
    Behavioral: "Conductual",
    Mixed: "Mixta",
    tecnica: "Técnica",
    conductual: "Conductual",
    combinada: "Combinada",
  };
  const displayType = typeTranslations[interview.type] || interview.type || "Técnica";

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex flex-col justify-center items-center py-2 md:py-6">
      <Agent
        userName={user?.name || ""}
        userId={user?.id}
        interviewId={id}
        type="interview"
        questions={interview.questions}
        role={interview.role}
        company={interview.company}
        level={interview.level}
        interviewType={displayType}
        techstack={interview.techstack}
      />
    </div>
  );
};
export default Page;
