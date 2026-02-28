import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Image,
  Platform // <-- Agregado
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker'; // <-- Importante tener instalada esta librería
import DateInput from '../components/DateInput';

export default function RegistroScreen({ onRegistroCompleto }) {
  const [cargando, setCargando] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false); // <-- Nuevo estado
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date(1995, 0, 1)); // Fecha inicial por defecto

  const [datos, setDatos] = useState({
    nombre: '',
    nacimiento: '1995-01-01', // Se actualizará con el picker
    peso: '',
    altura: '',
    sexo: 'hombre',
    objetivo: 'Mantener',
    actividad: 1.375 
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setCargando(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Función para manejar el cambio de fecha
  const onChangeFecha = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setFechaSeleccionada(date);
      const isoFecha = date.toISOString().split('T')[0];
      setDatos({...datos, nacimiento: isoFecha});
    }
  };

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

  const calcularPlan = async () => {
  const { nombre, peso, altura, nacimiento, sexo, objetivo, actividad } = datos;

  // 1. Validar campos vacíos
  if (!nombre || !peso || !altura || !nacimiento) {
    Alert.alert("Campos incompletos", "Por favor, llena todos los datos.");
    return;
  }

  // 2. Validaciones de Rangos Reales (Seguridad)
  const pesoNum = parseFloat(peso);
  const alturaNum = parseFloat(altura);

  if (pesoNum < 35 || pesoNum > 250) {
    Alert.alert("Peso no válido", "Por favor ingresa un peso entre 35 y 250 kg.");
    return;
  }

  if (alturaNum < 120 || alturaNum > 230) {
    Alert.alert("Altura no válida", "Por favor ingresa una estatura entre 120 y 230 cm.");
    return;
  }

  // 3. Cálculos
  const edad = obtenerEdad(nacimiento);
  
  // Mifflin-St. Jeor
  let tmb = (10 * pesoNum) + (6.25 * alturaNum) - (5 * edad);
  tmb = sexo === 'hombre' ? tmb + 5 : tmb - 161;

  let mantenimiento = tmb * actividad;
  
  // UNIFICACIÓN DE NOMBRES (Importante para que el Perfil lo entienda)
  let caloriasFinales = Math.round(mantenimiento);
  if (objetivo === 'Perder Grasa') caloriasFinales -= 500;
  if (objetivo === 'Ganar Músculo') caloriasFinales += 400;

  const perfilUsuario = {
    ...datos,
    peso: pesoNum,   // Guardamos como número
    altura: alturaNum, // Guardamos como número
    edad,
    caloriasMeta: caloriasFinales,
    fechaRegistro: new Date().toISOString()
  };

  try {
    await AsyncStorage.setItem('@perfil_usuario', JSON.stringify(perfilUsuario));
    onRegistroCompleto();
  } catch (e) {
    Alert.alert("Error", "No pudimos guardar tu perfil.");
  }
};

  if (cargando) {
    return (
      <View style={styles.containerSplash}>
        <Image 
          source={require('../assets/logomontalfit.png')} 
          style={styles.logoImagen}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Version 1.0</Text>
        <ActivityIndicator size="large" color="#28A745" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.logoText}>MONTALFIT</Text>
        <Text style={styles.subtitulo}>Conoce tus requerimientos calóricos</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>¿Cómo te llamas?</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Escribe tu nombre" 
            placeholderTextColor="#666"
            onChangeText={(val) => setDatos({...datos, nombre: val})}
          />
        </View>

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

        {/* CAMBIO: Selector de Fecha en lugar de TextInput */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha de Nacimiento</Text>
          <View style={styles.input}>
            <DateInput
              value={datos.nacimiento}
              onPress={() => setShowDatePicker(true)}
              onChange={(iso) => {
                // web will call onChange with ISO YYYY-MM-DD
                if (iso) {
                  setFechaSeleccionada(new Date(iso));
                  setDatos({ ...datos, nacimiento: iso });
                }
              }}
            />
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={fechaSeleccionada}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeFecha}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.row}>
          <View style={{flex: 1, marginRight: 10}}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="75" placeholderTextColor="#666" onChangeText={(val) => setDatos({...datos, peso: val})} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Altura (cm)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="170" placeholderTextColor="#666" onChangeText={(val) => setDatos({...datos, altura: val})} />
          </View>
        </View>

        <Text style={styles.label}>Nivel de Actividad</Text>
        <View style={styles.gridContainer}>
          {[
            { label: 'Sedentario', desc: 'Oficina / Poco ej.', val: 1.2 },
            { label: 'Ligero', desc: '1-3 días gym', val: 1.375 },
            { label: 'Moderado', desc: '3-5 días gym', val: 1.55 },
            { label: 'Intenso', desc: '6-7 días gym', val: 1.725 },
          ].map((item) => (
            <TouchableOpacity key={item.val} style={[styles.btnActividad, datos.actividad === item.val && styles.btnActive]} onPress={() => setDatos({...datos, actividad: item.val})}>
              <Text style={styles.btnText}>{item.label}</Text>
              <Text style={styles.btnDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tu Meta</Text>
        <View style={{marginBottom: 20}}>
          {['Perder Grasa', 'Mantener', 'Ganar Músculo'].map((obj) => (
            <TouchableOpacity key={obj} style={[styles.btnOpcion, datos.objetivo === obj && styles.btnActive, {marginBottom: 8}]} onPress={() => setDatos({...datos, objetivo: obj})}>
              <Text style={styles.btnText}>{obj}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btnPrincipal} onPress={calcularPlan}>
          <Text style={styles.btnPrincipalText}>CALCULAR MI PLAN</Text>
        </TouchableOpacity>
        
        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#003366' },
  containerSplash: { flex: 1, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center' },
  logoImagen: { width: 300, height: 300, marginBottom: 20 },
  logoTextSplash: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  tagline: { color: '#28A745', fontSize: 16, marginTop: 1, letterSpacing: 2, fontWeight: '600' },
  container: { flex: 1 },
  content: { padding: 25, paddingTop: 20 },
  logoText: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitulo: { color: '#28A745', fontSize: 13, textAlign: 'center', marginBottom: 25 },
  label: { color: '#FFF', marginBottom: 8, fontSize: 14, fontWeight: '700', marginTop: 10 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15, color: '#FFF', marginBottom: 5 },
  inputGroup: { marginBottom: 15 },
  row: { flexDirection: 'row', marginBottom: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  btnOpcion: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
  btnActividad: { width: '48%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  btnActive: { borderColor: '#28A745', backgroundColor: 'rgba(40, 167, 69, 0.2)' },
  btnText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold', fontSize: 13 },
  btnDesc: { color: '#AAA', textAlign: 'center', fontSize: 10, marginTop: 4 },
  btnPrincipal: { backgroundColor: '#28A745', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 15 },
  btnPrincipalText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
}); 