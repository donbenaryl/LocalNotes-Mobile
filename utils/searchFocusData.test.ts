import { mapListItemToFollowPick, mergeSuggestions } from "@/utils/searchFocusData";
import type { ListItemPublic } from "@/http/list-api/types";

function makeItem(overrides: Partial<ListItemPublic> = {}): ListItemPublic {
  return {
    id: "item-1",
    business_name: "Skyline Lounge",
    business_id: null,
    is_verified: false,
    is_favorite: false,
    is_owner: false,
    owner: { id: "u1", name: "Ana", username: "ana", profile_image: null },
    description: " Great views ",
    tags: [],
    categories: ["Bars"],
    images: [{ url: "https://img/1.jpg" }],
    list_usage_count: 0,
    location: { city: "Austin" },
    ...overrides,
  } as unknown as ListItemPublic;
}

describe("mapListItemToFollowPick", () => {
  it("maps a full item and omits a null match", () => {
    const pick = mapListItemToFollowPick(makeItem());
    expect(pick).toMatchObject({
      id: "item-1",
      ownerId: "u1",
      title: "Skyline Lounge",
      category: "Bars",
      place: "Austin",
      username: "ana",
      imageUrl: "https://img/1.jpg",
      reason: "Great views",
    });
    expect(pick).not.toHaveProperty("matchPercent");
  });

  it("returns null without a title or image", () => {
    expect(mapListItemToFollowPick(makeItem({ business_name: null }))).toBeNull();
    expect(mapListItemToFollowPick(makeItem({ images: [] }))).toBeNull();
  });

  it("falls back to the author's name and empty place", () => {
    const pick = mapListItemToFollowPick(
      makeItem({
        owner: { id: "u1", name: "Ana", username: null, profile_image: null },
        location: null,
      }),
    );
    expect(pick?.username).toBe("Ana");
    expect(pick?.place).toBe("");
  });
});

describe("mergeSuggestions", () => {
  it("puts server rows first, dedupes case-insensitively and caps", () => {
    const merged = mergeSuggestions(
      [{ label: "tacos", source: "your_searches" }],
      [
        { label: "Tacos", source: "vibe_answers" },
        { label: "Quiet places", source: "vibe_answers" },
      ],
      2,
    );
    expect(merged.map((r) => r.label)).toEqual(["tacos", "Quiet places"]);
  });
});
