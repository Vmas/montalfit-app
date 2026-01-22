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

// --- COMPONENTE INTERNO: Resumen de Calorías ---
// (Luego lo moveremos a su propio archivo en la carpeta components)
const ResumenCalorias = ({ total }) => (
  <View style={styles.card}>
    <Text style={styles.textoCard}>Consumo de hoy</Text>
    <Text style={styles.numeroCalorias}>{total} kcal</Text>
  </View>
);

export default function App() {
  // Estados para el formulario
  const [nombreAlimento, setNombreAlimento] = useState('');
  const [caloriasInput, setCaloriasInput] = useState('');
  
  // Estado para la lista de alimentos y el total
  const [listaAlimentos, setListaAlimentos] = useState([]);
  const [totalCalorias, setTotalCalorias] = useState(0);

  // Función para agregar alimento
  const guardarAlimento = () => {
    if (nombreAlimento === '' || caloriasInput === '') return;

    const nuevoAlimento = {
      id: Math.random().toString(),
      nombre: nombreAlimento,
      kcal: parseInt(caloriasInput)
    };

    setListaAlimentos([...listaAlimentos, nuevoAlimento]);
    setTotalCalorias(totalCalorias + nuevoAlimento.kcal);
    
    // Limpiar campos y cerrar teclado
    setNombreAlimento('');
    setCaloriasInput('');
    Keyboard.dismiss();
  };

  // Función para eliminar alimento (El botón rojo)
  const eliminarAlimento = (id, kcal) => {
    const nuevaLista = listaAlimentos.filter(item => item.id !== id);
    setListaAlimentos(nuevaLista);
    setTotalCalorias(totalCalorias - kcal);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <Text style={styles.titulo}>MontalFit</Text>

        {/* Componente de Resumen */}
        <ResumenCalorias total={totalCalorias} />

        {/* Formulario de Entrada */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formulario}
        >
          <TextInput 
            style={styles.input}
            placeholder="¿Qué comiste? (Ej. Pollo)"
            placeholderTextColor="#A0A0A0"
            value={nombreAlimento}
            onChangeText={setNombreAlimento}
          />
          <TextInput 
            style={styles.input}
            placeholder="Calorías (kcal)"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
            value={caloriasInput}
            onChangeText={setCaloriasInput}
          />
          <TouchableOpacity style={styles.botonVerde} onPress={guardarAlimento}>
            <Text style={styles.textoBoton}>+ AGREGAR AL DIARIO</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>

        {/* Lista de Alimentos */}
        <Text style={styles.seccionTitulo}>Alimentos de hoy</Text>
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
          style={{ width: '100%' }}
          ListEmptyComponent={
            <Text style={styles.listaVacia}>No hay alimentos registrados aún.</Text>
          }
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003366', // Tu azul llamativo
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  titulo: {
    color: '#F2F2F2',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textoCard: { color: '#D1D1D1', fontSize: 16, marginBottom: 5 },
  numeroCalorias: { color: '#FFFFFF', fontSize: 48, fontWeight: 'bold' },
  formulario: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  botonVerde: {
    backgroundColor: '#28A745', // Tu verde
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  textoBoton: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  seccionTitulo: {
    color: '#F2F2F2',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  itemAlimento: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  textoItem: { color: '#F2F2F2', fontSize: 17, fontWeight: '500' },
  caloriasItem: { color: '#28A745', fontWeight: 'bold', fontSize: 14 },
  botonBorrar: {
    backgroundColor: '#FF4444', // Tu rojo para eliminar
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBorrar: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  listaVacia: {
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic'
  }
});