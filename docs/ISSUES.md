# 📋 Backlog de Issues - Voll Med / MediClin

Este documento contém o detalhamento passo a passo de todas as issues do projeto, estruturadas com contexto de negócio, arquitetura técnica, divisão por etapas e prompts prontos para serem executados por Inteligência Artificial ou desenvolvedores.

---

## 📊 Visão Geral do Backlog

| Issue | Módulo | Título | Status |
|:---:|---|---|:---:|
| **#1** | Frontend | Estruturar projeto React com Vite e autenticação JWT | ✅ Concluída |
| **#2** | Backend / Security | Configurar CORS e modernizar SecurityConfigurations para Spring Security 6 | ✅ Concluída |
| **#3** | Backend | Implementar endpoint `GET /consultas` com filtros e paginação | ✅ Concluída |
| **#4** | Fullstack | Harmonizar DTOs e formulários (Endereço, Agendamento e Edição) | ✅ Concluída |
| **#5** | Backend / Arquitetura | Implementar camada de Service para Médicos e Pacientes | ✅ Concluída |
| **#6** | DevOps | Criar Dockerfile multi-stage e docker-compose.yml para API e MySQL | ✅ Concluída |
| **#7** | CI/CD | Configurar GitHub Actions para validação e build contínuo | ✅ Concluída |
| **#8** | Testes | Ampliar cobertura de testes unitários para validadores e segurança | ✅ Concluída |
| **#9** | Segurança / Auth | Controle de Perfis de Usuário (RBAC) e Recuperação de Senha | ✅ Concluída |
| **#10** | Clínica / PEP | Prontuário Eletrônico do Paciente (PEP) e Histórico Clínico | ✅ Concluída |
| **#11** | Documentos / PDF | Geração e Emissão de Receituário e Atestado Médico em PDF | ✅ Concluída |
| **#12** | Frontend / UX | Visão de Agenda em Calendário Interativo Semanal/Mensal | ✅ Concluída |
| **#13** | Notificações | Disparo Automático de E-mails de Confirmação e Cancelamento | ✅ Concluída |
| **#14** | Analytics | Métricas Avançadas, Gráficos no Dashboard e Exportação CSV | ✅ Concluída |
| **#15** | Compliance / DB | Auditoria de Operações e Rastreabilidade de Modificações (LGPD) | ⏳ Pendente |

---

## 📌 Issue #10: [Clínica & PEP] Prontuário Eletrônico do Paciente (PEP) e Histórico Clínico

- **Tipo:** `enhancement`, `backend`, `frontend`
- **Prioridade:** Alta
- **Status:** ✅ Concluída

### Descrição
Em sistemas de gestão hospitalar, o acompanhamento do paciente exige o registro das evoluções médicas realizadas durante as consultas. Atualmente, a consulta é apenas agendada ou cancelada, sem armazenamento de diagnósticos, anamnese ou conduta terapêutica.

### Passo a Passo Técnico

#### Passo 1: Modelagem e Banco de Dados (Flyway)
1. Criar migration `V9__create-table-prontuarios.sql`:
   - Tabela `prontuarios`: `id`, `paciente_id` (FK not null), `medico_id` (FK not null), `consulta_id` (FK nullable), `data_registro` (datetime not null), `queixa_principal` (text), `diagnostico` (text), `prescricao` (text), `observacoes` (text), `peso` (decimal), `altura` (int), `pressao_arterial` (varchar).
2. Adicionar campos clínicos opcionais na tabela `pacientes`: `tipo_sanguineo` (varchar), `alergias` (text).

#### Passo 2: Entidades e Repositórios JPA
1. Criar entidade `Prontuario.java` no pacote `med.voll.api.domain.prontuario`.
2. Criar `ProntuarioRepository.java` com métodos de busca:
   - `Page<Prontuario> findByPacienteIdOrderByDataRegistroDesc(Long pacienteId, Pageable pageable)`
   - `Optional<Prontuario> findByConsultaId(Long consultaId)`

#### Passo 3: Regras de Negócio e DTOs
1. Criar DTOs:
   - `DadosRegistroProntuario(Long pacienteId, Long medicoId, Long consultaId, String queixaPrincipal, String diagnostico, String prescricao, String observacoes, BigDecimal peso, Integer altura, String pressaoArterial)`
   - `DadosDetalhamentoProntuario(...)`
2. Criar `ProntuarioService.java` com regras de validação (ex: médico e paciente devem estar ativos no momento do registro).

#### Passo 4: Controller REST
1. Criar `ProntuarioController.java`:
   - `POST /prontuarios` (Permitido para `ROLE_MEDICO` e `ROLE_ADMIN`)
   - `GET /prontuarios/paciente/{id}` (Paginado, para visualizar histórico completo)
   - `GET /prontuarios/consulta/{consultaId}` (Detalhamento do prontuário vinculado a uma consulta)

#### Passo 5: Frontend
1. Na tela de `PacientesPage.jsx`, adicionar botão **"Ver Prontuário / Histórico"** abrindo modal com a linha do tempo de atendimentos do paciente.
2. Na tela de `ConsultasPage.jsx`, adicionar ação **"Registrar Atendimento"** para consultas agendadas, abrindo modal com formulário clínico (anamnese, diagnóstico, prescrição).

#### Passo 6: Testes
1. Criar `ProntuarioServiceTest.java` testando cenários de registro e validação de médico/paciente.
2. Criar `ProntuarioControllerTest.java` com `MockMvc` validando retornos HTTP 201 e 400.

### Critérios de Aceite
- Médicos autenticados conseguem registrar a evolução clínica vinculada a um paciente.
- O histórico completo de evoluções de um paciente é listado em ordem cronológica reversa.
- Testes automatizados cobrem a criação e busca do prontuário.

> **Prompt para a IA:**  
> *"Realize as implementações propostas na Issue #10: Prontuário Eletrônico do Paciente (PEP) e Histórico Clínico."*

---

## 📌 Issue #11: [Documentos & PDF] Geração e Emissão de Receitas e Atestados Médicos em PDF

- **Tipo:** `enhancement`, `frontend`, `clinical`
- **Prioridade:** Média-Alta
- **Status:** ✅ Concluída

### Descrição
Disponibilizar a emissão e o download instantâneo de documentos médicos oficiais em formato PDF (Receituário Médico e Atestado de Comparecimento), formatados em papel timbrado com identidade visual da clínica MediClin, dados do médico (CRM, especialidade), dados do paciente e data da consulta.

### Passo a Passo Técnico

#### Passo 1: Estrutura do Documento e Modelagem
1. Definir os modelos de documentos clínicos:
   - **Receituário Médico**: Cabeçalho clínico, identificação do paciente, lista de medicamentos com posologia/instruções, carimbo/assinatura digital do médico e data.
   - **Atestado de Comparecimento**: Declaração formal de atendimento contendo horário de início/término, recomendação de dias de repouso (se aplicável) e código CID-10 (opcional).

#### Passo 2: Modal de Configuração no Frontend
1. Criar componente `DocumentoModal.jsx` disparado a partir da listagem de consultas ou do prontuário:
   - Seletor de Tipo: Receita Médica ou Atestado Médico.
   - Campos de texto ricos para medicamentos/posologia ou período de repouso.
   - Botão **"Gerar e Imprimir / Baixar PDF"**.

#### Passo 3: Renderizador e Folha Timbrada
1. Criar folha de estilo específica para impressão/PDF (`@media print` ou integração com biblioteca como `html2pdf.js` / `jspdf`):
   - Layout formal A4 com margens calibradas.
   - Marca d'água discreta e logotipo da MediClin no topo.
   - Bloco de rodapé com informações da unidade hospitalar e código de validação.

#### Passo 4: Integração de Ações Rápidas
1. Adicionar ícone de documento na tabela de consultas e na tela de prontuário do paciente.

#### Passo 5: Testes e Validação
1. Validar a renderização do layout em diferentes resoluções e garantir que a quebra de página A4 seja limpa e legível.

### Critérios de Aceite
- O médico consegue emitir uma receita ou atestado em menos de 3 cliques a partir de uma consulta.
- O documento impresso ou salvo em PDF possui cabeçalho formal, dados completos do médico e paciente.

> **Prompt para a IA:**  
> *"Realize as implementações propostas na Issue #11: Geração e Emissão de Receitas e Atestados Médicos em PDF."*

---

## 📌 Issue #12: [Frontend & UX] Visão de Agenda em Calendário Interativo Semanal/Mensal

- **Tipo:** `enhancement`, `frontend`, `ux`
- **Prioridade:** Média
- **Status:** ✅ Concluída

### Descrição
A visualização atual de consultas em formato de tabela é eficiente para buscas, mas não oferece a percepção visual de horários vagos e ocupados necessária para recepcionistas e médicos. Esta issue implementa uma visão alternativa em Calendário Interativo.

### Passo a Passo Técnico

#### Passo 1: Alternador de Visualização na Tela de Consultas
1. Em `ConsultasPage.jsx`, adicionar alternador de abas no topo: **"Modo Tabela"** e **"Modo Calendário"**.
2. Criar componente `CalendarView.jsx`.

#### Passo 2: Construção da Grade de Dias e Horários
1. Implementar grade mensal e semanal responsiva:
   - Navegação por mês/semana (mês anterior, próximo mês, botão "Hoje").
   - Identificação visual dos dias da semana e dias do final de semana.

#### Passo 3: Distribuição dos Agendamentos no Calendário
1. Mapear as consultas da API nas células de data correspondentes.
2. Exibir badges resumidos com cor por especialidade (ex: Cardiologia azul, Ortopedia verde, Ginecologia roxo, Dermatologia laranja).
3. Indicar status da consulta (Agendada vs Cancelada).

#### Passo 4: Ações Interativas no Calendário
1. **Clique no horário vago**: Abre diretamente o modal de agendamento com a data selecionada pré-preenchida.
2. **Clique na consulta existente**: Abre popover ou modal com detalhes da consulta, médico responsável, paciente e botão de cancelamento rápido.

#### Passo 5: Filtro por Médico
1. Adicionar seletor no topo do calendário para filtrar a agenda de um médico específico ou visualizar a agenda geral da unidade.

### Critérios de Aceite
- O usuário pode alternar fluidamente entre visualização de lista e calendário.
- As consultas reais retornadas pela API são exibidas corretamente nos dias agendados.
- Responsividade garantida para tablets e desktops.

> **Prompt para a IA:**  
> *"Realize as implementações propostas na Issue #12: Visão de Agenda em Calendário Interativo Semanal/Mensal."*

---

## 📌 Issue #13: [Comunicação] Disparo Automático de E-mails de Confirmação e Cancelamento

- **Tipo:** `enhancement`, `backend`, `notification`
- **Prioridade:** Média
- **Status:** ✅ Concluída

### Descrição
Notificar pacientes e médicos por e-mail automaticamente sempre que uma consulta for agendada ou cancelada, garantindo redução na taxa de absenteísmo (no-show) e maior confiabilidade no sistema.

### Passo a Passo Técnico

#### Passo 1: Configuração do Spring Boot Starter Mail
1. Adicionar dependência `spring-boot-starter-mail` no `pom.xml`.
2. Configurar variáveis no `application.properties`:
   - `spring.mail.host`, `spring.mail.port`, `spring.mail.username`, `spring.mail.password`.
3. Adicionar configuração de fallback/simulação caso as credenciais de SMTP não estejam preenchidas, evitando falhas no fluxo principal.

#### Passo 2: Implementação do Serviço de E-mail
1. Criar interface `EmailService.java` e implementação `EnviadorDeEmailService.java` no pacote `med.voll.api.infra.email`.
2. Construir templates HTML modernos e responsivos para:
   - **Confirmação de Agendamento**: Data, hora, nome do médico, especialidade e orientações de antecedência.
   - **Aviso de Cancelamento**: Notificação de cancelamento com o motivo registrado no sistema.

#### Passo 3: Execução Assíncrona (@Async)
1. Habilitar `@EnableAsync` na classe de configuração principal.
2. Tornar o envio de e-mails assíncrono para que o tempo de resposta da API na criação da consulta (`POST /consultas`) permaneça abaixo de 100ms.

#### Passo 4: Integração no docker-compose (Mailpit)
1. Adicionar o serviço do **Mailpit** (servidor SMTP local com interface web) no `docker-compose.yml`, permitindo visualizar todos os e-mails disparados em ambiente de desenvolvimento na porta `http://localhost:8025`.

#### Passo 5: Testes Automatizados
1. Criar testes unitários mockando o `JavaMailSender` e verificando os destinatários e assuntos das mensagens geradas.

### Critérios de Aceite
- O agendamento de uma consulta dispara o e-mail correspondente sem travar a requisição HTTP.
- O cancelamento de consulta dispara o e-mail notificando as partes envolvidas.
- Em ambiente de testes, nenhum e-mail real é enviado.

> **Prompt para a IA:**  
> *"Realize as implementações propostas na Issue #13: Disparo Automático de E-mails de Confirmação e Cancelamento."*

---

## 📌 Issue #14: [Analytics] Métricas Avançadas, Gráficos no Dashboard e Exportação CSV

- **Tipo:** `enhancement`, `fullstack`, `analytics`
- **Prioridade:** Média
- **Status:** ✅ Concluída

### Descrição
Expandir o painel administrativo da clínica com métricas analíticas detalhadas, gráficos visuais de desempenho operacional e funcionalidade de exportação de dados em CSV para relatórios da diretoria.

### Passo a Passo Técnico

#### Passo 1: Endpoint de Estatísticas no Backend
1. Criar `DashboardController.java` com endpoint `GET /dashboard/metricas`:
   - Total de consultas no mês atual.
   - Distribuição de consultas por especialidade.
   - Taxa percentual de cancelamento com distribuição por motivo.
   - Média de consultas agendadas por médico ativo.

#### Passo 2: Gráficos Visuais no Frontend
1. Adicionar componentes visuais de gráfico em `DashboardPage.jsx`:
   - Gráfico de barras com as especialidades mais procuradas.
   - Gráfico de distribuição de status (Realizadas vs Agendadas vs Canceladas).
   - Indicador de crescimento percentual em relação ao mês anterior.

#### Passo 3: Exportação de Dados em CSV
1. Criar utilitário `csvExport.js` no frontend:
   - Botão **"Exportar CSV"** na tela de Médicos (gera planilha com nome, crm, especialidade, telefone, status).
   - Botão **"Exportar CSV"** na tela de Pacientes (gera planilha com nome, cpf, email, telefone).
   - Botão **"Exportar Relatório"** na tela de Consultas com filtros aplicados.

#### Passo 4: Filtros de Período
1. Adicionar seletor de período no Dashboard: Últimos 7 dias, Mês Atual, Últimos 90 dias.

#### Passo 5: Testes
1. Criar `DashboardControllerTest.java` validando o cálculo e estrutura das estatísticas retornadas.

### Critérios de Aceite
- O dashboard renderiza gráficos com métricas calculadas em tempo real.
- O usuário consegue baixar arquivos `.csv` válidos com codificação UTF-8 compatível com Excel e Google Planilhas.

> **Prompt para a IA:**  
> *"Realize as implementações propostas na Issue #14: Métricas Avançadas, Gráficos no Dashboard e Exportação CSV."*

---

## 📌 Issue #15: [Compliance & DB] Auditoria de Operações e Rastreabilidade de Modificações (LGPD)

- **Tipo:** `security`, `backend`, `compliance`
- **Prioridade:** Média
- **Status:** ⏳ Pendente

### Descrição
Para atender aos padrões de conformidade da LGPD e normas do Conselho Federal de Medicina (CFM), todas as entidades de dados sensíveis devem manter histórico de quem criou, quem modificou e os carimbos de data/hora de cada alteração.

### Passo a Passo Técnico

#### Passo 1: Migração de Banco de Dados (Flyway)
1. Criar migration `V10__add-audit-columns.sql`:
   - Adicionar colunas `criado_em` (datetime), `atualizado_em` (datetime), `criado_por` (varchar) e `atualizado_por` (varchar) nas tabelas `medicos`, `pacientes`, `consultas` e `prontuarios`.

#### Passo 2: Configuração de Auditoria no Spring Data JPA
1. Criar classe base abstrata `@MappedSuperclass public abstract class EntidadeAuditavel`:
   - Campos anotados com `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy`.
2. Fazer as entidades `Medico`, `Paciente` e `Consulta` herdarem de `EntidadeAuditavel`.
3. Criar componente `SpringSecurityAuditorAware implements AuditorAware<String>` que extrai o username do `SecurityContextHolder`.
4. Habilitar auditoria na aplicação com `@EnableJpaAuditing`.

#### Passo 3: Exibição no Frontend
1. Exibir rodapé informativo no modal de edição/detalhes: *"Criado por [login] em [data/hora] · Última alteração por [login] em [data/hora]"*.

#### Passo 4: Testes
1. Testar persistência de entidades e verificar se as colunas de auditoria são preenchidas automaticamente pelo Hibernate/Spring Data.

### Critérios de Aceite
- Nenhuma entidade é gravada ou alterada sem o preenchimento automático das colunas de auditoria.
- A aplicação identifica o usuário logado que efetuou a alteração.

> **Prompt para a IA:**  
> *"Realize as implementações propostas na Issue #15: Auditoria de Operações e Rastreabilidade de Modificações (LGPD)."*
