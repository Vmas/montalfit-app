import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Image 
} from 'react-native';

export default function RegistroScreen() {
  // 1. Estados
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState({
    nacimiento: '',
    peso: '',
    altura: '',
    sexo: 'hombre',
    objetivo: 'Mantener',
    actividad: 1.375 // Valor por defecto: Ligero
  });

  // 2. Efecto de Bienvenida (Splash)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCargando(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 3. Lógica de Edad
  const obtenerEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const cumple = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const mes = hoy.getMonth() - cumple.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < cumple.getDate())) {
      edad--;
    }
    return edad || 0;
  };

  // 4. Función de Cálculo Final
  const calcularPlan = () => {
    const { peso, altura, nacimiento, sexo, objetivo, actividad } = datos;

    if (!peso || !altura || !nacimiento) {
      Alert.alert("Campos incompletos", "Por favor, llena todos los datos.");
      return;
    }

    const edad = obtenerEdad(nacimiento);
    
    // FÓRMULA MIFFLIN-ST. JEOR
    let tmb = (10 * parseFloat(peso)) + (6.25 * parseFloat(altura)) - (5 * edad);
    tmb = sexo === 'hombre' ? tmb + 5 : tmb - 161;

    // APLICAR NIVEL DE ACTIVIDAD SELECCIONADO
    let mantenimiento = tmb * actividad;

    // AJUSTE POR OBJETIVO
    let caloriasFinales = mantenimiento;
    if (objetivo === 'Perder Grasa') caloriasFinales -= 450; // Déficit
    if (objetivo === 'Ganar Músculo') caloriasFinales += 350; // Superávit

    Alert.alert(
      "MONTALFIT",
      `Perfil: ${sexo.toUpperCase()}, ${edad} años.\n\nMeta Diaria: ${Math.round(caloriasFinales)} kcal.`,
      [{ text: "¡Empezar ahora!" }]
    );
  };

  // --- RENDERIZADO ---

  if (cargando) {
    return (
      <View style={styles.containerSplash}>
        {/* --- Logo aqui--- */}
      <Image 
        source={require('../assets/logomontalfit.png')} 
        style={styles.logoImagen}
        resizeMode="contain"
      />
      {/* ----------------------- */}
        <Text style={styles.tagline}>Version 1.0</Text>
        <Text style={styles.logoTextSplash}>Inicio</Text>
        <ActivityIndicator size="large" color="#28A745" style={{ marginTop: 30 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.logoText}>MONTALFIT</Text>
      <Text style={styles.subtitulo}>Conoce tus requerimientos calóricos</Text>

      {/* SEXO */}
      <Text style={styles.label}>Sexo</Text>
      <View style={styles.row}>
        {['hombre', 'mujer'].map((s) => (
          <TouchableOpacity 
            key={s}
            style={[styles.btnOpcion, datos.sexo === s && styles.btnActive]}
            onPress={() => setDatos({...datos, sexo: s})}
          >
            <Text style={styles.btnText}>{s.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* DATOS FÍSICOS */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Fecha de Nacimiento (AAAA-MM-DD)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="1995-05-15" 
          placeholderTextColor="#666"
          onChangeText={(val) => setDatos({...datos, nacimiento: val})}
        />
      </View>

      <View style={styles.row}>
        <View style={{flex: 1, marginRight: 10}}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            placeholder="75"
            placeholderTextColor="#666"
            onChangeText={(val) => setDatos({...datos, peso: val})}
          />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            placeholder="170"
            placeholderTextColor="#666"
            onChangeText={(val) => setDatos({...datos, altura: val})}
          />
        </View>
      </View>

      {/* NIVEL DE ACTIVIDAD */}
      <Text style={styles.label}>Nivel de Actividad</Text>
      <View style={styles.gridContainer}>
        {[
          { label: 'Sedentario', desc: 'Poco ejercicio', val: 1.2 },
          { label: 'Ligero', desc: '1-3 días gym', val: 1.375 },
          { label: 'Moderado', desc: '3-5 días gym', val: 1.55 },
          { label: 'Intenso', desc: '6-7 días gym', val: 1.725 },
        ].map((item) => (
          <TouchableOpacity 
            key={item.val} 
            style={[styles.btnActividad, datos.actividad === item.val && styles.btnActive]}
            onPress={() => setDatos({...datos, actividad: item.val})}
          >
            <Text style={styles.btnText}>{item.label}</Text>
            <Text style={styles.btnDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* META */}
      <Text style={styles.label}>Tu Meta</Text>
      <View style={{marginBottom: 20}}>
        {['Perder Grasa', 'Mantener', 'Ganar Músculo'].map((obj) => (
          <TouchableOpacity 
            key={obj} 
            style={[styles.btnOpcion, datos.objetivo === obj && styles.btnActive, {marginBottom: 8}]}
            onPress={() => setDatos({...datos, objetivo: obj})}
          >
            <Text style={styles.btnText}>{obj}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btnPrincipal} onPress={calcularPlan}>
        <Text style={styles.btnPrincipalText}>CALCULAR MI PLAN</Text>
      </TouchableOpacity>
      
      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Splash
  containerSplash: { flex: 1, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center' },
  logoImagen: { width: 300, height: 300, marginBottom: 10 },
  logoCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#28A745', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logoLetra: { fontSize: 70, color: '#FFF', fontWeight: 'bold' },
  logoTextSplash: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  tagline: { color: '#28A745', fontSize: 14, marginTop: 5 },
  
  // Registro
  container: { flex: 1, backgroundColor: '#003366' },
  content: { padding: 25, paddingTop: 50 },
  logoText: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitulo: { color: '#28A745', fontSize: 13, textAlign: 'center', marginBottom: 25 },
  label: { color: '#FFF', marginBottom: 10, fontSize: 14, fontWeight: '700', marginTop: 10 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, color: '#FFF', marginBottom: 15 },
  row: { flexDirection: 'row', marginBottom: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
  btnOpcion: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
  btnActividad: { width: '48%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  btnActive: { borderColor: '#28A745', backgroundColor: 'rgba(40, 167, 69, 0.2)' },
  btnText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold', fontSize: 13 },
  btnDesc: { color: '#AAA', textAlign: 'center', fontSize: 10, marginTop: 4 },
  btnPrincipal: { backgroundColor: '#28A745', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 15 },
  btnPrincipalText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});