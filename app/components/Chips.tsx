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
  return (
    <View style={[defaultStyles.chipsRow, customStyles.chipsRow]}> 
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.label}
          style={[defaultStyles.chip, customStyles.chip, selected === opt.label && [defaultStyles.chipSelected, customStyles.chipSelected]]}
          onPress={() => onSelect(opt.label)}
          activeOpacity={0.7}
        >
          {opt.icon ? <Text style={[defaultStyles.chipIcon, customStyles.chipIcon]}>{opt.icon}</Text> : null}
          <Text style={[defaultStyles.chipText, customStyles.chipText, selected === opt.label && [defaultStyles.chipTextSelected, customStyles.chipTextSelected]]}>{opt.label}</Text>
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
    marginBottom: 12,
    gap: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    margin: 1,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  chipSelected: {
    backgroundColor: '#FFA726',
    borderColor: '#FFA726',
  },
  chipIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  chipText: {
    color: '#222',
    fontSize: 15,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
