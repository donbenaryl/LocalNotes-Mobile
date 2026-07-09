import { Toggle } from "@/components/ui/Toggle";

export type SavedSubTab = "lists" | "picks";

interface SavedListsPicksToggleProps {
  activeTab: SavedSubTab;
  onChange: (tab: SavedSubTab) => void;
  listsLabel: string;
  picksLabel: string;
}

export function SavedListsPicksToggle({
  activeTab,
  onChange,
  listsLabel,
  picksLabel,
}: SavedListsPicksToggleProps) {
  return (
    <Toggle
      value={activeTab}
      onChange={onChange}
      options={[
        { value: "lists", label: listsLabel },
        { value: "picks", label: picksLabel },
      ]}
      className="mb-4 self-start"
    />
  );
}
