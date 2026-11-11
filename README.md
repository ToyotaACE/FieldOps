# 📋 FieldOps

> Sistema de gerenciamento de **inspeções técnicas em campo**, com foco em organização, segurança e rastreabilidade.

---

## 🎯 Objetivo

O FieldOps permite **planejar, executar, acompanhar e revisar inspeções técnicas** diretamente no campo. A plataforma integra um painel web administrativo, um aplicativo mobile para técnicos e uma API centralizada que gerencia todos os dados e regras de negócio.

---

## 🧩 Módulos

| Módulo | Descrição |
|---|---|
| 📱 **Mobile** | Execução de inspeções, checklist, fotos, QR Code, localização e modo offline |
| 💻 **Web** | Usuários, equipamentos, modelos, agendamento, acompanhamento e aprovação |
| ⚙️ **API** | Regras de negócio, autenticação JWT, dados e sincronização |

---

## 🔄 Fluxo principal

```
Criar modelo → Agendar → Atribuir → Executar → Sincronizar → Revisar → Aprovar / Reprovar
```

---

## 👥 Perfis de usuário

| Perfil | Papel |
|---|---|
| **Administrador** | Configura o sistema, gerencia usuários e permissões |
| **Supervisor** | Planeja, agenda e revisa inspeções |
| **Técnico** | Executa inspeções em campo |

---

## 🛠️ Tecnologias

| Módulo | Tecnologias |
|---|---|
| **Front-end Web** | React 19, TypeScript, Vite, Tailwind CSS, React Router v7, React Hook Form, Zod, Recharts, TanStack Query |
| **Mobile** | React Native 0.86, Expo 57, TypeScript |
| **Back-end** | Java, Spring Boot 4.1, Spring Security, Spring Data JPA, JWT (Auth0) |
| **Banco de dados** | PostgreSQL 17 (local) |
| **Autenticação** | JWT Bearer Token |

---

## 👩‍💻 Equipe

Aline | Cecilia | Graciele | Hebert | Isabelle | Isadora | Rafael | Rayan |

---

## 🚀 Guia rápido — Primeiro acesso no Windows

### 1. Pré-requisitos

Certifique-se de que as ferramentas abaixo estão instaladas antes de continuar.

| Ferramenta | Versão recomendada | Download |
|---|---|---|
| **Git** | Qualquer versão atual | [git-scm.com](https://git-scm.com) |
| **Java JDK** | 21+ (testado com 26) | [adoptium.net](https://adoptium.net) |
| **Maven** | 3.9+ | Incluído via `mvnw` no projeto |
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org) |
| **npm** | Incluído com Node.js | — |
| **PostgreSQL** | 15+ | [postgresql.org](https://www.postgresql.org) |
| **Expo Go** (opcional) | Versão atual | App Store / Google Play |

> **Dica:** Verifique suas versões com `java -version`, `node -v` e `psql --version` no PowerShell.

---

### 2. Baixar o código

```powershell
git clone https://github.com/ToyotaACE/FieldOps
cd FieldOps
```

---

### 3. Configurar o banco de dados

O back-end utiliza **PostgreSQL** na porta padrão `5432`. Antes de iniciar a API, crie o banco de dados.

Abra o **psql** ou o **pgAdmin** e execute:

```sql
CREATE DATABASE fieldops_db;
```

As configurações de conexão padrão da API são:

| Parâmetro | Valor padrão |
|---|---|
| Host | `localhost` |
| Porta | `5432` |
| Banco | `fieldops_db` |
| Usuário | `postgres` |
| Senha | `admin` |

> Se o seu PostgreSQL utiliza usuário ou senha diferentes, edite o arquivo `fieldops-api/src/main/resources/application.properties` antes de iniciar a API.

---

### 4. Iniciar a API (Back-end)

> Abra um terminal **PowerShell** na pasta `fieldops-api`.

```powershell
cd fieldops-api
.\mvnw.cmd spring-boot:run
```

A API inicia na porta **`8080`**.

**Como verificar se está funcionando:**

```powershell
# Deve retornar status 200 ou 401 (unauthorized) — ambos confirmam que a API está no ar
Invoke-WebRequest -Uri http://localhost:8080/api/v1/inspections -UseBasicParsing
```

> O Hibernate criará automaticamente as tabelas no banco ao subir a aplicação (`spring.jpa.hibernate.ddl-auto=update`).

---

### 5. Iniciar o Front-end Web

> Abra um **novo terminal** PowerShell na pasta `fieldops-web`.

```powershell
cd fieldops-web
npm install
npm run dev
```

O Vite iniciará o servidor e exibirá a URL de acesso no terminal — normalmente **`http://localhost:5173`**.

**Variável de ambiente (opcional):**

Se a API não estiver em `http://localhost:8080`, crie o arquivo `.env` dentro de `fieldops-web` com o seguinte conteúdo:

```env
VITE_API_URL=http://localhost:8080
```

---

### 6. Iniciar o Aplicativo Mobile

> Abra um **novo terminal** PowerShell na pasta `app-mobile/FieldOpsReactNative`.

```powershell
cd app-mobile\FieldOpsReactNative
npm install
npm start
```

O Expo exibirá um QR Code no terminal.

**Para rodar no dispositivo físico:**
1. Instale o aplicativo **Expo Go** no celular.
2. Escaneie o QR Code exibido no terminal.
3. O app abrirá automaticamente.

**Para rodar no emulador:**
- **Android:** Pressione `a` no terminal (Android Studio com emulador configurado necessário).
- **iOS:** Pressione `i` no terminal (macOS + Xcode necessário).

**Conexão com o back-end (Supabase — opcional):**

O app mobile atualmente utiliza **dados locais de demonstração**. Para conectar ao Supabase, copie o arquivo de exemplo e preencha as variáveis:

```powershell
copy .env.example .env
```

Edite o `.env` com as credenciais do seu projeto Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

> Se não configurar o `.env`, o app funciona normalmente com dados locais de demonstração.

---

## 🔐 Primeiro acesso ao sistema

### Front-end Web

Acesse **`http://localhost:5173`** no navegador. A tela de login será exibida.

Para criar o primeiro usuário, utilize o endpoint de registro da API:

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/v1/auth/register `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"Seu Nome","email":"email@exemplo.com","password":"suaSenha123","role":"ADMIN"}'
```

Após o cadastro, faça login com o e-mail e a senha criados.

> Não há usuários pré-cadastrados. O primeiro cadastro deve ser realizado via API.

---

## 📁 Estrutura de pastas

```
FieldOps/
│
├── fieldops-api/                   ⚙️ Back-end (Java + Spring Boot)
│   └── src/main/java/com/fieldops/fieldops_api/
│       ├── controllers/            Endpoints REST
│       ├── services/               Regras de negócio
│       ├── entities/               Entidades JPA (banco de dados)
│       ├── dto/                    Objetos de transferência de dados
│       ├── repositories/           Acesso ao banco via Spring Data
│       ├── security/               JWT e filtros de autenticação
│       └── config/                 Configurações de segurança
│
├── fieldops-web/                   💻 Front-end Web (React + Vite)
│   └── src/
│       ├── pages/                  Telas: dashboard, inspeções, clientes...
│       ├── components/             Componentes reutilizáveis
│       ├── data/                   Dados de demonstração
│       ├── types/                  Tipos TypeScript
│       └── utils/                  Funções utilitárias
│
├── app-mobile/
│   └── FieldOpsReactNative/        📱 Mobile (React Native + Expo)
│       └── src/
│           ├── pages/              Telas do aplicativo
│           ├── components/         Componentes reutilizáveis
│           ├── data/               Dados locais de demonstração
│           ├── types/              Tipos TypeScript
│           ├── theme/              Paletas de cores (claro/escuro)
│           └── lib/                Cliente Supabase (opcional)
│
├── Documentacao/                   📄 Documentação de aulas e entregas
└── uploads/                        📂 Diretório para evidências de inspeção
```

---

## 🔗 Endpoints principais da API

Base URL: `http://localhost:8080/api/v1`

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Autenticação — retorna token JWT |
| `POST` | `/auth/register` | Cadastro de novo usuário |
| `GET` | `/auth/me` | Perfil do usuário autenticado |
| `GET` | `/inspections` | Listar inspeções |
| `POST` | `/inspections` | Criar inspeção |
| `PATCH` | `/inspections/{id}/status` | Atualizar status da inspeção |
| `GET` | `/clients` | Listar clientes |
| `GET` | `/sites` | Listar locais de inspeção |
| `GET` | `/equipments` | Listar equipamentos |
| `GET` | `/users` | Listar usuários |
| `GET` | `/audit-logs` | Consultar log de auditoria |

> Todos os endpoints (exceto `/auth/login` e `/auth/register`) exigem o cabeçalho `Authorization: Bearer <token>`.

---

## ⚠️ Observações

- O **aplicativo mobile** atualmente utiliza dados locais de demonstração. A integração com a API back-end está prevista como próximo passo.
- O **front-end web** se conecta diretamente à API Spring Boot via variável de ambiente `VITE_API_URL` (padrão: `http://localhost:8080`).
- Não há arquivo `.env.example` no módulo web — a variável possui valor padrão no código e é **opcional**.
- O projeto **não utiliza Docker Compose**. Todos os serviços são iniciados manualmente.

---

> **FieldOps — Inspeções de campo conectadas, organizadas e confiáveis.**
