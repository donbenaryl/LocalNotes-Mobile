import { buildSearchSuggestions } from "@/utils/buildSearchSuggestions";
import type { UserProfileData } from "@/http/account-api/types";

function makeProfile(sides: Array<{ label: string; side: "left" | "right" }>): UserProfileData {
  return {
    color_breakdown: {},
    tags: "",
    description: "",
    trait_scores: sides.map((entry, index) => ({
      trait: {
        id: String(index),
        left_side: {
          label: entry.side === "left" ? entry.label : "Other Left",
          color: "#000",
          slug: "left",
        },
        right_side: {
          label: entry.side === "right" ? entry.label : "Other Right",
          color: "#fff",
          slug: "right",
        },
      },
      left_value: entry.side === "left" ? 70 : 30,
      right_value: entry.side === "right" ? 70 : 30,
    })),
  };
}

describe("buildSearchSuggestions", () => {
  it("maps dominant vibe answers and often-used vibes with dedupe", () => {
    const rows = buildSearchSuggestions({
      profile: makeProfile([
        { label: "Quiet and Peaceful", side: "right" },
        { label: "Hidden Gem", side: "right" },
        { label: "Outdoor Movement", side: "right" },
      ]),
      recentVibes: ["Peaceful", "Quiet"],
    });

    expect(rows.map((r) => r.label)).toEqual([
      "Quiet places",
      "Hidden gems",
      "Outdoor spots",
      "Peaceful spots",
    ]);
    expect(rows.every((r) => r.source === "vibe_answers" || r.source === "vibe_often")).toBe(
      true,
    );
  });

  it("returns empty when there is nothing to suggest", () => {
    expect(
      buildSearchSuggestions({
        profile: null,
        recentVibes: [],
      }),
    ).toEqual([]);
  });
});
