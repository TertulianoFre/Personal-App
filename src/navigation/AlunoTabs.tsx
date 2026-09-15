import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import MeusTreinosScreen from '../screens/aluno/MeusTreinosScreen';
import TreinoDetailScreen from '../screens/aluno/TreinoDetailScreen';
import ExecutarTreinoScreen from '../screens/aluno/ExecutarTreinoScreen';
import AlunoProfileScreen from '../screens/aluno/AlunoProfileScreen';
import AnamneseScreen from '../screens/aluno/AnamneseScreen';
import MinhaEvolucaoScreen from '../screens/aluno/MinhaEvolucaoScreen';
import NovaAvaliacaoScreen from '../screens/aluno/NovaAvaliacaoScreen';
import { colors } from '../theme/theme';
import { stackHeaderOptions } from './RootNavigator';

export type AlunoTreinosStackParamList = {
  MeusTreinos: undefined;
  TreinoDetail: { treinoId: string; treinoNome: string };
  ExecutarTreino: { treinoId: string; treinoNome: string };
};

export type AlunoPerfilStackParamList = {
  PerfilHome: undefined;
  Anamnese: undefined;
  MinhaEvolucao: undefined;
  NovaAvaliacao: undefined;
};

const TreinosStack = createNativeStackNavigator<AlunoTreinosStackParamList>();
const PerfilStack = createNativeStackNavigator<AlunoPerfilStackParamList>();
const Tab = createBottomTabNavigator();

function TreinosStackNavigator() {
  return (
    <TreinosStack.Navigator screenOptions={{ ...stackHeaderOptions, headerTitleAlign: 'center' }}>
      <TreinosStack.Screen name="MeusTreinos" component={MeusTreinosScreen} options={{ title: 'Meus Treinos' }} />
      <TreinosStack.Screen
        name="TreinoDetail"
        component={TreinoDetailScreen}
        options={({ route }) => ({ title: route.params.treinoNome })}
      />
      <TreinosStack.Screen
        name="ExecutarTreino"
        component={ExecutarTreinoScreen}
        options={({ route }) => ({ title: route.params.treinoNome, gestureEnabled: false })}
      />
    </TreinosStack.Navigator>
  );
}

function PerfilStackNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={{ ...stackHeaderOptions, headerTitleAlign: 'center' }}>
      <PerfilStack.Screen name="PerfilHome" component={AlunoProfileScreen} options={{ title: 'Perfil' }} />
      <PerfilStack.Screen name="Anamnese" component={AnamneseScreen} options={{ title: 'Minha Anamnese' }} />
      <PerfilStack.Screen
        name="MinhaEvolucao"
        component={MinhaEvolucaoScreen}
        options={{ title: 'Minha Evolução' }}
      />
      <PerfilStack.Screen
        name="NovaAvaliacao"
        component={NovaAvaliacaoScreen}
        options={{ title: 'Nova Avaliação' }}
      />
    </PerfilStack.Navigator>
  );
}

export default function AlunoTabs() {
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
        name="TreinosTab"
        component={TreinosStackNavigator}
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="dumbbell" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={PerfilStackNavigator}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
