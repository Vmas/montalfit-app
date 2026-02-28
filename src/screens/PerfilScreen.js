import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateInput from '../components/DateInput';
import { Platform } from 'react-native'; // Útil para diferenciar Android/iOS

export default function PerfilScreen({ onLogout }) {
  const [perfil, setPerfil] = useState(null);
  const [editando, setEditando] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Estados temporales para la edición
  const [tempData, setTempData] = useState({});

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [])
  );

  const calcularEdadReal = (fechaStr) => {
  if (!fechaStr) return 0;
  const hoy = new Date();
  const cumple = new Date(fechaStr);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
    edad--;
  }
  return edad;
};
const onChangeFecha = (event, selectedDate) => {
  setShowDatePicker(false); 
  // Si el usuario cancela en Android, el tipo de evento es "set". 
  // Si es "dismissed", simplemente no hacemos nada.
  if (event.type === 'set' && selectedDate) {
    const fechaFormateada = selectedDate.toISOString().split('T')[0];
    setTempData({ ...tempData, fechaNacimiento: fechaFormateada });
  }
};

  const cargarPerfil = async () => {
    try {
      const datos = await AsyncStorage.getItem('@perfil_usuario');
      if (datos) {
        const parsed = JSON.parse(datos);
        setPerfil(parsed);
        setTempData({...parsed, fechaNacimiento: parsed.nacimiento||parsed.fechaNacimiento }); // Inicializamos los datos temporales
      }
    } catch (e) {
      console.log("Error cargando perfil");
    }
  };

  const calcularIMC = () => {
    if (!perfil || !perfil.peso || !perfil.altura) return { valor: 0, estado: '-', nota: null };
    const alturaMeters = perfil.altura / 100;
    const imc = (perfil.peso / (alturaMeters * alturaMeters)).toFixed(1);
    
    let estado = "Normal";
    let nota = null;

    if (imc < 18.5) estado = "Bajo peso";
    else if (imc >= 25 && imc < 29.9) {
      estado = "Sobrepeso";
      if (perfil.actividad >= 1.55) nota = "Nota: Tu IMC puede ser elevado debido a tu masa muscular.";
    } else if (imc >= 30) {
      estado = "Obesidad";
      if (perfil.actividad >= 1.55) nota = "Nota: El IMC no es preciso si tienes mucha masa muscular.";
    }
    return { valor: imc, estado, nota };
  };

  const getActividadTexto = (val) => {
    const v = parseFloat(val);
    if (v <= 1.2) return 'Sedentario';
    if (v <= 1.375) return 'Ligera';
    if (v <= 1.55) return 'Moderada';
    return 'Intensa';
  };

const guardarCambios = async () => {
  try {
    // 1. Convertir y Validar números (Evita errores si el campo está vacío)
    const pesoNum = parseFloat(tempData.peso) || 0;
    const alturaNum = parseFloat(tempData.altura) || 0;
    
    if (alturaNum < 100 || alturaNum > 250) {
      Alert.alert("Dato no válido", "La estatura debe estar entre 100 y 250 cm.");
      return;
    }

    // 2. Calcular edad dinámica (La fuente de la verdad)
    const edadDinamica = calcularEdadReal(tempData.fechaNacimiento);
    
    // Validación extra: Que la fecha sea coherente (entre 14 y 99 años)
    if (edadDinamica < 14 || edadDinamica > 99) {
      Alert.alert("Fecha no válida", "La fecha de nacimiento debe corresponder a una edad entre 14 y 99 años.");
      return;
    }

    // 3. Fórmula Mifflin-St. Jeor (Cálculo profesional)
    let tmb = (10 * pesoNum) + (6.25 * alturaNum) - (5 * edadDinamica);
    tmb = tempData.sexo === 'hombre' ? tmb + 5 : tmb - 161;
    
    let calorias = Math.round(tmb * tempData.actividad);
    if (tempData.objetivo === 'Perder Grasa') calorias -= 500;
    if (tempData.objetivo === 'Ganar Músculo') calorias += 400;

    // 4. Guardar objeto limpio
    const nuevoPerfil = { 
      ...tempData, 
      nacimiento: tempData.fechaNacimiento,
      peso: pesoNum,   // Aseguramos que se guarde como número
      altura: alturaNum, // Aseguramos que se guarde como número
      edad: edadDinamica, 
      caloriasMeta: calorias 
    };

    // Borramos la propiedad vieja para que no haya basura en el JSON
  delete nuevoPerfil.fechaNacimiento;
    
    await AsyncStorage.setItem('@perfil_usuario', JSON.stringify(nuevoPerfil));
    setPerfil(nuevoPerfil);
    setEditando(false);
    Alert.alert("Éxito", "Perfil actualizado. Tus metas se han recalculado automáticamente.");
  } catch (e) {
    Alert.alert("Error", "No se pudieron guardar los cambios.");
  }
};
  const cerrarSesion = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro? Se borrarán tus datos de la aplicación.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, borrar datos clave", onPress: async () => {
            try {
              // Eliminamos únicamente las claves relevantes para evitar borrar otros datos
              await AsyncStorage.multiRemove(['@perfil_usuario','@historial_peso','@inicio_reto_montalfit']);
              // limpiar estado local
              setPerfil(null);
              setTempData({});

              // avisamos al componente padre para que actualice el estado "logueado"
              if (onLogout) {
                onLogout();
              }

              // En web podemos forzar una recarga para asegurar que no queden caches de PWA
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                setTimeout(() => window.location.reload(), 300);
                return;
              }

              // En móvil simplemente mostramos mensaje y dejamos que App reevalúe la condición
              Alert.alert("Datos borrados", "Se eliminaron los datos principales. Reinicia la app para empezar de cero.");
            } catch (e) {
              Alert.alert("Error", "No se pudieron borrar todos los datos.");
            }
        }}
      ]
    );
  };

  const limpiarDiarios = () => {
    Alert.alert(
      "Limpiar diarios",
      "¿Eliminar todos los registros diarios almacenados en el dispositivo? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, eliminar", onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const diarios = keys.filter(k => k && k.startsWith('@diario_'));
              if (diarios.length === 0) {
                Alert.alert('No hay diarios', 'No se encontraron registros diarios en el storage.');
                return;
              }
              // además limpiamos el historial de peso para que la gráfica de progreso quede vacía
              await AsyncStorage.multiRemove([...diarios, '@historial_peso']);
              Alert.alert('Listo', 'Se eliminaron los registros diarios y el historial de peso.');
            } catch (e) {
              console.log('Error limpiando diarios', e);
              Alert.alert('Error', 'No se pudieron eliminar todos los diarios.');
            }
        }}
      ]
    );
  };

  // Sólo para pruebas: forzar el inicio del reto 90 días atrás (visible en desarrollo)
  const forzarReto90 = async () => {
    try {
      const hoy = new Date();
      const inicio = new Date(hoy.getTime() - (90 - 1) * 24 * 60 * 60 * 1000); // hace 89 días -> día 90
      await AsyncStorage.setItem('@inicio_reto_montalfit', inicio.toISOString());
      Alert.alert('Forzado', 'El reto se ha fijado al día 90 para pruebas. Reinicia la pantalla de Progreso.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo forzar el reto.');
    }
  };

  const confirmarForzarReto90 = () => {
    Alert.alert(
      'Forzar Reto (solo dev)',
      'Esto fijará la fecha de inicio del reto 90 días atrás para pruebas. ¿Confirmas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, forzar', style: 'destructive', onPress: () => {
          console.log('[DEV] Forzando reto 90 días');
          forzarReto90();
        } }
      ]
    );
  };

  if (!perfil) return (
    <View style={[styles.container, {justifyContent: 'center'}]}>
      <Text style={{color: '#FFF', textAlign: 'center'}}>Cargando perfil...</Text>
    </View>
  );

  const imcData = calcularIMC();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* ENCABEZADO CON BOTÓN EDITAR/GUARDAR */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.btnEditHeader} 
            onPress={() => editando ? guardarCambios() : setEditando(true)}
          >
            <Ionicons name={editando ? "checkmark-circle" : "pencil"} size={24} color="#28A745" />
            <Text style={styles.btnEditTxt}>{editando ? "GUARDAR Y VOLVER" : "EDITAR"}</Text>
          </TouchableOpacity>

          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{perfil.nombre ? perfil.nombre[0].toUpperCase() : 'M'}</Text>
          </View>
          
          {editando ? (
            <TextInput 
              style={styles.inputNombre}
              value={tempData.nombre}
              onChangeText={(t) => setTempData({...tempData, nombre: t})}
            />
          ) : (
            <Text style={styles.nombre}>{perfil.nombre}</Text>
          )}
        </View>

        {/* CARD DE ESTADÍSTICAS (Ahora incluye el Objetivo) */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{perfil.peso}kg</Text>
            <Text style={styles.statLabel}>Peso</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{perfil.caloriasMeta}</Text>
            <Text style={styles.statLabel}>Kcal Meta</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, {color: '#d3ec41'}]}>
                {perfil.objetivo === 'Perder Grasa' ? 'Perder Grasa' : perfil.objetivo === 'Ganar Músculo' ? 'Ganar Músculo' : 'Mantener'}
            </Text>
            <Text style={styles.statLabel}>Objetivo</Text>
          </View>
        </View>

        {/* SECCIÓN DE DETALLES EDITABLES */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Detalles del Perfil</Text>
          
          {/* ALTURA */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Altura (cm):</Text>
            {editando ? (
              <TextInput 
                style={styles.inputEdit}
                keyboardType="numeric"
                value={String(tempData.altura)}
                onChangeText={(t) => setTempData({...tempData, altura: t})}
              />
            ) : <Text style={styles.infoText}>{perfil.altura} cm</Text>}
          </View>

          {/* EDAD */}
          <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha de Nacimiento:</Text>
          {editando ? (
            <View>
              <TouchableOpacity style={styles.btnFechaSelector} disabled>
                {/* placeholder container so styles remain consistent */}
                <Text style={styles.btnFechaSelectorTxt}>{tempData.fechaNacimiento || "Seleccionar Fecha"}</Text>
                <Ionicons name="calendar-outline" size={18} color="#28A745" />
              </TouchableOpacity>

              {/* Cross-platform date input */}
              <DateInput
                value={tempData.fechaNacimiento || ''}
                onPress={() => setShowDatePicker(true)}
                onChange={(iso) => {
                  if (iso) setTempData({ ...tempData, fechaNacimiento: iso });
                }}
              />

              {showDatePicker && (
                <DateTimePicker
                  value={tempData.fechaNacimiento ? new Date(tempData.fechaNacimiento) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeFecha}
                  maximumDate={new Date()} // No permite fechas futuras
                />
              )}
            </View>
          ) : (
            <Text style={styles.infoText}>{perfil.nacimiento} ({perfil.edad} años)</Text>
          )}
        </View>

          {/* OBJETIVO SELECTOR (Sincronizado con Registro) */}
{editando && (
  <View style={styles.selectorContainer}>
    <Text style={styles.infoLabel}>Cambiar Objetivo:</Text>
    <View style={styles.rowWrap}>
      {['Perder Grasa', 'Mantener', 'Ganar Músculo'].map((obj) => (
        <TouchableOpacity 
          key={obj}
          onPress={() => setTempData({...tempData, objetivo: obj})}
          style={[styles.chip, tempData.objetivo === obj && styles.chipActive]}
        >
          <Text style={[styles.chipText, tempData.objetivo === obj && styles.chipTextActive]}>
            {obj}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)}

          {/* ACTIVIDAD SELECTOR (SOLO EN EDICIÓN) */}
          {editando && (
            <View style={styles.selectorContainer}>
               <Text style={styles.infoLabel}>Nivel de Actividad:</Text>
               <View style={styles.rowWrap}>
                 {[
                   {l: 'Sedentario', v: 1.2}, 
                   {l: 'Ligera', v: 1.375}, 
                   {l: 'Moderada', v: 1.55}, 
                   {l: 'Intensa', v: 1.725}
                 ].map((act) => (
                   <TouchableOpacity 
                    key={act.l}
                    onPress={() => setTempData({...tempData, actividad: act.v})}
                    style={[styles.chip, tempData.actividad === act.v && styles.chipActive]}
                   >
                     <Text style={[styles.chipText, tempData.actividad === act.v && styles.chipTextActive]}>{act.l}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
            </View>
          )}

          {!editando && (
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nivel de actividad:</Text>
                <Text style={styles.infoText}>{getActividadTexto(perfil.actividad)}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>IMC:</Text>
            <Text style={styles.infoText}>{imcData.valor} ({imcData.estado})</Text>
          </View>
        </View>

        {/* BOTÓN DE REINICIO (SÓLO SI NO ESTÁ EDITANDO) */}
        {!editando && (
          <TouchableOpacity style={styles.btnReset} onPress={cerrarSesion}>
            <Text style={styles.btnResetTxt}>BORRAR PERFIL Y REINICIAR</Text>
          </TouchableOpacity>
        )}

        {/* BOTÓN PARA LIMPIAR DIARIOS */}
        {!editando && (
          <TouchableOpacity style={[styles.btnReset, { marginTop: 12 }]} onPress={limpiarDiarios}>
            <Text style={[styles.btnResetTxt, { color: '#FFFFFF' }]}>LIMPIAR REGISTROS DIARIOS</Text>
          </TouchableOpacity>
        )}

        {/* BOTÓN DE PRUEBA: FORZAR RETO 90 DÍAS (solo en desarrollo) */}
        {!editando && __DEV__ && (
          <TouchableOpacity style={[styles.btnReset, { marginTop: 12, backgroundColor: '#444' }]} onPress={confirmarForzarReto90}>
            <Text style={[styles.btnResetTxt, { color: '#FFF' }]}>Forzar reto 90 (dev)</Text>
          </TouchableOpacity>
        )}

        {/* SECCIÓN DE ACLARACIONES LEGALES */}
        {!editando && (
<TouchableOpacity 
  style={styles.btnInfo} 
  onPress={() => Alert.alert(
    "Aviso Importante y Privacidad",
    "• No es una app médica: Destinada a apoyar el estilo de vida como referencia aproximada. Consulta siempre a un nutricionista.\n\n" +
    "• Datos Locales: Tu información se guarda solo en este teléfono. Al cambiar de dispositivo o borrar la app, los datos se perderán.\n\n" +
    "• Recomendación: Se sugiere ejercicio de fuerza para optimizar resultados.\n\n" +
    "• Herramienta en crecimiento: Los datos pueden no ser exactos, úsalos como guía referencial.",
    [{ text: "Entendido" }]
  )}
>
  <Ionicons name="information-circle-outline" size={20} color="#AAA" />
  <Text style={styles.btnInfoTxt}>Información Legal y Privacidad</Text>
</TouchableOpacity>

{/* BOTÓN TÉRMINOS Y CONDICIONES */}
{/* (Términos y Condiciones eliminado: se mantiene solo Información Legal y Privacidad) */}
        {!editando && (
          <>
            <Text style={styles.brand}>MontalFit - v1.0 - Desarrollado por Victor Aliendo</Text>
            <Text style={styles.brand}> vmas.system@gmail.com</Text>
            <View style={{height: 40}} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003366' },
  content: { padding: 25, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 30, width: '100%' },
  btnEditHeader: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  btnEditTxt: { color: '#28A745', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#28A745', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 },
  avatarTxt: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  nombre: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  inputNombre: { color: '#FFF', fontSize: 24, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#28A745', width: '80%', textAlign: 'center' },
  statsCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 25, padding: 20, width: '100%', justifyContent: 'space-around', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statItem: { alignItems: 'center', flex: 1 },
  statVal: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  statLabel: { color: '#AAA', fontSize: 11, marginTop: 4 },
  infoSection: { width: '100%', marginTop: 25, backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20 },
  infoTitle: { color: '#28A745', fontWeight: 'bold', marginBottom: 15, fontSize: 12, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 8, alignItems: 'center' },
  infoLabel: { color: '#AAA', fontSize: 13 },
  infoText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  inputEdit: { color: '#28A745', fontSize: 14, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#28A745', minWidth: 50, textAlign: 'right' },
  selectorContainer: { marginTop: 15, marginBottom: 10 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#28A745' },
  chipText: { color: '#AAA', fontSize: 11, fontWeight: 'bold' },
  chipTextActive: { color: '#FFF' },
  btnReset: { marginTop: 30, width: '100%', padding: 18, borderRadius: 15, backgroundColor: 'rgba(255, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.3)', alignItems: 'center' },
  btnResetTxt: { color: '#FF4444', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
  brand: { color: 'rgba(255,255,255,0.2)', marginTop: 30, fontSize: 10 },
  btnFechaSelector: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.05)',
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#28A745',
},
btnFechaSelectorTxt: {
  color: '#28A745',
  fontWeight: 'bold',
  marginRight: 10,
  fontSize: 14,
},btnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  btnInfoTxt: {
    color: '#AAA',
    fontSize: 12,
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
});