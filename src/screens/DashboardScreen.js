import React, { useState, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Alert, ScrollView, Modal,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import alimentosLocales from '../data/alimentos.json';
import Constants from 'expo-constants';

// Leer API KEY desde variable de entorno en build (EXPO_USDA_API_KEY) o desde app config
// Esto permite fijar la clave en Vercel sin guardarla en git.
const USDA_API_KEY =
  process.env.EXPO_USDA_API_KEY ||
  Constants.manifest?.extra?.USDA_API_KEY ||
  null;

export default function DashboardScreen() {
  // --- ESTADOS ---
  const [fechaConsulta, setFechaConsulta] = useState(new Date());
  const [metaCalorias, setMetaCalorias] = useState(2000);
  const [metasMacros, setMetasMacros] = useState({ p: 0, c: 0, g: 0 });
  const [comidasDelDia, setComidasDelDia] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalCantidad, setModalCantidad] = useState(false);
  const [alimentoSeleccionado, setAlimentoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState('1');
  const [esPorUnidad, setEsPorUnidad] = useState(false);
  const [modalManual, setModalManual] = useState(false);
  const [manualFood, setManualFood] = useState({ nombre: '', kcal: '', p: '', c: '', g: '' });
  const [aguaConsumida, setAguaConsumida] = useState(0);
  const [metaAgua, setMetaAgua] = useState(2000);

  // --- HERRAMIENTAS DE FECHA ---
  const getFechaKey = (date) => {
    try { return date.toISOString().split('T')[0]; } 
    catch (e) { return new Date().toISOString().split('T')[0]; }
  };
  
  const getFechaDisplay = (date) => {
    const hoy = new Date();
    if (getFechaKey(date) === getFechaKey(hoy)) return "Hoy";
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  };
  
  const cambiarDia = (offset) => {
    const nuevaFecha = new Date(fechaConsulta);
    nuevaFecha.setDate(fechaConsulta.getDate() + offset);
    setFechaConsulta(nuevaFecha);
  };

  // --- LÓGICA DE MACROS (TUYA ORIGINAL) ---
  const calcularMacros = (objetivo, kcalMeta, peso) => {
    const pesoNum = parseFloat(peso) || 70;
    let p, g, c;
    if (objetivo === 'Perder Grasa') { p = pesoNum * 2.2; g = pesoNum * 0.8; }
    else if (objetivo === 'Ganar Músculo') { p = pesoNum * 1.8; g = pesoNum * 1.0; }
    else { p = pesoNum * 1.6; g = pesoNum * 0.9; }
    const kcalRestantes = kcalMeta - (p * 4 + g * 9);
    c = kcalRestantes / 4;
    return { p: Math.round(p), c: Math.round(c), g: Math.round(g) };
  };

  // --- CARGA CENTRALIZADA (CON TU LÓGICA DE AGUA 35ml) ---
  const cargarTodo = async () => {
    try {
      const llave = getFechaKey(fechaConsulta);
      const perfilDoc = await AsyncStorage.getItem('@perfil_usuario');
      
      if (perfilDoc) {
        const p = JSON.parse(perfilDoc);
        setMetaCalorias(p.caloriasMeta);
        setMetasMacros(calcularMacros(p.objetivo, p.caloriasMeta, p.peso));
        // Lógica original: 35ml por kg
        setMetaAgua(Math.round(parseFloat(p.peso) * 35));
      }

      const datosComida = await AsyncStorage.getItem(`@diario_${llave}`);
      setComidasDelDia(datosComida ? JSON.parse(datosComida) : []);

      const datosAgua = await AsyncStorage.getItem(`@agua_${llave}`);
      setAguaConsumida(datosAgua ? parseInt(datosAgua) : 0);
    } catch (e) { console.log("Error:", e); }
  };

  useFocusEffect(
    useCallback(() => { cargarTodo(); }, [fechaConsulta])
  );

  // --- ACCIONES DE AGUA (CON TU ALERTA DE 6L) ---
  const sumarAgua = async (ml) => {
    const llave = getFechaKey(fechaConsulta);
    const nuevaCantidad = aguaConsumida + ml;
    if (nuevaCantidad > 5000) {
      // incluir icono de advertencia para enfatizar
      Alert.alert("⚠️ ¡Atención!", "Estás registrando mucha agua. Mantén presionado para reiniciar si es un error.");
    }
    setAguaConsumida(nuevaCantidad);
    await AsyncStorage.setItem(`@agua_${llave}`, nuevaCantidad.toString());
  };

  const reiniciarAgua = () => {
    Alert.alert("Reiniciar", "¿Vaciar contador de este día?", [
      { text: "No" },
      { text: "Sí", onPress: async () => {
          const llave = getFechaKey(fechaConsulta);
          setAguaConsumida(0);
          await AsyncStorage.setItem(`@agua_${llave}`, "0");
      }}
    ]);
  };

  // --- GUARDADO DE ALIMENTOS (TU LÓGICA DE FACTOR ORIGINAL) ---
 const confirmarGuardado = async () => {
  const llave = getFechaKey(fechaConsulta);
  
  const cantLimpia = cantidad.replace(',', '.');
  const cantNum = parseFloat(cantLimpia) || 0;
  
  if (cantNum <= 0) {
    Alert.alert("Error", "Ingresa una cantidad válida");
    return;
  }

  let factor;
  let sufijo;

  if (esPorUnidad) {
    const pesoRef = alimentoSeleccionado.pesoUnidad || 100; 
    factor = (cantNum * pesoRef) / 100;
    sufijo = "u";
  } else {
    factor = cantNum / 100;
    sufijo = "g";
  }

  const itemFinal = {
    ...alimentoSeleccionado,
    // Usamos cantNum para el nombre para que siempre use el punto decimal correcto
    nombre: `${alimentoSeleccionado.nombre} (${cantNum}${sufijo})`,
    // Aplicamos factor y redondeamos a 1 decimal para estabilidad visual
    calorias: parseFloat(((Number(alimentoSeleccionado.calorias) || 0) * factor).toFixed(1)),
    p: parseFloat(((Number(alimentoSeleccionado.p) || 0) * factor).toFixed(1)),
    c: parseFloat(((Number(alimentoSeleccionado.c) || 0) * factor).toFixed(1)),
    g: parseFloat(((Number(alimentoSeleccionado.g) || 0) * factor).toFixed(1)),
    id: Date.now(),
    fuente: alimentoSeleccionado.fuente || 'Local' 
  };

  try {
    const nuevaLista = [...comidasDelDia, itemFinal];
    setComidasDelDia(nuevaLista);
    await AsyncStorage.setItem(`@diario_${llave}`, JSON.stringify(nuevaLista));
    
    setModalCantidad(false);
    setBusqueda('');
    setResultados([]);
    setCantidad('1');
  } catch (e) {
    Alert.alert("Error", "No se pudo guardar");
  }
};

  // --- EL RESTO DE FUNCIONES (BUSCADOR, ELIMINAR, ETC) ---
  const buscarAlimento = async () => {
    if (busqueda.length < 3) return;
    setCargando(true);
    try {
      const locales = alimentosLocales.filter(item => 
        item.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      if (locales.length > 0) {
        setResultados(locales.map(l => ({ ...l, fuente: 'Local' })));
      } else {
        if (!USDA_API_KEY) {
          Alert.alert('API key ausente', 'No se configuró la clave de USDA. Solo se buscan alimentos locales.');
          setResultados([]);
          setCargando(false);
          return;
        }

        const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${busqueda}&pageSize=15`);
        const data = await res.json();
        const procesados = (data.foods || []).map(f => ({
          id: f.fdcId || Date.now() + Math.random(),
          nombre: f.description.toLowerCase(),
          subnombre: f.brandOwner || f.foodCategory || "Externo",
          calorias: f.foodNutrients.find(n => n.nutrientId === 1008)?.value || 0,
          p: f.foodNutrients.find(n => n.nutrientId === 1003)?.value || 0,
          g: f.foodNutrients.find(n => n.nutrientId === 1004)?.value || 0,
          c: f.foodNutrients.find(n => n.nutrientId === 1005)?.value || 0,
          fuente: 'USDA'
        }));
        setResultados(procesados);
      }
    } catch (e) { Alert.alert("Error", "No hay conexión"); } finally { setCargando(false); }
  };

  const abrirModalCantidad = (item) => {
    setAlimentoSeleccionado(item);
    const esReceta = item.subnombre?.includes('Recetas');
    const esHuevo = item.nombre.toLowerCase().includes('huevo');
    setEsPorUnidad(esReceta || esHuevo);
    setCantidad(esReceta || esHuevo ? '1' : '100');
    setModalCantidad(true);
  };

  const eliminarAlimento = async (id) => {
    const llave = getFechaKey(fechaConsulta);
    const nuevaLista = comidasDelDia.filter(item => item.id !== id);
    setComidasDelDia(nuevaLista);
    await AsyncStorage.setItem(`@diario_${llave}`, JSON.stringify(nuevaLista));
  };

  const guardarManual = async () => {
  // 1. Validaciones básicas
  if (!manualFood.nombre.trim() || !manualFood.kcal) {
    Alert.alert("Campos incompletos", "Por favor completa al menos el nombre y las calorías.");
    return;
  }

  // 2. Aseguramos que los valores sean números reales (evitamos NaN)
  const item = {
    nombre: manualFood.nombre.trim(),
    calorias: parseFloat(manualFood.kcal) || 0,
    p: parseFloat(manualFood.p) || 0,
    c: parseFloat(manualFood.c) || 0,
    g: parseFloat(manualFood.g) || 0,
    id: Date.now(),
    subnombre: "Entrada Manual",
    fuente: 'Manual'
  };

  try {
    const nuevaLista = [...comidasDelDia, item];
    const llave = getFechaKey(fechaConsulta);
    
    // Actualizamos estado y storage
    setComidasDelDia(nuevaLista);
    await AsyncStorage.setItem(`@diario_${llave}`, JSON.stringify(nuevaLista));
    
    // Reset de UI
    setModalManual(false);
    setManualFood({ nombre: '', kcal: '', p: '', c: '', g: '' });
    
    Alert.alert("Éxito", "Alimento guardado correctamente.");
  } catch (e) {
    Alert.alert("Error", "No se pudo guardar el alimento.");
  }
};

  const consumido = comidasDelDia.reduce((acc, i) => acc + (Number(i.calorias) || 0), 0);
  const tP = comidasDelDia.reduce((acc, i) => acc + (Number(i.p) || 0), 0);
  const tC = comidasDelDia.reduce((acc, i) => acc + (Number(i.c) || 0), 0);
  const tG = comidasDelDia.reduce((acc, i) => acc + (Number(i.g) || 0), 0);

  // Evita divisiones por cero cuando las metas todavía no están cargadas
  const porcentajeConsumido = metaCalorias > 0 ? Math.min(100, (consumido / metaCalorias) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">

        <View style={styles.brandContainer}>
            <Ionicons name="leaf" size={16} color="#28A745" />
            <Text style={styles.brandTitle}>MONTALFIT</Text>
        </View>

        {/* Nota para web: algunas interacciones requieren dispositivo móvil */}
        {Platform.OS === 'web' && (
          <View style={styles.webNote}>
            <Text style={styles.webNoteText}>
              ⚠️ Las funciones de largo pulsado y algunas APIs sólo están disponibles en móvil. 
              Para probarlas instala la PWA o abre en Expo Go usando el QR.
            </Text>
          </View>
        )}

        <View style={styles.selectorFecha}>
          <TouchableOpacity onPress={() => cambiarDia(-1)} style={styles.flechaBtn}>
            <Ionicons name="chevron-back" size={24} color="#28A745" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.fechaTexto}>{getFechaDisplay(fechaConsulta)}</Text>
            <Text style={styles.fechaSubtexto}>{getFechaKey(fechaConsulta)}</Text>
          </View>
          <TouchableOpacity onPress={() => cambiarDia(1)} style={styles.flechaBtn}>
            <Ionicons name="chevron-forward" size={24} color="#28A745" />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.restantes}>{Math.max(0, Math.round(metaCalorias - consumido))}</Text>
          <Text style={styles.sub}>Calorías Restantes</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${porcentajeConsumido}%` }]} />
          </View>
        </View>

        <View style={styles.macroRow}>
          {[
            { label: 'PROT', val: tP, meta: metasMacros.p, color: '#28A745' },
            { label: 'CARBS', val: tC, meta: metasMacros.c, color: '#FFC107' },
            { label: 'GRASAS', val: tG, meta: metasMacros.g, color: '#17A2B8' }
          ].map((m, idx) => (
            <View key={idx} style={styles.circleContainer}>
              <View style={[styles.macroCircle, { borderColor: m.color }]}>
                <View style={[styles.fillIndicator, { 
                  height: `${m.meta ? Math.min(100, (m.val / m.meta) * 100) : 0}%`, 
                  backgroundColor: m.color, opacity: 0.2 
                }]} />
                <Text style={styles.mV}>{Math.round(m.val)}g</Text>
                <View style={styles.divider} />
                <Text style={styles.mTotal}>{m.meta}g</Text>
              </View>
              <Text style={styles.mL}>{m.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.aguaCard} onLongPress={reiniciarAgua} activeOpacity={0.8}>
          <View>
            <Text style={styles.aguaTitulo}>Hidratación</Text>
            <Text style={styles.aguaSubTitulo}>Manten presionado para reiniciar</Text>
            <Text style={styles.aguaMeta}>{aguaConsumida}ml / {metaAgua}ml</Text>
          </View>
          <TouchableOpacity style={styles.btnAgua} onPress={() => sumarAgua(250)}>
            <Text style={styles.btnAguaTxt}>+250ml 💧</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.searchRow}>
          <TextInput style={styles.input} placeholder="Buscar alimento..." value={busqueda} onChangeText={(t) => {setBusqueda(t); if(t==='') setResultados([]);}} placeholderTextColor="#888" />
          <TouchableOpacity style={styles.btnS} onPress={buscarAlimento}>
            {cargando ? <ActivityIndicator color="#FFF"/> : <Ionicons name="search" size={20} color="#FFF" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setModalManual(!modalManual)}>
          <Text style={styles.manualText}>{modalManual ? "✕ Cerrar" : "+ Añadir Manualmente"}</Text>
        </TouchableOpacity>

        {modalManual && (
  <View style={styles.manualForm}>
    <TextInput 
      style={styles.inputM} 
      placeholder="Nombre del alimento" 
      placeholderTextColor="#999" 
      value={manualFood.nombre}
      onChangeText={t => setManualFood({...manualFood, nombre: t})} 
    />
    
    <View style={styles.row}>
      <TextInput 
        style={[styles.inputM, {flex: 1, marginRight: 5}]} 
        placeholder="Kcal" 
        keyboardType="numeric" 
        placeholderTextColor="#999" 
        value={manualFood.kcal}
        onChangeText={t => setManualFood({...manualFood, kcal: t})} 
        accessibilityLabel="Campo para ingresar calorías"
        accessibilityHint="Ingresa un número entero"
      />

      <TextInput 
        style={[styles.inputM, {flex: 1}]} 
        placeholder="Prot (g: 0.0)" 
        keyboardType="numeric" 
        placeholderTextColor="#999" 
        value={manualFood.p}
        onChangeText={t => setManualFood({...manualFood, p: t})} 
        accessibilityLabel="Campo para ingresar gramos de proteína"
        accessibilityHint="Ingresa un número decimal usando punto como separador de decimales"
      />
    </View>

    <View style={styles.row}>
      <TextInput 
        style={[styles.inputM, {flex: 1, marginRight: 5}]} 
        placeholder="Carbs (g: 0.0)" 
        keyboardType="numeric" 
        placeholderTextColor="#999" 
        value={manualFood.c}
        onChangeText={t => setManualFood({...manualFood, c: t})} 
        accessibilityLabel="Campo para ingresar gramos de carbohidratos"
        accessibilityHint="Ingresa un número decimal usando punto como separador de decimales"
      />
      <TextInput 
        style={[styles.inputM, {flex: 1}]} 
        placeholder="Grasas (g: 0.0)" 
        keyboardType="numeric" 
        placeholderTextColor="#999" 
        value={manualFood.g}
        onChangeText={t => setManualFood({...manualFood, g: t})} 
        accessibilityLabel="Campo para ingresar gramos de grasas"
        accessibilityHint="Ingresa un número decimal usando punto como separador de decimales"
      />
    </View>

    <TouchableOpacity style={styles.btnG} onPress={guardarManual}>
      <Text style={styles.btnT}>GUARDAR ALIMENTO</Text>
    </TouchableOpacity>
  </View>
)}

       <Text style={styles.tituloSec}>{resultados.length > 0 ? "Resultados:" : "Hoy:"}</Text>
{(resultados.length > 0 ? resultados : comidasDelDia).map((item, index) => (
  <View key={item.id || index} style={styles.itemContainer}>
    <TouchableOpacity 
      style={styles.item} 
      onPress={() => resultados.length > 0 ? abrirModalCantidad(item) : null} 
      disabled={resultados.length === 0}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName} numberOfLines={1}>{item.nombre}</Text>
        
        {/* Contenedor horizontal para Macros + Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={styles.itemMacros}>
            P: {(Number(item.p) || 0).toFixed(1)}g | C: {(Number(item.c) || 0).toFixed(1)}g | G: {(Number(item.g) || 0).toFixed(1)}g
          </Text>
          
          {/* Badge dinámico */}
          <View style={[
            styles.badge, 
            { 
              backgroundColor: item.fuente === 'USDA' ? '#3b82f6' : 
                               item.fuente === 'Manual' ? '#6c757d' : '#28A745',
              marginLeft: 8 
            }
          ]}>
            <Text style={styles.badgeText}>{item.fuente || 'LOCAL'}</Text>
          </View>
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={styles.itemK}>{Math.round(item.calorias)}</Text>
        <Text style={{ color: '#28A745', fontSize: 10, fontWeight: 'bold' }}>kcal</Text>
      </View>
    </TouchableOpacity>

    {resultados.length === 0 && (
      <TouchableOpacity onPress={() => eliminarAlimento(item.id)} style={styles.btnBorrar}>
        <Ionicons name="trash-outline" size={20} color="#FF4444" />
      </TouchableOpacity>
    )}
  </View>
))}
<View style={{ height: 100 }} /> 
     </ScrollView>

      {/* MODAL CANTIDAD */}
<Modal visible={modalCantidad} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalCant}>
      <Text style={styles.modalTitle}>{alimentoSeleccionado?.nombre}</Text>
      
      {/* Selector de unidad simple para todo */}
      <View style={styles.unitSelector}>
        <TouchableOpacity 
          onPress={() => { setEsPorUnidad(false); setCantidad('100'); }} 
          style={[styles.unitBtn, !esPorUnidad && styles.unitBtnActive]}
        >
          <Text style={styles.unitBtnText}>Gramos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => { setEsPorUnidad(true); setCantidad('1'); }} 
          style={[styles.unitBtn, esPorUnidad && styles.unitBtnActive]}
        >
          <Text style={styles.unitBtnText}>Unidades</Text>
        </TouchableOpacity>
      </View>

      <TextInput 
        style={styles.inputCant} 
        keyboardType="numeric" 
        value={cantidad} 
        onChangeText={setCantidad} 
        autoFocus 
      />

      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.btnG, {backgroundColor: '#444', flex: 1, marginRight: 10}]} 
          onPress={() => setModalCantidad(false)}
        >
          <Text style={styles.btnT}>VOLVER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnG, {flex: 2}]} onPress={confirmarGuardado}>
          <Text style={styles.btnT}>AÑADIR</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003366', paddingHorizontal: 20 },
  header: { alignItems: 'center', marginVertical: 10, backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 25 },
  restantes: { color: '#FFF', fontSize: 55, fontWeight: '900' },
  brandContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  brandTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginLeft: 8 },
  sub: { color: '#28A745', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  barBg: { height: 6, width: '100%', backgroundColor: '#112233', borderRadius: 3, marginTop: 15 },
  barFill: { height: 6, backgroundColor: '#28A745', borderRadius: 3 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  circleContainer: {
    alignItems: 'center',
    width: '30%',
  },
  
  divider: {
    height: 1,
    width: '60%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 2,
  },
  mTotal: {
    color: '#AAA',
    fontSize: 10,
    fontWeight: 'bold',
  },
  macroCircle: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden', // IMPORTANTE: Corta el relleno para que sea circular
    position: 'relative',
  },
  fillIndicator: {
    opacity: 0.6,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  // Actualiza mV y mL que ya tenías
  mCard: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 12, borderRadius: 15, width: '31%', alignItems: 'center' },
  mV: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  mL: { color: '#28A745', fontSize: 10, fontWeight: 'bold' },
  aguaCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0, 122, 255, 0.1)', padding: 18, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0, 122, 255, 0.3)' },
  aguaTitulo: { color: '#82B1FF', fontWeight: 'bold', fontSize: 15, textTransform: 'uppercase' },
  aguaSubTitulo: { color: '#c5ddf6', fontSize: 12, marginBottom: 5 },
  aguaMeta: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  btnAgua: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
  btnAguaTxt: { color: '#FFF', fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', marginBottom: 10 },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 15, color: '#000' },
  btnS: { backgroundColor: '#28A745', width: 55, marginLeft: 8, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  manualText: { color: '#28A745', textAlign: 'center', marginVertical: 10, fontWeight: 'bold' },
  manualForm: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 20, marginBottom: 15 },
  inputM: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 8, color: '#000' },
  row: { flexDirection: 'row' },
  btnG: { backgroundColor: '#28A745', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnT: { color: '#FFF', fontWeight: 'bold' },
  tituloSec: { color: '#AAA', marginBottom: 12, fontSize: 11, fontWeight: 'bold' },
  itemContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  item: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18 },
  itemName: { color: '#FFF', fontWeight: '700', fontSize: 14, maxWidth: '70%' },
  itemMacros: { color: '#28A745', fontSize: 11 },
  itemK: { color: '#FFF', fontWeight: '900', fontSize: 18 },
  btnBorrar: { padding: 12, marginLeft: 8, backgroundColor: 'rgba(255,68,68,0.1)', borderRadius: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,10,20,0.9)', justifyContent: 'center', padding: 25 },
  modalCant: { backgroundColor: '#001a33', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: '#28A745' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  unitSelector: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#112233', borderRadius: 15, padding: 5 },
  unitBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  unitBtnActive: { backgroundColor: '#28A745' },
  unitBtnText: { color: '#FFF', fontWeight: 'bold' },
  inputCant: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, fontSize: 30, textAlign: 'center', fontWeight: '900', color: '#000', marginBottom: 20 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  selectorFecha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(40, 167, 69, 0.2)',
  },
  fechaTexto: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  fechaSubtexto: {
    color: '#28A745',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 1,
  },
  webNote: { backgroundColor: '#333', padding: 10, borderRadius: 8, marginVertical: 10 },
  webNoteText: { color: '#FFD700', fontSize: 12, textAlign: 'center' },
  flechaBtn: {
    padding: 10,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderRadius: 12,
  },
});