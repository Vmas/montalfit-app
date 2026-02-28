import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// IMPORTACIONES DE NOTIFICACIONES
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import RegistroScreen from './src/screens/RegistroScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProgresoScreen from './src/screens/ProgresoScreen';
import PerfilScreen from './src/screens/PerfilScreen';

const Tab = createBottomTabNavigator();

// CONFIGURACIÓN DEL MANEJADOR DE NOTIFICACIONES
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [logueado, setLogueado] = useState(null);

  useEffect(() => {
    revisarSesion();
    configurarNotificacionesGlobales(); // <--- Se activan al abrir la app
  }, []);

  const revisarSesion = async () => {
    const perfil = await AsyncStorage.getItem('@perfil_usuario');
    setLogueado(perfil !== null);
  };

  // FUNCIÓN MAESTRA DE NOTIFICACIONES
  const configurarNotificacionesGlobales = async () => {
    if (!Device.isDevice) return;

    // 1. Canal para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Recordatorios MontalFit',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#28A745',
      });
    }

    // 2. Permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    // 3. Limpiar y Reprogramar (Peso y Agua)
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Recordatorio de Peso (7:30 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🏆 Reto MontalFit",
        body: "Es hora de registrar tu peso. ¡Mantén la constancia!",
      },
      trigger: { hour: 7, minute: 30, repeats: true },
    });

    // Recordatorios de Agua
    const horasAgua = [11, 15, 19]; 
    for (const hora of horasAgua) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💧 Hidratación",
          body: "Bebe un vaso de agua para tu bienestar y el de Aromas de los valles altos.",
        },
        trigger: { hour: hora, minute: 0, repeats: true },
      });
    }
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
              tabBarStyle: { 
                backgroundColor: '#001a33', 
                borderTopWidth: 0, 
                height: 90, 
                paddingBottom: 25, 
                paddingTop: 5,
                elevation: 15,
                shadowColor: '#000',
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
            {/* pasamos una función para volver a evaluar "logueado" */}
            <Tab.Screen name="Perfil">
              {props => <PerfilScreen {...props} onLogout={() => setLogueado(false)} />}
            </Tab.Screen>
          </Tab.Navigator>
        ) : (
          <RegistroScreen onRegistroCompleto={() => {
            setLogueado(true);
            configurarNotificacionesGlobales(); // Reprogramar al registrarse
          }} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}