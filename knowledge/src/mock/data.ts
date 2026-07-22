// Full seed dataset for the mocked deploy (VITE_DATA_SOURCE=mock — see
// npm run build:mock / dev:mock). Populates every screen — Dashboard,
// Workspace, Base Compartilhada, Busca, Grafo, Favoritos, Admin — with
// realistic, cross-referenced content spanning all three roles, so someone
// reviewing the mocked build sees the app "as if" real data already exists,
// without touching the real gateway/Neon at all.
//
// Mock login always resolves to a single fixed user (Carla, admin — see
// session.tsx's MOCK_USER_ID). There's no role switcher, so this data is
// deliberately owned across all four seeded users: as admin, Carla's
// seeAllDocs permission means she sees everyone's vaults, folders, and
// documents at once — that's how "the rep's and manager's data" becomes
// visible in a single mocked session.
import type {
  Document,
  DocumentReference,
  Favorite,
  Folder,
  SharedDocument,
  SharedDocumentReference,
  User,
} from "../lib/types";

const day = 24 * 60 * 60 * 1000;
const now = Date.now();
/** Spreads seed timestamps over the recent past instead of one identical instant. */
const at = (daysAgo: number) => new Date(now - daysAgo * day).toISOString();

export const mockUsers: User[] = [
  { id: "u_ana", name: "Ana Silva", email: "ana@empresa.com", role: "rep" },
  { id: "u_bruno", name: "Bruno Costa", email: "bruno@empresa.com", role: "manager" },
  { id: "u_carla", name: "Carla Dias", email: "carla@empresa.com", role: "admin" },
  { id: "u_diego", name: "Diego Reis", email: "diego@empresa.com", role: "rep" },
];

export const mockFolders: Folder[] = [
  // Ana (rep)
  {
    id: "f_ana_clientes",
    owner_id: "u_ana",
    parent_id: null,
    name: "Clientes",
    owner_name: "Ana Silva",
    created_at: at(40),
    updated_at: at(40),
  },
  {
    id: "f_ana_roteiros",
    owner_id: "u_ana",
    parent_id: null,
    name: "Roteiros de Ligação",
    owner_name: "Ana Silva",
    created_at: at(38),
    updated_at: at(12),
  },
  // Diego (rep)
  {
    id: "f_diego_prospeccao",
    owner_id: "u_diego",
    parent_id: null,
    name: "Prospecção",
    owner_name: "Diego Reis",
    created_at: at(33),
    updated_at: at(5),
  },
  // Bruno (manager)
  {
    id: "f_bruno_time",
    owner_id: "u_bruno",
    parent_id: null,
    name: "Time",
    owner_name: "Bruno Costa",
    created_at: at(50),
    updated_at: at(50),
  },
  {
    id: "f_bruno_onboarding",
    owner_id: "u_bruno",
    parent_id: "f_bruno_time",
    name: "Onboarding",
    owner_name: "Bruno Costa",
    created_at: at(45),
    updated_at: at(9),
  },
  // Carla (admin)
  {
    id: "f_carla_processos",
    owner_id: "u_carla",
    parent_id: null,
    name: "Processos Internos",
    owner_name: "Carla Dias",
    created_at: at(60),
    updated_at: at(60),
  },
  {
    id: "f_carla_politicas",
    owner_id: "u_carla",
    parent_id: "f_carla_processos",
    name: "Políticas",
    owner_name: "Carla Dias",
    created_at: at(58),
    updated_at: at(2),
  },
];

export const mockDocuments: Document[] = [
  {
    id: "d_ana_acme",
    owner_id: "u_ana",
    folder_id: "f_ana_clientes",
    title: "Cliente Acme Corp",
    content:
      "# Acme Corp\n\n**Contato:** Mariana Freitas — compras@acme.com\n\n## Histórico\n\n- 12/03: primeira reunião, interesse em plano anual.\n- 28/03: enviada proposta comercial.\n- 02/04: aguardando retorno do jurídico deles.\n\n## Próximos passos\n\n- [ ] Follow-up por telefone na próxima semana.\n- [ ] Confirmar se usam algum concorrente hoje.\n\nUsar o [[Script de Cold Call|d_ana_script]] pra reengajar caso não responda.",
    owner_name: "Ana Silva",
    created_at: at(35),
    updated_at: at(3),
  },
  {
    id: "d_ana_script",
    owner_id: "u_ana",
    folder_id: "f_ana_roteiros",
    title: "Script de Cold Call",
    content:
      "# Script — abordagem inicial\n\n1. Confirmar quem decide sobre o produto.\n2. Perguntar qual ferramenta usam hoje.\n3. Agendar demo de 15 minutos.\n\nReferência de argumentos prontos: [[Manual de Vendas]].\n\nExemplo de caso real: [[Cliente Acme Corp|d_ana_acme]].",
    owner_name: "Ana Silva",
    created_at: at(30),
    updated_at: at(12),
  },
  {
    id: "d_ana_beta_contrato",
    owner_id: "u_ana",
    folder_id: "f_ana_clientes",
    title: "Contrato Beta Ltda",
    content:
      "# Contrato — Beta Ltda\n\nPlano anual assinado em 15/04, vigência de 12 meses.\n\n## Condições\n\n- Renovação automática salvo aviso com 30 dias de antecedência.\n- Reajuste pelo IPCA no aniversário do contrato.\n\nDetalhes do processo de renovação em [[Renovação Beta Ltda|d_ana_beta_renovacao]].",
    owner_name: "Ana Silva",
    created_at: at(18),
    updated_at: at(4),
  },
  {
    id: "d_ana_beta_renovacao",
    owner_id: "u_ana",
    folder_id: "f_ana_clientes",
    title: "Renovação Beta Ltda",
    content:
      "# Renovação — Beta Ltda\n\nAcompanhamento da renovação automática do [[Contrato Beta Ltda|d_ana_beta_contrato]].\n\n## Checklist\n\n- [ ] Confirmar satisfação do cliente 60 dias antes do vencimento.\n- [ ] Verificar se houve mudança no volume de uso.\n- [ ] Avisar o financeiro sobre o reajuste do IPCA.",
    owner_name: "Ana Silva",
    created_at: at(18),
    updated_at: at(2),
  },
  {
    id: "d_diego_leads",
    owner_id: "u_diego",
    folder_id: "f_diego_prospeccao",
    title: "Lista de Leads Q3",
    content:
      "# Leads em prospecção — Q3\n\n| Empresa | Status | Próximo passo |\n|---|---|---|\n| Nortex | Contato feito | Enviar proposta |\n| Vale Sul | Sem retorno | 2ª tentativa |\n| Cortex Ltda | Reunião marcada | Preparar demo |\n\nUsar o [[Manual de Vendas]] antes de qualquer reunião.",
    owner_name: "Diego Reis",
    created_at: at(20),
    updated_at: at(5),
  },
  {
    id: "d_bruno_metas",
    owner_id: "u_bruno",
    folder_id: "f_bruno_time",
    title: "Metas do Trimestre",
    content:
      "# Metas Q3\n\n- Ana: 8 novos clientes.\n- Diego: 6 novos clientes.\n- Time: NPS acima de 8.\n\nProcesso de acompanhamento em [[Guia de Onboarding]].",
    owner_name: "Bruno Costa",
    created_at: at(48),
    updated_at: at(6),
  },
  {
    id: "d_bruno_onboarding_doc",
    owner_id: "u_bruno",
    folder_id: "f_bruno_onboarding",
    title: "Onboarding Novo Vendedor",
    content:
      "# Onboarding — primeira semana\n\n1. Acesso ao CRM e ao Knowledge Vault.\n2. Ler [[Manual de Vendas]].\n3. Sombrear 3 ligações de um vendedor sênior.\n4. Primeira reunião 1:1 no fim da semana.",
    owner_name: "Bruno Costa",
    created_at: at(44),
    updated_at: at(9),
  },
  {
    id: "d_carla_compliance",
    owner_id: "u_carla",
    folder_id: "f_carla_processos",
    title: "Checklist de Compliance",
    content:
      "# Checklist trimestral\n\n- [ ] Revisar contratos vencendo em 60 dias.\n- [ ] Auditar acessos de ex-funcionários.\n- [x] Atualizar [[Política de Reembolso]].\n\nResponsável: Carla Dias.",
    owner_name: "Carla Dias",
    created_at: at(25),
    updated_at: at(1),
  },
  {
    id: "d_carla_reembolso",
    owner_id: "u_carla",
    folder_id: "f_carla_politicas",
    title: "Política de Reembolso",
    content:
      "# Política de Reembolso (rascunho interno)\n\nReembolsos de despesas de viagem devem ser solicitados em até 30 dias, com nota fiscal anexada.\n\nVersão publicada para o time: [[Política de Reembolso (Pública)]].",
    owner_name: "Carla Dias",
    created_at: at(57),
    updated_at: at(2),
  },
];

export const mockSharedDocuments: SharedDocument[] = [
  {
    id: "s_manual_vendas",
    title: "Manual de Vendas",
    content:
      '# Manual de Vendas\n\nPlaybook oficial do time comercial — argumentos, objeções comuns e processo de fechamento.\n\n## Objeções comuns\n\n- "Já uso outra ferramenta" → focar na migração assistida.\n- "Não é prioridade agora" → oferecer piloto de 30 dias.\n\nVeja também o [[Guia de Onboarding]] pra novos vendedores.',
    source_document_id: null,
    published_by: "u_bruno",
    published_by_name: "Bruno Costa",
    created_at: at(46),
    updated_at: at(10),
  },
  {
    id: "s_onboarding_guia",
    title: "Guia de Onboarding",
    content:
      "# Guia de Onboarding — versão pública\n\nRoteiro padrão para os primeiros 30 dias de qualquer novo vendedor. Combine com o gestor direto.\n\nLeitura obrigatória: [[Manual de Vendas]].",
    source_document_id: "d_bruno_onboarding_doc",
    published_by: "u_bruno",
    published_by_name: "Bruno Costa",
    created_at: at(40),
    updated_at: at(8),
  },
  {
    id: "s_reembolso_publica",
    title: "Política de Reembolso (Pública)",
    content:
      "# Política de Reembolso\n\nReembolsos de despesas de viagem devem ser solicitados em até 30 dias, com nota fiscal anexada. Dúvidas: financeiro@empresa.com.",
    source_document_id: "d_carla_reembolso",
    published_by: "u_carla",
    published_by_name: "Carla Dias",
    created_at: at(20),
    updated_at: at(1),
  },
];

// Mirrors what syncPersonalRefs would compute from the [[links]] embedded in
// the content above — seeded directly since seed data doesn't go through a
// save cycle, so Backlinks/Grafo have something to show from the first load.
export const mockDocumentReferences: DocumentReference[] = [
  {
    id: "r_ana_acme_to_script",
    owner_id: "u_ana",
    source_document_id: "d_ana_acme",
    target_scope: "personal",
    target_document_id: "d_ana_script",
    created_at: at(3),
  },
  {
    id: "r_ana_script_to_manual",
    owner_id: "u_ana",
    source_document_id: "d_ana_script",
    target_scope: "shared",
    target_document_id: "s_manual_vendas",
    created_at: at(12),
  },
  {
    id: "r_ana_script_to_acme",
    owner_id: "u_ana",
    source_document_id: "d_ana_script",
    target_scope: "personal",
    target_document_id: "d_ana_acme",
    created_at: at(12),
  },
  {
    id: "r_ana_beta_contrato_to_renovacao",
    owner_id: "u_ana",
    source_document_id: "d_ana_beta_contrato",
    target_scope: "personal",
    target_document_id: "d_ana_beta_renovacao",
    created_at: at(4),
  },
  {
    id: "r_ana_beta_renovacao_to_contrato",
    owner_id: "u_ana",
    source_document_id: "d_ana_beta_renovacao",
    target_scope: "personal",
    target_document_id: "d_ana_beta_contrato",
    created_at: at(2),
  },
  {
    id: "r_diego_leads_to_manual",
    owner_id: "u_diego",
    source_document_id: "d_diego_leads",
    target_scope: "shared",
    target_document_id: "s_manual_vendas",
    created_at: at(5),
  },
  {
    id: "r_bruno_metas_to_guia",
    owner_id: "u_bruno",
    source_document_id: "d_bruno_metas",
    target_scope: "shared",
    target_document_id: "s_onboarding_guia",
    created_at: at(6),
  },
  {
    id: "r_bruno_onboarding_to_manual",
    owner_id: "u_bruno",
    source_document_id: "d_bruno_onboarding_doc",
    target_scope: "shared",
    target_document_id: "s_manual_vendas",
    created_at: at(9),
  },
  {
    id: "r_carla_compliance_to_reembolso",
    owner_id: "u_carla",
    source_document_id: "d_carla_compliance",
    target_scope: "personal",
    target_document_id: "d_carla_reembolso",
    created_at: at(1),
  },
  {
    id: "r_carla_reembolso_to_publica",
    owner_id: "u_carla",
    source_document_id: "d_carla_reembolso",
    target_scope: "shared",
    target_document_id: "s_reembolso_publica",
    created_at: at(2),
  },
];

export const mockSharedDocumentReferences: SharedDocumentReference[] = [
  {
    id: "sr_manual_to_guia",
    source_shared_document_id: "s_manual_vendas",
    target_shared_document_id: "s_onboarding_guia",
    created_at: at(10),
  },
  {
    id: "sr_guia_to_manual",
    source_shared_document_id: "s_onboarding_guia",
    target_shared_document_id: "s_manual_vendas",
    created_at: at(8),
  },
];

// Owned by u_carla (the fixed mock-login user) — Favoritos filters by
// owner_id === session user, so only her favorites are ever visible here.
export const mockFavorites: Favorite[] = [
  {
    id: "fav_carla_compliance",
    owner_id: "u_carla",
    document_scope: "personal",
    document_id: "d_carla_compliance",
    created_at: at(1),
  },
  {
    id: "fav_carla_manual",
    owner_id: "u_carla",
    document_scope: "shared",
    document_id: "s_manual_vendas",
    created_at: at(4),
  },
  {
    id: "fav_carla_beta_contrato",
    owner_id: "u_carla",
    document_scope: "personal",
    document_id: "d_ana_beta_contrato",
    created_at: at(1),
  },
];
