export function formatarDataAuditoria(iso) {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return String(iso);
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function foiRegistroAlterado(auditoria) {
  if (!auditoria?.criadoEm || !auditoria?.atualizadoEm) return false;
  const criado = new Date(auditoria.criadoEm).getTime();
  const atualizado = new Date(auditoria.atualizadoEm).getTime();
  return atualizado - criado > 1000 || auditoria.criadoPor !== auditoria.atualizadoPor;
}

/**
 * Selo compacto de auditoria para linhas de tabela e cartões de prontuário (visível apenas para ADMIN).
 */
export function AuditBadge({ auditoria, inline = false }) {
  if (!auditoria) {
    return (
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Sem rastreamento
      </span>
    );
  }

  const alterado = foiRegistroAlterado(auditoria);

  if (inline) {
    return (
      <div className="audit-inline-strip">
        <span>🛡️ Criado por <strong>{auditoria.criadoPor || 'SISTEMA'}</strong> em {formatarDataAuditoria(auditoria.criadoEm)}</span>
        {alterado && (
          <span> · Atualizado por <strong>{auditoria.atualizadoPor || 'SISTEMA'}</strong> em {formatarDataAuditoria(auditoria.atualizadoEm)}</span>
        )}
      </div>
    );
  }

  return (
    <div className="audit-cell">
      <div className="audit-cell-row">
        <span className="audit-label">Criado:</span>{' '}
        <strong>{auditoria.criadoPor || 'SISTEMA'}</strong>
        <span className="audit-date"> · {formatarDataAuditoria(auditoria.criadoEm)}</span>
      </div>
      {alterado && (
        <div className="audit-cell-row audit-cell-updated">
          <span className="audit-label">Editado:</span>{' '}
          <strong>{auditoria.atualizadoPor || 'SISTEMA'}</strong>
          <span className="audit-date"> · {formatarDataAuditoria(auditoria.atualizadoEm)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Painel detalhado de trilha de auditoria exibido nos modais de edição para perfis ADMIN.
 */
export function AuditDetailBox({ auditoria }) {
  if (!auditoria) return null;

  return (
    <div className="audit-detail-box">
      <div className="audit-detail-header">
        <span>🛡️ Rastreabilidade & Auditoria (LGPD / CFM)</span>
        <span className="badge badge-indigo" style={{ fontSize: 10 }}>Somente Leitura</span>
      </div>
      <div className="audit-detail-grid">
        <div>
          <span className="audit-detail-key">Criado por</span>
          <strong className="audit-detail-val">{auditoria.criadoPor || 'SISTEMA'}</strong>
          <small>{formatarDataAuditoria(auditoria.criadoEm)}</small>
        </div>
        <div>
          <span className="audit-detail-key">Última modificação</span>
          <strong className="audit-detail-val">{auditoria.atualizadoPor || 'SISTEMA'}</strong>
          <small>{formatarDataAuditoria(auditoria.atualizadoEm)}</small>
        </div>
      </div>
    </div>
  );
}
