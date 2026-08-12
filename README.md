# 📋 FieldOps

O **FieldOps** é um sistema de gerenciamento e execução de inspeções técnicas em campo, desenvolvido com o objetivo de tornar o processo de inspeção mais organizado, seguro e confiável.

O projeto permite o planejamento de inspeções, criação de checklists personalizados, execução de inspeções em campo, registro de evidências, identificação de equipamentos por QR Code, localização, funcionamento offline, sincronização de dados e revisão das inspeções realizadas.

---

## 🎯 Objetivo do Projeto

Desenvolver uma solução completa para gerenciamento de inspeções técnicas, permitindo que administradores e supervisores organizem as inspeções e que técnicos possam executá-las diretamente pelo aplicativo mobile, inclusive em locais sem acesso à internet.

---

## 🧩 Estrutura do Sistema

O FieldOps será composto por três aplicações principais:

### 📱 Aplicativo Mobile

Aplicativo utilizado principalmente pelos técnicos durante as inspeções em campo.

Principais funcionalidades:

- Login e autenticação;
- Visualização das inspeções atribuídas;
- Detalhes da inspeção;
- Checklist dinâmico;
- Registro de observações;
- Captura de fotografias;
- Leitura de QR Code;
- Registro de localização;
- Registro de não conformidades;
- Funcionamento offline;
- Armazenamento local com SQLite;
- Sincronização dos dados;
- Acompanhamento de erros e pendências de sincronização.

### 💻 Interface Administrativa

Painel utilizado por administradores e supervisores.

Principais funcionalidades:

- Gerenciamento de usuários;
- Gerenciamento de clientes;
- Cadastro de locais;
- Cadastro de equipamentos;
- Criação de modelos de inspeção;
- Versionamento dos modelos;
- Planejamento e agendamento de inspeções;
- Atribuição de técnicos;
- Acompanhamento das inspeções;
- Visualização de evidências;
- Visualização de não conformidades;
- Revisão das inspeções;
- Aprovação e reprovação;
- Histórico e auditoria.

### ⚙️ API REST

Responsável pela comunicação entre o aplicativo mobile, painel administrativo e banco de dados.

Principais responsabilidades:

- Autenticação e autorização;
- Regras de negócio;
- Gerenciamento dos dados;
- Persistência;
- Upload de evidências;
- Sincronização;
- Idempotência;
- Controle de conflitos;
- Auditoria;
- Documentação dos endpoints.

---

## 🛠️ Tecnologias

### Mobile
- React Native
- Expo
- TypeScript
- Expo Router
- SQLite
- Secure Store
- React Hook Form
- TanStack Query

### Interface Administrativa
- Angular
- TypeScript

### Backend
- Java
- Spring Boot
- API REST
- OpenAPI / Swagger

### Banco de Dados
- PostgreSQL

---

## 🔄 Fluxo Principal

O fluxo principal do FieldOps será:

**Criar modelo → Publicar versão → Agendar inspeção → Atribuir técnico → Baixar inspeção → Executar checklist → Registrar evidências → Concluir → Sincronizar → Revisar → Aprovar ou reprovar**

O aplicativo será preparado para que uma inspeção previamente baixada possa continuar sendo realizada mesmo sem conexão com a internet.

---

## 📡 Offline First

Uma das principais características do FieldOps será o funcionamento em ambientes com conexão instável ou inexistente.

As informações serão armazenadas localmente no dispositivo utilizando **SQLite**.

Quando a conexão estiver disponível novamente, as alterações pendentes poderão ser sincronizadas com a API.

O sistema deverá diferenciar os seguintes estados:

- Salvo no dispositivo;
- Aguardando sincronização;
- Sincronizado;
- Falha no envio;
- Conflito.

---

## 🔐 Segurança

O projeto deverá possuir:

- Autenticação por token;
- Controle de acesso por perfil;
- Proteção dos endpoints da API;
- Armazenamento seguro de informações sensíveis;
- Senhas armazenadas de forma segura no backend;
- Validação de uploads;
- Auditoria das principais operações;
- Proteção contra acesso indevido às inspeções.

---

## 👥 Perfis de Usuário

### Administrador
Responsável principalmente pelo gerenciamento dos usuários e configurações administrativas.

### Supervisor
Responsável pelo planejamento, acompanhamento e revisão das inspeções.

### Técnico
Responsável pela execução das inspeções em campo através do aplicativo mobile.

---

## 👩‍💻 Equipe

O projeto **FieldOps** está sendo desenvolvido por:

- Aline
- Cecilia
- Isabelle
- Isadora
- Graciele
- Raya
- Heberte

---

## 📌 Status do Projeto

🚧 **Em desenvolvimento**

O projeto está sendo desenvolvido de forma incremental, seguindo backlog, sprints e critérios de aceitação definidos pela equipe.

---

## 📦 Entrega do MVP

O MVP deverá permitir demonstrar o seguinte fluxo completo:

1. Login administrativo;
2. Cadastro ou seleção de cliente, local e equipamento;
3. Criação e publicação de um modelo de inspeção;
4. Agendamento da inspeção;
5. Atribuição ao técnico;
6. Login do técnico;
7. Download da inspeção;
8. Identificação do equipamento por QR Code;
9. Execução do checklist;
10. Registro de fotografia;
11. Registro de localização;
12. Registro de não conformidade;
13. Execução sem internet;
14. Conclusão offline;
15. Sincronização dos dados;
16. Visualização pelo supervisor;
17. Aprovação ou reprovação;
18. Atualização da decisão no aplicativo;
19. Consulta do histórico.

---

## 📚 Projeto Acadêmico

Projeto desenvolvido como atividade acadêmica integrando conhecimentos de:

- Desenvolvimento Mobile;
- Desenvolvimento Web;
- Java e Spring Boot;
- Banco de Dados;
- APIs REST;
- Engenharia de Software;
- Arquitetura de Software;
- Integração de Sistemas.

---

> **FieldOps — Inspeções de campo conectadas, organizadas e confiáveis.**
