import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

type TopRightIconActionProps = {
  icon: "arrow-forward" | "checkmark";
  onPress: () => void;
  disabled?: boolean;
};

export function TopRightIconAction({ icon, onPress, disabled = false }: TopRightIconActionProps) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={disabled ? "#64748B" : "#FFFFFF"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  actionButtonDisabled: {
    backgroundColor: "#1E293B",
    shadowOpacity: 0,
  },
});