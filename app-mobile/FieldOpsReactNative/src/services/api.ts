
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

export type TemplateSection = {
  id: number;
  templateVersionId: number;
  title: string;
  description?: string | null;
  displayOrder: number;
  createdAt?: string;
};

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
  createdAt?: string;
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
  answerId: number;
  originalFilename: string;
  contentType: string;
  uploadedAt: string;
};

export type InspectionAnswerRequest = {
  templateItemId: number;
  value: string;
  observation?: string | null;
};

/**
 * Executa requisições autenticadas na API.
 */
async function authenticatedFetch(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Não foi possível conectar ao servidor. Verifique se o backend está ativo.',
    );
  }

  if (response.status === 401) {
    throw new Error('SESSION_INVALID');
  }

  if (response.status === 403) {
    throw new Error('Você não tem permissão para realizar esta operação.');
  }

  return response;
}

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
 */
export async function getInspections(
  token: string,
): Promise<BackendInspection[]> {
  const response = await authenticatedFetch('/inspections', token);

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

/**
 * Busca as seções da versão exata vinculada à inspeção.
 */
export async function getTemplateSections(
  token: string,
  templateVersionId: number,
): Promise<TemplateSection[]> {
  const response = await authenticatedFetch(
    `/template-sections/version/${templateVersionId}`,
    token,
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar seções do modelo. HTTP: ${response.status}`,
    );
  }

  const sections: TemplateSection[] = await response.json();

  return sections.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Busca as perguntas de uma seção.
 */
export async function getTemplateItems(
  token: string,
  sectionId: number,
): Promise<TemplateItem[]> {
  const response = await authenticatedFetch(
    `/template-sections/${sectionId}/items`,
    token,
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar perguntas da seção. HTTP: ${response.status}`,
    );
  }

  const items: TemplateItem[] = await response.json();

  return items.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Busca todas as perguntas de todas as seções de uma versão.
 */
export async function getInspectionChecklist(
  token: string,
  templateVersionId: number,
): Promise<{ section: TemplateSection; items: TemplateItem[] }[]> {
  const sections = await getTemplateSections(token, templateVersionId);

  return Promise.all(
    sections.map(async (section) => ({
      section,
      items: await getTemplateItems(token, section.id),
    })),
  );
}

/**
 * Busca as respostas já salvas na inspeção.
 */
export async function getInspectionAnswers(
  token: string,
  inspectionId: number,
): Promise<InspectionAnswer[]> {
  const response = await authenticatedFetch(
    `/inspections/${inspectionId}/answers`,
    token,
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar respostas. HTTP: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Cria uma resposta para uma pergunta.
 */
export async function createInspectionAnswer(
  token: string,
  inspectionId: number,
  data: InspectionAnswerRequest,
): Promise<InspectionAnswer> {
  const response = await authenticatedFetch(
    `/inspections/${inspectionId}/answers`,
    token,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao salvar resposta. HTTP: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Atualiza uma resposta existente.
 */
export async function updateInspectionAnswer(
  token: string,
  inspectionId: number,
  answerId: number,
  data: InspectionAnswerRequest,
): Promise<InspectionAnswer> {
  const response = await authenticatedFetch(
    `/inspections/${inspectionId}/answers/${answerId}`,
    token,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao atualizar resposta. HTTP: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Envia uma fotografia vinculada a uma resposta.
 */
export async function uploadInspectionEvidence(
  token: string,
  answerId: number,
  file: {
    uri: string;
    name: string;
    type: string;
  },
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

  const response = await authenticatedFetch(
    `/inspection-evidences/answers/${answerId}`,
    token,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao enviar fotografia. HTTP: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Busca as evidências vinculadas a uma resposta.
 */
export async function getAnswerEvidences(
  token: string,
  answerId: number,
): Promise<InspectionEvidence[]> {
  const response = await authenticatedFetch(
    `/inspection-evidences/answers/${answerId}`,
    token,
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar evidências. HTTP: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Retorna a URL do arquivo de evidência.
 * Use o token Bearer ao buscar o arquivo.
 */
export function getEvidenceFileUrl(evidenceId: number): string {
  return `${API_URL}/inspection-evidences/${evidenceId}/file`;
}

/**
 * Atualiza o status da inspeção.
 */
export async function updateInspectionStatus(
  token: string,
  inspectionId: number,
  status:
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED',
): Promise<void> {
  const response = await authenticatedFetch(
    `/inspections/${inspectionId}/status?status=${status}`,
    token,
    {
      method: 'PATCH',
    },
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Erro ao atualizar status. HTTP: ${response.status}`,
    );
  }
}
