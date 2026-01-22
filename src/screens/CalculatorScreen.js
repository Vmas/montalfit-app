import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CalculatorScreen({ navigation }) {
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [edad, setEdad] = useState('');
  const [sexo, setSexo] = useState('hombre');
  const [actividad, setActividad] = useState(1.2);
  const [objetivo, setObjetivo] = useState(0);
  const [resultado, setResultado] = useState(null);

  // Función para obtener la descripción de la actividad
  const getDescripcionActividad = () => {
    if (actividad === 1.2) return "Sedentario: Poco o nada de ejercicio.";
    if (actividad === 1.55) return "Moderado: Ejercicio 3-5 días a la semana.";
    if (actividad === 1.9) return "Intenso: Atleta o ejercicio diario fuerte.";
    return "";
  };

  const calcularTMB = async () => {
    if(!peso || !altura || !edad) return;
    let tmbBase = 0;
    const p = parseFloat(peso);
    const a = parseFloat(altura);
    const e = parseFloat(edad);

    if (sexo === 'hombre') {
      tmbBase = 88.36 + (13.4 * p) + (4.8 * a) - (5.7 * e);
    } else {
      tmbBase = 447.59 + (9.2 * p) + (3.1 * a) - (4.3 * e);
    }
    
    const caloriasMantenimiento = tmbBase * actividad;
    const metaFinal = Math.round(caloriasMantenimiento + objetivo);
    
    setResultado(metaFinal);
    
    try {
      await AsyncStorage.setItem('@calorias_meta', metaFinal.toString());
    } catch (e) { console.log(e); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Configura tu Meta</Text>
      
      {/* Selector de Sexo */}
      <Text style={styles.label}>Sexo:</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.miniBtn, sexo === 'hombre' && styles.active]} onPress={() => setSexo('hombre')}>
          <Text style={styles.btnText}>HOMBRE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.miniBtn, sexo === 'mujer' && styles.active]} onPress={() => setSexo('mujer')}>
          <Text style={styles.btnText}>MUJER</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} keyboardType="numeric" placeholder="Peso (kg)" value={peso} onChangeText={setPeso} />
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Altura (cm)" value={altura} onChangeText={setAltura} />
      <TextInput style={styles.input} keyboardType="numeric" placeholder="Edad" value={edad} onChangeText={setEdad} />

      {/* Actividad Física con Descripción */}
      <Text style={styles.label}>Nivel de Actividad Física:</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.miniBtn, actividad === 1.2 && styles.active]} onPress={() => setActividad(1.2)}>
          <Text style={styles.btnText}>BAJA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.miniBtn, actividad === 1.55 && styles.active]} onPress={() => setActividad(1.55)}>
          <Text style={styles.btnText}>MEDIA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.miniBtn, actividad === 1.9 && styles.active]} onPress={() => setActividad(1.9)}>
          <Text style={styles.btnText}>ALTA</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.descTexto}>{getDescripcionActividad()}</Text>

      {/* Objetivo con nombres corregidos */}
      <Text style={styles.label}>Tu Objetivo Principal:</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.miniBtn, objetivo === -500 && styles.activeDeficit]} onPress={() => setObjetivo(-500)}>
          <Text style={styles.btnText}>PERDER PESO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.miniBtn, objetivo === 0 && styles.active]} onPress={() => setObjetivo(0)}>
          <Text style={styles.btnText}>MANTENER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.miniBtn, objetivo === 400 && styles.activeSuperavit]} onPress={() => setObjetivo(400)}>
          <Text style={styles.btnText}>GANAR MÚSCULO</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.buttonMain} onPress={calcularTMB}>
        <Text style={styles.buttonText}>CALCULAR MI META</Text>
      </TouchableOpacity>

      {resultado && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Tu objetivo diario:</Text>
          <Text style={styles.resultNumber}>{resultado} kcal</Text>
          <TouchableOpacity style={styles.btnNext} onPress={() => navigation.navigate('Diary')}>
            <Text style={styles.buttonText}>EMPEZAR REGISTRO DIARIO →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#003366', padding: 25, paddingTop: 50 },
  title: { color: '#FFF', fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 20, fontSize: 16 },
  label: { color: '#D1D1D1', marginTop: 10, marginBottom: 10, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  miniBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, width: '31%', alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: '#28A745' },
  activeDeficit: { backgroundColor: '#FFC107' },
  activeSuperavit: { backgroundColor: '#007BFF' },
  btnText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  descTexto: { color: '#A0A0A0', fontSize: 12, fontStyle: 'italic', marginTop: 5, marginBottom: 15 },
  buttonMain: { backgroundColor: '#28A745', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  resultCard: { marginTop: 25, alignItems: 'center', padding: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, borderLeftWidth: 5, borderLeftColor: '#28A745' },
  resultLabel: { color: '#D1D1D1', fontSize: 16 },
  resultNumber: { color: '#FFF', fontSize: 44, fontWeight: 'bold', marginVertical: 10 },
  btnNext: { backgroundColor: '#28A745', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' }
});