import { describe, expect, it } from "vitest";
import { classifyJobEmail } from "@/email/classifier";

describe("classifyJobEmail", () => {
  it("detects application confirmation emails", () => {
    const result = classifyJobEmail(
      "Thank you for applying for the QA Automation Engineer position at NovaTech Dublin. Your application is under review.",
      "Application received for QA Automation Engineer at NovaTech Dublin",
      "careers@novatech.ie"
    );
    expect(result.isJobRelated).toBe(true);
    expect(result.company).toContain("NovaTech");
    expect(result.position).toContain("QA Automation Engineer");
    expect(result.status).toBe("UNDER_REVIEW");
  });

  it("detects rejection reasons", () => {
    const result = classifyJobEmail(
      "Unfortunately you were not shortlisted for the Data Analyst role with CPL. More experienced candidates were selected.",
      "Update on Data Analyst role with CPL",
      "recruitment@cpl.ie"
    );
    expect(result.status).toBe("REJECTED");
    expect(result.rejectionReason).toBe("More experienced candidates selected");
  });

  it("detects interview invites", () => {
    const result = classifyJobEmail(
      "We would like to invite you to a technical interview for the Performance Test Engineer role at Reperio on 12 June 2026 at 10:30 AM with Aoife Byrne. Join: https://teams.microsoft.com/l/meetup-join/example",
      "Technical interview for Performance Test Engineer - Reperio",
      "aoife@reperio.ie"
    );
    expect(result.status).toBe("TECHNICAL_INTERVIEW");
    expect(result.interviewType).toBe("technical interview");
    expect(result.meetingLink).toContain("teams.microsoft.com");
  });

  it("detects recruiter calls", () => {
    const result = classifyJobEmail(
      "Can we schedule a recruiter call for the Test Analyst role at Solas IT on 10 June 2026 at 2:00 PM?",
      "Recruiter call for Test Analyst at Solas IT",
      "talent@solasit.ie"
    );
    expect(result.status).toBe("RECRUITER_CALL");
    expect(result.interviewType).toBe("phone call");
  });

  it("detects job offers", () => {
    const result = classifyJobEmail(
      "We are pleased to offer you the Software Testing Consultant role at Morgan McKinley.",
      "Offer for Software Testing Consultant at Morgan McKinley",
      "jobs@morganmckinley.ie"
    );
    expect(result.status).toBe("OFFER");
  });

  it("does not classify generic non-job emails as job related", () => {
    const result = classifyJobEmail(
      "Your monthly electricity bill is available.",
      "Your electricity bill is ready",
      "billing@exampleutility.ie"
    );
    expect(result.isJobRelated).toBe(false);
    expect(result.status).toBe("NEEDS_REVIEW");
  });
});
