import * as Haptics from 'expo-haptics';
import React from "react";
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";

export type ChipOption = {
  label: string;
  icon?: string;
};

export type ChipStyles = {
  chipsRow?: ViewStyle;
  chip?: ViewStyle;
  chipSelected?: ViewStyle;
  chipText?: TextStyle;
  chipTextSelected?: TextStyle;
  chipIcon?: TextStyle;
};

interface ChipsProps {
  options: ChipOption[];
  selected: string;
  onSelect: (label: string) => void;
  styles?: ChipStyles;
}

export function Chips({ options, selected, onSelect, styles: customStyles = {} }: ChipsProps) {
  const handleSelect = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(label);
  };

  return (
    <View style={[defaultStyles.chipsRow, customStyles.chipsRow]}> 
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.label}
          style={[
            defaultStyles.chip, 
            customStyles.chip, 
            selected === opt.label && [defaultStyles.chipSelected, customStyles.chipSelected]
          ]}
          onPress={() => handleSelect(opt.label)}
          activeOpacity={0.7}
        >
          {opt.icon ? <Text style={[defaultStyles.chipIcon, customStyles.chipIcon]}>{opt.icon}</Text> : null}
          <Text style={[
            defaultStyles.chipText, 
            customStyles.chipText, 
            selected === opt.label && [defaultStyles.chipTextSelected, customStyles.chipTextSelected]
          ]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const defaultStyles = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    margin: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipSelected: {
    backgroundColor: '#10B981', // Emerald Emerald
    borderColor: '#10B981',
  },
  chipIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  chipText: {
    color: '#94A3B8', // Slate 400
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
