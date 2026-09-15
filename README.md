# Personal Trainer App — MVP (Fase 1)

App único para **Personal Trainers** e **Alunos**, com login por perfil (role).
Stack: **React Native + Expo** (frontend) e **Supabase** (auth + banco Postgres).

## O que já está pronto (Fase 1)

- Cadastro/login com dois perfis: `personal` e `aluno`.
- Personal tem um **código de convite** (aba Perfil) para vincular alunos no cadastro deles.
- Biblioteca de exercícios do personal (nome, grupo muscular, link de vídeo, observações).
- Prescrição de treino: personal monta uma ficha por aluno escolhendo exercícios da
  biblioteca, com séries, repetições, carga, descanso e observações.
- Aluno visualiza os treinos com o vídeo demonstrativo de cada exercício.
- Banco de dados e regras de segurança (RLS) já criados no Supabase — cada personal só
  vê seus próprios alunos/exercícios/treinos, e cada aluno só vê os treinos dele.

## Como rodar

1. Instale as dependências (só na primeira vez ou quando adicionar pacotes novos):

   ```bash
   npm install
   ```

2. Rode o projeto:

   ```bash
   npx expo start
   ```

3. Abra o app **Expo Go** no seu celular (Android/iOS) e escaneie o QR code que aparece
   no terminal. O app carrega ao vivo no celular — qualquer alteração no código
   atualiza na hora.

O arquivo `.env` já está configurado com a URL e a chave pública (anon) do projeto
Supabase criado para este app. Essa chave é segura para ficar no app — quem protege os
dados de verdade são as regras de RLS no banco, não o segredo da chave.

## Estrutura do projeto

```
App.tsx                     -> ponto de entrada, monta o AuthProvider + navegação
src/
  lib/supabase.ts           -> cliente do Supabase
  types/database.ts         -> tipos das tabelas do banco
  context/AuthContext.tsx   -> sessão do usuário logado + perfil (role)
  navigation/
    RootNavigator.tsx       -> decide: tela de login OU app do Personal OU app do Aluno
    PersonalTabs.tsx        -> abas do Personal (Alunos / Exercícios / Perfil)
    AlunoTabs.tsx            -> abas do Aluno (Treinos / Perfil)
  screens/
    auth/                   -> Login, Cadastro
    personal/               -> Alunos, Biblioteca de exercícios, Prescrever treino, Perfil
    aluno/                  -> Meus treinos, Detalhe do treino, Perfil
```

## Banco de dados (Supabase)

Projeto: `personal-trainer-app` (região São Paulo, plano gratuito).

Tabelas:

- `profiles` — 1 linha por usuário (personal ou aluno), criada automaticamente no
  cadastro por um trigger (`handle_new_user`). Alunos ficam vinculados ao personal via
  `personal_id`.
- `exercicios` — biblioteca de exercícios de cada personal.
- `treinos` — fichas de treino (uma por aluno/objetivo/dia).
- `treino_exercicios` — os exercícios de cada treino, com séries/reps/carga/descanso.

Todas as tabelas têm **Row Level Security** ativado: cada personal só acessa seus
próprios dados, e cada aluno só acessa os próprios treinos.

## Roteiro completo (para onde o app pode crescer)

### Fase 1 — MVP (pronto)
Autenticação com 2 perfis, gestão de alunos, biblioteca de exercícios, prescrição de
treino, visualização do treino pelo aluno.

### Fase 2 — uso no dia a dia
- Execução do treino: aluno marca séries concluídas + cronômetro de descanso.
- Feedback pós-treino (dificuldade, comentário) visível para o personal.
- Avaliação física / anamnese (medidas, fotos de evolução, composição corporal).
- Histórico e gráficos de evolução (carga ao longo do tempo, peso, medidas).
- Notificações push (novo treino, lembrete, mensagem).

### Fase 3 — diferenciais
- Chat entre personal e aluno.
- Gestão financeira (pagamentos, vencimento, cobrança automática).
- Modelos de treino reutilizáveis (templates aplicáveis a vários alunos).
- Suporte a mais de um personal na mesma base (equipe).

## Publicação (bem mais à frente)

Para testar, o Expo Go é suficiente e gratuito. Só quando for publicar de verdade nas
lojas é que entram: conta de desenvolvedor Apple (pago, ~US$99/ano) e conta de
desenvolvedor Google Play (pagamento único, ~US$25). Isso não é necessário agora.
