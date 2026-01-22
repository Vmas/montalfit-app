import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DiaryScreen({ navigation }) {
  const [nombreAlimento, setNombreAlimento] = useState('');
  const [caloriasInput, setCaloriasInput] = useState('');
  const [listaAlimentos, setListaAlimentos] = useState([]);
  const [totalCalorias, setTotalCalorias] = useState(0);
  const [metaCalorias, setMetaCalorias] = useState(2000); // Meta por defecto

  // 1. Cargar la meta guardada y la lista (si existiera) al abrir la pantalla
  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        const metaGuardada = await AsyncStorage.getItem('@calorias_meta');
        if (metaGuardada !== null) {
          setMetaCalorias(parseInt(metaGuardada));
        }
      } catch (e) { console.log("Error cargando meta:", e); }
    };
    inicializarDatos();
  }, []);

  const guardarAlimento = () => {
    if (nombreAlimento === '' || caloriasInput === '') return;
    const nuevoAlimento = {
      id: Math.random().toString(),
      nombre: nombreAlimento,
      kcal: parseInt(caloriasInput)
    };
    setListaAlimentos([...listaAlimentos, nuevoAlimento]);
    setTotalCalorias(totalCalorias + nuevoAlimento.kcal);
    setNombreAlimento('');
    setCaloriasInput('');
    Keyboard.dismiss();
  };

  const eliminarAlimento = (id, kcal) => {
    const nuevaLista = listaAlimentos.filter(item => item.id !== id);
    setListaAlimentos(nuevaLista);
    setTotalCalorias(totalCalorias - kcal);
  };

  // Lógica para la barra de progreso (porcentaje)
  const porcentaje = Math.min((totalCalorias / metaCalorias) * 100, 100);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVolver}>
           <Text style={styles.textoVolver}>← Volver a Calculadora</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Mi Diario</Text>

        {/* Tarjeta de Progreso */}
        <View style={styles.cardProgreso}>
          <Text style={styles.textoMeta}>Meta: {metaCalorias} kcal</Text>
          <Text style={styles.textoConsumido}>{totalCalorias} consumidas</Text>
          
          {/* Barra de Progreso */}
          <View style={styles.barraFondo}>
            <View style={[styles.barraProgreso, { width: `${porcentaje}%` }]} />
          </View>
          
          <Text style={styles.textoRestante}>
            Quedan: {metaCalorias - totalCalorias > 0 ? metaCalorias - totalCalorias : 0} kcal
          </Text>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formulario}
        >
          <TextInput 
            style={styles.input}
            placeholder="Alimento (Ej. Arepa)"
            placeholderTextColor="#A0A0A0"
            value={nombreAlimento}
            onChangeText={setNombreAlimento}
          />
          <TextInput 
            style={styles.input}
            placeholder="Calorías"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
            value={caloriasInput}
            onChangeText={setCaloriasInput}
          />
          <TouchableOpacity style={styles.botonVerde} onPress={guardarAlimento}>
            <Text style={styles.textoBoton}>+ AGREGAR ALIMENTO</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>

        <FlatList 
          data={listaAlimentos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemAlimento}>
              <View>
                <Text style={styles.textoItem}>{item.nombre}</Text>
                <Text style={styles.caloriasItem}>{item.kcal} kcal</Text>
              </View>
              <TouchableOpacity 
                style={styles.botonBorrar} 
                onPress={() => eliminarAlimento(item.id, item.kcal)}
              >
                <Text style={styles.textoBorrar}>X</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.listaVacia}>No has registrado nada hoy.</Text>
          }
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003366', paddingTop: 50, paddingHorizontal: 20 },
  btnVolver: { marginBottom: 10 },
  textoVolver: { color: '#28A745', fontWeight: 'bold' },
  titulo: { color: '#F2F2F2', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  
  cardProgreso: { 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  textoMeta: { color: '#A0A0A0', fontSize: 14 },
  textoConsumido: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginVertical: 5 },
  textoRestante: { color: '#28A745', fontSize: 14, marginTop: 10, fontWeight: '600' },
  
  barraFondo: { 
    width: '100%', 
    height: 12, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    borderRadius: 6, 
    marginTop: 10,
    overflow: 'hidden' 
  },
  barraProgreso: { 
    height: '100%', 
    backgroundColor: '#28A745', 
    borderRadius: 6 
  },

  formulario: { marginBottom: 20 },
  input: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12, marginBottom: 10, color: '#333' },
  botonVerde: { backgroundColor: '#28A745', padding: 15, borderRadius: 10, alignItems: 'center' },
  textoBoton: { color: '#FFF', fontWeight: 'bold' },
  itemAlimento: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, marginBottom: 8 },
  textoItem: { color: '#F2F2F2', fontSize: 16 },
  caloriasItem: { color: '#28A745', fontWeight: 'bold' },
  botonBorrar: { backgroundColor: '#FF4444', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  textoBorrar: { color: '#FFF', fontWeight: 'bold' },
  listaVacia: { color: '#A0A0A0', textAlign: 'center', marginTop: 20 }
});