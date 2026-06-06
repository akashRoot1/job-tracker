import { ApplicationStatus } from "@prisma/client";
import type { ClassificationResult } from "@/email/types";

const JOB_SOURCES = [
  "linkedin", "indeed", "workday", "greenhouse", "lever", "smartrecruiters",
  "reperio", "cpl", "morgan mckinley", "solas it", "careers", "recruiter",
  "talent", "workable", "bamboohr", "jobvite", "ashby", "icims"
];

const ROLE_HINTS = [
  "qa", "quality assurance", "automation", "performance testing", "software testing",
  "test engineer", "sdet", "data analyst", "business analyst", "software engineer",
  "manual tester", "test analyst"
];

const STATUS_RULES: Array<{ status: ApplicationStatus; terms: string[] }> = [
  { status: "OFFER", terms: ["pleased to offer", "job offer", "offer letter", "we would like to offer"] },
  { status: "REJECTED", terms: ["unfortunately", "regret to inform", "not selected", "not moving forward", "unsuccessful", "not shortlisted"] },
  { status: "WITHDRAWN", terms: ["withdrawn", "you withdrew", "application has been withdrawn"] },
  { status: "TECHNICAL_INTERVIEW", terms: ["technical interview", "coding interview", "technical round", "pairing session"] },
  { status: "HR_INTERVIEW", terms: ["hr interview", "people interview", "culture interview"] },
  { status: "INTERVIEW_SCHEDULED", terms: ["interview", "teams meeting", "zoom meeting", "google meet", "calendar invite"] },
  { status: "RECRUITER_CALL", terms: ["recruiter call", "phone screen", "introductory call", "quick call", "screening call"] },
  { status: "ASSESSMENT_TEST", terms: ["assessment", "test", "take-home", "hackerrank", "codility", "assignment"] },
  { status: "UNDER_REVIEW", terms: ["under review", "reviewing your application", "hiring team is reviewing"] },
  { status: "APPLICATION_RECEIVED", terms: ["application received", "received your application", "thank you for applying"] },
  { status: "APPLIED", terms: ["applied", "application submitted", "your application"] }
];

export function classifyJobEmail(emailText: string, subject = "", sender = ""): ClassificationResult {
  const sourceText = `${subject}\n${sender}\n${emailText}`.replace(/\s+/g, " ").trim();
  const lower = sourceText.toLowerCase();
  const source = detectSource(lower, sender);
  const status = detectStatus(lower);
  const roleRelevant = ROLE_HINTS.some(term => lower.includes(term));
  const position = status !== "NEEDS_REVIEW" || source || roleRelevant ? detectPosition(sourceText) : null;
  const company = status !== "NEEDS_REVIEW" || source || roleRelevant ? detectCompany(sourceText, sender) : null;
  const rejectionReason = status === "REJECTED" ? detectRejectionReason(lower) : null;
  const interview = detectInterview(sourceText);
  const isJobRelated = Boolean(source || company || position || status !== "NEEDS_REVIEW" || roleRelevant);
  const confidence = score({ isJobRelated, company, position, status, source, roleRelevant, hasInterview: Boolean(interview.date) });

  return {
    isJobRelated,
    company,
    position,
    status: isJobRelated ? status : "NEEDS_REVIEW",
    rejectionReason,
    interviewDate: interview.date,
    interviewType: interview.type,
    meetingLink: interview.meetingLink,
    contactPerson: interview.contactPerson,
    confidence,
    summary: summarize(status, company, position, rejectionReason, interview.date),
    source
  };
}

export async function classifyJobEmailWithAiFallback(emailText: string, subject = "", sender = "") {
  const ruleBased = classifyJobEmail(emailText, subject, sender);
  if (ruleBased.confidence >= 0.72 || process.env.OPENAI_API_KEY === undefined) return ruleBased;
  // LLM integration hook: send subject, sender, and emailText to an extraction model and validate the JSON.
  return ruleBased;
}

function detectStatus(lower: string): ApplicationStatus {
  for (const rule of STATUS_RULES) {
    if (rule.terms.some(term => lower.includes(term))) return rule.status;
  }
  return "NEEDS_REVIEW";
}

function detectSource(lower: string, sender: string) {
  const combined = `${lower} ${sender.toLowerCase()}`;
  return JOB_SOURCES.find(source => combined.includes(source)) ?? null;
}

function detectPosition(text: string) {
  const patterns = [
    /(?:for|regarding|about|to)\s+(?:the\s+)?([A-Z][A-Za-z0-9+#/&.,\s-]{2,90}?)\s+(?:position|role|job|vacancy|application)\b/i,
    /(?:position|role|job|vacancy)\s+(?:of|as|for)\s+([A-Z][A-Za-z0-9+#/&.,\s-]{2,90}?)(?:\s+at|\s+with|\.|,|$)/i,
    /(?:interview|assessment|call|offer)\s+for\s+([A-Z][A-Za-z0-9+#/&.,\s-]{2,90}?)(?:\s+-|\s+at|\s+with|\.|,|$)/i
  ];
  return clean(firstMatch(text, patterns));
}

function detectCompany(text: string, sender: string) {
  const senderDomain = sender.split("@")[1]?.split(".")[0];
  const patterns = [
    /(?:at|with|to)\s+([A-Z][A-Za-z0-9&.,\s-]{2,70}?)(?:\.|,|\s+for|\s+regarding|\s+team|\s+careers|\s+application|$)/i,
    /(?:from|by)\s+([A-Z][A-Za-z0-9&.,\s-]{2,70}?)(?:\s+careers|\s+recruitment|\s+talent|\.|,|$)/i,
    /-\s*([A-Z][A-Za-z0-9&.,\s-]{2,70})$/i
  ];
  const match = clean(firstMatch(text, patterns));
  if (match) return match;
  if (!senderDomain || ["gmail", "outlook", "hotmail", "linkedin", "indeed", "greenhouse", "lever", "workday"].includes(senderDomain)) return null;
  return titleCase(senderDomain.replace(/[-_]/g, " "));
}

function detectRejectionReason(lower: string) {
  if (lower.includes("more experienced")) return "More experienced candidates selected";
  if (lower.includes("role has been filled") || lower.includes("position has been filled")) return "Role filled";
  if (lower.includes("visa") || lower.includes("work authorization") || lower.includes("work authorisation")) return "Visa/work authorization issue";
  if (lower.includes("skills") || lower.includes("experience does not match")) return "Skills mismatch";
  if (lower.includes("location") || lower.includes("relocation")) return "Location mismatch";
  if (lower.includes("salary") || lower.includes("compensation")) return "Salary mismatch";
  if (lower.includes("not shortlisted")) return "Not shortlisted";
  return "No reason provided";
}

function detectInterview(text: string) {
  const lower = text.toLowerCase();
  const meetingLink = text.match(/https?:\/\/(?:www\.)?(?:teams\.microsoft\.com|zoom\.us|meet\.google\.com|calendly\.com)[^\s)]+/i)?.[0] ?? null;
  const dateText = text.match(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?\.?\s?\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}(?:\s+at\s+\d{1,2}:\d{2}\s?(?:AM|PM)?)?/i)?.[0] ?? null;
  const date = dateText ? parseHumanDate(dateText) : null;
  const contactPerson = text.match(/(?:with|contact person:|recruiter:)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/)?.[1] ?? null;
  let type: string | null = null;
  if (lower.includes("technical")) type = "technical interview";
  else if (lower.includes("hr interview")) type = "HR interview";
  else if (lower.includes("final interview")) type = "final interview";
  else if (lower.includes("phone") || lower.includes("call")) type = "phone call";
  else if (lower.includes("recruiter")) type = "recruiter screen";
  return { date, meetingLink, contactPerson, type };
}

function parseHumanDate(value: string) {
  const match = value.match(/(\d{1,2})\s([A-Za-z]+)\s(\d{4})(?:\s+at\s+(\d{1,2}):(\d{2})\s?(AM|PM)?)?/i);
  if (!match) return value;
  const months: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
  };
  const day = Number(match[1]);
  const month = months[match[2].toLowerCase()];
  const year = Number(match[3]);
  let hour = Number(match[4] ?? 9);
  const minute = Number(match[5] ?? 0);
  const meridiem = match[6]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (month === undefined) return value;
  return new Date(Date.UTC(year, month, day, hour, minute)).toISOString();
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function clean(value: string | null) {
  if (!value) return null;
  return value
    .replace(/\b(application|position|role|job|vacancy|team|careers|recruitment)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[,\s-]+|[,\s-]+$/g, "")
    .trim() || null;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, letter => letter.toUpperCase());
}

function summarize(status: ApplicationStatus, company: string | null, position: string | null, reason: string | null, interviewDate: string | null) {
  const base = `${company ?? "Unknown company"} - ${position ?? "Unknown position"} classified as ${status.replaceAll("_", " ").toLowerCase()}.`;
  if (reason) return `${base} Rejection reason: ${reason}.`;
  if (interviewDate) return `${base} Interview/call detected for ${interviewDate}.`;
  return base;
}

function score(input: {
  isJobRelated: boolean;
  company: string | null;
  position: string | null;
  status: ApplicationStatus;
  source: string | null;
  roleRelevant: boolean;
  hasInterview: boolean;
}) {
  let score = input.isJobRelated ? 0.3 : 0;
  if (input.company) score += 0.18;
  if (input.position) score += 0.2;
  if (input.status !== "NEEDS_REVIEW") score += 0.18;
  if (input.source) score += 0.08;
  if (input.roleRelevant) score += 0.04;
  if (input.hasInterview) score += 0.05;
  return Math.min(0.98, Number(score.toFixed(2)));
}
