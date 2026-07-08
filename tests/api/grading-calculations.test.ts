import { describe, expect, it } from "vitest";
import {
  calculateTaskPenalty,
  calculateReportPenalty,
  calculateTotalScore,
  scoreToGrade,
  clampScore,
} from "@/lib/grading/calculations";

describe("calculateTaskPenalty", () => {
  it("matches spec example: normal task, 3 days late", () => {
    expect(
      calculateTaskPenalty({ daysLate: 3, penaltyPerDayLate: 5, gradeWeight: 1.0, maxPenaltyPerItem: 100 })
    ).toBe(15);
  });

  it("matches spec example: critical task, 3 days late", () => {
    expect(
      calculateTaskPenalty({ daysLate: 3, penaltyPerDayLate: 5, gradeWeight: 2.0, maxPenaltyPerItem: 100 })
    ).toBe(30);
  });

  it("caps at max_penalty_per_item", () => {
    expect(
      calculateTaskPenalty({ daysLate: 100, penaltyPerDayLate: 5, gradeWeight: 2.0, maxPenaltyPerItem: 100 })
    ).toBe(100);
  });
});

describe("calculateReportPenalty", () => {
  it("full penalty when missed", () => {
    expect(calculateReportPenalty({ missed: true, penaltyPerMissed: 10 })).toBe(10);
  });

  it("half penalty when late", () => {
    expect(calculateReportPenalty({ missed: false, penaltyPerMissed: 10 })).toBe(5);
  });
});

describe("calculateTotalScore / scoreToGrade", () => {
  it("weights task and report scores", () => {
    const total = calculateTotalScore({
      taskScore: 100,
      reportScore: 70,
      taskWeightPercent: 60,
      reportWeightPercent: 40,
    });
    expect(total).toBe(88);
    expect(scoreToGrade(total)).toBe("B");
  });

  it("grade boundaries", () => {
    expect(scoreToGrade(90)).toBe("A");
    expect(scoreToGrade(80)).toBe("B");
    expect(scoreToGrade(70)).toBe("C");
    expect(scoreToGrade(60)).toBe("D");
    expect(scoreToGrade(59.9)).toBe("F");
  });
});

describe("clampScore", () => {
  it("clamps below zero and above 100", () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(150)).toBe(100);
    expect(clampScore(42)).toBe(42);
  });
});
