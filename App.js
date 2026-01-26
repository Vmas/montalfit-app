import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Importante para el área segura
import { Ionicons } from '@expo/vector-icons'; // Iconos modernos

import RegistroScreen from './src/screens/RegistroScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProgresoScreen from './src/screens/ProgresoScreen';
import PerfilScreen from './src/screens/PerfilScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [logueado, setLogueado] = useState(null);

  useEffect(() => {
    revisarSesion();
  }, []);

  const revisarSesion = async () => {
    const perfil = await AsyncStorage.getItem('@perfil_usuario');
    setLogueado(perfil !== null);
  };

  if (logueado === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#003366', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#28A745" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {logueado ? (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              // CONFIGURACIÓN DE ICONOS
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Hoy') {
                  iconName = focused ? 'flash' : 'flash-outline';
                } else if (route.name === 'Progreso') {
                  iconName = focused ? 'trending-up' : 'trending-up-outline';
                } else if (route.name === 'Perfil') {
                  iconName = focused ? 'person' : 'person-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              // DISEÑO DEL MENÚ (FOOTER)
              tabBarStyle: { 
                backgroundColor: '#001a33', // Un azul más profundo para el menú
                borderTopWidth: 0, 
                height: 100, // Un poco más alto para dar aire
                paddingBottom: 25, // Sube los iconos para que no choquen con la barra del tlf
                paddingTop: 5,
                elevation: 15, // Sombra en Android
                shadowColor: '#000', // Sombra en iOS
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.2,
              },
              tabBarActiveTintColor: '#28A745',
              tabBarInactiveTintColor: '#888',
              tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
              
            })}
          >
            <Tab.Screen name="Hoy" component={DashboardScreen} />
            <Tab.Screen name="Progreso" component={ProgresoScreen} />
            <Tab.Screen name="Perfil" component={PerfilScreen} />
          </Tab.Navigator>
        ) : (
          <RegistroScreen onRegistroCompleto={() => setLogueado(true)} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}