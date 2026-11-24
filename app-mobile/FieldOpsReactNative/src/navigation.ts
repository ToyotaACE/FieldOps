import type { Role } from './services/api';
import type { Page } from './types';

/*
|--------------------------------------------------------------------------
| ACESSO ÀS TELAS POR PERFIL
|--------------------------------------------------------------------------
| Telas não listadas aqui ficam disponíveis para todos os perfis.
| As regras de segurança reais continuam no backend.
*/

const PAGE_ACCESS: Partial<Record<Page, Role[]>> = {
  Clientes: ['ADMIN', 'SUPERVISOR'],
  'Modelos de inspeção': ['ADMIN', 'SUPERVISOR'],
  Auditoria: ['ADMIN', 'SUPERVISOR'],
};

export function canAccessPage(role: Role, page: Page): boolean {
  const allowedRoles = PAGE_ACCESS[page];

  return !allowedRoles || allowedRoles.includes(role);
}
