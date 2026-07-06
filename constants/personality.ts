import { QuestionGroup } from "@/types/personality";


export const MIN_SUBMITTING_DISPLAY_MS = 2000;

export const QUESTION_GROUPS: QuestionGroup[] = [
  {
    sectionKey: 'vibeAtmosphere',
    range: '1-5',
    items: [
      { id: 1, question: 'Ambiance or Taste?', leftLabel: 'Ambiance', rightLabel: 'Taste', leftColor: '#3B82F6', rightColor: '#EF4444' },
      { id: 2, question: 'Loud and Lively or Quiet and Peaceful?', leftLabel: 'Loud and Lively', rightLabel: 'Quiet and Peaceful', leftColor: '#EF4444', rightColor: '#3B82F6' },
      { id: 3, question: 'Popular Spot or Hidden Gem?', leftLabel: 'Popular Spot', rightLabel: 'Hidden Gem', leftColor: '#F59E0B', rightColor: '#E76E04' },
      { id: 4, question: 'Cultural Experience or Scenic View?', leftLabel: 'Cultural Experience', rightLabel: 'Scenic View', leftColor: '#10B981', rightColor: '#008080' },
      { id: 5, question: 'Morning Coffee Shop or Late Night Lounge?', leftLabel: 'Morning Coffee Shop', rightLabel: 'Late Night Lounge', leftColor: '#3B82F6', rightColor: '#EF4444' },
    ],
  },
  {
    sectionKey: 'styleApproach',
    range: '6-10',
    items: [
      { id: 6, question: 'Spontaneous Adventure or Well-Planned Day?', leftLabel: 'Spontaneous Adventure', rightLabel: 'Well-Planned Day', leftColor: '#E76E04', rightColor: '#008080' },
      { id: 7, question: 'Visual Aesthetic or Comfort?', leftLabel: 'Visual Aesthetic', rightLabel: 'Comfort', leftColor: '#8B5CF6', rightColor: '#A9A9A9' },
      { id: 8, question: 'Nature Hike or City Walk?', leftLabel: 'Nature Hike', rightLabel: 'City Walk', leftColor: '#10B981', rightColor: '#F59E0B' },
      { id: 9, question: 'Budget-Friendly or Premium Experience?', leftLabel: 'Budget-Friendly', rightLabel: 'Premium Experience', leftColor: '#A9A9A9', rightColor: '#8B5CF6' },
      { id: 10, question: 'Big Group Outing or Solo Exploration?', leftLabel: 'Big Group Outing', rightLabel: 'Solo Exploration', leftColor: '#F59E0B', rightColor: '#3B82F6' },
    ],
  },
  {
    sectionKey: 'tasteDiscovery',
    range: '11-15',
    items: [
      { id: 11, question: 'High Design or Down-to-Earth?', leftLabel: 'High Design', rightLabel: 'Down-to-Earth', leftColor: '#8B5CF6', rightColor: '#10B981' },
      { id: 12, question: 'Beach Day or Mountain Getaway?', leftLabel: 'Beach Day', rightLabel: 'Mountain Getaway', leftColor: '#F59E0B', rightColor: '#10B981' },
      { id: 13, question: 'Known Crowd or New Faces?', leftLabel: 'Known Crowd', rightLabel: 'New Faces', leftColor: '#3B82F6', rightColor: '#F59E0B' },
      { id: 14, question: 'Food-Driven or Atmosphere-Driven Experience?', leftLabel: 'Food-Driven', rightLabel: 'Atmosphere-Driven Experience', leftColor: '#EF4444', rightColor: '#3B82F6' },
      { id: 15, question: 'Structured Activity or Freestyle Wandering?', leftLabel: 'Structured Activity', rightLabel: 'Freestyle Wandering', leftColor: '#008080', rightColor: '#E76E04' },
    ],
  },
  {
    sectionKey: 'environmentMovement',
    range: '16-20',
    items: [
      { id: 16, question: 'Casual Spot or Upscale Venue?', leftLabel: 'Casual Spot', rightLabel: 'Upscale Venue', leftColor: '#A9A9A9', rightColor: '#8B5CF6' },
      { id: 17, question: 'Artistic Environment or Functional Simplicity?', leftLabel: 'Artistic Environment', rightLabel: 'Functional Simplicity', leftColor: '#8B5CF6', rightColor: '#008080' },
      { id: 18, question: 'Frequent Familiar Places or Constantly Discover New Ones?', leftLabel: 'Frequent Familiar Places', rightLabel: 'Constantly Discover New Ones', leftColor: '#3B82F6', rightColor: '#E76E04' },
      { id: 19, question: 'Indoor Relaxation or Outdoor Movement?', leftLabel: 'Indoor Relaxation', rightLabel: 'Outdoor Movement', leftColor: '#008080', rightColor: '#EF4444' },
      { id: 20, question: 'Active Adventure or Calm Observation?', leftLabel: 'Active Adventure', rightLabel: 'Calm Observation', leftColor: '#E76E04', rightColor: '#3B82F6' },
    ],
  },
  {
    sectionKey: 'energyPlanning',
    range: '21-25',
    items: [
      { id: 21, question: 'Guided Experience or Self-Exploration?', leftLabel: 'Guided Experience', rightLabel: 'Self-Exploration', leftColor: '#10B981', rightColor: '#E76E04' },
      { id: 22, question: 'Low-Intensity Hike or High-Intensity Hike?', leftLabel: 'Low-Intensity Hike', rightLabel: 'High-Intensity Hike', leftColor: '#008080', rightColor: '#EF4444' },
      { id: 23, question: 'Wellness-Focused Spot or High-Energy Experience?', leftLabel: 'Wellness-Focused Spot', rightLabel: 'High-Energy Experience', leftColor: '#008080', rightColor: '#F59E0B' },
      { id: 24, question: 'Local Favorites or Trendy New Openings?', leftLabel: 'Local Favorites', rightLabel: 'Trendy New Openings', leftColor: '#10B981', rightColor: '#EF4444' },
      { id: 25, question: 'Fast Paced Energy or Relaxed Vibe?', leftLabel: 'Fast Paced Energy', rightLabel: 'Relaxed Vibe', leftColor: '#EF4444', rightColor: '#008080' },
    ],
  },
];