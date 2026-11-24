# FieldOps React Native — versão organizada

Aplicação React Native com Expo + TypeScript reorganizada para facilitar manutenção e evolução.

## Como executar

```bash
npm install
npm start
```

Para Android/iOS, use um development build/EAS ou um ambiente nativo compatível com a versão do Expo declarada em `package.json`.

## Integração com o backend (fieldops-api)
1. Suba o backend (Spring Boot, porta 8080) e o PostgreSQL.
2. Copie `.env.example` para `.env` e ajuste `EXPO_PUBLIC_API_URL`:
   - celular físico (Expo Go): IP do computador na rede, ex.: `http://192.168.0.10:8080`
   - emulador Android: `http://10.0.2.2:8080`
   - iOS Simulator / Web: `http://localhost:8080`
3. Reinicie o Expo (`npx expo start -c`) após alterar o `.env`.
## Organização do projeto

- `App.tsx`: shell principal, navegação simples, tema, busca e estado global local.
- `src/pages/`: uma tela por arquivo.
- `src/pages/*.styles.ts`: estilos exclusivos de cada tela.
- `src/components/`: componentes reutilizáveis como menu, cards, badges e gráficos.
- `src/services/`: acesso à API (`api.ts`), conversões (`mappers.ts`) e dados derivados das respostas (`insights.ts`).
- `src/types/`: tipos TypeScript.
- `src/theme/`: paletas dos temas claro e escuro.
- `src/lib/supabase.ts`: cliente opcional do Supabase.
- `src/styles/App.styles.ts`: estilos exclusivos do shell principal.

## Pages separadas

- `DashboardPage.tsx` + `DashboardPage.styles.ts`
- `InspectionsPage.tsx` + `InspectionsPage.styles.ts`
- `CalendarPage.tsx` + `CalendarPage.styles.ts`
- `InspectionModelsPage.tsx` + `InspectionModelsPage.styles.ts`
- `ClientsPage.tsx` + `ClientsPage.styles.ts`
- `LocationsPage.tsx` + `LocationsPage.styles.ts`
- `EquipmentPage.tsx` + `EquipmentPage.styles.ts`
- `NonConformitiesPage.tsx` + `NonConformitiesPage.styles.ts`
- `ReportsPage.tsx` + `ReportsPage.styles.ts`
- `AuditPage.tsx` + `AuditPage.styles.ts`
- `SettingsPage.tsx` + `SettingsPage.styles.ts`

## Por que `.styles.ts` em vez de `.css`?

Esta aplicação é React Native. Android e iOS não utilizam CSS tradicional da mesma maneira que uma aplicação React para navegador. Por isso, cada page recebeu seu próprio arquivo `*.styles.ts` usando `StyleSheet`, que é o equivalente nativo correto e mantém a estilização totalmente separada do JSX.

## Backend

O projeto recebido utiliza dados locais/mock e já contém um cliente opcional do Supabase. Nenhuma credencial foi criada ou inventada durante esta reorganização.

Copie `.env.example` para `.env` quando for conectar o backend:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```
