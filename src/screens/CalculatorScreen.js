import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CalculatorScreen({ navigation }) {
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [edad, setEdad] = useState('');
  const [resultado, setResultado] = useState(null);

  // Cargar datos previos si existen
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const valorGuardado = await AsyncStorage.getItem('@calorias_meta');
      if (valorGuardado !== null) setResultado(valorGuardado);
    } catch (e) { console.log(e); }
  };

  const calcularTMB = async () => {
    // Fórmula simplificada para hombres (puedes ajustarla luego)
    // TMB = 88.36 + (13.4 x peso) + (4.8 x altura) - (5.7 x edad)
    const tmb = 88.36 + (13.4 * parseFloat(peso)) + (4.8 * parseFloat(altura)) - (5.7 * parseFloat(edad));
    const final = Math.round(tmb);
    
    setResultado(final);
    
    // Guardar en la "libreta" del teléfono (AsyncStorage)
    try {
      await AsyncStorage.setItem('@calorias_meta', final.toString());
    } catch (e) { console.log(e); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Calculadora TMB</Text>
      <Text style={styles.label}>Peso (kg)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={peso} onChangeText={setPeso} placeholder="Ej: 80" />
      
      <Text style={styles.label}>Altura (cm)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={altura} onChangeText={setAltura} placeholder="Ej: 175" />
      
      <Text style={styles.label}>Edad</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={edad} onChangeText={setEdad} placeholder="Ej: 39" />

      <TouchableOpacity style={styles.button} onPress={calcularTMB}>
        <Text style={styles.buttonText}>CALCULAR MI META</Text>
      </TouchableOpacity>

      {resultado && (
        <View style={styles.resultCard}>
          <Text style={styles.resultText}>Tu meta diaria es de:</Text>
          <Text style={styles.resultNumber}>{resultado} kcal</Text>
          
          <TouchableOpacity 
            style={styles.buttonDiary}
            onPress={() => navigation.navigate('Diary')}
          >
            <Text style={styles.buttonText}>IR A REGISTRAR COMIDAS</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#003366', padding: 30, paddingTop: 60 },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { color: '#D1D1D1', marginBottom: 5, fontSize: 16 },
  input: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 20, fontSize: 18 },
  button: { backgroundColor: '#28A745', padding: 20, borderRadius: 10, alignItems: 'center' },
  buttonDiary: { backgroundColor: '#0056b3', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  resultCard: { marginTop: 30, backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 15, alignItems: 'center' },
  resultText: { color: '#D1D1D1', fontSize: 18 },
  resultNumber: { color: '#28A745', fontSize: 42, fontWeight: 'bold' }
});