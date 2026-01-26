import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Alert, ScrollView, Modal 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 1. IMPORTA TU LISTA LOCAL (Asegúrate de que la ruta sea correcta)
import alimentosLocales from '../data/alimentos.json'; 

const USDA_API_KEY = 'UyLYCL8Bq6X0QmrQzuz5vxF9tHrnj2QlaxsaAvRd'; 

export default function DashboardScreen() {
  const [metaCalorias, setMetaCalorias] = useState(2000);
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

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const perfil = await AsyncStorage.getItem('@perfil_usuario');
      if (perfil) setMetaCalorias(JSON.parse(perfil).caloriasMeta);
      const hoy = new Date().toISOString().split('T')[0];
      const guardado = await AsyncStorage.getItem(`@diario_${hoy}`);
      if (guardado) setComidasDelDia(JSON.parse(guardado));
    } catch (e) { console.log("Error al cargar"); }
  };

  // --- NUEVA LÓGICA DE BÚSQUEDA HÍBRIDA ---
  const buscarAlimento = async () => {
    if (busqueda.length < 3) return;
    setCargando(true);
    
    try {
      // PASO A: Buscar en JSON Local
      const locales = alimentosLocales.filter(item => 
        item.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );

      if (locales.length > 0) {
        setResultados(locales.map(l => ({ ...l, fuente: 'Local' })));
      } else {
        // PASO B: Si no hay local, buscar en USDA (Sin traducción para más velocidad)
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
    } catch (e) { 
      Alert.alert("Error", "No hay conexión para búsqueda externa"); 
    } finally { 
      setCargando(false); 
    }
  };

  const abrirModalCantidad = (item) => {
    setAlimentoSeleccionado(item);
    const esHuevo = item.nombre.toLowerCase().includes('huevo') || item.nombre.toLowerCase().includes('egg');
    setEsPorUnidad(esHuevo);
    setCantidad(esHuevo ? '1' : '100');
    setModalCantidad(true);
  };

  const confirmarGuardado = async () => {
    let factor = esPorUnidad ? (parseFloat(cantidad) * 50) / 100 : parseFloat(cantidad) / 100;
    let sufijo = esPorUnidad ? "u" : "g";

    const itemFinal = {
      ...alimentoSeleccionado,
      nombre: `${alimentoSeleccionado.nombre} (${cantidad}${sufijo})`,
      calorias: alimentoSeleccionado.calorias * factor,
      p: alimentoSeleccionado.p * factor,
      c: alimentoSeleccionado.c * factor,
      g: alimentoSeleccionado.g * factor,
      id: Date.now()
    };

    const nuevaLista = [...comidasDelDia, itemFinal];
    setComidasDelDia(nuevaLista);
    const hoy = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(`@diario_${hoy}`, JSON.stringify(nuevaLista));
    
    setModalCantidad(false);
    setResultados([]);
    setBusqueda('');
  };

  const eliminarAlimento = async (id) => {
    const nuevaLista = comidasDelDia.filter(item => item.id !== id);
    setComidasDelDia(nuevaLista);
    const hoy = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(`@diario_${hoy}`, JSON.stringify(nuevaLista));
  };

  const guardarManual = async () => {
    const item = {
      nombre: manualFood.nombre || "Manual",
      calorias: parseFloat(manualFood.kcal) || 0,
      p: parseFloat(manualFood.p) || 0,
      c: parseFloat(manualFood.c) || 0,
      g: parseFloat(manualFood.g) || 0,
      id: Date.now(),
      subnombre: "Entrada Manual",
      fuente: 'Manual'
    };
    const nuevaLista = [...comidasDelDia, item];
    setComidasDelDia(nuevaLista);
    const hoy = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(`@diario_${hoy}`, JSON.stringify(nuevaLista));
    setModalManual(false);
    setManualFood({ nombre: '', kcal: '', p: '', c: '', g: '' });
  };

  // CÁLCULOS DE TOTALES
  const consumido = comidasDelDia.reduce((acc, i) => acc + (Number(i.calorias) || 0), 0);
  const tP = comidasDelDia.reduce((acc, i) => acc + (Number(i.p) || 0), 0).toFixed(1);
  const tC = comidasDelDia.reduce((acc, i) => acc + (Number(i.c) || 0), 0).toFixed(1);
  const tG = comidasDelDia.reduce((acc, i) => acc + (Number(i.g) || 0), 0).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* HEADER CALORÍAS */}
        <View style={styles.header}>
          <Text style={styles.restantes}>{Math.max(0, Math.round(metaCalorias - consumido))}</Text>
          <Text style={styles.sub}>Calorías Restantes</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, {width: `${Math.min(100, (consumido/metaCalorias)*100)}%`}]} />
          </View>
        </View>

        {/* MACROS TOTALES */}
        <View style={styles.macroRow}>
          <View style={styles.mCard}><Text style={styles.mV}>{tP}g</Text><Text style={styles.mL}>Prot</Text></View>
          <View style={styles.mCard}><Text style={styles.mV}>{tC}g</Text><Text style={styles.mL}>Carbs</Text></View>
          <View style={styles.mCard}><Text style={styles.mV}>{tG}g</Text><Text style={styles.mL}>Grasas</Text></View>
        </View>

        {/* BUSCADOR */}
        <View style={styles.searchRow}>
          <TextInput style={styles.input} placeholder="Buscar alimento..." value={busqueda} onChangeText={(t) => {setBusqueda(t); if(t==='') setResultados([]);}} placeholderTextColor="#888" />
          <TouchableOpacity style={styles.btnS} onPress={buscarAlimento}>
            {cargando ? <ActivityIndicator color="#FFF"/> : <Ionicons name="search" size={20} color="#FFF" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setModalManual(!modalManual)}>
          <Text style={styles.manualText}>{modalManual ? "✕ Cerrar" : "+ Añadir Manualmente"}</Text>
        </TouchableOpacity>

        {/* FORMULARIO MANUAL */}
        {modalManual && (
          <View style={styles.manualForm}>
            <TextInput style={styles.inputM} placeholder="Nombre del alimento" placeholderTextColor="#999" onChangeText={t => setManualFood({...manualFood, nombre: t})} />
            <View style={styles.row}>
                <TextInput style={[styles.inputM, {flex:1, marginRight:5}]} placeholder="Kcal" keyboardType="numeric" placeholderTextColor="#999" onChangeText={t => setManualFood({...manualFood, kcal: t})} />
                <TextInput style={[styles.inputM, {flex:1}]} placeholder="Prot (g)" keyboardType="numeric" placeholderTextColor="#999" onChangeText={t => setManualFood({...manualFood, p: t})} />
            </View>
            <View style={styles.row}>
                <TextInput style={[styles.inputM, {flex:1, marginRight:5}]} placeholder="Carbs (g)" keyboardType="numeric" placeholderTextColor="#999" onChangeText={t => setManualFood({...manualFood, c: t})} />
                <TextInput style={[styles.inputM, {flex:1}]} placeholder="Grasa (g)" keyboardType="numeric" placeholderTextColor="#999" onChangeText={t => setManualFood({...manualFood, g: t})} />
            </View>
            <TouchableOpacity style={styles.btnG} onPress={guardarManual}><Text style={styles.btnT}>GUARDAR ALIMENTO</Text></TouchableOpacity>
          </View>
        )}

        <Text style={styles.tituloSec}>{resultados.length > 0 ? "Resultados encontrados:" : "Consumo de hoy:"}</Text>
        
        {/* LISTADO DE RESULTADOS O COMIDAS */}
        {(resultados.length > 0 ? resultados : comidasDelDia).map((item, index) => (
          <View key={item.id || index} style={styles.itemContainer}>
            <TouchableOpacity 
              style={styles.item} 
              onPress={() => resultados.length > 0 ? abrirModalCantidad(item) : null}
              disabled={resultados.length === 0}
            >
              <View style={{ flex: 1 }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.nombre}</Text>
                  {item.fuente && (
                    <View style={[styles.badge, {backgroundColor: item.fuente === 'Local' ? '#28A745' : '#666'}]}>
                      <Text style={styles.badgeText}>{item.fuente}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.itemMacros}>
                  P: {Number(item.p).toFixed(1)}g | C: {Number(item.c).toFixed(1)}g | G: {Number(item.g).toFixed(1)}g
                </Text>
                <Text style={{ color: '#666', fontSize: 10, marginTop: 2 }}>{item.subnombre}</Text> 
              </View>
              <View style={{alignItems: 'flex-end', justifyContent: 'center'}}>
                <Text style={styles.itemK}>{Math.round(item.calorias)}</Text>
                <Text style={{color: '#28A745', fontSize: 10}}>kcal</Text>
              </View>
            </TouchableOpacity>

            {resultados.length === 0 && (
              <TouchableOpacity onPress={() => eliminarAlimento(item.id)} style={styles.btnBorrar}>
                <Ionicons name="trash-outline" size={20} color="#FF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={{height: 100}} />
      </ScrollView>

      {/* MODAL DE CANTIDAD */}
      <Modal visible={modalCantidad} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCant}>
            <Text style={styles.modalTitle} numberOfLines={2}>{alimentoSeleccionado?.nombre}</Text>
            <View style={styles.unitSelector}>
              <TouchableOpacity onPress={() => setEsPorUnidad(false)} style={[styles.unitBtn, !esPorUnidad && styles.unitBtnActive]}>
                <Text style={styles.unitBtnText}>Gramos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEsPorUnidad(true)} style={[styles.unitBtn, esPorUnidad && styles.unitBtnActive]}>
                <Text style={styles.unitBtnText}>Unidades</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.inputCant} keyboardType="numeric" value={cantidad} onChangeText={setCantidad} autoFocus />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btnG, {backgroundColor: '#444', flex: 1, marginRight: 10}]} onPress={() => setModalCantidad(false)}>
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
  container: { flex: 1, backgroundColor: '#003366', padding: 20 },
  header: { alignItems: 'center', marginVertical: 10, backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 25 },
  restantes: { color: '#FFF', fontSize: 55, fontWeight: '900' },
  sub: { color: '#28A745', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  barBg: { height: 6, width: '100%', backgroundColor: '#112233', borderRadius: 3, marginTop: 15 },
  barFill: { height: 6, backgroundColor: '#28A745', borderRadius: 3 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  mCard: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 12, borderRadius: 15, width: '30%', alignItems: 'center' },
  mV: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  mL: { color: '#28A745', fontSize: 10, fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', marginBottom: 10 },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 15, color: '#000', fontSize: 16 },
  btnS: { backgroundColor: '#28A745', width: 55, marginLeft: 8, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  manualText: { color: '#28A745', textAlign: 'center', marginVertical: 10, fontWeight: 'bold', fontSize: 14 },
  manualForm: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 20, marginBottom: 15 },
  inputM: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 8, color: '#000' },
  row: { flexDirection: 'row' },
  btnG: { backgroundColor: '#28A745', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  btnT: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  tituloSec: { color: '#AAA', marginTop: 10, marginBottom: 12, fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase' },
  itemContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  item: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  itemName: { color: '#FFF', textTransform: 'capitalize', fontWeight: '700', fontSize: 14, marginBottom: 2, maxWidth: '70%' },
  itemMacros: { color: '#28A745', fontSize: 11, fontWeight: '600' },
  itemK: { color: '#FFF', fontWeight: '900', fontSize: 18 },
  btnBorrar: { padding: 12, marginLeft: 8, backgroundColor: 'rgba(255,68,68,0.1)', borderRadius: 15, justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,10,20,0.9)', justifyContent: 'center', padding: 25 },
  modalCant: { backgroundColor: '#001a33', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: '#28A745' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  unitSelector: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#112233', borderRadius: 15, padding: 5 },
  unitBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12 },
  unitBtnActive: { backgroundColor: '#28A745' },
  unitBtnText: { color: '#FFF', fontWeight: 'bold' },
  inputCant: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, fontSize: 35, textAlign: 'center', fontWeight: '900', color: '#000', marginBottom: 25 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' }
});