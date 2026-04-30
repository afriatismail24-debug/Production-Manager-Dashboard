import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ModalShell } from "@/components/ModalShell";
import { TextField } from "@/components/TextField";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { ProductionItem } from "@/types";

const empty = (): ProductionItem => ({ name: "", color: "", quantity: "", note: "" });

export default function ProductionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = params.editId;
  const app = useApp();

  const editing = useMemo(
    () => (editId ? app.productions.find((p) => p.id === editId) ?? null : null),
    [editId, app.productions],
  );

  const chef = app.chefs.find((c) => c.id === app.session?.userId);
  const [items, setItems] = useState<ProductionItem[]>(
    editing ? editing.items.map((i) => ({ ...i })) : [empty()],
  );

  useEffect(() => {
    if (editing) {
      setItems(editing.items.map((i) => ({ ...i })));
    }
  }, [editing]);

  const update = (i: number, key: keyof ProductionItem, value: string) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)),
    );
  };

  const addRow = () => setItems((p) => [...p, empty()]);
  const removeRow = (i: number) =>
    setItems((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));

  const submit = async () => {
    if (!chef) return;
    const valid = items.filter(
      (i) => i.name.trim().length > 0 && i.quantity.trim().length > 0,
    );
    if (valid.length === 0) {
      Alert.alert("Add at least one item with name and quantity.");
      return;
    }
    if (editing) {
      await app.updateProduction(editing.id, items);
    } else {
      await app.submitProduction(chef.id, chef.name, items);
    }
    router.back();
  };

  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <ModalShell
      title={editing ? "Edit production" : "Submit production"}
      subtitle={editing ? "You can still update or delete this entry." : "Add every item produced this session."}
    >
      <KeyboardAwareScrollView
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 18,
          paddingBottom: insets.bottom + webBottom + 24,
          gap: 12,
        }}
      >
        {items.map((it, i) => (
          <Card key={i}>
            <View style={styles.itemHead}>
              <View style={[styles.numCircle, { backgroundColor: colors.accent }]}>
                <Text
                  style={{
                    color: colors.accentForeground,
                    fontFamily: "Inter_700Bold",
                    fontSize: 12,
                  }}
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: "Inter_700Bold",
                  color: colors.foreground,
                  fontSize: 15,
                }}
              >
                Item {i + 1}
              </Text>
              {items.length > 1 ? (
                <Pressable onPress={() => removeRow(i)} hitSlop={8}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </Pressable>
              ) : null}
            </View>

            <View style={{ marginTop: 12, gap: 10 }}>
              <TextField
                label="Trouser name"
                placeholder="e.g. Slim chinos"
                value={it.name}
                onChangeText={(t) => update(i, "name", t)}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextField
                  label="Color"
                  placeholder="e.g. Navy"
                  value={it.color}
                  onChangeText={(t) => update(i, "color", t)}
                  containerStyle={{ flex: 1 }}
                />
                <TextField
                  label="Quantity"
                  placeholder="e.g. 24"
                  value={it.quantity}
                  onChangeText={(t) => update(i, "quantity", t)}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>
              <TextField
                label="Note (optional)"
                placeholder="Any context for this batch…"
                value={it.note}
                onChangeText={(t) => update(i, "note", t)}
                multiline
                numberOfLines={2}
                style={{ minHeight: 60, textAlignVertical: "top" }}
              />
            </View>
          </Card>
        ))}

        <Pressable
          onPress={addRow}
          style={[
            styles.addRow,
            { borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Feather name="plus" size={16} color={colors.primary} />
          <Text
            style={{
              color: colors.primary,
              fontFamily: "Inter_600SemiBold",
              fontSize: 13,
            }}
          >
            Add item
          </Text>
        </Pressable>

        <Button
          label={editing ? "Save changes" : "Submit production"}
          icon="check"
          onPress={submit}
          fullWidth
          size="lg"
          style={{ marginTop: 6 }}
        />
      </KeyboardAwareScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  itemHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  numCircle: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderStyle: "dashed",
  },
});
