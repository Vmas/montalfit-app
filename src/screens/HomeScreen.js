import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, StatusBar } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        {/* Cargamos tu nuevo logo */}
        <Image 
          source={require('../assets/logomontalfit.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        {/* Ya no necesitamos el texto "MONTALFIT" aquí porque el logo ya lo tiene */}
      </View>

      <View style={styles.cuerpo}>
        <TouchableOpacity 
          style={styles.botonPrincipal}
          onPress={() => navigation.navigate('Calculator')}
        >
          <Text style={styles.textoBoton}>COMENZAR CÁLCULO</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.copyright}>© 2026 MONTALFIT. Todos los derechos reservados.</Text>
        <Text style={styles.contacto}>Diseñado por MontalFit | Contacto</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#003366', 
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 60
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
  },
  logoImage: {
    width: 250, // Lo hacemos grande para que se lea bien el eslogan
    height: 250,
  },
  cuerpo: {
    width: '100%',
  },
  botonPrincipal: {
    backgroundColor: '#28A745',
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  textoBoton: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 20,
  },
  copyright: {
    color: '#A0A0A0',
    fontSize: 11,
    marginBottom: 5,
  },
  contacto: {
    color: '#D1D1D1',
    fontSize: 12,
  }
});