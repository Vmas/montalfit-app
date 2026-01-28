import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, ScrollView, Alert, Animated } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useIsFocused } from '@react-navigation/native';

export default function ProgresoScreen() {
  const isFocused = useIsFocused();
  const [nuevoPeso, setNuevoPeso] = useState('');
  const [historialPeso, setHistorialPeso] = useState([0]);
  const [fechas, setFechas] = useState(['-']);
  const [resumenComida, setResumenComida] = useState({ kcal: 0, p: 0, c: 0, g: 0 });
  const [meta, setMeta] = useState(2000);

  // ESTADOS DEL RETO MONTALFIT
  const [enReto, setEnReto] = useState(false);
  const [diaDelReto, setDiaDelReto] = useState(1);
  const animacionBarra = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      cargarTodo();
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused && enReto) {
      animacionBarra.setValue(0);
      Animated.timing(animacionBarra, {
        toValue: (diaDelReto / 90),
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }
  }, [isFocused, enReto, diaDelReto]);

  const cargarTodo = async () => {
    try {
      // 1. Cargar Historial de Peso con sus FECHAS
      const guardadoPeso = await AsyncStorage.getItem('@historial_peso');
      if (guardadoPeso) {
        const data = JSON.parse(guardadoPeso);
        if (data.length > 0) {
          // Mantenemos los últimos 7 registros para que el gráfico no se amontone
          setHistorialPeso(data.map(item => item.peso).slice(-7));
          setFechas(data.map(item => item.fecha).slice(-7));
        }
      }

      // 2. Cargar Estado del Reto
      const fechaInicio = await AsyncStorage.getItem('@inicio_reto_montalfit');
      if (fechaInicio) {
        setEnReto(true);
        const inicio = new Date(fechaInicio);
        const hoy = new Date();
        const diffTime = Math.abs(hoy - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDiaDelReto(diffDays > 90 ? 90 : (diffDays === 0 ? 1 : diffDays));
      }

      // 3. Perfil y Consumo
      const perfil = await AsyncStorage.getItem('@perfil_usuario');
      if (perfil) setMeta(JSON.parse(perfil).caloriasMeta);

      const hoyIso = new Date().toISOString().split('T')[0];
      const datosComida = await AsyncStorage.getItem(`@diario_${hoyIso}`);
      if (datosComida) {
        const lista = JSON.parse(datosComida);
        setResumenComida({
          kcal: lista.reduce((acc, curr) => acc + (Number(curr.calorias) || 0), 0),
          p: lista.reduce((acc, curr) => acc + (Number(curr.p) || 0), 0),
          c: lista.reduce((acc, curr) => acc + (Number(curr.c) || 0), 0),
          g: lista.reduce((acc, curr) => acc + (Number(curr.g) || 0), 0),
        });
      }
    } catch (e) {
      console.log("Error:", e);
    }
  };

  const generarPDFMontalFit = async () => {
    const hoyStr = new Date().toLocaleDateString();
    const datosGrafica = historialPeso.map((p, i) => `['${fechas[i]}', ${p}]`).join(',');

    const htmlContent = `
      <html>
        <head>
          <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
          <script type="text/javascript">
            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(drawChart);
            function drawChart() {
              var data = google.visualization.arrayToDataTable([['Fecha', 'Peso'], ${datosGrafica}]);
              var options = { title: 'Evolución MontalFit', curveType: 'function', colors: ['#28A745'] };
              var chart = new google.visualization.LineChart(document.getElementById('chart'));
              chart.draw(data, options);
            }
          </script>
        </head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #003366; text-align: center;">MONTALFIT</h1>
          <p style="text-align: center; color: #666;">Reporte de Progreso Personal</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p><b>Día:</b> ${diaDelReto}/90 | <b>Fecha:</b> ${hoyStr}</p>
            <p><b>Peso Actual:</b> ${historialPeso[historialPeso.length-1]} kg</p>
          </div>
          <div id="chart" style="width: 100%; height: 300px;"></div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "No se pudo generar el reporte."); }
  };

  const gestionarReto = async () => {
    if (!enReto) {
      Alert.alert(
        "🏆 RETO MONTALFIT",
        "Este reto de 90 días te ayudará a transformar tu disciplina. Al finalizar, podrás exportar tu reporte completo de evolución. ¿Aceptas el desafío?",
        [
          { text: "Quizás luego", style: "cancel" },
          { text: "¡ACEPTO!", onPress: async () => {
              const hoy = new Date().toISOString();
              await AsyncStorage.setItem('@inicio_reto_montalfit', hoy);
              setEnReto(true);
              setDiaDelReto(1);
          }}
        ]
      );
    } else {
      Alert.alert("¿Abandonar Reto?", "Si abandonas ahora, perderás tu progreso actual en el Reto MontalFit. ¿Estás seguro?", [
        { text: "Seguir", style: "cancel" },
        { text: "Sí, abandonar", onPress: async () => {
            await AsyncStorage.removeItem('@inicio_reto_montalfit');
            setEnReto(false);
            animacionBarra.setValue(0);
        }}
      ]);
    }
  };

  const registrarPeso = async () => {
    if (!nuevoPeso) return;
    const pesoNum = parseFloat(nuevoPeso);
    const hoyLabel = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    const nuevoRegistro = { fecha: hoyLabel, peso: pesoNum };
    
    const actual = await AsyncStorage.getItem('@historial_peso');
    const lista = actual ? JSON.parse(actual) : [];
    lista.push(nuevoRegistro);
    await AsyncStorage.setItem('@historial_peso', JSON.stringify(lista));
    setNuevoPeso('');
    cargarTodo();
    Alert.alert("Éxito", "Peso guardado correctamente.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.titulo}>Mi Evolución</Text>

        <View style={[styles.retoCard, enReto && styles.retoCardActivo]}>
          <View style={styles.rowBetween}>
            <Text style={styles.retoTitulo}>{enReto ? `RETO MONTALFIT: DÍA ${diaDelReto}/90` : "DESAFÍO MONTALFIT"}</Text>
            <Ionicons name={enReto ? "shield-checkmark" : "trophy-outline"} size={24} color="#FFD700" />
          </View>
          
          {enReto ? (
            <View style={styles.progresoCont}>
              <View style={styles.barraFondo}>
                <Animated.View style={[styles.barraVida, { 
                  width: animacionBarra.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) 
                }]} />
              </View>

              {diaDelReto >= 30 ? (
                <TouchableOpacity style={styles.btnDescargar} onPress={generarPDFMontalFit}>
                  <Ionicons name="cloud-download-outline" size={18} color="#FFF" />
                  <Text style={styles.btnDescargarTxt}>DESCARGAR REPORTE MENSUAL</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.btnBloqueado}>
                  <Ionicons name="lock-closed" size={14} color="#666" />
                  <Text style={styles.txtBloqueado}>Reporte disponible en el día 30</Text>
                </View>
              )}

              <TouchableOpacity onPress={gestionarReto}><Text style={styles.abandonarTxt}>Abandonar reto</Text></TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.retoDesc}>Lleva tu constancia al siguiente nivel durante 3 meses y desbloquea reportes detallados.</Text>
              <TouchableOpacity style={styles.btnReto} onPress={gestionarReto}>
                <Text style={styles.btnRetoTxt}>EMPEZAR RETO</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Progreso de tu Peso</Text>
          <LineChart  
            data={{ labels: fechas, datasets: [{ data: historialPeso }] }}
            width={Dimensions.get("window").width - 70}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.labelSec}>Estado Nutricional (Hoy)</Text>
          <View style={styles.macroResumen}>
            <View style={styles.macroItem}><Text style={styles.macroVal}>{Math.round(resumenComida.kcal)}</Text><Text style={styles.macroLab}>kcal / {meta}</Text></View>
            <View style={styles.macroItem}><Text style={styles.macroVal}>{Math.round(resumenComida.p)}g</Text><Text style={styles.macroLab}>Prot</Text></View>
            <View style={styles.macroItem}><Text style={styles.macroVal}>{Math.round(resumenComida.c)}g</Text><Text style={styles.macroLab}>Carbs</Text></View>
            <View style={styles.macroItem}><Text style={styles.macroVal}>{Math.round(resumenComida.g)}g</Text><Text style={styles.macroLab}>Grasas</Text></View>
          </View>
        </View>

{/* Tip Informativo */}
<View style={styles.tipCard}>
  <View style={styles.row}>
    <Ionicons name="bulb-outline" size={20} color="#28A745" />
    <Text style={styles.tipTitulo}>Tip MontalFit</Text>
  </View>
  <Text style={styles.tipDesc}>
    Pésate a diario en ayunas después de ir al baño. No te obsesiones con el número diario; lo importante es la tendencia de la gráfica a largo plazo.
  </Text>
</View>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Actualizar peso corporal (kg)</Text>
          <View style={styles.row}>
            <TextInput style={styles.input} keyboardType="numeric" value={nuevoPeso} onChangeText={setNuevoPeso} placeholder="Ej: 75.5" />
            <TouchableOpacity style={styles.btn} onPress={registrarPeso}><Text style={styles.btnText}>Anotar</Text></TouchableOpacity>
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
  // EL ERROR ESTABA AQUÍ ABAJO (faltaba el símbolo $ y las llaves)
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, 
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003366' },
  titulo: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  retoCard: { backgroundColor: 'rgba(255, 215, 0, 0.1)', padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' },
  retoCardActivo: { borderColor: '#28A745', backgroundColor: 'rgba(40, 167, 69, 0.05)' },
  retoTitulo: { color: '#FFD700', fontWeight: '900', fontSize: 14 },
  retoDesc: { color: '#CCC', fontSize: 12, marginVertical: 10 },
  btnReto: { backgroundColor: '#FFD700', padding: 12, borderRadius: 10, alignItems: 'center' },
  btnRetoTxt: { color: '#000', fontWeight: 'bold' },
  progresoCont: { marginTop: 15 },
  barraFondo: { height: 12, backgroundColor: '#112233', borderRadius: 6, overflow: 'hidden' },
  barraVida: { height: '100%', backgroundColor: '#28A745' },
  abandonarTxt: { color: '#666', fontSize: 10, textAlign: 'center', marginTop: 15, textDecorationLine: 'underline' },
  chartCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 15, alignItems: 'center' },
  chartTitle: { color: '#28A745', fontSize: 12, fontWeight: 'bold', marginBottom: 10, alignSelf: 'flex-start' },
  chart: { borderRadius: 16 },
  inputCard: { marginTop: 15, backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 20 },
  label: { color: '#AAA', marginBottom: 10 },
  labelSec: { color: '#28A745', fontWeight: 'bold', marginBottom: 15, fontSize: 12 },
  macroResumen: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center' },
  macroVal: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  macroLab: { color: '#AAA', fontSize: 10 },
  row: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 12, fontSize: 18 },
  btn: { backgroundColor: '#28A745', marginLeft: 10, padding: 15, borderRadius: 10, justifyContent: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  btnDescargar: { backgroundColor: '#28A745', flexDirection: 'row', padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  btnDescargarTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 12, marginLeft: 8 },
  btnBloqueado: { backgroundColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  txtBloqueado: { color: '#666', fontWeight: 'bold', fontSize: 12, marginLeft: 8 },
  tipCard: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  tipTitulo: {
    color: '#28A745',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  tipDesc: {
    color: '#CCC',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  }
});