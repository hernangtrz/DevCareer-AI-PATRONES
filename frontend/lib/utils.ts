import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL =
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

const DEFAULT_VARIANTS = [
  "original",
  "plain",
  "original-wordmark",
  "plain-wordmark",
] as const;

/**
 * Overrides variant order when the default `original` SVG has poor contrast on
 * dark backgrounds or a clearer mark exists at small icon sizes (e.g. AWS
 * `plain` is bright orange `#f90`, Go `original-wordmark` is crisp at 20px).
 */
const PREFERRED_VARIANTS: Record<string, readonly string[]> = {
  amazonwebservices: ["plain", "original", "line"],
  go: ["original-wordmark", "original", "plain"],
};

const resolvedIconCache = new Map<string, string>();

const normalizeTechName = (tech: string): string => {
  const cleaned = tech
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, "") // strip parenthetical qualifiers like "Go (Golang)" or "AWS (EC2)"
    .trim();

  const compact = cleaned.replace(/[\s_-]+/g, "");
  if (mappings[compact]) return mappings[compact];

  const withoutJs = compact.replace(/\.js$/, "");
  if (mappings[withoutJs]) return mappings[withoutJs];

  const withoutVersion = withoutJs.replace(/\d+(\.\d+)*$/, "");
  if (withoutVersion && mappings[withoutVersion]) {
    return mappings[withoutVersion];
  }

  // Fall back to sanitized slug so any of Devicon's 650+ icons can still match
  return withoutJs.replace(/[^a-z0-9]/g, "");
};

const checkIconExists = async (
  url: string,
): Promise<{ ok: boolean; networkError: boolean }> => {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      next: { revalidate: 86400 },
    });
    return { ok: response.ok, networkError: false };
  } catch {
    return { ok: false, networkError: true };
  }
};

const resolveTechIconUrl = async (slug: string): Promise<string> => {
  if (!slug) return "/tech.svg";

  const cached = resolvedIconCache.get(slug);
  if (cached) return cached;

  const variants = PREFERRED_VARIANTS[slug] ?? DEFAULT_VARIANTS;
  let hadNetworkError = false;

  for (const variant of variants) {
    const candidate = `${techIconBaseURL}/${slug}/${slug}-${variant}.svg`;
    const { ok, networkError } = await checkIconExists(candidate);
    if (ok) {
      resolvedIconCache.set(slug, candidate);
      return candidate;
    }
    if (networkError) {
      hadNetworkError = true;
      break;
    }
  }

  if (!hadNetworkError) {
    resolvedIconCache.set(slug, "/tech.svg");
  }
  return "/tech.svg";
};

export const getTechLogos = async (techArray: string[]) => {
  const safeTechs = (techArray ?? []).filter(
    (tech): tech is string => typeof tech === "string" && tech.trim().length > 0,
  );

  const results = await Promise.all(
    safeTechs.map(async (tech) => {
      const normalized = normalizeTechName(tech);
      const url = await resolveTechIconUrl(normalized);
      return { tech, url };
    }),
  );

  return results;
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};
