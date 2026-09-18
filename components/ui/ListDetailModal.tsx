import { View } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { ListDetailsMain } from "@/components/PageComponents/List/ListDetails/ListDetailsMain";
import { useLocalSearchParams, usePathname } from "expo-router";
import type { ListItemDAO } from "@/http/list-api/types";
import type { ViewOrigin } from "@/http/types";
import { resolveViewOrigin } from "@/utils/viewTracking";

interface ListDetailModalProps {
  visible: boolean;
  onClose: () => void;
  listId: string | null;
  viewOrigin?: ViewOrigin;
  /** Seed list-detail cache so first open can paint without a skeleton. */
  initialList?: ListItemDAO | null;
}

export function ListDetailModal({
  visible,
  onClose,
  listId,
  viewOrigin,
  initialList = null,
}: ListDetailModalProps) {
  const pathname = usePathname();
  const { origin } = useLocalSearchParams<{ origin?: string }>();
  const resolvedViewOrigin = resolveViewOrigin({
    explicitOrigin: viewOrigin,
    pathname,
    queryOrigin: origin,
  });

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      withCloseIcon={false}
      avoidKeyboard={false}
      sheetClassName="pb-10"
    >
      <View className="-mx-8">
        {listId ? (
          <ListDetailsMain
            listId={listId}
            onClose={onClose}
            viewOrigin={resolvedViewOrigin}
            visible={visible}
            initialList={initialList}
          />
        ) : null}
      </View>
    </Modal>
  );
}
