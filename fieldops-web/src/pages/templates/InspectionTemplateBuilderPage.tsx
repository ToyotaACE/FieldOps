  import { useCallback, useEffect, useMemo, useState } from 'react';

import {

  ClipboardList, Search, RefreshCw, Pencil, Trash2, Plus, LoaderCircle,

  AlertCircle, FileText, X, Save, CheckCircle2, ChevronDown, ChevronRight,

  Layers, ListChecks, Camera, ShieldAlert, Send, ArrowLeft,

} from 'lucide-react';



type Id = number | string;

type InspectionTemplate = {

  id: Id; title: string; category: string; description: string | null;

  active: boolean; createdAt: string | null; updatedAt: string | null;

};

type TemplateVersion = {

  id: Id; templateId: Id; versionNumber: number; published: boolean;

  publishedAt: string | null; createdAt: string | null;

};

type Section = {

  id: Id; title: string; description?: string | null; displayOrder?: number;

};

type ResponseType = 'TEXT_SHORT' | 'TEXT_LONG' | 'NUMBER' | 'BOOLEAN' | 'CONFORMITY' | 'SINGLE_CHOICE' | 'DATE';

type TemplateItem = {

  id: Id; label: string; description?: string | null; responseType: ResponseType;

  required: boolean; requiresEvidence: boolean; requiresObservationOnNonconformity: boolean;

  critical: boolean; displayOrder?: number;

};

type TemplateStatus = 'Todos' | 'Ativos' | 'Inativos';

type TemplateForm = { title: string; category: string; description: string };

type SectionForm = { title: string; description: string };

type ItemForm = {

  label: string; description: string; responseType: ResponseType; required: boolean;

  requiresEvidence: boolean; requiresObservationOnNonconformity: boolean; critical: boolean;

};



const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const EMPTY_FORM: TemplateForm = { title: '', category: '', description: '' };

const EMPTY_SECTION: SectionForm = { title: '', description: '' };

const EMPTY_ITEM: ItemForm = {

  label: '', description: '', responseType: 'CONFORMITY', required: true,

  requiresEvidence: false, requiresObservationOnNonconformity: false, critical: false,

};

const RESPONSE_TYPES: { value: ResponseType; label: string }[] = [

  { value: 'TEXT_SHORT', label: 'Texto curto (alfanumérico)' },

  { value: 'TEXT_LONG', label: 'Texto longo' },

  { value: 'NUMBER', label: 'Número' },

  { value: 'BOOLEAN', label: 'Sim / Não' },

  { value: 'CONFORMITY', label: 'Conforme / Não conforme' },

  { value: 'SINGLE_CHOICE', label: 'Escolha única' },

  { value: 'DATE', label: 'Data' },

];



function getToken(): string | null {

  return localStorage.getItem('fieldops_token') || sessionStorage.getItem('fieldops_token');

}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {

  const token = getToken();

  if (!token) throw new Error('Token de autenticação não encontrado. Entre novamente no sistema.');

  const response = await fetch(`${API_URL}${path}`, {

    ...options,

    headers: {

      Accept: 'application/json',

      ...(options.body ? { 'Content-Type': 'application/json' } : {}),

      Authorization: `Bearer ${token}`,

      ...options.headers,

    },

  });

  if (!response.ok) {

    let message = `Erro na API (${response.status}).`;

    try {

      const body = await response.json();

      message = body.message || body.detail || body.error || message;

    } catch {

      // A resposta pode não conter JSON.

    }

    throw new Error(message);

  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();

  return (text ? JSON.parse(text) : undefined) as T;

}

function getErrorMessage(error: unknown): string {

  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';

}

function formatDate(value: string | null): string {

  if (!value) return 'Sem data';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'Sem data' : date.toLocaleDateString('pt-BR');

}

const asArray = <T,>(value: unknown): T[] => {

  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === 'object') {

    const object = value as Record<string, unknown>;

    for (const key of ['content', 'items', 'sections', 'data', 'results']) {

      if (Array.isArray(object[key])) return object[key] as T[];

    }

  }

  return [];

};

function normalizeSection(raw: any, index: number): Section {

  return {

    id: raw.id,

    title: raw.title ?? raw.name ?? raw.label ?? `Seção ${index + 1}`,

    description: raw.description ?? '',

    displayOrder: raw.displayOrder ?? raw.order ?? raw.position ?? index,

  };

}

function normalizeItem(raw: any, index: number): TemplateItem {

  const knownTypes = RESPONSE_TYPES.map((type) => type.value);

  const type = String(raw.responseType ?? raw.type ?? 'CONFORMITY') as ResponseType;

  return {

    id: raw.id,

    label: raw.label ?? raw.title ?? raw.question ?? `Questão ${index + 1}`,

    description: raw.description ?? '',

    responseType: knownTypes.includes(type) ? type : 'CONFORMITY',

    required: Boolean(raw.required),

    requiresEvidence: Boolean(raw.requiresEvidence ?? raw.evidenceRequired),

    requiresObservationOnNonconformity: Boolean(raw.requiresObservationOnNonconformity ?? raw.requiresObservation),

    critical: Boolean(raw.criticalOnNonconformity ?? raw.critical ?? raw.criticality),

    displayOrder: raw.displayOrder ?? raw.order ?? raw.position ?? index,

  };

}



export function InspectionTemplateBuilderPage() {

  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);

  const [versions, setVersions] = useState<Record<string, TemplateVersion[]>>({});

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');

  const [status, setStatus] = useState<TemplateStatus>('Todos');

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TemplateForm, string>>>({});



  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null);

  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);

  const [sections, setSections] = useState<Section[]>([]);

  const [sectionItems, setSectionItems] = useState<Record<string, TemplateItem[]>>({});

  const [builderLoading, setBuilderLoading] = useState(false);

  const [sectionModal, setSectionModal] = useState(false);

  const [sectionForm, setSectionForm] = useState<SectionForm>(EMPTY_SECTION);

  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const [itemModal, setItemModal] = useState(false);

  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM);

  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null);

  const [itemSection, setItemSection] = useState<Section | null>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});



  const loadTemplates = useCallback(async () => {

    setLoading(true);

    setError('');

    try {

      const data = await apiRequest<unknown>('/api/v1/inspection-templates');

      const list = asArray<InspectionTemplate>(data);

      setTemplates(list);

      const results = await Promise.allSettled(list.map(async (template) => ({

        id: String(template.id),

        versions: asArray<TemplateVersion>(await apiRequest<unknown>(`/api/v1/inspection-templates/${template.id}/versions`)),

      })));

      const map: Record<string, TemplateVersion[]> = {};

      results.forEach((result) => { if (result.status === 'fulfilled') map[result.value.id] = result.value.versions; });

      setVersions(map);

    } catch (err) {

      setError(getErrorMessage(err));

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => { void loadTemplates(); }, [loadTemplates]);



  const filteredTemplates = useMemo(() => {

    const term = search.trim().toLowerCase();

    return templates.filter((template) => {

      const matchesSearch = !term || template.title.toLowerCase().includes(term) ||

        template.category.toLowerCase().includes(term) || (template.description || '').toLowerCase().includes(term) || String(template.id).includes(term);

      const matchesStatus = status === 'Todos' || (status === 'Ativos' && template.active) || (status === 'Inativos' && !template.active);

      return matchesSearch && matchesStatus;

    });

  }, [templates, search, status]);



  function openCreateModal() {

    setForm(EMPTY_FORM); setFormErrors({}); setError(''); setSuccess(''); setModalOpen(true);

  }

  function closeCreateModal() { if (!saving) { setModalOpen(false); setForm(EMPTY_FORM); setFormErrors({}); } }

  async function handleCreateTemplate(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault(); setError(''); setSuccess('');

    const errors: Partial<Record<keyof TemplateForm, string>> = {};

    if (!form.title.trim()) errors.title = 'Informe o nome do modelo.';

    else if (form.title.trim().length > 150) errors.title = 'O nome deve ter no máximo 150 caracteres.';

    if (!form.category.trim()) errors.category = 'Informe a categoria.';

    else if (form.category.trim().length > 100) errors.category = 'A categoria deve ter no máximo 100 caracteres.';

    if (form.description.trim().length > 500) errors.description = 'A descrição deve ter no máximo 500 caracteres.';

    setFormErrors(errors); if (Object.keys(errors).length) return;

    setSaving(true);

    try {

      await apiRequest('/api/v1/inspection-templates', { method: 'POST', body: JSON.stringify({ title: form.title.trim(), category: form.category.trim(), description: form.description.trim() || null }) });

      setModalOpen(false); setForm(EMPTY_FORM); setSuccess('Modelo criado com sucesso! Configure as seções e questões antes de publicar.'); await loadTemplates();

    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }

  }

  async function handleToggleActive(template: InspectionTemplate) {

    const action = template.active ? 'desativar' : 'ativar';

    if (!window.confirm(`Deseja realmente ${action} o modelo "${template.title}"?`)) return;

    setError(''); setSuccess('');

    try {

      await apiRequest(`/api/v1/inspection-templates/${template.id}/${template.active ? 'deactivate' : 'activate'}`, { method: 'PATCH' });

      setSuccess(`Modelo "${template.title}" ${template.active ? 'desativado' : 'ativado'} com sucesso.`); await loadTemplates();

    } catch (err) { setError(getErrorMessage(err)); }

  }



  async function openBuilder(template: InspectionTemplate) {

    setError(''); setSuccess(''); setEditingTemplate(template); setSelectedVersion(null); setSections([]); setSectionItems({}); setBuilderLoading(true);

    try {

      const foundVersions = asArray<TemplateVersion>(await apiRequest<unknown>(`/api/v1/inspection-templates/${template.id}/versions`));

      setVersions((old) => ({ ...old, [String(template.id)]: foundVersions }));

      const latest = [...foundVersions].sort((a, b) => b.versionNumber - a.versionNumber)[0];

      if (!latest) throw new Error('Este modelo ainda não possui uma versão. Atualize a página e tente novamente.');

      setSelectedVersion(latest);

      await loadSections(latest.id);

    } catch (err) { setError(getErrorMessage(err)); }

    finally { setBuilderLoading(false); }

  }

  async function loadSections(versionId: Id) {
    const data = await apiRequest<unknown>(`/api/v1/template-sections/version/${versionId}`);
    const list = asArray<any>(data)
      .map(normalizeSection)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    const results = await Promise.all(list.map(async (section) => ({
      id: String(section.id),
      items: asArray<any>(
        await apiRequest<unknown>(`/api/v1/template-sections/${section.id}/items`)
      )
        .map(normalizeItem)
        .sort(
          (a, b) =>
            (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        ),
    })));

    const map: Record<string, TemplateItem[]> = {};
    results.forEach((result) => {
      map[result.id] = result.items;
    });

    setSections(list);
    setSectionItems(map);
    setExpandedSections((old) => {
      const next = { ...old };
      list.forEach((section) => {
        if (next[String(section.id)] === undefined) next[String(section.id)] = true;
      });
      return next;
    });
  }

  async function refreshBuilder() {
    if (!editingTemplate || !selectedVersion || builderLoading) return;

    setBuilderLoading(true);
    setError('');
    setSuccess('');

    try {
      const freshVersions = asArray<TemplateVersion>(
        await apiRequest<unknown>(`/api/v1/inspection-templates/${editingTemplate.id}/versions`)
      );
      setVersions((old) => ({ ...old, [String(editingTemplate.id)]: freshVersions }));

      const currentVersion =
        freshVersions.find((version) => String(version.id) === String(selectedVersion.id)) ??
        [...freshVersions].sort((a, b) => b.versionNumber - a.versionNumber)[0];

      if (!currentVersion) {
        setSelectedVersion(null);
        setSections([]);
        setSectionItems({});
        throw new Error('Este modelo não possui versões disponíveis.');
      }

      setSelectedVersion(currentVersion);
      await loadSections(currentVersion.id);
      setSuccess('Checklist atualizado com os dados mais recentes do servidor.');
    } catch (err) {
      setError(`Não foi possível atualizar o checklist: ${getErrorMessage(err)}`);
    } finally {
      setBuilderLoading(false);
    }
  }

  async function deleteSection(section: Section) {
    if (!selectedVersion) return;

    if (isPublished) {
      setError('Esta versão está publicada. Crie uma nova versão para fazer alterações.');
      return;
    }

    const items = sectionItems[String(section.id)] || [];
    if (items.length > 0) {
      setError(`Não é possível excluir a seção "${section.title}" porque ela possui ${items.length} questão(ões). Exclua as questões primeiro.`);
      return;
    }

    if (!window.confirm(`Excluir a seção "${section.title}"? Esta ação não pode ser desfeita.`)) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiRequest<void>(`/api/v1/template-sections/${section.id}`, { method: 'DELETE' });
      await loadSections(selectedVersion.id);
      setSuccess(`Seção "${section.title}" excluída com sucesso.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const isPublished = Boolean(selectedVersion?.published);

  async function createDraftVersion() {

    if (!editingTemplate || !selectedVersion) return;

    if (!window.confirm('Criar uma nova versão em rascunho para editar o checklist? A versão publicada atual será preservada.')) return;

    setSaving(true); setError(''); setSuccess('');

    try {

      const created = await apiRequest<TemplateVersion>(`/api/v1/inspection-template-versions/template/${editingTemplate.id}`, { method: 'POST', body: JSON.stringify({}) });

      const version = created as TemplateVersion;

      if (!version?.id) throw new Error('A API não retornou a versão criada. Verifique o endpoint e o formato da resposta.');

      setSelectedVersion(version); await loadSections(version.id); await loadTemplates(); setSuccess(`Versão ${version.versionNumber ?? ''} criada em rascunho.`);

    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }

  }

  function openSectionModal(section?: Section) {

    setEditingSection(section ?? null); setSectionForm(section ? { title: section.title, description: section.description || '' } : EMPTY_SECTION); setSectionModal(true);

  }

  async function saveSection(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault(); if (!selectedVersion) return;

    if (isPublished) { setError('Esta versão está publicada. Crie uma nova versão para fazer alterações.'); return; }

    if (!sectionForm.title.trim()) { setError('Informe o nome da seção.'); return; }

    setSaving(true); setError(''); setSuccess('');

    try {

      if (editingSection) {

        throw new Error('A API atual não disponibiliza edição de seção. Para alterar o nome, confirme se existe um endpoint PUT de seções no backend.');

      }

      await apiRequest(`/api/v1/template-sections/version/${selectedVersion.id}`, {

        method: 'POST', body: JSON.stringify({ title: sectionForm.title.trim(), description: sectionForm.description.trim() || null, displayOrder: sections.length + 1 }),

      });

      setSectionModal(false); setSectionForm(EMPTY_SECTION); await loadSections(selectedVersion.id); setSuccess('Seção criada com sucesso.');

    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }

  }

  function openItemModal(section: Section, item?: TemplateItem) {

    setItemSection(section); setEditingItem(item ?? null);

    setItemForm(item ? {

      label: item.label, description: item.description || '', responseType: item.responseType, required: item.required,

      requiresEvidence: item.requiresEvidence, requiresObservationOnNonconformity: item.requiresObservationOnNonconformity, critical: item.critical,

    } : EMPTY_ITEM);

    setItemModal(true);

  }

  
async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!itemSection || !selectedVersion) return;

    if (isPublished) {
      setError(
        'Esta versão está publicada. Crie uma nova versão para fazer alterações.'
      );
      return;
    }

    if (!itemForm.label.trim()) {
      setError('Informe o enunciado da questão.');
      return;
    }

    const currentItems = [...(sectionItems[String(itemSection.id)] || [])]
      .sort(
        (a, b) =>
          (Number(a.displayOrder) || 0) -
          (Number(b.displayOrder) || 0)
      );

    // Ao editar, mantém a posição da questão.
    // Ao criar, utiliza uma posição após a última questão.
    const editingIndex = editingItem
      ? currentItems.findIndex(
          (item) => String(item.id) === String(editingItem.id)
        )
      : -1;

    const displayOrder = editingItem
      ? editingIndex >= 0
        ? editingIndex + 1
        : currentItems.length + 1
      : currentItems.length + 1;

    const payload = {
      label: itemForm.label.trim(),
      description: itemForm.description.trim() || null,
      responseType: itemForm.responseType,
      required: itemForm.required,
      requiresEvidence: itemForm.requiresEvidence,
      requiresObservationOnNonconformity:
        itemForm.requiresObservationOnNonconformity,
      criticalOnNonconformity: itemForm.critical,
      displayOrder,
    };

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingItem) {
        await apiRequest(
          `/api/v1/template-items/${editingItem.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
      } else {
        await apiRequest(
          `/api/v1/template-sections/${itemSection.id}/items`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );
      }

      setItemModal(false);
      setItemForm(EMPTY_ITEM);

      await loadSections(selectedVersion.id);

      setSuccess(
        editingItem
          ? 'Questão atualizada com sucesso.'
          : 'Questão adicionada à seção.'
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }


  async function deleteItem(item: TemplateItem) {

    if (isPublished) { setError('Esta versão está publicada. Crie uma nova versão para fazer alterações.'); return; }

    if (!window.confirm(`Excluir a questão "${item.label}"? Esta ação não pode ser desfeita.`)) return;

    setError(''); setSuccess('');

    try { await apiRequest(`/api/v1/template-items/${item.id}`, { method: 'DELETE' }); await loadSections(selectedVersion!.id); setSuccess('Questão excluída.'); }

    catch (err) { setError(getErrorMessage(err)); }

  }

  
async function publishVersion() {
    if (!selectedVersion || !editingTemplate) return;

    if (isPublished) {
      setError('Esta versão já está publicada.');
      return;
    }

    if (
      !window.confirm(
        'Publicar esta versão? As questões serão ordenadas automaticamente antes da publicação. Depois de publicada, a versão não poderá ser editada.'
      )
    ) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Recarrega os dados atuais antes de corrigir a ordem.
      const sectionData = await apiRequest<unknown>(
        `/api/v1/template-sections/version/${selectedVersion.id}`
      );

      const currentSections = asArray<any>(sectionData)
        .map(normalizeSection)
        .sort(
          (a, b) =>
            (Number(a.displayOrder) || 0) -
            (Number(b.displayOrder) || 0)
        );

      if (currentSections.length === 0) {
        throw new Error(
          'A versão precisa possuir pelo menos uma seção.'
        );
      }

      // Corrige a ordem das seções, se necessário.
      for (let index = 0; index < currentSections.length; index++) {
        const section = currentSections[index];
        const correctOrder = index + 1;

        if (Number(section.displayOrder) !== correctOrder) {
          await apiRequest(
            `/api/v1/template-sections/${section.id}`,
            {
              method: 'PUT',
              body: JSON.stringify({
                title: section.title,
                description: section.description || null,
                displayOrder: correctOrder,
              }),
            }
          );
        }
      }

      // Corrige a ordem das questões separadamente em cada seção.
      for (const section of currentSections) {
        const itemData = await apiRequest<unknown>(
          `/api/v1/template-sections/${section.id}/items`
        );

        const items = asArray<any>(itemData)
          .map(normalizeItem)
          .sort((a, b) => {
            const orderDifference =
              (Number(a.displayOrder) || 0) -
              (Number(b.displayOrder) || 0);

            if (orderDifference !== 0) return orderDifference;

            // Desempate estável quando há ordens duplicadas.
            return String(a.id).localeCompare(String(b.id));
          });

        if (items.length === 0) {
          throw new Error(
            `A seção "${section.title}" precisa possuir pelo menos uma questão.`
          );
        }

        for (let index = 0; index < items.length; index++) {
          const item = items[index];
          const correctOrder = index + 1;

          if (Number(item.displayOrder) !== correctOrder) {
            await apiRequest(
              `/api/v1/template-items/${item.id}`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  label: item.label,
                  description: item.description || null,
                  responseType: item.responseType,
                  required: item.required,
                  requiresEvidence: item.requiresEvidence,
                  requiresObservationOnNonconformity:
                    item.requiresObservationOnNonconformity,
                  criticalOnNonconformity: item.critical,
                  displayOrder: correctOrder,
                }),
              }
            );
          }
        }
      }

      // Atualiza a tela com a ordem persistida.
      await loadSections(selectedVersion.id);

      // Publica somente após salvar todas as correções.
      await apiRequest(
        `/api/v1/inspection-template-versions/${selectedVersion.id}/publish`,
        { method: 'POST' }
      );

      setSuccess('Versão publicada com sucesso.');

      await openBuilder(editingTemplate);
      await loadTemplates();
    } catch (err) {
      setError(
        `Não foi possível publicar a versão: ${getErrorMessage(err)}`
      );

      // Busca os dados novamente para refletir eventuais correções
      // que tenham sido salvas antes de uma falha.
      try {
        await loadSections(selectedVersion.id);
      } catch {
        // Preserva a mensagem do erro original.
      }
    } finally {
      setSaving(false);
    }
  }




  const activeCount = templates.filter((template) => template.active).length;

  const inactiveCount = templates.length - activeCount;

  return (

    <section className="templates-page">

      {editingTemplate ? (

        <>

          <header className="page-head builder-head">

            <div><button className="templates-back" type="button" onClick={() => { setEditingTemplate(null); setSelectedVersion(null); setError(''); setSuccess(''); }}><ArrowLeft size={16} /> Voltar aos modelos</button>

              <div className="eyebrow">CONSTRUTOR DE CHECKLIST</div><h1>{editingTemplate.title}</h1>

              <p>{editingTemplate.category}{editingTemplate.description ? ` · ${editingTemplate.description}` : ''}</p>

            </div>

            <div className="builder-header-actions">

              {selectedVersion && <span className={`templates-badge ${isPublished ? 'published' : 'draft'}`}>v{selectedVersion.versionNumber} · {isPublished ? 'Publicado' : 'Rascunho'}</span>}

              {isPublished ? <button className="templates-primary-button" type="button" onClick={() => void createDraftVersion()} disabled={saving}><Plus size={17} /> Nova versão</button> : <button className="templates-primary-button" type="button" onClick={() => void publishVersion()} disabled={saving || builderLoading}><Send size={17} /> Publicar versão</button>}

            </div>

          </header>

          {isPublished && <div className="templates-info"><ShieldAlert size={18} /><span>Versão publicada e protegida. Para alterar o checklist, crie uma nova versão; a versão histórica será mantida.</span></div>}

          {builderLoading ? <div className="templates-state"><LoaderCircle size={26} className="templates-spinning" /><strong>Carregando estrutura do checklist...</strong></div> : <>

            <div className="builder-toolbar"><div><strong>{sections.length} seções</strong><span> · {Object.values(sectionItems).reduce((total, list) => total + list.length, 0)} questões</span></div>

              <button className="templates-secondary-button" type="button" onClick={() => void refreshBuilder()} disabled={builderLoading || saving}><RefreshCw size={15} className={builderLoading ? "templates-spinning" : ""} /> {builderLoading ? "Atualizando..." : "Atualizar"}</button>

              <button className="templates-primary-button" type="button" onClick={() => openSectionModal()} disabled={isPublished}><Plus size={17} /> Adicionar seção</button>

            </div>

            {sections.length === 0 ? <div className="templates-state builder-empty"><Layers size={30} /><strong>Este checklist ainda não tem seções</strong><span>Crie uma seção para agrupar as questões da inspeção.</span>{!isPublished && <button className="templates-primary-button" type="button" onClick={() => openSectionModal()}><Plus size={16} /> Criar primeira seção</button>}</div> :

              <div className="builder-sections">{sections.map((section, index) => {

                const items = sectionItems[String(section.id)] || []; const expanded = expandedSections[String(section.id)] ?? true;

                return <article className="builder-section" key={section.id}>

                  <header className="builder-section-head"><button className="builder-collapse" type="button" onClick={() => setExpandedSections((old) => ({ ...old, [String(section.id)]: !expanded }))}>{expanded ? <ChevronDown size={19} /> : <ChevronRight size={19} />}</button>

                    <div className="builder-section-number">{index + 1}</div><div className="builder-section-title"><strong>{section.title}</strong><span>{section.description || `${items.length} questão(ões)`}</span></div>

                    <span className="builder-count">{items.length} {items.length === 1 ? 'questão' : 'questões'}</span>

                    {!isPublished && <>
                      <button className="templates-icon-button" title="Adicionar questão" type="button" onClick={() => openItemModal(section)}><Plus size={17} /></button>
                      <button className="templates-icon-button section-delete-button" title="Excluir seção" aria-label={`Excluir seção ${section.title}`} type="button" onClick={() => void deleteSection(section)} disabled={saving}><Trash2 size={16} /></button>
                    </>}

                  </header>

                  {expanded && <div className="builder-items">{items.length === 0 ? <div className="builder-no-items">Nenhuma questão nesta seção.{!isPublished && <button type="button" onClick={() => openItemModal(section)}>Adicionar questão</button>}</div> : items.map((item, itemIndex) => <div className="builder-item" key={item.id}>

                    <div className="builder-item-index">
                      {item.displayOrder ?? itemIndex + 1}
                    </div><div className="builder-item-main"><strong>{item.label}</strong>{item.description && <span>{item.description}</span>}<div className="builder-item-tags"><span className="item-type-tag">{RESPONSE_TYPES.find((type) => type.value === item.responseType)?.label || item.responseType}</span>{item.required && <span className="item-tag">Obrigatória</span>}{item.requiresEvidence && <span className="item-tag evidence"><Camera size={12} /> Foto/evidência</span>}{item.requiresObservationOnNonconformity && <span className="item-tag">Observação na não conformidade</span>}{item.critical && <span className="item-tag critical"><ShieldAlert size={12} /> Crítica</span>}</div></div>

                    {!isPublished && <div className="builder-item-actions"><button type="button" title="Editar questão" onClick={() => openItemModal(section, item)}><Pencil size={15} /></button><button type="button" title="Excluir questão" onClick={() => void deleteItem(item)}><Trash2 size={15} /></button></div>}

                  </div>)}</div>}

                </article>;

              })}</div>}

          </>}

        </>

      ) : <>

        <header className="page-head"><div><div className="eyebrow">GESTÃO OPERACIONAL</div><h1>Modelos de inspeção</h1><p>Gerencie checklists versionados do FieldOps.</p></div><button type="button" className="templates-primary-button" onClick={openCreateModal}><Plus size={18} /> Novo modelo</button></header>

        <div className="templates-toolbar"><div className="templates-search"><Search size={18} /><input type="search" placeholder="Buscar modelos..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar modelos de inspeção" /></div>

          <select className="templates-status-filter" value={status} onChange={(event) => setStatus(event.target.value as TemplateStatus)} aria-label="Filtrar modelos por status"><option value="Todos">Todos</option><option value="Ativos">Ativos</option><option value="Inativos">Inativos</option></select>

          <button type="button" className="templates-refresh-button" onClick={() => void loadTemplates()} disabled={loading} title="Atualizar modelos"><RefreshCw size={17} className={loading ? 'templates-spinning' : ''} /></button></div>

        <div className="templates-summary"><div><strong>{loading ? 'Carregando...' : `${filteredTemplates.length} modelos`}</strong><span>{activeCount} ativos · {inactiveCount} inativos</span></div></div>

        <div className="templates-list">

          {loading ? <div className="templates-state"><LoaderCircle size={26} className="templates-spinning" /><strong>Carregando modelos de inspeção...</strong><span>Consultando os dados do servidor.</span></div> : filteredTemplates.length === 0 ? <div className="templates-state"><ClipboardList size={30} /><strong>Nenhum modelo encontrado</strong><span>{search ? 'Tente alterar o termo da busca.' : 'Não existem modelos para os filtros selecionados.'}</span></div> : filteredTemplates.map((template) => {

            const templateVersions = versions[String(template.id)] || [];

            const latestVersion = [...templateVersions].sort((a, b) => b.versionNumber - a.versionNumber)[0];

            return <article className="templates-row" key={template.id}><div className="templates-icon"><ClipboardList size={21} /></div><div className="templates-information"><strong>{template.title}</strong><span>{template.category}{latestVersion ? ` · v${latestVersion.versionNumber}` : ' · Sem versão'}</span>{template.description && <small>{template.description}</small>}</div>

              <div className="templates-metadata"><span className={`templates-badge ${latestVersion?.published ? 'published' : 'draft'}`}>{latestVersion ? (latestVersion.published ? 'Publicado' : 'Rascunho') : 'Sem versão'}</span><span className="templates-date">{template.updatedAt ? `Atualizado em ${formatDate(template.updatedAt)}` : `Criado em ${formatDate(template.createdAt)}`}</span>{!template.active && <span className="templates-badge inactive">Inativo</span>}</div>

              <div className="templates-actions"><button type="button" onClick={() => void openBuilder(template)} title="Editar checklist" aria-label={`Editar checklist de ${template.title}`}><Pencil size={17} /></button><button type="button" onClick={() => void handleToggleActive(template)} title={template.active ? 'Desativar modelo' : 'Ativar modelo'} aria-label={template.active ? `Desativar ${template.title}` : `Ativar ${template.title}`}>{template.active ? <Trash2 size={17} /> : <FileText size={17} />}</button></div></article>;

          })}

        </div>

      </>}



      {success && <div className="templates-success" role="status"><CheckCircle2 size={18} /><span>{success}</span><button type="button" onClick={() => setSuccess('')} aria-label="Fechar mensagem"><X size={16} /></button></div>}

      {error && <div className="templates-alert" role="alert"><AlertCircle size={18} /><span>{error}</span><button type="button" onClick={() => setError('')}>Fechar</button></div>}



      {modalOpen && <div className="templates-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreateModal(); }}><section className="templates-modal" role="dialog" aria-modal="true" aria-labelledby="create-template-title"><header className="templates-modal-header"><div className="templates-modal-heading-icon"><ClipboardList size={22} /></div><div><h2 id="create-template-title">Novo modelo de inspeção</h2><p>Cadastre os dados básicos para iniciar seu checklist.</p></div><button type="button" className="templates-modal-close" onClick={closeCreateModal} disabled={saving} aria-label="Fechar formulário"><X size={20} /></button></header>

        <form onSubmit={handleCreateTemplate} noValidate><div className="templates-modal-body"><div className="templates-field"><label htmlFor="template-title">Nome do modelo <span>\*</span></label><input id="template-title" autoFocus maxLength={150} placeholder="Ex.: Inspeção de empilhadeira" value={form.title} onChange={(event) => { setForm({ ...form, title: event.target.value }); setFormErrors({ ...formErrors, title: undefined }); }} aria-invalid={Boolean(formErrors.title)} />{formErrors.title && <span className="templates-field-error">{formErrors.title}</span>}</div>

          <div className="templates-field"><label htmlFor="template-category">Categoria <span>\*</span></label><input id="template-category" maxLength={100} placeholder="Ex.: Equipamentos, Segurança, Elétrica" value={form.category} onChange={(event) => { setForm({ ...form, category: event.target.value }); setFormErrors({ ...formErrors, category: undefined }); }} aria-invalid={Boolean(formErrors.category)} />{formErrors.category && <span className="templates-field-error">{formErrors.category}</span>}</div>

          <div className="templates-field"><label htmlFor="template-description">Descrição</label><textarea id="template-description" rows={4} maxLength={500} placeholder="Descreva o objetivo e o escopo deste modelo..." value={form.description} onChange={(event) => { setForm({ ...form, description: event.target.value }); setFormErrors({ ...formErrors, description: undefined }); }} />{formErrors.description && <span className="templates-field-error">{formErrors.description}</span>}<div className="templates-field-footer"><span>Campo opcional.</span><small>{form.description.length}/500</small></div></div>

          <div className="templates-draft-note"><FileText size={18} /><div><strong>Primeira versão em rascunho</strong><span>Depois do cadastro, configure as seções e os itens antes de publicar o modelo.</span></div></div></div>

          <footer className="templates-modal-footer"><button type="button" className="templates-secondary-button" onClick={closeCreateModal} disabled={saving}>Cancelar</button><button type="submit" className="templates-primary-button" disabled={saving}>{saving ? <><LoaderCircle size={17} className="templates-spinning" /> Salvando...</> : <><Save size={17} /> Criar modelo</>}</button></footer></form></section></div>}



      {sectionModal && <div className="templates-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSectionModal(false); }}><section className="templates-modal" role="dialog" aria-modal="true"><header className="templates-modal-header"><div className="templates-modal-heading-icon"><Layers size={22} /></div><div><h2>{editingSection ? 'Editar seção' : 'Nova seção'}</h2><p>Agrupe questões relacionadas da inspeção.</p></div><button className="templates-modal-close" type="button" onClick={() => setSectionModal(false)}><X size={20} /></button></header><form onSubmit={saveSection}><div className="templates-modal-body"><div className="templates-field"><label htmlFor="section-title">Nome da seção <span>\*</span></label><input id="section-title" maxLength={150} value={sectionForm.title} onChange={(event) => setSectionForm({ ...sectionForm, title: event.target.value })} placeholder="Ex.: Inspeção visual" required /></div><div className="templates-field"><label htmlFor="section-description">Descrição/instruções</label><textarea id="section-description" rows={3} maxLength={500} value={sectionForm.description} onChange={(event) => setSectionForm({ ...sectionForm, description: event.target.value })} placeholder="Orientações para o técnico (opcional)" /></div></div><footer className="templates-modal-footer"><button className="templates-secondary-button" type="button" onClick={() => setSectionModal(false)}>Cancelar</button><button className="templates-primary-button" type="submit" disabled={saving}><Save size={16} /> Salvar seção</button></footer></form></section></div>}



      {itemModal && itemSection && <div className="templates-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setItemModal(false); }}><section className="templates-modal item-modal" role="dialog" aria-modal="true"><header className="templates-modal-header"><div className="templates-modal-heading-icon"><ListChecks size={22} /></div><div><h2>{editingItem ? 'Editar questão' : 'Nova questão'}</h2><p>Seção: {itemSection.title}</p></div><button className="templates-modal-close" type="button" onClick={() => setItemModal(false)}><X size={20} /></button></header><form onSubmit={saveItem}><div className="templates-modal-body"><div className="templates-field"><label htmlFor="item-label">Enunciado da questão <span>\*</span></label><input id="item-label" maxLength={250} value={itemForm.label} onChange={(event) => setItemForm({ ...itemForm, label: event.target.value })} placeholder="Ex.: O equipamento apresenta vazamentos?" required /></div><div className="templates-field"><label htmlFor="item-description">Descrição/instruções</label><textarea id="item-description" rows={2} maxLength={500} value={itemForm.description} onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })} placeholder="Orientação adicional para o técnico (opcional)" /></div><div className="templates-field"><label htmlFor="item-type">Tipo de resposta <span>\*</span></label><select id="item-type" value={itemForm.responseType} onChange={(event) => setItemForm({ ...itemForm, responseType: event.target.value as ResponseType })}>{RESPONSE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select><span className="templates-field-hint">A foto não é um tipo de resposta: ela é capturada no mobile como evidência da questão.</span></div>

          <div className="builder-options"><label className="builder-option"><input type="checkbox" checked={itemForm.required} onChange={(event) => setItemForm({ ...itemForm, required: event.target.checked })} /><span><strong>Resposta obrigatória</strong><small>O técnico precisa responder antes de concluir.</small></span></label><label className="builder-option"><input type="checkbox" checked={itemForm.requiresEvidence} onChange={(event) => setItemForm({ ...itemForm, requiresEvidence: event.target.checked })} /><span><strong>Exigir foto/evidência</strong><small>A evidência será capturada ou anexada no aplicativo mobile.</small></span></label><label className="builder-option"><input type="checkbox" checked={itemForm.requiresObservationOnNonconformity} onChange={(event) => setItemForm({ ...itemForm, requiresObservationOnNonconformity: event.target.checked })} /><span><strong>Exigir observação na não conformidade</strong><small>Solicitar explicação quando a resposta indicar não conformidade.</small></span></label><label className="builder-option"><input type="checkbox" checked={itemForm.critical} onChange={(event) => setItemForm({ ...itemForm, critical: event.target.checked })} /><span><strong>Questão crítica</strong><small>Identifica um item de maior criticidade operacional.</small></span></label></div></div><footer className="templates-modal-footer"><button className="templates-secondary-button" type="button" onClick={() => setItemModal(false)}>Cancelar</button><button className="templates-primary-button" type="submit" disabled={saving}><Save size={16} /> {editingItem ? 'Salvar alterações' : 'Adicionar questão'}</button></footer></form></section></div>}



      <style>{`

        .templates-page{color:var(--text,#0f172a)}.templates-page .page-head{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:22px}.templates-page .page-head h1{margin:8px 0 7px;font-size:29px;letter-spacing:-1px}.templates-page .page-head p{margin:0;color:var(--muted,#64748b);font-size:14px}.eyebrow{font-size:10px;font-weight:800;letter-spacing:1.2px;color:#2563eb}.templates-primary-button,.templates-secondary-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 15px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}.templates-primary-button{border:0;background:#2563eb;color:white;box-shadow:0 5px 12px #2563eb20}.templates-primary-button:hover{background:#1d4ed8}.templates-primary-button:disabled{opacity:.6;cursor:wait}.templates-secondary-button{border:1px solid var(--border,#dbe3ee);background:var(--panel,#fff);color:var(--text,#334155)}.templates-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:18px}.templates-search{display:flex;align-items:center;gap:10px;width:min(100%,350px);height:42px;padding:0 13px;border:1px solid var(--border,#dbe3ee);border-radius:9px;background:var(--panel,#fff);color:#64748b}.templates-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--text,#0f172a);font-size:13px}.templates-status-filter,.templates-refresh-button{height:42px;border:1px solid var(--border,#dbe3ee);border-radius:9px;background:var(--panel,#fff);color:var(--text,#334155)}.templates-status-filter{min-width:130px;padding:0 12px;font-size:13px}.templates-refresh-button{display:grid;place-items:center;width:42px;cursor:pointer}.templates-summary{padding:17px 20px;border:1px solid var(--border,#dbe3ee);border-bottom:0;border-radius:12px 12px 0 0;background:var(--panel,#fff)}.templates-summary strong,.templates-summary span{display:block}.templates-summary strong{font-size:15px}.templates-summary span{margin-top:4px;color:var(--muted,#64748b);font-size:12px}.templates-list{overflow:hidden;border:1px solid var(--border,#dbe3ee);border-radius:0 0 12px 12px;background:var(--panel,#fff)}.templates-row{display:flex;align-items:center;gap:17px;min-height:74px;margin:0 20px;padding:14px 4px;border-bottom:1px solid var(--border,#e2e8f0)}.templates-row:last-child{border-bottom:0}.templates-icon,.templates-modal-heading-icon{display:grid;place-items:center;flex:0 0 43px;width:43px;height:43px;border-radius:11px;background:#eff6ff;color:#2563eb}.templates-information{display:flex;flex:1 1 220px;min-width:120px;flex-direction:column;gap:5px}.templates-information strong{font-size:14px;line-height:1.4}.templates-information span,.templates-information small{color:var(--muted,#64748b);font-size:12px}.templates-metadata{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:10px 14px;min-width:190px}.templates-badge{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:750;white-space:nowrap}.templates-badge.published{background:#dcfce7;color:#15803d}.templates-badge.draft{background:#f1f5f9;color:#475569}.templates-badge.inactive{background:#fee2e2;color:#b91c1c}.templates-date{color:var(--muted,#64748b);font-size:12px;white-space:nowrap}.templates-actions{display:flex;align-items:center;gap:7px;margin-left:auto}.templates-actions button,.templates-icon-button,.builder-item-actions button{display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:7px;background:transparent;color:#64748b;cursor:pointer}.templates-actions button:hover,.templates-icon-button:hover,.builder-item-actions button:hover{background:#eff6ff;color:#2563eb}.templates-icon-button.section-delete-button:hover{background:#fef2f2;color:#dc2626}.templates-state{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;min-height:230px;padding:28px;color:var(--muted,#64748b);text-align:center}.templates-state strong{color:var(--text,#0f172a);font-size:14px}.templates-state span{font-size:12px}.templates-spinning{animation:templates-spin 1s linear infinite}@keyframes templates-spin{to{transform:rotate(360deg)}}.templates-success,.templates-alert,.templates-info{display:flex;align-items:center;gap:10px;margin:14px 0;padding:12px 14px;border-radius:9px;font-size:12px}.templates-success{border:1px solid #bbf7d0;background:#f0fdf4;color:#166534}.templates-alert{border:1px solid #fecaca;background:#fef2f2;color:#b91c1c}.templates-info{border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8}.templates-success span,.templates-alert span,.templates-info span{flex:1}.templates-success button,.templates-alert button{border:0;background:transparent;color:inherit;font-weight:700;cursor:pointer}.templates-modal-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:24px;background:rgb(15 23 42 / 55%);backdrop-filter:blur(3px)}.templates-modal{width:100%;max-width:570px;max-height:calc(100vh - 48px);overflow-y:auto;border:1px solid var(--border,#e2e8f0);border-radius:16px;background:var(--panel,#fff);box-shadow:0 24px 70px rgb(15 23 42 / 24%)}.item-modal{max-width:650px}.templates-modal-header{display:flex;align-items:flex-start;gap:13px;padding:22px 24px;border-bottom:1px solid var(--border,#e2e8f0)}.templates-modal-header h2{margin:2px 0 7px;font-size:19px;letter-spacing:-.4px}.templates-modal-header p{margin:0;color:var(--muted,#64748b);font-size:12px;line-height:1.5}.templates-modal-close{display:grid;flex:0 0 34px;width:34px;height:34px;margin-left:auto;place-items:center;border:0;border-radius:8px;background:transparent;color:#64748b;cursor:pointer}.templates-modal-body{display:flex;flex-direction:column;gap:19px;padding:24px}.templates-field{display:flex;flex-direction:column;gap:8px}.templates-field label{color:var(--text,#0f172a);font-size:13px;font-weight:700}.templates-field label span{color:#dc2626}.templates-field input,.templates-field textarea,.templates-field select{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid var(--border,#dbe3ee);border-radius:9px;outline:none;background:var(--panel,#fff);color:var(--text,#0f172a);font:inherit;font-size:13px}.templates-field textarea{resize:vertical;line-height:1.5}.templates-field input:focus,.templates-field textarea:focus,.templates-field select:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgb(37 99 235 / 10%)}.templates-field-error{color:#dc2626;font-size:11px}.templates-field-hint,.templates-field-footer{color:var(--muted,#64748b);font-size:11px;line-height:1.5}.templates-field-footer{display:flex;justify-content:space-between}.templates-draft-note{display:flex;align-items:flex-start;gap:11px;padding:13px;border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;color:#1d4ed8}.templates-draft-note strong,.templates-draft-note span{display:block}.templates-draft-note strong{margin-bottom:4px;font-size:12px}.templates-draft-note span{color:#475569;font-size:11px;line-height:1.5}.templates-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--border,#e2e8f0)}.templates-back{display:inline-flex;align-items:center;gap:6px;margin-bottom:13px;padding:0;border:0;background:transparent;color:#2563eb;font-size:12px;font-weight:700;cursor:pointer}.builder-head{align-items:flex-end!important}.builder-header-actions{display:flex;align-items:center;gap:12px}.builder-toolbar{display:flex;align-items:center;gap:10px;margin:20px 0 14px}.builder-toolbar>div{flex:1;color:var(--muted,#64748b);font-size:13px}.builder-toolbar strong{color:var(--text,#0f172a)}.builder-sections{display:flex;flex-direction:column;gap:13px}.builder-section{overflow:hidden;border:1px solid var(--border,#dbe3ee);border-radius:12px;background:var(--panel,#fff)}.builder-section-head{display:flex;align-items:center;gap:11px;padding:14px 16px}.builder-collapse{display:grid;place-items:center;width:26px;height:30px;border:0;background:transparent;color:#64748b;cursor:pointer}.builder-section-number,.builder-item-index{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;border-radius:8px;background:#eff6ff;color:#2563eb;font-size:12px;font-weight:800}.builder-section-title{display:flex;flex:1;flex-direction:column;gap:4px;min-width:0}.builder-section-title strong{font-size:13px}.builder-section-title span{color:var(--muted,#64748b);font-size:11px}.builder-count{color:var(--muted,#64748b);font-size:11px}.builder-items{border-top:1px solid var(--border,#e2e8f0);padding:0 16px 4px 57px}.builder-item{display:flex;align-items:flex-start;gap:12px;padding:15px 0;border-bottom:1px solid var(--border,#eef2f7)}.builder-item:last-child{border-bottom:0}.builder-item-index{background:#f8fafc;color:#64748b}.builder-item-main{display:flex;flex:1;flex-direction:column;gap:6px;min-width:0}.builder-item-main>strong{font-size:12px;line-height:1.5}.builder-item-main>span{font-size:11px;color:var(--muted,#64748b)}.builder-item-tags{display:flex;flex-wrap:wrap;gap:6px}.item-type-tag,.item-tag{display:inline-flex;align-items:center;gap:4px;padding:4px 7px;border-radius:6px;background:#f1f5f9;color:#475569;font-size:10px}.item-tag.evidence{background:#eff6ff;color:#1d4ed8}.item-tag.critical{background:#fff1f2;color:#be123c}.builder-item-actions{display:flex;gap:3px}.builder-no-items{padding:18px 0;color:var(--muted,#64748b);font-size:12px}.builder-no-items button{margin-left:8px;border:0;background:transparent;color:#2563eb;font-weight:700;cursor:pointer}.builder-empty{border:1px dashed var(--border,#cbd5e1);border-radius:12px;background:var(--panel,#fff)}.builder-empty .templates-primary-button{margin-top:8px}.builder-options{display:flex;flex-direction:column;gap:0;border:1px solid var(--border,#e2e8f0);border-radius:10px;overflow:hidden}.builder-option{display:flex;align-items:flex-start;gap:11px;padding:13px;border-bottom:1px solid var(--border,#e2e8f0);cursor:pointer}.builder-option:last-child{border-bottom:0}.builder-option input{width:16px;height:16px;margin-top:2px;accent-color:#2563eb}.builder-option span,.builder-option strong,.builder-option small{display:block}.builder-option strong{font-size:12px}.builder-option small{margin-top:4px;color:var(--muted,#64748b);font-size:11px;line-height:1.4}

        @media(max-width:900px){.templates-row{align-items:flex-start;flex-wrap:wrap;gap:12px}.templates-metadata{justify-content:flex-start;min-width:0;flex:1 1 100%;padding-left:55px}.templates-actions{margin-left:auto}.builder-head{align-items:flex-start!important;flex-direction:column}.builder-header-actions{flex-wrap:wrap}.builder-items{padding-left:16px}}

        @media(max-width:600px){.templates-page .page-head{align-items:flex-start;flex-direction:column}.templates-toolbar{align-items:stretch;flex-wrap:wrap}.templates-search{flex-basis:100%;width:100%}.templates-row{margin:0 12px}.templates-metadata{padding-left:0}.templates-date{white-space:normal}.templates-modal-overlay{align-items:flex-end;padding:0}.templates-modal{max-height:92vh;border-radius:16px 16px 0 0}.templates-modal-header,.templates-modal-body{padding:19px}.templates-modal-footer{padding:15px 19px}.builder-toolbar{flex-wrap:wrap}.builder-toolbar>div{flex-basis:100%}.builder-count{display:none}}

      `}</style>

    </section>

  );

}
