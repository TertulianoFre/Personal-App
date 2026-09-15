import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors, fonts } from '../theme/theme';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import PersonalTabs from './PersonalTabs';
import AlunoTabs from './AlunoTabs';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surfaceContainerLowest,
    text: colors.onSurface,
    border: colors.outlineVariant,
    primary: colors.primary,
    notification: colors.primary,
  },
};

export const stackHeaderOptions = {
  headerStyle: { backgroundColor: colors.surfaceContainerLowest },
  headerTintColor: colors.primary,
  headerTitleStyle: { fontFamily: fonts.headingSemiBold, fontSize: 17 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const { session, profile, loading } = useAuth();

  if (loading || (session && !profile)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!session ? (
        <AuthNavigator />
      ) : profile?.role === 'personal' ? (
        <PersonalTabs />
      ) : (
        <AlunoTabs />
      )}
    </NavigationContainer>
  );
}
