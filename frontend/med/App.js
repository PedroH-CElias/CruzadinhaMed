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
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import AccountScreen from './src/screens/AccountScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ProgressProvider, useProgress } from './src/context/ProgressContext';
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
        {/* O progresso depende da sessão (convidado ou conta), por isso fica dentro do AuthProvider */}
        <ProgressProvider>
          <RootNavigator />
        </ProgressProvider>
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
  const { ready: progressReady } = useProgress();

  // Enquanto restaura a sessão salva e carrega o progresso do aparelho, mostra só um indicador
  if (status === 'loading' || !progressReady) {
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
        <Stack.Screen name="Account" component={AccountScreen} />

        {/* Telas de autenticação, abertas como modal por cima do jogo */}
        <Stack.Group screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
