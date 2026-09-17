import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AlunosListScreen from '../screens/personal/AlunosListScreen';
import AlunoDetailScreen from '../screens/personal/AlunoDetailScreen';
import PrescreverTreinoScreen from '../screens/personal/PrescreverTreinoScreen';
import VerAnamneseScreen from '../screens/personal/VerAnamneseScreen';
import VerEvolucaoScreen from '../screens/personal/VerEvolucaoScreen';
import ExerciciosLibraryScreen from '../screens/personal/ExerciciosLibraryScreen';
import ExercicioFormScreen from '../screens/personal/ExercicioFormScreen';
import PersonalProfileScreen from '../screens/personal/PersonalProfileScreen';
import ConversasListScreen from '../screens/personal/ConversasListScreen';
import ChatComAlunoScreen from '../screens/personal/ChatComAlunoScreen';
import PlanosAlimentaresScreen from '../screens/personal/PlanosAlimentaresScreen';
import PrescreverPlanoAlimentarScreen from '../screens/personal/PrescreverPlanoAlimentarScreen';
import { colors } from '../theme/theme';
import { stackHeaderOptions } from './RootNavigator';

export type PersonalAlunosStackParamList = {
  AlunosList: undefined;
  AlunoDetail: { alunoId: string; alunoNome: string };
  PrescreverTreino: { alunoId: string; alunoNome: string; treinoId?: string };
  VerAnamnese: { alunoId: string; alunoNome: string };
  VerEvolucao: { alunoId: string; alunoNome: string };
  PlanosAlimentares: { alunoId: string; alunoNome: string };
  PrescreverPlanoAlimentar: { alunoId: string; alunoNome: string; planoId?: string };
};

export type PersonalExerciciosStackParamList = {
  ExerciciosLibrary: undefined;
  ExercicioForm: { exercicioId?: string };
};

export type PersonalMensagensStackParamList = {
  ConversasList: undefined;
  Chat: { alunoId: string; alunoNome: string };
};

const AlunosStack = createNativeStackNavigator<PersonalAlunosStackParamList>();
const ExerciciosStack = createNativeStackNavigator<PersonalExerciciosStackParamList>();
const MensagensStack = createNativeStackNavigator<PersonalMensagensStackParamList>();
const Tab = createBottomTabNavigator();

function AlunosStackNavigator() {
  return (
    <AlunosStack.Navigator screenOptions={{ ...stackHeaderOptions, headerTitleAlign: 'center' }}>
      <AlunosStack.Screen name="AlunosList" component={AlunosListScreen} options={{ title: 'Meus Alunos' }} />
      <AlunosStack.Screen
        name="AlunoDetail"
        component={AlunoDetailScreen}
        options={({ route }) => ({ title: route.params.alunoNome })}
      />
      <AlunosStack.Screen
        name="PrescreverTreino"
        component={PrescreverTreinoScreen}
        options={{ title: 'Prescrever Treino' }}
      />
      <AlunosStack.Screen
        name="VerAnamnese"
        component={VerAnamneseScreen}
        options={{ title: 'Anamnese' }}
      />
      <AlunosStack.Screen
        name="VerEvolucao"
        component={VerEvolucaoScreen}
        options={{ title: 'Evolução' }}
      />
      <AlunosStack.Screen
        name="PlanosAlimentares"
        component={PlanosAlimentaresScreen}
        options={{ title: 'Planos Alimentares' }}
      />
      <AlunosStack.Screen
        name="PrescreverPlanoAlimentar"
        component={PrescreverPlanoAlimentarScreen}
        options={{ title: 'Plano Alimentar' }}
      />
    </AlunosStack.Navigator>
  );
}

function MensagensStackNavigator() {
  return (
    <MensagensStack.Navigator screenOptions={{ ...stackHeaderOptions, headerTitleAlign: 'center' }}>
      <MensagensStack.Screen name="ConversasList" component={ConversasListScreen} options={{ title: 'Mensagens' }} />
      <MensagensStack.Screen
        name="Chat"
        component={ChatComAlunoScreen}
        options={({ route }) => ({ title: route.params.alunoNome })}
      />
    </MensagensStack.Navigator>
  );
}

function ExerciciosStackNavigator() {
  return (
    <ExerciciosStack.Navigator screenOptions={{ ...stackHeaderOptions, headerTitleAlign: 'center' }}>
      <ExerciciosStack.Screen
        name="ExerciciosLibrary"
        component={ExerciciosLibraryScreen}
        options={{ title: 'Biblioteca de Exercícios' }}
      />
      <ExerciciosStack.Screen
        name="ExercicioForm"
        component={ExercicioFormScreen}
        options={{ title: 'Exercício' }}
      />
    </ExerciciosStack.Navigator>
  );
}

export default function PersonalTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest,
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="AlunosTab"
        component={AlunosStackNavigator}
        options={{
          title: 'Alunos',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ExerciciosTab"
        component={ExerciciosStackNavigator}
        options={{
          title: 'Exercícios',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="dumbbell" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MensagensTab"
        component={MensagensStackNavigator}
        options={{
          title: 'Mensagens',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chat-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={PersonalProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
