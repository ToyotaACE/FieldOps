# FieldOps React Native — versão organizada

Aplicação React Native com Expo + TypeScript reorganizada para facilitar manutenção e evolução.

## Como executar

```bash
npm install
npm start
```

Para Android/iOS, use um development build/EAS ou um ambiente nativo compatível com a versão do Expo declarada em `package.json`.

## Organização do projeto

- `App.tsx`: shell principal, navegação simples, tema, busca e estado global local.
- `src/pages/`: uma tela por arquivo.
- `src/pages/*.styles.ts`: estilos exclusivos de cada tela.
- `src/components/`: componentes reutilizáveis como menu, cards, badges e gráficos.
- `src/data/`: dados locais de demonstração.
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
