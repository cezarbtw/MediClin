package med.voll.api.domain.auditoria;

import java.time.LocalDateTime;

/**
 * Representa uma linha consolidada no painel administrativo de auditoria (LGPD / CFM).
 */
public record DadosRegistroAuditoria(
        String entidade,
        Long registroId,
        String identificador,
        String statusRegistro,
        LocalDateTime criadoEm,
        String criadoPor,
        LocalDateTime atualizadoEm,
        String atualizadoPor
) {
}
