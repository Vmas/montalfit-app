import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import RegistroScreen from './src/screens/RegistroScreen'; // 1. Verifica que esta ruta sea correcta

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#003366' }}>
      {/* Esto hace que la barra de estado (donde sale la hora/batería) sea blanca */}
      <StatusBar barStyle="light-content" />
      
      {/* 2. Aquí llamamos a la nueva pantalla que creamos de cero */}
      <RegistroScreen />
    </SafeAreaView>
  );
}