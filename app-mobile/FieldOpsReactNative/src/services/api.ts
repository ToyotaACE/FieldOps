
const API_URL = 'http://localhost:8080/api/v1';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  document?: string | null;
  phone?: string | null;
  role: 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN';
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type LoginResponse = {
  accessToken: string;
  tokenType: string;
};

// Dados retornados pela API para cada inspeção.
export type BackendInspection = {
  id: number;
  title: string;

  templateVersionId: number;
  clientId: number;
  siteId: number;
  equipmentId: number;
  technicianId: number;

  clientName: string;
  siteName: string;
  equipmentName: string;
  technicianName: string;

  scheduledDate: string;
  scheduledTime: string;

  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

  status:
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED';

  createdAt: string;
  updatedAt: string;
};

/**
 * Busca o perfil do usuário e valida o token no backend.
 */
export async function getCurrentUser(
  token: string,
): Promise<AuthUser> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error(
      'Não foi possível conectar ao servidor. Verifique sua conexão.',
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('SESSION_INVALID');
  }

  if (!response.ok) {
    throw new Error(
      `Não foi possível validar a sessão. Código HTTP: ${response.status}`,
    );
  }

  const user: AuthUser = await response.json();

  if (!user.active) {
    throw new Error('Este usuário está inativo.');
  }

  return user;
}

/**
 * Realiza o login e carrega o perfil autenticado.
 */
export async function loginRequest(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });
  } catch {
    throw new Error(
      'Não foi possível conectar ao servidor. Verifique se o backend está ativo.',
    );
  }

  if (!response.ok) {
    throw new Error(
      response.status === 400 ||
      response.status === 401 ||
      response.status === 403
        ? 'E-mail ou senha inválidos, ou usuário sem permissão.'
        : `Falha no login. Código HTTP: ${response.status}`,
    );
  }

  const data: LoginResponse = await response.json();

  if (!data.accessToken) {
    throw new Error('A API não retornou o token de acesso.');
  }

  const user = await getCurrentUser(data.accessToken);

  return {
    token: data.accessToken,
    user,
  };
}

/**
 * Busca as inspeções do usuário autenticado.
 *
 * O backend já aplica as permissões:
 * - ADMIN: consulta todas as inspeções.
 * - SUPERVISOR: consulta todas as inspeções.
 * - TECHNICIAN: consulta somente as próprias inspeções.
 */
export async function getInspections(
  token: string,
): Promise<BackendInspection[]> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/inspections`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error(
      'Não foi possível carregar as inspeções. Verifique se o backend está ativo.',
    );
  }

  if (response.status === 401) {
    throw new Error('SESSION_INVALID');
  }

  if (response.status === 403) {
    throw new Error(
      'Você não tem permissão para consultar as inspeções.',
    );
  }

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar inspeções. Código HTTP: ${response.status}`,
    );
  }

  const inspections: BackendInspection[] = await response.json();

  if (!Array.isArray(inspections)) {
    throw new Error(
      'A API retornou um formato inválido para as inspeções.',
    );
  }

  return inspections;
}
