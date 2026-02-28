import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Este componente solo recibe el total y lo muestra
export default function ResumenCalorias({ total }) {
  return (
    <View style={styles.card}>
      <Text style={styles.textoCard}>Total de hoy</Text>
      <Text style={styles.numeroCalorias}>{total} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  textoCard: { color: '#D1D1D1', fontSize: 16 },
  numeroCalorias: { color: '#FFFFFF', fontSize: 40, fontWeight: 'bold' },
});