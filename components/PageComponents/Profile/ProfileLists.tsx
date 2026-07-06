import { ProfileListTabContent } from "./ProfileListTabContent";

interface ProfileListsProps {
  status?: string;
}

/** @deprecated Use ProfileListTabContent with a category prop instead. */
export function ProfileLists({ status = "Published" }: ProfileListsProps) {
  return (
    <ProfileListTabContent
      category="my-lists"
      userId=""
      selectedCategory="All"
      selectedStatus={status}
    />
  );
}
