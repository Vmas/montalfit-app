import React, { useState } from 'react';
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

// Componente de soporte (lo mantenemos aquí por ahora)
const ResumenCalorias = ({ total }) => (
  <View style={styles.card}>
    <Text style={styles.textoCard}>Consumo de hoy</Text>
    <Text style={styles.numeroCalorias}>{total} kcal</Text>
  </View>
);

export default function DiaryScreen({ navigation }) {
  const [nombreAlimento, setNombreAlimento] = useState('');
  const [caloriasInput, setCaloriasInput] = useState('');
  const [listaAlimentos, setListaAlimentos] = useState([]);
  const [totalCalorias, setTotalCalorias] = useState(0);

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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Botón para volver atrás (opcional) */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVolver}>
           <Text style={styles.textoVolver}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Mi Diario</Text>

        <ResumenCalorias total={totalCalorias} />

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formulario}
        >
          <TextInput 
            style={styles.input}
            placeholder="¿Qué comiste?"
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
            <Text style={styles.textoBoton}>+ AGREGAR</Text>
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
            <Text style={styles.listaVacia}>No hay alimentos aún.</Text>
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
  titulo: { color: '#F2F2F2', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  textoCard: { color: '#D1D1D1', fontSize: 14 },
  numeroCalorias: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold' },
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