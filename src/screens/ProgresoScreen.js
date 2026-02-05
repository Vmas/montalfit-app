import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, ScrollView, Alert, Animated } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useIsFocused } from '@react-navigation/native';
import ViewShot, { captureRef } from 'react-native-view-shot';

export default function ProgresoScreen() {
  const chartRef = useRef();
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
        }else {
  // Reset por si borran todo
  setHistorialPeso([0]);
  setFechas(['-']);
}
      }

      // 2. Cargar Estado del Reto (Lógica Mejorada)
const fechaInicioStr = await AsyncStorage.getItem('@inicio_reto_montalfit');
if (fechaInicioStr) {
  setEnReto(true);
  
  // Normalizamos las fechas a "solo fecha" (sin horas/minutos)
  const inicio = new Date(fechaInicioStr);
  inicio.setHours(0, 0, 0, 0);
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Calculamos la diferencia en milisegundos y convertimos a días
  const diffTime = hoy.getTime() - inicio.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 porque el día que inicia es el Día 1

  if (diffDays >= 90) {
  setDiaDelReto(90);
  // Opcional: Podrías lanzar una alerta automática de felicitación aquí
} else {
  setDiaDelReto(diffDays);
}
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
  try {
    // 1. Capturar la gráfica como imagen Base64
    if (!chartRef || !chartRef.current) {
      Alert.alert("Error", "La gráfica no está disponible. Asegúrate de que la sección de progreso sea visible antes de exportar.");
      return;
    }

    const uri = await captureRef(chartRef.current, {
      format: "jpg",
      quality: 0.8,
      result: "base64",
    });

    const imagenBase64 = `data:image/jpg;base64,${uri}`;
    const hoyStr = new Date().toLocaleDateString();

    // 2. HTML Simplificado (Sin scripts externos, carga la imagen directo)
    const htmlContent = `
      <html>
        <body style="font-family: sans-serif; padding: 40px; color: #333;">
          <div style="text-align: center;">
            <h1 style="color: #003366; margin-bottom: 5px;">MONTALFIT</h1>
            <p style="color: #28A745; font-weight: bold;">Reporte de Progreso Personal</p>
          </div>

          <div style="background: #f4f4f4; padding: 20px; border-radius: 15px; margin: 30px 0;">
            <p><b>Usuario:</b> Aromas de los valles altos</p>
            <p><b>Día del Reto:</b> ${diaDelReto}/90</p>
            <p><b>Fecha de Reporte:</b> ${hoyStr}</p>
            <p><b>Peso Actual:</b> ${historialPeso[historialPeso.length - 1]} kg</p>
          </div>

          <h3 style="color: #003366;">Evolución de Peso</h3>
          <img src="${imagenBase64}" style="width: 100%; border-radius: 10px; border: 1px solid #ddd;" />

          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px;">
            Este reporte fue generado automáticamente por la App MontalFit.<br/>
            &copy; 2026 MontalFit.
          </div>
        </body>
      </html>
    `;

    const { uri: pdfUri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(pdfUri);

  } catch (e) {
    console.log(e);
    Alert.alert("Error", "Asegúrate de que la gráfica sea visible en pantalla antes de exportar.");
  }
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
      // alert de abandono y reinicio:

const mensajeTitulo = diaDelReto >= 90 ? "¡Felicidades Campeón!" : "¿Reiniciar el Reto?";
const mensajeDesc = diaDelReto >= 90 
  ? "Has completado los 90 días de MontalFit. ¿Quieres reiniciar el contador para un nuevo ciclo de disciplina?" 
  : "Se borrará tu fecha de inicio y el contador volverá a 1. ¿Confirmas?";

Alert.alert(
  mensajeTitulo, 
  mensajeDesc, 
  [
    { text: diaDelReto >= 90 ? "Mantener récord" : "Seguir en el reto", style: "cancel" },
    { text: "Sí, reiniciar", onPress: async () => {
        await AsyncStorage.removeItem('@inicio_reto_montalfit');
        setEnReto(false);
        animacionBarra.setValue(0);
        setDiaDelReto(1);
        Alert.alert("Listo", "El reto se ha reiniciado. ¡Vamos por más!");
    }}
  ]
);
    }
  };

  const registrarPeso = async () => {
    if (!nuevoPeso) return;
    const pesoNum = parseFloat(nuevoPeso);

    // 1. VALIDACIÓN DE LÍMITES DE SEGURIDAD
    if (isNaN(pesoNum) || pesoNum < 30 || pesoNum > 350) {
      Alert.alert(
        "Peso no válido", 
        "Por favor ingresa un peso realista (entre 30kg y 350kg) para que MontalFit pueda calcular tus metas correctamente."
      );
      return;
    }

    try {
      // Obtenemos el perfil actual para comparar y recalcular
      const perfilDoc = await AsyncStorage.getItem('@perfil_usuario');
      const perfilActual = perfilDoc ? JSON.parse(perfilDoc) : null;

      const realizarGuardado = async (nuevaMetaKcal) => {
        // Actualizar Historial para la gráfica
        const hoyLabel = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        const nuevoRegistro = { fecha: hoyLabel, peso: pesoNum };
        
        const actualHistorial = await AsyncStorage.getItem('@historial_peso');
        const lista = actualHistorial ? JSON.parse(actualHistorial) : [];
        lista.push(nuevoRegistro);
        await AsyncStorage.setItem('@historial_peso', JSON.stringify(lista));

        // Actualizar Perfil (Peso y Calorías) para sincronizar con Dashboard
        if (perfilActual) {
          const perfilActualizado = {
            ...perfilActual,
            peso: pesoNum,
            caloriasMeta: nuevaMetaKcal
          };
          await AsyncStorage.setItem('@perfil_usuario', JSON.stringify(perfilActualizado));
        }

        setNuevoPeso('');
        cargarTodo();
        Alert.alert("Éxito", "Peso y metas actualizados correctamente.");
      };

      // 2. LÓGICA DE RECALCULAR REQUERIMIENTOS
      if (perfilActual && perfilActual.peso !== pesoNum) {
        Alert.alert(
          "Ajustar Metas",
          `Has cambiado tu peso a ${pesoNum}kg. ¿Deseas recalcular tus requerimientos nutricionales automáticamente?`,
          [
            { 
              text: "No, solo anotar peso", 
              onPress: () => realizarGuardado(perfilActual.caloriasMeta) 
            },
            { 
  text: "Sí, ajustar metas", 
  onPress: () => {
    // 1. Extraer datos necesarios del perfil actual
    const { altura, nacimiento, sexo, objetivo, actividad } = perfilActual;
    
    // 2. Calcular edad (reutilizando lógica o calculando aquí)
    const hoy = new Date();
    const cumple = new Date(nacimiento);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    if (hoy.getMonth() < cumple.getMonth() || (hoy.getMonth() === cumple.getMonth() && hoy.getDate() < cumple.getDate())) {
      edad--;
    }

    // 3. Fórmula Mifflin-St. Jeor con el NUEVO peso corporal
    let tmb = (10 * pesoNum) + (6.25 * parseFloat(altura)) - (5 * edad);
    tmb = sexo === 'hombre' ? tmb + 5 : tmb - 161;

    // 4. Aplicar factor de actividad y meta (Asegúrate que los nombres coincidan)
    let mantenimiento = tmb * actividad;
    let nuevaMeta = Math.round(
      objetivo === 'Perder Grasa' ? mantenimiento - 500 : 
      objetivo === 'Ganar Músculo' ? mantenimiento + 400 : 
      mantenimiento
    );

    realizarGuardado(nuevaMeta);
  }
}
          ]
        );
      } else {
        // Si es el primer registro o el peso es igual
        realizarGuardado(perfilActual ? perfilActual.caloriasMeta : 2000);
      }

    } catch (e) {
      console.log("Error al registrar peso:", e);
      Alert.alert("Error", "No se pudo sincronizar el peso.");
    }
  };

  const borrarUltimoPeso = async () => {
  Alert.alert(
    "Eliminar último registro",
    "¿Estás seguro de que quieres borrar el último peso anotado?",
    [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sí, borrar", 
        style: "destructive", 
        onPress: async () => {
          try {
            const guardadoPeso = await AsyncStorage.getItem('@historial_peso');
            if (guardadoPeso) {
              let lista = JSON.parse(guardadoPeso);
              if (lista.length > 0) {
                lista.pop(); // Elimina el último elemento
                await AsyncStorage.setItem('@historial_peso', JSON.stringify(lista));
                
                // Si aún quedan pesos, actualizamos el perfil con el que quedó al final
                const perfilDoc = await AsyncStorage.getItem('@perfil_usuario');
                if (perfilDoc && lista.length > 0) {
                  const perfil = JSON.parse(perfilDoc);
                  perfil.peso = lista[lista.length - 1].peso;
                  await AsyncStorage.setItem('@perfil_usuario', JSON.stringify(perfil));
                }
                
                cargarTodo(); // Recargamos la gráfica y estados
                Alert.alert("Eliminado", "El último registro ha sido borrado.");
              }
            }
          } catch (e) {
            console.log("Error al borrar:", e);
          }
        } 
      }
    ]
  );
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

              {/* AÑADE ESTO: Texto de porcentaje debajo de la barra */}
  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 5}}>
    <Text style={{color: '#AAA', fontSize: 10}}>{diaDelReto} de 90 días</Text>
    <Text style={{color: '#28A745', fontSize: 10, fontWeight: 'bold'}}>
      {((diaDelReto / 90) * 100).toFixed(0)}%
    </Text>
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

              {/* Lógica de botones al final del reto */}
{diaDelReto >= 90 ? (
  <TouchableOpacity 
    style={[styles.btnReto, {backgroundColor: '#28A745', marginTop: 15}]} 
    onPress={gestionarReto}
  >
    <Text style={styles.btnRetoTxt}>¡RETO COMPLETADO! EMPEZAR OTRA VEZ</Text>
  </TouchableOpacity>
) : (
  <TouchableOpacity onPress={gestionarReto}>
    <Text style={styles.abandonarTxt}>Abandonar reto</Text>
  </TouchableOpacity>
)}
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
          <ViewShot ref={chartRef} options={{ format: "jpg", quality: 0.9 }}>
          <LineChart  
            data={{ 
  labels: fechas.length > 0 ? fechas : ["-"], // Si no hay fechas, pone un guion
  datasets: [{ 
    // Si solo hay un peso, duplicamos el punto para que la línea sea visible
      data: historialPeso.length === 1 ? [historialPeso[0], historialPeso[0]] : 
            historialPeso.length > 0 ? historialPeso : [0] // Si no hay pesos, pone 0 para no crashear
  }] 
}}
            width={Dimensions.get("window").width - 70}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
          </ViewShot>
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
  
  {/* Bloque horizontal: Input + Botón Anotar */}
  <View style={styles.row}>
    <TextInput 
      style={styles.input} 
      keyboardType="numeric" 
      value={nuevoPeso} 
      onChangeText={setNuevoPeso} 
      placeholder="Ej: 75.5" 
    />
    <TouchableOpacity style={styles.btn} onPress={registrarPeso}>
      <Text style={styles.btnText}>Anotar</Text>
    </TouchableOpacity>
  </View>

  {/* Bloque vertical (FUERA DEL ROW): Botón Borrar */}
  {fechas.length > 0 && fechas[0] !== '-' && (
    <TouchableOpacity 
      style={{ 
        marginTop: 15, 
        paddingVertical: 10, // Más fácil de presionar
        alignItems: 'center', 
        flexDirection: 'row', 
        justifyContent: 'center' 
      }} 
      onPress={borrarUltimoPeso}
    >
      <Ionicons name="arrow-undo-outline" size={16} color="#FF4444" />
      <Text style={{ color: '#FF4444', fontSize: 12, marginLeft: 5, fontWeight: 'bold' }}>
        BORRAR ÚLTIMA ANOTACIÓN
      </Text>
    </TouchableOpacity>
  )}

          
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
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Corregido
  propsForDots: {
    r: "5",
    strokeWidth: "2",
    stroke: "#28A745"
  }
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