package med.voll.api.domain.auditoria;

import java.time.LocalDateTime;

/**
 * Representa os metadados de rastreabilidade e auditoria de uma entidade persistida.
 */
public record DadosAuditoria(
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        String criadoPor,
        String atualizadoPor
) {
    public static DadosAuditoria de(EntidadeAuditavel entidade) {
        if (entidade == null) {
            return null;
        }
        if (entidade.getCriadoEm() == null
                && entidade.getAtualizadoEm() == null
                && entidade.getCriadoPor() == null
                && entidade.getAtualizadoPor() == null) {
            return null;
        }
        return new DadosAuditoria(
                entidade.getCriadoEm(),
                entidade.getAtualizadoEm(),
                entidade.getCriadoPor(),
                entidade.getAtualizadoPor()
        );
    }
}
