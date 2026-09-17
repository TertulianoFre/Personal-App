import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChatScreen from '../shared/ChatScreen';
import type { PersonalMensagensStackParamList } from '../../navigation/PersonalTabs';

type Props = NativeStackScreenProps<PersonalMensagensStackParamList, 'Chat'>;

export default function ChatComAlunoScreen({ route }: Props) {
  return <ChatScreen alunoId={route.params.alunoId} keyboardOffset={90} />;
}
