// Tipos que espelham as tabelas do Supabase (src/lib/supabase.ts).
// Se o schema mudar, atualize aqui também.

export type Role = 'personal' | 'aluno';

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  personal_id: string | null;
  invite_code: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Exercicio {
  id: string;
  // null = exercício da biblioteca base (compartilhada entre todos os personals);
  // preenchido = exercício próprio, criado por aquele personal.
  personal_id: string | null;
  nome: string;
  grupamento_principal: string | null;
  grupamentos_secundarios: string[];
  video_url: string | null;
  descricao: string | null;
  created_at: string;
}

export interface Alimento {
  id: string;
  nome: string;
  kcal_100g: number;
  proteina_g: number;
  carboidratos_g: number;
  gorduras_g: number;
  created_at: string;
}

// Grupamentos musculares (volume direto/indireto), na ordem usada na planilha de referência.
export const GRUPOS_MUSCULARES = [
  'Quadríceps',
  'Posterior de coxa',
  'Glúteo máximo',
  'Glúteo médio',
  'Adutor',
  'Panturrilha',
  'Abdômen',
  'Latíssimo',
  'Upper back',
  'Eretores',
  'Peitoral',
  'Deltoide anterior',
  'Deltoide lateral',
  'Deltoide posterior',
  'Bíceps',
  'Tríceps',
  'Trapézio',
  'Antebraço',
];

export interface Treino {
  id: string;
  aluno_id: string;
  personal_id: string;
  nome: string;
  dia_semana: number | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
}

export interface TreinoExercicio {
  id: string;
  treino_id: string;
  exercicio_id: string;
  ordem: number;
  series: number | null;
  repeticoes: string | null;
  carga: string | null;
  descanso_segundos: number | null;
  observacoes: string | null;
  // Preenchido quando fazemos join com exercicios
  exercicio?: Exercicio;
}

export interface Anamnese {
  id: string;
  aluno_id: string;
  idade: number | null;
  altura_cm: number | null;
  peso_kg: number | null;
  objetivo: string | null;
  nivel_experiencia: string | null;
  dias_disponiveis_semana: number | null;
  restricoes_alimentares: string | null;
  observacoes: string | null;
  possui_lesao: boolean;
  descricao_lesao: string | null;
  possui_condicao_medica: boolean;
  descricao_condicao_medica: string | null;
  usa_medicamento: boolean;
  descricao_medicamento: string | null;
  liberado_medico: boolean | null;
  updated_at: string;
}

export interface AvaliacaoFisica {
  id: string;
  aluno_id: string;
  data: string;
  peso_kg: number | null;
  percentual_gordura: number | null;
  medida_cintura_cm: number | null;
  medida_quadril_cm: number | null;
  medida_braco_cm: number | null;
  medida_coxa_cm: number | null;
  fotos: string[];
  observacoes: string | null;
  created_at: string;
}

export interface PlanoAlimentar {
  id: string;
  aluno_id: string;
  personal_id: string;
  nome: string;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Refeicao {
  id: string;
  plano_id: string;
  nome: string;
  horario: string | null;
  ordem: number;
  created_at: string;
}

export interface RefeicaoAlimento {
  id: string;
  refeicao_id: string;
  alimento_id: string;
  quantidade_g: number;
  observacoes: string | null;
  ordem: number;
  // Preenchido quando fazemos join com alimentos
  alimento?: Alimento;
}

export interface Mensagem {
  id: string;
  aluno_id: string;
  remetente_id: string;
  conteudo: string;
  lida: boolean;
  created_at: string;
}

export interface TreinoExecucao {
  id: string;
  treino_id: string;
  aluno_id: string;
  data: string;
  dificuldade: number | null;
  comentario: string | null;
  created_at: string;
}

export interface TreinoExecucaoItem {
  id: string;
  treino_execucao_id: string;
  treino_exercicio_id: string;
  concluido: boolean;
  carga_realizada: string | null;
  repeticoes_realizadas: string | null;
}

export const NIVEIS_EXPERIENCIA = ['Iniciante', 'Intermediário', 'Avançado'];
export const OBJETIVOS = ['Hipertrofia', 'Emagrecimento', 'Performance', 'Saúde geral', 'Reabilitação'];

export const DIAS_SEMANA = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];
