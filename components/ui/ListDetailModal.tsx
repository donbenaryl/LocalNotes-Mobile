import { View } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { ListDetailsMain } from "@/components/PageComponents/List/ListDetails/ListDetailsMain";

interface ListDetailModalProps {
  visible: boolean;
  onClose: () => void;
  listId: string | null;
}

export function ListDetailModal({
  visible,
  onClose,
  listId,
}: ListDetailModalProps) {
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
          <ListDetailsMain listId={listId} onClose={onClose} />
        ) : null}
      </View>
    </Modal>
  );
}
