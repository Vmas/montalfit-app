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
  const [metaCalorias, setMetaCalorias] = useState(2000);

  // Cargar la meta guardada al entrar
  useEffect(() => {
    const cargarMeta = async () => {
      try {
        const metaGuardada = await AsyncStorage.getItem('@calorias_meta');
        if (metaGuardada !== null) {
          setMetaCalorias(parseInt(metaGuardada));
        }
      } catch (e) { console.log("Error cargando meta:", e); }
    };
    cargarMeta();
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

  // Cálculo del porcentaje para el círculo
  const porcentaje = Math.min((totalCalorias / metaCalorias) * 100, 100);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVolver}>
           <Text style={styles.textoVolver}>← Volver a Calculadora</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Mi Diario</Text>

        {/* Tarjeta de Progreso Circular */}
        <View style={styles.cardProgreso}>
          <View style={styles.contenedorCirculo}>
            {/* Círculo de Fondo (El "vaso" que se llena) */}
            <View style={styles.circuloFondo}>
              <View style={[
                styles.progresoCirculo, 
                { 
                  height: `${porcentaje}%`, 
                  backgroundColor: porcentaje >= 100 ? '#FF4444' : '#28A745' 
                }
              ]} />
            </View>
            
            {/* El centro que tapa el color para hacer el efecto de anillo */}
            <View style={styles.centroAzul}>
              <Text style={styles.numeroCentro}>{totalCalorias}</Text>
              <Text style={styles.metaCentro}>de {metaCalorias} kcal</Text>
            </View>
          </View>
          
          <Text style={[
            styles.textoRestante, 
            { color: totalCalorias >= metaCalorias ? '#FF4444' : '#28A745' }
          ]}>
            {totalCalorias >= metaCalorias 
              ? '¡Límite alcanzado!' 
              : `Te faltan ${metaCalorias - totalCalorias} kcal`}
          </Text>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formulario}
        >
          <TextInput 
            style={styles.input}
            placeholder="Alimento (Ej. Pollo)"
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
            <Text style={styles.textoBoton}>+ AÑADIR AL DIARIO</Text>
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
            <Text style={styles.listaVacia}>No has registrado alimentos hoy.</Text>
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
    padding: 25, 
    borderRadius: 25, 
    alignItems: 'center', 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  contenedorCirculo: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circuloFondo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden', 
    justifyContent: 'flex-end', 
  },
  progresoCirculo: {
    width: '100%',
    // La altura se maneja dinámicamente en el componente
  },
  centroAzul: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#003366', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  numeroCentro: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  metaCentro: { color: '#A0A0A0', fontSize: 14 },
  textoRestante: { fontSize: 14, marginTop: 15, fontWeight: 'bold' },

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