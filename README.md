<p align="center">
  <img src="frontend/public/mediclin-logo.png" alt="MediClin Gestão Clínica" width="160" />
</p>

# 🩺 MediClin · Gestão Clínica & Hospitalar Integrada

[![CI](https://github.com/cezarbtw/Projeto-Medicos/actions/workflows/ci.yml/badge.svg)](https://github.com/cezarbtw/Projeto-Medicos/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.0.0-brightgreen?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![LGPD](https://img.shields.io/badge/Compliance-LGPD%20%2F%20CFM-059669?logo=shield&logoColor=white)

O **MediClin** é uma solução completa para gestão clínica e hospitalar, combinando uma **API REST robusta em Spring Boot 3** com uma **Single Page Application (SPA) em React 18 e Vite**. 

O sistema oferece gestão de ponta a ponta: controle cadastral de profissionais e pacientes, agendamento de consultas com grade interativa, prontuário eletrônico do paciente (PEP), emissão de receitas e atestados em PDF timbrado, notificações transacionais por e-mail, dashboard analítico com métricas em tempo real e trilha de auditoria completa em conformidade com a **LGPD** e normas do **Conselho Federal de Medicina (CFM)**.

---

## 📑 Sumário

- [Visão Geral dos Módulos](#-visão-geral-dos-módulos)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Controle de Acesso & Perfis (RBAC)](#-controle-de-acesso--perfis-rbac)
- [Conformidade LGPD & Trilha de Auditoria](#-conformidade-lgpd--trilha-de-auditoria)
- [Documentação da API (Swagger / OpenAPI)](#-documentação-da-api-swagger--openapi)
- [Como Executar o Projeto](#-como-executar-o-projeto)
  - [Opção 1: Com Docker Compose (Recomendado)](#opção-1-com-docker-compose-recomendado)
  - [Opção 2: Execução Local (Backend + Frontend)](#opção-2-execução-local-backend--frontend)
- [Testes Automatizados & Qualidade](#-testes-automatizados--qualidade)
- [Histórico de Entregas & Backlog (Issues #7 a #15)](#-histórico-de-entregas--backlog)
- [Autor](#-autor)

---

## 🌟 Visão Geral dos Módulos

### 1. 🩺 Corpo Clínico & Médicos
- Cadastro completo com validação de CRM (4 a 6 dígitos), e-mail, telefone e endereço padronizado.
- Categorização por especialidades médicas: `CARDIOLOGIA`, `ORTOPEDIA`, `GINECOLOGIA`, `DERMATOLOGIA`.
- Algoritmo de alocação inteligente: escolha de médico aleatório disponível no horário caso o paciente não selecione um profissional específico.
- Inativação lógica (soft delete) mantendo integridade com consultas anteriores.
- Exportação instantânea da listagem filtrada para **CSV (com proteção contra CSV Injection e UTF-8 BOM)**.

### 2. 👤 Pacientes & Ficha de Saúde
- Cadastro e edição com máscaras e validações de CPF e CEP.
- Metadados clínicos essenciais: tipo sanguíneo (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) e alertas visuais de alergias medicamentosas.
- Acesso com um clique ao Prontuário Eletrônico do Paciente.
- Inativação lógica e exportação de dados para CSV.

### 3. 📅 Agendamento & Gestão de Consultas
- **Grade Interativa Dupla**: alternância imediata entre **Visualização em Tabela** e **Modo Calendário** (visão mensal e semanal interativa).
- Regras de negócio rigorosas via cadeia de validadores Spring:
  - Antecedência mínima de 30 minutos para agendamento.
  - Horário de funcionamento da clínica: segunda a sábado, das 07:00 às 19:00.
  - Bloqueio de duplicidade: paciente não pode agendar duas consultas no mesmo dia.
  - Bloqueio de choque de agenda: médico não pode ter consultas sobrepostas no mesmo horário.
  - Verificação de atividade: tanto médico quanto paciente precisam estar ativos.
- Cancelamento seguro com validação de antecedência mínima de 24 horas e registro do motivo (`PACIENTE_DESISTIU`, `MEDICO_CANCELOU`, `OUTROS`).
- Disparo direto de evolução clínica no PEP ou emissão de documentos a partir da consulta.

### 4. 📋 Prontuário Eletrônico do Paciente (PEP)
- Linha do tempo clínica com histórico cronológico de todos os atendimentos do paciente.
- Registro completo da consulta: queixa principal / anamnese, hipótese diagnóstica, prescrição terapêutica e observações de conduta.
- Monitoramento de sinais vitais: Pressão Arterial (PA), Peso (kg), Altura (cm) e **cálculo automático de Índice de Massa Corporal (IMC)**.
- Rastreamento do médico responsável pelo atendimento e consulta de origem.

### 5. 📄 Emissão de Documentos Clínicos em PDF Timbrado
- Visualizador com layout oficial de folha timbrada hospitalar A4 da rede MediClin.
- Geração instantânea de **Receituários Médicos** e **Atestados Médicos**.
- Cabeçalho institucional, dados do paciente, corpo do documento, identificação do profissional (Nome, Especialidade, CRM) e carimbo/assinatura.
- Estilos otimizados para impressão (`@media print`) permitindo salvar em PDF com fidelidade visual.

### 6. 📧 Notificações Transacionais por E-mail
- Disparo automático de e-mails em HTML responsivo:
  - **Confirmação de Agendamento**: dados da consulta, médico, data/hora e orientações de preparo.
  - **Notificação de Cancelamento**: confirmação da desmarcação e orientações para reagendamento.
- Execução assíncrona (`@Async`) garantindo resposta imediata na API.
- Ambiente de desenvolvimento integrado com **Mailpit** para captura e inspeção visual de mensagens.

### 7. 📊 Dashboard Analítico & Indicadores de Gestão
- Indicadores chave (KPIs): Total de Consultas, Consultas Realizadas, Taxa de Cancelamento e Crescimento Percentual.
- Filtro temporal dinâmico: 7 dias, 30 dias, 90 dias, últimos 365 dias (`ano_atual`) ou período completo (`todos`).
- **Gráficos Visuais Nativos**:
  - Distribuição percentual de consultas por especialidade médica.
  - Proporção de consultas por status (`AGENDADA`, `REALIZADA`, `CANCELADA`).
  - Análise de motivos de cancelamento.
  - Gráfico de colunas com detecção automática do **dia de pico da semana**.

### 8. 🛡️ Auditoria de Operações & Rastreabilidade (LGPD / CFM)
- Módulo administrativo exclusivo para perfis `ADMIN`.
- Rastreamento automático de **quem criou**, **quando criou**, **quem modificou** e **quando modificou** para todas as entidades sensíveis.
- Painel com métricas de eventos nas últimas 24h e filtros por entidade (`MEDICO`, `PACIENTE`, `CONSULTA`, `PRONTUARIO`, `USUARIO`) ou autor.
- Selos e faixas visuais de auditoria nas listagens e caixas de detalhes nos modais de edição.

---

## 🛠 Tecnologias Utilizadas

### Backend
- **Java 17** (LTS)
- **Spring Boot 3.0.0**
  - `spring-boot-starter-web` (REST APIs e Jackson)
  - `spring-boot-starter-data-jpa` (Hibernate 6 e Spring Data JPA)
  - `spring-boot-starter-security` (Spring Security 6 e RBAC)
  - `spring-boot-starter-validation` (Bean Validation / Hibernate Validator)
  - `spring-boot-starter-mail` (JavaMailSender / SMTP)
- **Spring Data JPA Auditing** (captura transparente de data e autoria de modificações)
- **Auth0 Java JWT (v4.2.1)** (geração e validação de tokens JWT stateless)
- **Flyway Migration** (controle versionado de schema DDL: V1 a V10)
- **MySQL 8.0** / **H2 Database** (para suíte de testes automatizados)
- **SpringDoc OpenAPI 2.0.2** (documentação interativa Swagger UI)
- **Lombok** & **Maven Wrapper**

### Frontend
- **React 18** com Hooks modernos (`useCallback`, `useMemo`, `useState`, `useEffect`)
- **Vite 5** (build ultrarrápido com Hot Module Replacement)
- **Context API** (gerenciamento centralizado de autenticação e sessão RBAC)
- **CSS Modular com Design System Clínico** (paleta profissional, microinterações, modo responsivo e `@media print`)

### Infraestrutura & DevOps
- **Docker & Docker Compose** (orquestração de MySQL 8, Mailpit e Spring Boot API)
- **Mailpit** (servidor SMTP e Web UI local para testes de e-mail)
- **GitHub Actions** (pipeline de Integração Contínua verificando build Java 17 + testes e build do Vite)

---

## 🏗 Arquitetura do Sistema

O projeto adota uma arquitetura em camadas orientada ao domínio, separando responsabilidades com clareza:

```text
Projeto-Medicos/
├── .github/workflows/          # Pipeline de CI (Backend + Frontend)
├── docker-compose.yml          # Orquestração MySQL + Mailpit + API
├── Dockerfile                  # Build multi-stage da aplicação Spring Boot
│
├── frontend/                   # Single Page Application em React + Vite
│   ├── public/                 # Assets públicos e identidades visuais (Favicon M+, Logos)
│   └── src/
│       ├── components/         # Componentes reutilizáveis (Sidebar, CalendarView, Modais, PEP, Audit)
│       ├── context/            # AuthContext (JWT, sessão, controle RBAC)
│       ├── pages/              # Telas (Lobby, Dashboard, Médicos, Pacientes, Consultas, Auditoria, Login)
│       ├── services/           # Cliente HTTP com interceptor Bearer e callback 401/403
│       └── utils/              # Exportação CSV sanitizada e formatadores
│
└── src/                        # Aplicação Backend Spring Boot
    ├── main/
    │   ├── java/med/voll/api/
    │   │   ├── controller/     # Controllers REST (endpoints da API)
    │   │   ├── domain/         # Entidades de domínio, DTOs, Services e Validadores
    │   │   │   ├── auditoria/  # Superclasse EntidadeAuditavel e serviço consolidado
    │   │   │   ├── consulta/   # Regras de agendamento, cancelamento e validadores
    │   │   │   ├── dashboard/  # Métricas analíticas e consolidação de indicadores
    │   │   │   ├── medico/     # Entidade Medico, repositório e serviços
    │   │   │   ├── paciente/   # Entidade Paciente, repositório e serviços
    │   │   │   ├── prontuario/ # Prontuário Eletrônico do Paciente (PEP)
    │   │   │   └── usuario/    # Usuários, credenciais, recuperação e enum de perfis
    │   │   └── infra/          # Configurações de infraestrutura
    │   │       ├── auditoria/  # AuditorAware integrado ao SecurityContextHolder
    │   │       ├── email/      # Serviço assíncrono de e-mails em HTML
    │   │       ├── exception/  # Tratador global de exceções (RFC 7807)
    │   │       ├── security/   # SecurityConfigurations, JWT TokenService e filtros
    │   │       └── springdoc/  # Configuração do Swagger OpenAPI
    │   └── resources/
    │       ├── db/migration/   # Migrations Flyway (V1__... até V10__add-audit-columns.sql)
    │       └── application.properties
    └── test/                   # 67 testes unitários, de repositório, controllers e auditoria
```

---

## 🔐 Controle de Acesso & Perfis (RBAC)

O sistema conta com controle de acesso baseado em papéis (*Role-Based Access Control*), integrado via Spring Security e refletido na interface do usuário:

| Perfil | Descrição | Permissões no Sistema |
|---|---|---|
| **`ADMIN`** | Administrador Geral do Hospital | Acesso total: gestão de médicos, pacientes, agendamentos, métricas analíticas e **acesso exclusivo ao painel e colunas de Auditoria LGPD/CFM**. |
| **`MEDICO`** | Profissional de Saúde | Consulta de agenda, atendimento clínico de consultas, registro de evolução no Prontuário Eletrônico (PEP) e emissão de atestados/receituários. |
| **`RECEPCIONISTA`** | Equipe de Recepção e Atendimento | Cadastro e atualização de pacientes, agendamento e cancelamento de consultas, consulta de horários e emissão de relatórios CSV. |

O fluxo de autenticação inclui:
1. **Login com JWT**: expiração de 2 horas com *claims* contendo o perfil de acesso (`perfil`) e *subject* autenticado.
2. **Auto-cadastro controlado**: possibilidade de criar contas com perfil pré-definido.
3. **Recuperação de Senha Segura**: geração de tokens temporários via UUID com expiração em 30 minutos e redefinição criptografada via BCrypt.

---

## 🛡 Conformidade LGPD & Trilha de Auditoria

Para atender às exigências da **Lei Geral de Proteção de Dados (Lei 13.709/2018)** e às resoluções do **Conselho Federal de Medicina (CFM)** sobre guarda e rastreabilidade de prontuários eletrônicos:

1. **Persistência Auditada**: As tabelas `medicos`, `pacientes`, `consultas`, `prontuarios` e `usuarios` contêm colunas imutáveis de criação e colunas rastreáveis de alteração:
   - `criado_em` (`datetime`, preenchido automaticamente, `updatable = false`).
   - `criado_por` (`varchar(100)`, login do autor autenticado no `SecurityContextHolder`, `updatable = false`).
   - `atualizado_em` (`datetime`, atualizado a cada `UPDATE`).
   - `atualizado_por` (`varchar(100)`, login do operador responsável pela edição).
2. **Auditoria Transparente**: Gerenciada centralmente pela superclasse `EntidadeAuditavel` e pelo `AuditorAwareImpl`, registrando `"SISTEMA"` caso a operação ocorra sem autenticação (como no auto-cadastro de conta).
3. **Painel de Auditoria (`GET /auditoria`)**: Protegido por `@PreAuthorize("hasRole('ADMIN')")`, fornecendo visão holística de criações e alterações recentes, com filtros dinâmicos por entidade e usuário.

---

## 📖 Documentação da API (Swagger / OpenAPI)

Com a aplicação em execução, a documentação interativa e a especificação OpenAPI podem ser acessadas em:

- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### Principais Grupos de Endpoints

```text
POST   /login                    Efetuar autenticação e obter Token JWT
POST   /cadastro                 Criar nova conta de usuário
POST   /recuperar-senha          Solicitar token de recuperação de acesso
POST   /redefinir-senha          Redefinir senha com token temporário

GET    /medicos                  Listar médicos ativos (paginado)
POST   /medicos                  Cadastrar novo médico
GET    /medicos/{id}             Detalhar informações do médico
PUT    /medicos/{id}             Atualizar dados de um médico
DELETE /medicos/{id}             Inativação lógica do médico

GET    /pacientes                Listar pacientes ativos (paginado)
POST   /pacientes                Cadastrar novo paciente
GET    /pacientes/{id}           Detalhar paciente
PUT    /pacientes/{id}           Atualizar dados do paciente
DELETE /pacientes/{id}           Inativação lógica do paciente

GET    /consultas                Listar consultas cadastradas
POST   /consultas                Agendar nova consulta médica
DELETE /consultas                Cancelar consulta informando motivo

POST   /prontuarios              Registrar evolução clínica / atendimento no PEP
GET    /prontuarios/{id}         Detalhar prontuário por ID
GET    /prontuarios/paciente/{id} Listar histórico do paciente no PEP (cronológico)
GET    /prontuarios/consulta/{id} Buscar prontuário vinculado a uma consulta

GET    /dashboard/metricas       Métricas analíticas (?periodo=7_dias|30_dias|90_dias|ano_atual|todos)
GET    /auditoria                Trilha de auditoria LGPD/CFM (Requer perfil ADMIN)
```

---

## ⚙️ Como Executar o Projeto

### Opção 1: Com Docker Compose (Recomendado)

Esta opção inicializa o **MySQL 8**, o servidor de e-mail **Mailpit** e a **API Spring Boot** conteinerizada em uma única rede:

```bash
# Na raiz do repositório:
docker compose up -d --build
```

Serviços disponibilizados:
- **API Spring Boot**: `http://localhost:8080`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **Mailpit Web UI (Caixa de E-mails)**: `http://localhost:8025`
- **MySQL 8**: `localhost:3306` (usuário: `root`, senha: `root`)

Para subir o frontend em desenvolvimento:
```bash
cd frontend
npm install
npm run dev
```
Acesse a aplicação web em: **`http://localhost:5173`**.

Para encerrar os contêineres:
```bash
docker compose down
```

---

### Opção 2: Execução Local (Backend + Frontend)

#### Pré-requisitos
- **Java 17** ou superior instalado (`JAVA_HOME` configurado)
- **Node.js 18** ou superior e `npm`
- **MySQL 8** em execução local

#### 1. Configurar o Banco de Dados MySQL
Crie a base de dados:
```sql
CREATE DATABASE vollmed_api;
```

Se necessário, ajuste suas credenciais em `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost/vollmed_api
spring.datasource.username=seu_usuario
spring.datasource.password=sua_senha
```

#### 2. Executar o Backend Spring Boot
```bash
# Linux / macOS:
./mvnw spring-boot:run

# Windows (PowerShell):
.\mvnw.cmd spring-boot:run
```
O Flyway executará automaticamente as migrações `V1` a `V10`.

#### 3. Executar o Frontend React
Em um novo terminal:
```bash
cd frontend
npm install
npm run dev
```

Abra o navegador em `http://localhost:5173`. O Vite redirecionará automaticamente as chamadas `/api/*` para a API Spring Boot em `http://localhost:8080`.

---

## 🧪 Testes Automatizados & Qualidade

O projeto conta com **67 testes automatizados** integrados ao ciclo de vida do Maven (`clean test` e `verify`), abrangendo:

- **Validadores de Negócio**: testes unitários de regras de agendamento (antecedência, horário de funcionamento, médico ativo, paciente ativo, conflito de horários) e cancelamento (antecedência mínima de 24h).
- **Controladores REST**: testes com `MockMvc` validando status HTTP (`200`, `201`, `400`, `403`), validações de payload e permissões de segurança.
- **Camada de Segurança**: geração e validação de tokens JWT, extração de roles e controle RBAC.
- **Serviço de Notificação**: testes com mocks do `JavaMailSender` validando envio de e-mails em HTML.
- **Persistência & Auditoria JPA**: testes com `@DataJpaTest` e `TestEntityManager` validando preenchimento automático das colunas de auditoria na criação e modificação, fallback para usuário `"SISTEMA"` e imutabilidade dos carimbos de criação.
- **Migrações Flyway**: teste de execução limpa de todas as migrations (`V1` a `V10`).

Para rodar os testes localmente:
```bash
# Linux / macOS:
./mvnw test

# Windows (PowerShell):
.\mvnw.cmd test
```

---

## 🚀 Histórico de Entregas & Issues (GitHub)

Status do repositório: **15 issues fechadas (`closed`) · 0 issues abertas (`open`)** — todo o backlog planejado foi **100% implementado, testado e entregue** na branch `master`:

### Base Arquitetural, Segurança & DevOps (Issues #1 a #9)
- [x] **[#1 — Frontend React + Vite & Autenticação JWT](https://github.com/cezarbtw/Projeto-Medicos/issues/1)**: Estruturação da SPA em React com Vite e fluxo de autenticação via Token JWT.
- [x] **[#2 — CORS & Spring Security 6](https://github.com/cezarbtw/Projeto-Medicos/issues/2)**: Configuração de política de CORS e modernização de `SecurityConfigurations` para Spring Security 6.
- [x] **[#3 — Endpoint `GET /consultas`](https://github.com/cezarbtw/Projeto-Medicos/issues/3)**: Listagem de consultas com filtros e paginação.
- [x] **[#4 — Harmonização de DTOs e Formulários](https://github.com/cezarbtw/Projeto-Medicos/issues/4)**: Alinhamento entre backend e frontend nos fluxos de endereço, agendamento e edição.
- [x] **[#5 — Camada de Service para Médicos e Pacientes](https://github.com/cezarbtw/Projeto-Medicos/issues/5)**: Separação de responsabilidades com `MedicoService` e `PacienteService`.
- [x] **[#6 — Dockerização Multi-Stage & Compose](https://github.com/cezarbtw/Projeto-Medicos/issues/6)**: Criação de `Dockerfile` multi-stage e `docker-compose.yml` integrando API e MySQL 8.
- [x] **[#7 — CI/CD com GitHub Actions](https://github.com/cezarbtw/Projeto-Medicos/issues/7)**: Workflow automatizado validando build/testes do Backend (JDK 17) e build do Frontend (Node 20).
- [x] **[#8 — Cobertura de Testes Unitários](https://github.com/cezarbtw/Projeto-Medicos/issues/8)**: Testes unitários para validadores de agendamento, cancelamento e `TokenService`.
- [x] **[#9 — Controle de Perfis (RBAC) & Recuperação de Senha](https://github.com/cezarbtw/Projeto-Medicos/issues/9)**: Perfis `ADMIN`, `MEDICO` e `RECEPCIONISTA` e fluxo de recuperação/redefinição de senha com token temporário.

### Evolução Clínica, Comunicação, Analytics & LGPD (Issues #10 a #15)
- [x] **[#10 — Prontuário Eletrônico do Paciente (PEP)](https://github.com/cezarbtw/Projeto-Medicos/issues/10)**: Linha do tempo clínica, sinais vitais com cálculo de IMC, anamnese, diagnóstico e prescrições.
- [x] **[#11 — Emissão de Documentos Clínicos em PDF](https://github.com/cezarbtw/Projeto-Medicos/issues/11)**: Visualização e impressão em folha timbrada hospitalar A4 para atestados e receituários médicos.
- [x] **[#12 — Agenda em Calendário Interativo](https://github.com/cezarbtw/Projeto-Medicos/issues/12)**: Calendário interativo semanal e mensal para acompanhamento dinâmico de consultas.
- [x] **[#13 — Notificações Transacionais por E-mail](https://github.com/cezarbtw/Projeto-Medicos/issues/13)**: Disparo assíncrono de confirmações e cancelamentos de consulta em HTML com integração ao Mailpit.
- [x] **[#14 — Métricas Analíticas & Exportação CSV](https://github.com/cezarbtw/Projeto-Medicos/issues/14)**: Painel analítico de indicadores, gráficos visuais de especialidades/dias de pico e exportação CSV sanitizada.
- [x] **[#15 — Auditoria de Operações & Rastreabilidade (LGPD/CFM)](https://github.com/cezarbtw/Projeto-Medicos/issues/15)**: Superclasse auditável JPA, `AuditorAware`, migração `V10` e painel administrativo exclusivo para perfil `ADMIN`.
- [x] **Identidade Visual MediClin**: Aplicação do logo oficial da rede e favicon exclusivo **M+** em vetor SVG/PNG/ICO.

---

## 👨‍💻 Autor

**Abraão Cezar Inácio Leopoldino**

- GitHub: [@cezarbtw](https://github.com/cezarbtw)
- LinkedIn: [linkedin.com/in/cezarinaciol](https://www.linkedin.com/in/cezarinaciol/)
