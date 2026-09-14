import { IFeedbackRepository } from "../feedback.repository";
import { Feedback } from "../../types";
import { v4 as uuidv4 } from "uuid";

function mapFeedbackFromDb(row: any): Feedback {
  return {
    id: row.id,
    interviewId: row.interview_id,
    userId: row.user_id,
    totalScore: Number(row.total_score),
    categoryScores: row.category_scores || [],
    strengths: row.strengths || [],
    areasForImprovement: row.areas_for_improvement || [],
    finalAssessment: row.final_assessment,
    createdAt: row.created_at || new Date().toISOString(),
    englishFeedback: row.english_feedback,
  };
}

function mapFeedbackToDb(feedback: Partial<Feedback>): any {
  const row: any = {};
  if (feedback.id !== undefined) row.id = feedback.id;
  if (feedback.interviewId !== undefined) row.interview_id = feedback.interviewId;
  if (feedback.userId !== undefined) row.user_id = feedback.userId;
  if (feedback.totalScore !== undefined) row.total_score = feedback.totalScore;
  if (feedback.categoryScores !== undefined) row.category_scores = feedback.categoryScores;
  if (feedback.strengths !== undefined) row.strengths = feedback.strengths;
  if (feedback.areasForImprovement !== undefined) row.areas_for_improvement = feedback.areasForImprovement;
  if (feedback.finalAssessment !== undefined) row.final_assessment = feedback.finalAssessment;
  if (feedback.createdAt !== undefined) row.created_at = feedback.createdAt;
  if (feedback.englishFeedback !== undefined) row.english_feedback = feedback.englishFeedback;
  return row;
}

export class SupabaseFeedbackRepository implements IFeedbackRepository {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async create(feedback: Omit<Feedback, "id">): Promise<string> {
    const id = uuidv4();
    const item: Feedback = { id, ...feedback };
    const row = mapFeedbackToDb(item);

    const { error } = await this.supabase.from("feedback").insert(row);
    if (error) {
      console.error("[SupabaseFeedbackRepository] create error:", error);
      throw error;
    }
    return id;
  }

  async getByInterviewId(interviewId: string, userId: string): Promise<Feedback | null> {
    const { data, error } = await this.supabase
      .from("feedback")
      .select("*")
      .eq("interview_id", interviewId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SupabaseFeedbackRepository] getByInterviewId error:", error);
      return null;
    }

    if (!data || data.length === 0) return null;
    return mapFeedbackFromDb(data[0]);
  }
}
