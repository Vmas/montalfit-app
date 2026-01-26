import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function DiaryScreen() {
  // Datos de ejemplo para probar el scroll (añade muchos para testear)
  const comidas = [
    { id: 1, nombre: 'Huevos con aguacate', cal: 450, protein: '25g' },
    { id: 2, nombre: 'Pechuga de pollo y arroz', cal: 600, protein: '40g' },
    { id: 3, nombre: 'Batido de proteína', cal: 200, protein: '30g' },
    { id: 4, nombre: 'Ensalada de atún', cal: 350, protein: '28g' },
    { id: 5, nombre: 'Yogurt griego con nueces', cal: 250, protein: '15g' },
    { id: 6, nombre: 'Cena: Salmón con espárragos', cal: 500, protein: '35g' },
  ];

  return (
    <View style={styles.container}>
      {/* Contenedor con Scroll para que no se corte el contenido */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.resumenDiario}>
          <Text style={styles.tituloSeccion}>Resumen de Hoy</Text>
          <View style={styles.caloriasBox}>
            <Text style={styles.numeroCal}>1,850</Text>
            <Text style={styles.labelCal}>kcal consumidas</Text>
          </View>
        </View>

        <Text style={styles.subtitulo}>Tus Comidas</Text>

        {comidas.map((item) => (
          <View key={item.id} style={styles.comidaCard}>
            <View>
              <Text style={styles.comidaNombre}>{item.nombre}</Text>
              <Text style={styles.comidaMacros}>Proteína: {item.protein}</Text>
            </View>
            <Text style={styles.comidaCal}>{item.cal} kcal</Text>
          </View>
        ))}

        {/* Espacio extra al final para que el último item no quede pegado al borde */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Botón flotante para añadir comida (siempre visible) */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003366', // El azul de MontalFit
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
  },
  resumenDiario: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  tituloSeccion: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  numeroCal: {
    color: '#28A745', // Verde del logo
    fontSize: 48,
    fontWeight: '900',
  },
  labelCal: {
    color: '#D1D1D1',
    fontSize: 14,
  },
  subtitulo: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  comidaCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  comidaNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  comidaMacros: {
    fontSize: 12,
    color: '#666',
  },
  comidaCal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28A745',
  },
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    backgroundColor: '#28A745',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: 'bold',
  }
});