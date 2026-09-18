import { View } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { ListDetailsMain } from "@/components/PageComponents/List/ListDetails/ListDetailsMain";
import { useLocalSearchParams, usePathname } from "expo-router";
import type { ViewOrigin } from "@/http/types";
import { resolveViewOrigin } from "@/utils/viewTracking";

interface ListDetailModalProps {
  visible: boolean;
  onClose: () => void;
  listId: string | null;
  viewOrigin?: ViewOrigin;
}

export function ListDetailModal({
  visible,
  onClose,
  listId,
  viewOrigin,
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
      sheetClassName="pb-10"
    >
      <View className="-mx-8">
        {listId ? (
          <ListDetailsMain
            listId={listId}
            onClose={onClose}
            viewOrigin={resolvedViewOrigin}
          />
        ) : null}
      </View>
    </Modal>
  );
}
