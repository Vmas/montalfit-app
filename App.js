import React, { useState } from 'react'; // Importamos useState para "recordar" datos
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  // Declaramos una variable llamada "calorias" y una función para cambiarla "setCalorias"
  // Empezamos en 0.
  const [calorias, setCalorias] = useState(0);

  const agregarCalorias = () => {
    // Esto es una alerta simple para simular la entrada de datos
    setCalorias(calorias + 100); 
    Alert.alert("¡Éxito!", "Has sumado 100 calorías a tu diario.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>MontalFit</Text>
      
      {/* Mostramos el valor que hay en nuestra "pizarra" (calorias) */}
      <View style={styles.card}>
        <Text style={styles.textoCard}>Calorías de hoy:</Text>
        <Text style={styles.numeroCalorias}>{calorias} kcal</Text>
      </View>

      <TouchableOpacity style={styles.botonVerde} onPress={agregarCalorias}>
        <Text style={styles.textoBoton}>+ AGREGAR 100 KCAL</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.botonReset} 
        onPress={() => setCalorias(0)}
      >
        <Text style={styles.textoBotonSmall}>RESETEAR DÍA</Text>
      </TouchableOpacity>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  titulo: {
    color: '#F2F2F2',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fondo blanco muy transparente (grisáceo)
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  textoCard: {
    color: '#D1D1D1',
    fontSize: 18,
  },
  numeroCalorias: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  botonVerde: {
    backgroundColor: '#28A745',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  botonReset: {
    marginTop: 20,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  textoBotonSmall: {
    color: '#FF4444', // Rojo para acciones de quitar/resetear
    fontSize: 14,
    fontWeight: '600',
  },
});