
import { useCallback, useEffect, useState } from "react";
import "./AuditPage.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

type AuditLog = {
  id: number;
  actorUserId: number | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
};

type AuditPageResponse = {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

function getToken(): string | null {
  return (
    localStorage.getItem("fieldops_token") ||
    sessionStorage.getItem("fieldops_token")
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function escapeCsv(value: unknown): string {
  let text = String(value ?? "");

  // Evita que valores importados sejam interpretados como fórmulas no Excel.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv(rows: AuditLog[]) {
  const headers = [
    "Data e hora",
    "Usuário",
    "E-mail",
    "Ação",
    "Entidade",
    "ID da entidade",
    "Descrição",
  ];

  const data = rows.map((item) => [
    formatDate(item.createdAt),
    item.actorName,
    item.actorEmail,
    item.action,
    item.entityType,
    item.entityId,
    item.description,
  ]);

  const csv = [
    headers.map(escapeCsv).join(";"),
    ...data.map((row) => row.map(escapeCsv).join(";")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "fieldops-auditoria.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setError("Sessão não encontrada. Faça login novamente.");
      setLogs([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        size: "25",
      });

      if (search.trim()) params.set("search", search.trim());
      if (action) params.set("action", action);
      if (entityType.trim()) {
        params.set("entityType", entityType.trim());
      }
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(
        `${API_URL}/api/v1/audit-logs?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            response.status === 401
              ? "Sessão expirada. Faça login novamente."
              : "Você não tem permissão para consultar a auditoria."
          );
        }

        throw new Error(
          `Não foi possível carregar a auditoria (HTTP ${response.status}).`
        );
      }

      const result: AuditPageResponse = await response.json();

      setLogs(result.content ?? []);
      setTotalElements(result.totalElements ?? 0);
      setTotalPages(result.totalPages ?? 0);
    } catch (err) {
      setLogs([]);
      setTotalElements(0);
      setTotalPages(0);
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao carregar a auditoria."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, action, entityType, from, to]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  function applyFilters() {
    setPage(0);
    // A consulta será refeita pelo efeito quando o estado mudar.
  }

  function clearFilters() {
    setSearch("");
    setAction("");
    setEntityType("");
    setFrom("");
    setTo("");
    setPage(0);
  }

  return (
    <section className="audit-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">GOVERNANÇA</div>
          <h1>Auditoria</h1>
          <p>
            Consulte a rastreabilidade das ações realizadas no sistema.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => exportCsv(logs)}
          disabled={logs.length === 0 || loading}
        >
          Exportar CSV
        </button>
      </header>

      <div className="audit-summary">
        <article className="audit-summary-card">
          <span>Total de registros encontrados</span>
          <strong>{totalElements}</strong>
        </article>

        <article className="audit-summary-card">
          <span>Registros nesta página</span>
          <strong>{logs.length}</strong>
        </article>

        <article className="audit-summary-card">
          <span>Página atual</span>
          <strong>
            {totalPages === 0 ? 0 : page + 1} de {totalPages}
          </strong>
        </article>
      </div>

      <section className="audit-panel">
        <div className="audit-panel-heading">
          <div>
            <h2>Histórico de ações</h2>
            <p>Pesquise e filtre os registros de auditoria.</p>
          </div>
        </div>

        <form
          className="audit-filters"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
            void loadLogs();
          }}
        >
          <label>
            Buscar
            <input
              type="search"
              placeholder="Usuário, ação ou descrição"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label>
            Tipo de ação
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
            >
              <option value="">Todas as ações</option>
              <option value="CREATE">Criação</option>
              <option value="UPDATE">Atualização</option>
              <option value="DELETE">Exclusão</option>
              <option value="LOGIN">Login</option>
              <option value="APPROVE">Aprovação</option>
              <option value="REJECT">Rejeição</option>
            </select>
          </label>

          <label>
            Entidade
            <input
              type="text"
              placeholder="Ex.: Inspection"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
            />
          </label>

          <label>
            Data inicial
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>

          <label>
            Data final
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>

          <div className="audit-filter-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              Filtrar
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearFilters}
            >
              Limpar
            </button>
          </div>
        </form>

        {error && (
          <div className="audit-error" role="alert">
            {error}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void loadLogs()}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Data e hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>ID relacionado</th>
                <th>Descrição</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>Carregando registros...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    {error
                      ? "Não foi possível exibir os registros."
                      : "Nenhum registro de auditoria encontrado."}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>
                      <strong>{log.actorName || "Sistema"}</strong>
                      {log.actorEmail && (
                        <small className="audit-email">
                          {log.actorEmail}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="audit-action">
                        {log.action}
                      </span>
                    </td>
                    <td>{log.entityType}</td>
                    <td>{log.entityId || "—"}</td>
                    <td>{log.description || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="audit-pagination">
          <span>
            {totalElements} registro(s) encontrado(s)
          </span>

          <div>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page === 0 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
