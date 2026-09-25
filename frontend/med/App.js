import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import LevelsScreen from './src/screens/LevelsScreen';
import GameScreen from './src/screens/GameScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { theme } from './src/theme';

const Stack = createNativeStackNavigator();

/**
 * Raiz do app. O AuthProvider envolve tudo para que qualquer tela saiba se o
 * usuário está logado ou jogando como convidado.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/**
 * Navegação principal. O app sempre abre na Home (modo convidado liberado).
 * Login e Cadastro são modais que podem ser abertos a qualquer momento.
 */
function RootNavigator() {
  const { status } = useAuth();

  // Enquanto tenta restaurar a sessão salva, mostra só um indicador de carregamento
  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Levels" component={LevelsScreen} />
        <Stack.Screen name="Game" component={GameScreen} />

        {/* Telas de autenticação, abertas como modal por cima do jogo */}
        <Stack.Group screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
