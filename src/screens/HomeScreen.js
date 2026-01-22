import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brand}>Bienvenidos</Text>
        <Text style={styles.title}>MONTALFIT</Text>
        <Text style={styles.subtitle}>Diseña tu cuerpo, domina tu mente.</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Calculator')}
        >
          <Text style={styles.buttonText}>COMENZAR CALCULADORA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003366', justifyContent: 'center', padding: 20 },
  content: { alignItems: 'center' },
  brand: { color: '#28A745', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  title: { color: '#FFF', fontSize: 48, fontWeight: 'bold' },
  subtitle: { color: '#D1D1D1', fontSize: 18, textAlign: 'center', marginBottom: 40 },
  button: { backgroundColor: '#28A745', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});