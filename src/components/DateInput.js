import React from 'react';
import { Platform, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function DateInput({ value, onPress, onChange, style }) {
  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#FFF', ...style }}
      />
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={styles.touch}>
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    padding: 10,
  },
  text: {
    color: '#FFF',
  },
});
