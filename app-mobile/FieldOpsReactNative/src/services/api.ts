import { Platform } from 'react-native';

/*
|--------------------------------------------------------------------------
| URL DA API
|--------------------------------------------------------------------------
| Defina EXPO_PUBLIC_API_URL no arquivo .env (sem /api/v1 no final).
| Exemplos:
|   - Celular físico:      http://192.168.0.10:8080   (IP do computador)
|   - Emulador Android:    http://10.0.2.2:8080
|   - iOS Simulator / Web: http://localhost:8080
*/

const DEFAULT_HOST =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080'
    : 'http://localhost:8080';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_HOST
).replace(/\/+$/, '');

const API_URL = `${API_BASE_URL}/api/v1`;

/*
|--------------------------------------------------------------------------
| ERROS DE REDE
|--------------------------------------------------------------------------
*/

/**
 * Falha de rede (sem conexão, timeout ou servidor inacessível).
 * Diferente de uma resposta de erro devolvida pelo servidor.
 */
export class NetworkError extends Error {
  constructor(
    message = 'Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está ativo.',
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError;
}

export const SESSION_INVALID = 'SESSION_INVALID';

const REQUEST_TIMEOUT_MS = 20000;
const UPLOAD_TIMEOUT_MS = 60000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }
}

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type Role = 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  document?: string | null;
  phone?: string | null;
  role: Role;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type LoginResponse = {
  accessToken: string;
  tokenType: string;
};

export type BackendInspectionStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

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
  equipmentQrCode?: string | null;
  technicianName: string;
  instructions?: string | null;
  scheduledDate: string;
  scheduledTime: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: BackendInspectionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  reviewComment?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TemplateSection = {
  id: number;
  templateVersionId?: number;
  title: string;
  description?: string | null;
  displayOrder: number;
  createdAt?: string;
};

/**
 * Contrato único de respostas (igual no Backend, Web e Mobile):
 *
 * TEXT_SHORT / TEXT_LONG  texto
 * NUMBER                  número decimal com ponto ("12.5")
 * BOOLEAN                 "true" | "false"
 * CONFORMITY              "CONFORM" | "NONCONFORM" | "NOT_APPLICABLE"
 * SINGLE_CHOICE           uma das opções cadastradas no item
 * DATE                    "AAAA-MM-DD"
 */
export type ResponseType =
  | 'TEXT_SHORT'
  | 'TEXT_LONG'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'CONFORMITY'
  | 'SINGLE_CHOICE'
  | 'DATE';

export type TemplateItem = {
  id: number;
  sectionId: number;
  label: string;
  description?: string | null;
  responseType: ResponseType;
  required: boolean;
  requiresObservationOnNonconformity: boolean;
  criticalOnNonconformity: boolean;
  requiresEvidence: boolean;
  displayOrder: number;
  options?: string[] | null;
  createdAt?: string;
};

export type ChecklistSection = {
  section: TemplateSection;
  items: TemplateItem[];
};

export type InspectionAnswer = {
  id: number;
  inspectionId: number;
  templateItemId: number;
  value: string | null;
  observation: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type InspectionEvidence = {
  id: number;
  answerId: number | null;
  nonConformityId?: number | null;
  originalFilename: string;
  contentType: string;
  uploadedAt: string;
};

export type NonConformitySeverityApi = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ApiNonConformity = {
  id: number;
  inspectionId: number;
  templateItemId?: number | null;
  severity: NonConformitySeverityApi;
  status: string;
  type?: string | null;
  description: string;
  probableCause?: string | null;
  recommendedAction?: string | null;
  technicalNotes?: string | null;
  createdByName?: string | null;
  clientOperationId?: string | null;
  createdAt?: string | null;
};

export type NonConformityPayload = {
  templateItemId?: number | null;
  severity: NonConformitySeverityApi;
  type?: string | null;
  description: string;
  probableCause?: string | null;
  recommendedAction?: string | null;
  technicalNotes?: string | null;
};

export type InspectionPackage = {
  inspection: BackendInspection;
  sections: {
    id: number;
    title: string;
    description?: string | null;
    displayOrder: number;
    items: TemplateItem[];
  }[];
  answers: InspectionAnswer[];
  evidences: InspectionEvidence[];
  nonConformities: ApiNonConformity[];
  history: {
    id: number;
    action: string;
    actorName?: string | null;
    description?: string | null;
    createdAt: string;
  }[];
};

export type InspectionAnswerRequest = {
  templateItemId: number;
  value: string;
  observation?: string | null;
};

export type ApiClient = {
  id: number;
  name: string;
  document?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiSite = {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  active: boolean;
  clientId: number;
  clientName: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiEquipment = {
  id: number;
  name: string;
  category?: string | null;
  serialNumber?: string | null;
  qrCode: string;
  active: boolean;
  siteId: number;
  siteName: string;
  clientId: number;
  clientName: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiTemplate = {
  id: number;
  title: string;
  category?: string | null;
  description?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiTemplateVersion = {
  id: number;
  templateId: number;
  versionNumber: number;
  published: boolean;
  publishedAt?: string | null;
  createdAt?: string;
};

export type ApiAuditLog = {
  id: number;
  actorUserId?: number | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  createdAt: string;
};

export type ApiPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type UpdateProfileRequest = {
  name: string;
  document: string;
  phone: string;
};

/** Operação da fila de sincronização (contrato de POST /sync/operations). */
export type SyncOperationRequest = {
  operationId: string;
  type: 'START' | 'COMPLETE' | 'REOPEN' | 'ANSWER' | 'NONCONFORMITY';
  inspectionId: number;
  deviceTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  locationTime?: string | null;
  templateItemId?: number | null;
  value?: string | null;
  observation?: string | null;
  nonConformity?: NonConformityPayload | null;
};

export type SyncOperationResult = {
  operationId: string;
  status: 'APPLIED' | 'DUPLICATE' | 'REJECTED';
  entityId?: number | null;
  message?: string | null;
  answer?: InspectionAnswer | null;
  nonConformity?: ApiNonConformity | null;
  inspection?: BackendInspection | null;
};

/*
|--------------------------------------------------------------------------
| FUNÇÕES AUXILIARES
|--------------------------------------------------------------------------
*/

/**
 * Lê a mensagem de erro devolvida pela API (quando existir).
 */
async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const text = await response.text();

    if (!text) return fallback;

    try {
      const data = JSON.parse(text);

      if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message;
      }

      if (typeof data?.detail === 'string' && data.detail.trim()) {
        return data.detail;
      }

      return fallback;
    } catch {
      return text.length <= 300 ? text : fallback;
    }
  } catch {
    return fallback;
  }
}

/**
 * Executa requisições autenticadas na API.
 */
async function authenticatedFetch(
  path: string,
  token: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const response = await fetchWithTimeout(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    },
    timeoutMs,
  );

  if (response.status === 401) {
    throw new Error(SESSION_INVALID);
  }

  if (response.status === 403) {
    throw new Error(
      await readErrorMessage(
        response,
        'Você não tem permissão para realizar esta operação.',
      ),
    );
  }

  return response;
}

/**
 * GET autenticado que devolve JSON tipado.
 */
async function getJson<T>(
  path: string,
  token: string,
  errorMessage: string,
): Promise<T> {
  const response = await authenticatedFetch(path, token);

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        `${errorMessage} Código HTTP: ${response.status}`,
      ),
    );
  }

  return response.json();
}

/**
 * Requisição autenticada com corpo JSON.
 */
async function sendJson<T>(
  path: string,
  token: string,
  method: 'POST' | 'PUT' | 'PATCH',
  body: unknown,
  errorMessage: string,
  expectBody = true,
): Promise<T> {
  const response = await authenticatedFetch(path, token, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        `${errorMessage} Código HTTP: ${response.status}`,
      ),
    );
  }

  return (expectBody ? await response.json() : undefined) as T;
}

/*
|--------------------------------------------------------------------------
| AUTENTICAÇÃO E PERFIL
|--------------------------------------------------------------------------
*/

/**
 * Busca o perfil do usuário e valida o token no backend.
 */
export async function getCurrentUser(
  token: string,
): Promise<AuthUser> {
  const response = await authenticatedFetch('/auth/me', token);

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
    response = await fetchWithTimeout(`${API_URL}/auth/login`, {
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
    throw new NetworkError(
      `Não foi possível conectar ao servidor (${API_BASE_URL}). Verifique se o backend está ativo e se EXPO_PUBLIC_API_URL está correto.`,
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
 * Renova o token (o token atual precisa estar válido).
 */
export async function refreshToken(token: string): Promise<string> {
  const data = await sendJson<LoginResponse>(
    '/auth/refresh',
    token,
    'POST',
    undefined,
    'Erro ao renovar a sessão.',
  );

  if (!data.accessToken) {
    throw new Error('A API não retornou o token de acesso.');
  }

  return data.accessToken;
}

/**
 * Atualiza nome, CPF e telefone do usuário autenticado.
 */
export async function updateMyProfile(
  token: string,
  data: UpdateProfileRequest,
): Promise<AuthUser> {
  return sendJson<AuthUser>(
    '/auth/me',
    token,
    'PATCH',
    data,
    'Erro ao atualizar o perfil.',
  );
}

/**
 * Altera a senha do usuário autenticado.
 */
export async function changeMyPassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await sendJson<void>(
    '/auth/me/password',
    token,
    'PATCH',
    { currentPassword, newPassword },
    'Erro ao alterar a senha.',
    false,
  );
}

/*
|--------------------------------------------------------------------------
| INSPEÇÕES
|--------------------------------------------------------------------------
*/

/**
 * Busca as inspeções do usuário autenticado (técnico: somente as dele).
 */
export async function getInspections(
  token: string,
): Promise<BackendInspection[]> {
  const inspections = await getJson<BackendInspection[]>(
    '/inspections',
    token,
    'Erro ao buscar inspeções.',
  );

  if (!Array.isArray(inspections)) {
    throw new Error(
      'A API retornou um formato inválido para as inspeções.',
    );
  }

  return inspections;
}

/**
 * Inspeção completa: checklist da versão exata do modelo, respostas,
 * evidências, não conformidades e histórico.
 */
export function getInspectionPackage(
  token: string,
  inspectionId: number,
): Promise<InspectionPackage> {
  return getJson<InspectionPackage>(
    `/inspections/${inspectionId}/package`,
    token,
    'Erro ao buscar a inspeção.',
  );
}

/** Supervisor: abre a revisão. */
export function startInspectionReview(
  token: string,
  inspectionId: number,
): Promise<BackendInspection> {
  return sendJson<BackendInspection>(
    `/inspections/${inspectionId}/review`,
    token,
    'POST',
    undefined,
    'Erro ao iniciar a revisão.',
  );
}

/** Supervisor: aprova (comentário opcional). */
export function approveInspection(
  token: string,
  inspectionId: number,
  comment?: string,
): Promise<BackendInspection> {
  return sendJson<BackendInspection>(
    `/inspections/${inspectionId}/approve`,
    token,
    'POST',
    { reason: comment?.trim() || null },
    'Erro ao aprovar a inspeção.',
  );
}

/** Supervisor: reprova (motivo obrigatório). */
export function rejectInspection(
  token: string,
  inspectionId: number,
  reason: string,
): Promise<BackendInspection> {
  return sendJson<BackendInspection>(
    `/inspections/${inspectionId}/reject`,
    token,
    'POST',
    { reason },
    'Erro ao reprovar a inspeção.',
  );
}

/*
|--------------------------------------------------------------------------
| SINCRONIZAÇÃO (OUTBOX)
|--------------------------------------------------------------------------
*/

/**
 * Envia um lote de operações. Cada operação é idempotente pelo
 * operationId; o resultado vem na mesma ordem do envio.
 */
export async function sendSyncOperations(
  token: string,
  operations: SyncOperationRequest[],
): Promise<SyncOperationResult[]> {
  const data = await sendJson<{ results: SyncOperationResult[] }>(
    '/sync/operations',
    token,
    'POST',
    { operations },
    'Erro ao sincronizar as operações.',
  );

  return data.results;
}

/*
|--------------------------------------------------------------------------
| EVIDÊNCIAS
|--------------------------------------------------------------------------
*/

type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

async function uploadEvidence(
  path: string,
  token: string,
  file: UploadFile,
  operationId?: string,
): Promise<InspectionEvidence> {
  const formData = new FormData();

  formData.append(
    'file',
    {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob,
  );

  const query = operationId
    ? `?operationId=${encodeURIComponent(operationId)}`
    : '';

  const response = await authenticatedFetch(
    `${path}${query}`,
    token,
    {
      method: 'POST',
      body: formData,
    },
    UPLOAD_TIMEOUT_MS,
  );

  if (!response.ok) {
    const error = new Error(
      await readErrorMessage(
        response,
        `Erro ao enviar fotografia. Código HTTP: ${response.status}`,
      ),
    );

    (error as Error & { httpStatus?: number }).httpStatus =
      response.status;

    throw error;
  }

  return response.json();
}

/** Envia uma foto vinculada a uma resposta (idempotente por operationId). */
export function uploadAnswerEvidence(
  token: string,
  answerId: number,
  file: UploadFile,
  operationId?: string,
): Promise<InspectionEvidence> {
  return uploadEvidence(
    `/inspection-evidences/answers/${answerId}`,
    token,
    file,
    operationId,
  );
}

/** Envia uma foto vinculada a uma não conformidade. */
export function uploadNonConformityEvidence(
  token: string,
  nonConformityId: number,
  file: UploadFile,
  operationId?: string,
): Promise<InspectionEvidence> {
  return uploadEvidence(
    `/inspection-evidences/nonconformities/${nonConformityId}`,
    token,
    file,
    operationId,
  );
}

/**
 * Baixa a imagem da evidência (com autenticação) e a devolve como
 * data URI, que pode ser usada diretamente em <Image source={{ uri }} />.
 */
export async function getEvidenceImageUri(
  token: string,
  evidence: Pick<InspectionEvidence, 'id' | 'contentType'>,
): Promise<string> {
  const response = await authenticatedFetch(
    `/inspection-evidences/${evidence.id}/file`,
    token,
    { headers: { Accept: '*/*' } },
    UPLOAD_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(
      `Não foi possível carregar a imagem. Código HTTP: ${response.status}`,
    );
  }

  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = String(reader.result ?? '');

      // Garante o tipo da imagem caso o servidor não envie Content-Type.
      resolve(
        result.startsWith('data:application/octet-stream')
          ? result.replace(
              'data:application/octet-stream',
              `data:${evidence.contentType || 'image/jpeg'}`,
            )
          : result,
      );
    };

    reader.onerror = () =>
      reject(new Error('Não foi possível ler a imagem da evidência.'));

    reader.readAsDataURL(blob);
  });
}

/**
 * Busca as evidências vinculadas a uma resposta.
 */
export function getAnswerEvidences(
  token: string,
  answerId: number,
): Promise<InspectionEvidence[]> {
  return getJson<InspectionEvidence[]>(
    `/inspection-evidences/answers/${answerId}`,
    token,
    'Erro ao buscar evidências.',
  );
}

/*
|--------------------------------------------------------------------------
| CADASTROS (CLIENTES, LOCAIS, EQUIPAMENTOS, MODELOS)
|--------------------------------------------------------------------------
*/

export function getClients(token: string): Promise<ApiClient[]> {
  return getJson<ApiClient[]>(
    '/clients',
    token,
    'Erro ao buscar clientes.',
  );
}

export function getSites(token: string): Promise<ApiSite[]> {
  return getJson<ApiSite[]>(
    '/sites',
    token,
    'Erro ao buscar locais.',
  );
}

export function getEquipments(token: string): Promise<ApiEquipment[]> {
  return getJson<ApiEquipment[]>(
    '/equipments',
    token,
    'Erro ao buscar equipamentos.',
  );
}

export function getInspectionTemplates(
  token: string,
): Promise<ApiTemplate[]> {
  return getJson<ApiTemplate[]>(
    '/inspection-templates',
    token,
    'Erro ao buscar modelos de inspeção.',
  );
}

export function getTemplateVersions(
  token: string,
  templateId: number,
): Promise<ApiTemplateVersion[]> {
  return getJson<ApiTemplateVersion[]>(
    `/inspection-templates/${templateId}/versions`,
    token,
    'Erro ao buscar versões do modelo.',
  );
}

/*
|--------------------------------------------------------------------------
| AUDITORIA
|--------------------------------------------------------------------------
*/

export function getAuditLogs(
  token: string,
  page = 0,
  size = 100,
): Promise<ApiPage<ApiAuditLog>> {
  return getJson<ApiPage<ApiAuditLog>>(
    `/audit-logs?page=${page}&size=${size}`,
    token,
    'Erro ao buscar a auditoria.',
  );
}
