package med.voll.api.domain.auditoria;

import java.util.List;
import java.util.Map;

/**
 * Resposta consolidada do painel administrativo de auditoria.
 */
public record DadosPainelAuditoria(
        long totalRegistros,
        long alteradosUltimas24h,
        long entidadesModificadas,
        Map<String, Long> porEntidade,
        List<DadosRegistroAuditoria> registros
) {
}
