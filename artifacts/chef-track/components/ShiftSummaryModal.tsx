import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { fmtDuration } from "@/lib/format";

interface Props {
  visible: boolean;
  date: Date | null;
  onDownloadPdf: () => Promise<void>;
  onClose: () => void;
}

export function ShiftSummaryModal({ visible, date, onDownloadPdf, onClose }: Props) {
  const colors = useColors();
  const app = useApp();
  const [downloading, setDownloading] = React.useState(false);

  const productions = app.todayProductionsAll();
  const problems = app.todayProblemsAll();

  const chefRows = app.chefs.map((chef) => {
    const prods = productions.filter((p) => p.chefId === chef.id);
    const probs = problems.filter((p) => p.chefId === chef.id);
    const qty = prods.reduce(
      (acc, p) =>
        acc + p.items.reduce((s, it) => { const n = parseFloat(it.quantity); return s + (isNaN(n) ? 0 : n); }, 0),
      0,
    );
    const ws = app.todayWorkSessionsAll().filter((w) => w.userId === chef.id);
    const totalMs = ws.reduce((acc, w) => acc + ((w.checkOutAt ?? Date.now()) - w.checkInAt), 0);
    return { chef, qty, submissionCount: prods.length, problemCount: probs.length, totalMs };
  });

  const grandQty = chefRows.reduce((a, r) => a + r.qty, 0);
  const grandProblems = problems.length;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownloadPdf();
    } finally {
      setDownloading(false);
    }
  };

  const dateStr = date?.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  }) ?? "";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Feather name="check-circle" size={18} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>Shift complete</Text>
            </View>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>{dateStr}</Text>
          </View>

          <View style={[styles.totalsRow, { borderBottomColor: colors.border }]}>
            <View style={styles.totalBox}>
              <Text style={[styles.totalNum, { color: colors.primary }]}>{grandQty}</Text>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total pieces</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.totalBox}>
              <Text style={[styles.totalNum, { color: grandProblems > 0 ? colors.destructive : colors.foreground }]}>
                {grandProblems}
              </Text>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Problems</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.totalBox}>
              <Text style={[styles.totalNum, { color: colors.foreground }]}>{app.chefs.length}</Text>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Operators</Text>
            </View>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 12 }}>
            {chefRows.map(({ chef, qty, submissionCount, problemCount, totalMs }) => (
              <View key={chef.id} style={[styles.chefRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chefName, { color: colors.foreground }]}>{chef.name}</Text>
                  <Text style={[styles.chefMeta, { color: colors.mutedForeground }]}>
                    {submissionCount} submission{submissionCount !== 1 ? "s" : ""} · {fmtDuration(totalMs)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={[styles.qty, { color: colors.primary }]}>{qty} pcs</Text>
                  {problemCount > 0 ? (
                    <Text style={[styles.probs, { color: colors.destructive }]}>
                      {problemCount} prob.
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              onPress={handleDownload}
              disabled={downloading}
              style={[styles.downloadBtn, { backgroundColor: colors.primary, opacity: downloading ? 0.7 : 1 }]}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Feather name="download" size={16} color="white" />
              )}
              <Text style={styles.downloadText}>
                {downloading ? "Preparing PDF…" : "Download PDF"}
              </Text>
            </Pressable>
            <Pressable onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
              <Text style={[styles.closeText, { color: colors.mutedForeground }]}>Close without PDF</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: "80%",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  date: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginLeft: 2,
  },
  totalsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  totalBox: {
    flex: 1,
    alignItems: "center",
  },
  totalNum: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 26,
  },
  totalLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    marginVertical: 4,
  },
  scroll: {
    maxHeight: 260,
    paddingHorizontal: 20,
  },
  chefRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chefName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  chefMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  qty: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  probs: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  actions: {
    padding: 20,
    gap: 10,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 50,
    borderRadius: 14,
  },
  downloadText: {
    color: "white",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  closeBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
