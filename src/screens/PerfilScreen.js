import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export default function PerfilScreen() {
  const [perfil, setPerfil] = useState(null);

  // Refresca los datos cada vez que el usuario entra a la pestaña
  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [])
  );

  const cargarPerfil = async () => {
    try {
      const datos = await AsyncStorage.getItem('@perfil_usuario');
      if (datos) setPerfil(JSON.parse(datos));
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

    if (imc < 18.5) {
      estado = "Bajo peso";
    } else if (imc >= 25 && imc < 29.9) {
      estado = "Sobrepeso";
      // Si el nivel de actividad es moderado (1.55) o intenso (1.725), mostramos la nota
      if (perfil.actividad >= 1.55) {
        nota = "Nota: Tu IMC puede ser elevado debido a tu masa muscular. No es un indicador preciso de grasa.";
      }
    } else if (imc >= 30) {
      estado = "Obesidad";
      if (perfil.actividad >= 1.55) {
        nota = "Nota: En personas con mucha masa muscular, el IMC no es un indicador preciso de grasa.";
      }
    }
    
    return { valor: imc, estado, nota };
  };

  const getActividadTexto = (val) => {
    if (val <= 1.2) return 'Sedentario';
    if (val <= 1.375) return 'Ligera';
    if (val <= 1.55) return 'Moderada';
    return 'Intensa';
  };

  const cerrarSesion = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro? Se borrarán tus datos y metas de Aromas de los valles altos.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, borrar todo", 
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert("Datos borrados", "Reinicia la aplicación para crear un nuevo perfil.");
          } 
        }
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
        
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{perfil.nombre ? perfil.nombre[0].toUpperCase() : 'M'}</Text>
          </View>
          <Text style={styles.nombre}>{perfil.nombre}</Text>
          <Text style={styles.objetivo}>{perfil.objetivo}</Text>
        </View>

        {/* CARD DE ESTADÍSTICAS */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{perfil.peso}kg</Text>
            <Text style={styles.statLabel}>Peso</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{imcData.valor}</Text>
            <Text style={styles.statLabel}>IMC ({imcData.estado})</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{perfil.caloriasMeta}</Text>
            <Text style={styles.statLabel}>Kcal Meta</Text>
          </View>
        </View>

        {/* NOTA DE ATLETA (SÓLO SI CORRESPONDE) */}
        {imcData.nota && (
          <View style={styles.notaAtleta}>
            <Text style={styles.notaAtletaTxt}>⚠️ {imcData.nota}</Text>
          </View>
        )}

        {/* SECCIÓN DE DETALLES */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Detalles del Perfil</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nivel de actividad:</Text>
            <Text style={styles.infoText}>{getActividadTexto(perfil.actividad)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Edad:</Text>
            <Text style={styles.infoText}>{perfil.edad} años</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Altura:</Text>
            <Text style={styles.infoText}>{perfil.altura} cm</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sexo:</Text>
            <Text style={styles.infoText}>{perfil.sexo === 'hombre' ? 'Masculino' : 'Femenino'}</Text>
          </View>
        </View>

        {/* BOTÓN DE REINICIO */}
        <TouchableOpacity style={styles.btnReset} onPress={cerrarSesion}>
          <Text style={styles.btnResetTxt}>BORRAR PERFIL Y REINICIAR</Text>
        </TouchableOpacity>
        
        <Text style={styles.brand}>MontalFit - v1.0</Text>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003366' },
  content: { padding: 25, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#28A745', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 },
  avatarTxt: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  nombre: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  objetivo: { color: '#28A745', fontSize: 16, fontWeight: '700', marginTop: 5 },
  statsCard: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 25, 
    padding: 20, 
    width: '100%', 
    justifyContent: 'space-around', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  statItem: { alignItems: 'center' },
  statVal: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#AAA', fontSize: 11, marginTop: 4 },
  notaAtleta: {
    backgroundColor: 'rgba(40, 167, 69, 0.15)',
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    width: '100%',
    borderLeftWidth: 5,
    borderLeftColor: '#28A745',
  },
  notaAtletaTxt: {
    color: '#FFF',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  infoSection: { width: '100%', marginTop: 25, backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20 },
  infoTitle: { color: '#28A745', fontWeight: 'bold', marginBottom: 15, fontSize: 14, textTransform: 'uppercase' },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)', 
    paddingBottom: 8 
  },
  infoLabel: { color: '#AAA', fontSize: 14 },
  infoText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  btnReset: { marginTop: 40, width: '100%', padding: 18, borderRadius: 15, backgroundColor: 'rgba(255, 68, 68, 0.1)', borderWidth: 1, borderColor: '#FF4444', alignItems: 'center' },
  btnResetTxt: { color: '#FF4444', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  brand: { color: 'rgba(255,255,255,0.3)', marginTop: 40, fontSize: 11, fontWeight: '500' }
});