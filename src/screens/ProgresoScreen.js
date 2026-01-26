import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, ScrollView,  Alert} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProgresoScreen() {
  // Estados de TU código (Peso)
  const [nuevoPeso, setNuevoPeso] = useState('');
  const [historialPeso, setHistorialPeso] = useState([0]);
  const [fechas, setFechas] = useState(['-']);

  // Estados de MI código (Nutrición)
  const [resumenComida, setResumenComida] = useState([]);
  const [meta, setMeta] = useState(2000);

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    // 1. Cargar Historial de Peso (Tu lógica)
    const guardadoPeso = await AsyncStorage.getItem('@historial_peso');
    if (guardadoPeso) {
      const data = JSON.parse(guardadoPeso);
      setHistorialPeso(data.map(item => item.peso).slice(-7));
      setFechas(data.map(item => item.fecha).slice(-7));
    }

    // 2. Cargar Resumen de Calorías (Mi lógica)
    const perfil = await AsyncStorage.getItem('@perfil_usuario');
    if (perfil) setMeta(JSON.parse(perfil).caloriasMeta);

    const hoy = new Date().toISOString().split('T')[0];
    const datosComida = await AsyncStorage.getItem(`@diario_${hoy}`);
    if (datosComida) {
      const lista = JSON.parse(datosComida);
      const totales = {
        kcal: lista.reduce((acc, curr) => acc + (Number(curr.calorias) || 0), 0),
        p: lista.reduce((acc, curr) => acc + (Number(curr.p) || 0), 0),
        c: lista.reduce((acc, curr) => acc + (Number(curr.c) || 0), 0),
        g: lista.reduce((acc, curr) => acc + (Number(curr.g) || 0), 0),
      };
      setResumenComida(totales);
    }
  };

  // NUEVA FUNCIÓN: Calcula la meta calórica basada en el nuevo peso
  const aplicarRecalculo = async (perfil, nuevoPesoValor) => {
    let bmr;
    // Fórmula de Mifflin-St Jeor
    if (perfil.sexo === 'hombre') {
      bmr = (10 * nuevoPesoValor) + (6.25 * perfil.altura) - (5 * perfil.edad) + 5;
    } else {
      bmr = (10 * nuevoPesoValor) + (6.25 * perfil.altura) - (5 * perfil.edad) - 161;
    }

    let tdee = bmr * perfil.actividad;
    let metaNueva;

    // Ajuste según el objetivo original
    if (perfil.objetivo.toLowerCase().includes('perder')) {
      metaNueva = tdee - 500;
    } else if (perfil.objetivo.toLowerCase().includes('ganar')) {
      metaNueva = tdee + 300;
    } else {
      metaNueva = tdee;
    }

    const perfilActualizado = {
      ...perfil,
      peso: nuevoPesoValor,
      caloriasMeta: Math.round(metaNueva)
    };

    try {
      await AsyncStorage.setItem('@perfil_usuario', JSON.stringify(perfilActualizado));
      setMeta(perfilActualizado.caloriasMeta); // Actualiza la meta en pantalla inmediatamente
      Alert.alert("¡Magia MontalFit!", `Tu nueva meta es de ${Math.round(metaNueva)} kcal para ajustarse a tus ${nuevoPesoValor}kg.`);
    } catch (e) {
      console.log("Error al actualizar perfil");
    }
  };

  const registrarPeso = async () => {
    if (!nuevoPeso) return;

    const pesoNum = parseFloat(nuevoPeso);

    // 1. FILTRO DE SEGURIDAD BÁSICO
    if (pesoNum < 30 || pesoNum > 300) {
      Alert.alert(
        "Peso inusual",
        "Has ingresado un peso que parece incorrecto. Por favor, verifica que el dato sea en kilogramos (Ej: 75.5)."
      );
      return;
    }

    const hoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    const nuevoRegistro = { fecha: hoy, peso: pesoNum };

    try {
      const perfilDatos = await AsyncStorage.getItem('@perfil_usuario');
      if (perfilDatos) {
        const perfil = JSON.parse(perfilDatos);
        const diferencia = Math.abs(perfil.peso - pesoNum);

        // 2. CONFIRMACIÓN SI EL CAMBIO ES MUY GRANDE (> 10kg)
        if (diferencia > 10) {
          Alert.alert(
            "¿Es correcto?",
            `Has ingresado ${pesoNum}kg. Hay una diferencia de ${diferencia.toFixed(1)}kg con tu peso anterior. ¿Deseas guardar este dato?`,
            [
              { text: "Corregir", style: "cancel" },
              { text: "Sí, es correcto", onPress: () => procesarGuardado(nuevoRegistro, perfil, pesoNum, diferencia) }
            ]
          );
        } else {
          procesarGuardado(nuevoRegistro, perfil, pesoNum, diferencia);
        }
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo validar el peso");
    }
  };

  const procesarGuardado = async (nuevoRegistro, perfil, pesoNum, diferencia) => {
    try {
      const actual = await AsyncStorage.getItem('@historial_peso');
      const lista = actual ? JSON.parse(actual) : [];
      lista.push(nuevoRegistro);
      await AsyncStorage.setItem('@historial_peso', JSON.stringify(lista));

      if (diferencia >= 2) {
        Alert.alert(
          "⚖️ Cambio de peso detectado",
          `Tu cuerpo ha cambiado ${diferencia.toFixed(1)}kg y tus necesidades de energía también. ¿Quieres ajustar tu meta de calorías?`,
          [
            { text: "Mantener actual", style: "cancel" },
            { text: "¡Sí, ajustar meta!", onPress: () => aplicarRecalculo(perfil, pesoNum) }
          ]
        );
      }

      setNuevoPeso('');
      cargarTodo(); // Refresca la UI
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el peso");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.titulo}>Mi Evolución</Text>
        
        {/* GRÁFICA DE PESO (Tuya) */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Progreso de tu Peso</Text>
          <LineChart  
            data={{
              labels: fechas,
              datasets: [{ data: historialPeso }]
            }}
            width={Dimensions.get("window").width - 60}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        {/* RESUMEN NUTRICIONAL DE HOY (Nuevo) */}
        <View style={styles.inputCard}>
          <Text style={styles.labelSec}>Estado nutricional (Hoy)</Text>
          <View style={styles.macroResumen}>
            <View style={styles.macroItem}>
              <Text style={styles.macroVal}>{Math.round(resumenComida.kcal || 0)}</Text>
              <Text style={styles.macroLab}>kcal / {meta}</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroVal}>{Math.round(resumenComida.p || 0)}g</Text>
              <Text style={styles.macroLab}>Proteína</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroVal}>{Math.round(resumenComida.c || 0)}g</Text>
              <Text style={styles.macroLab}>Carbs</Text>
            </View>
          </View>
        </View>

        {/* REGISTRO DE PESO (Tuyo) */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>Actualizar peso corporal (kg)</Text>
          <View style={styles.row}>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              placeholder="Ej: 75.5"
              placeholderTextColor="#AAA"
              value={nuevoPeso}
              onChangeText={setNuevoPeso}
            />
            <TouchableOpacity style={styles.btn} onPress={registrarPeso}>
              <Text style={styles.btnText}>Anotar</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const chartConfig = {
  backgroundColor: "#003366",
  backgroundGradientFrom: "#112233",
  backgroundGradientTo: "#003366",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(40, 167, 69, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003366' },
  titulo: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  chartTitle: {
    color: '#28A745', // El verde de tu marca
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 5,
    alignSelf: 'flex-start', // Para que se alinee a la izquierda del cuadro
    marginLeft: 10
  },
  chartCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 15, alignItems: 'center' },
  chart: { marginVertical: 8, borderRadius: 16 },
  inputCard: { marginTop: 20, backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 20 },
  label: { color: '#AAA', marginBottom: 10 },
  labelSec: { color: '#28A745', fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', fontSize: 12 },
  macroResumen: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center' },
  macroVal: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  macroLab: { color: '#AAA', fontSize: 10 },
  row: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 12, fontSize: 18, color: '#000' },
  btn: { backgroundColor: '#28A745', marginLeft: 10, padding: 15, borderRadius: 10, justifyContent: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});