package med.voll.api.domain.consulta;

import med.voll.api.domain.auditoria.DadosAuditoria;

import java.time.LocalDateTime;

public record DadosDetalhamentoConsulta(
        Long id,
        Long idMedico,
        Long idPaciente,
        LocalDateTime data,
        DadosAuditoria auditoria
) {
    public DadosDetalhamentoConsulta(Long id, Long idMedico, Long idPaciente, LocalDateTime data) {
        this(id, idMedico, idPaciente, data, null);
    }

    public DadosDetalhamentoConsulta(Consulta consulta) {
        this(consulta.getId(), consulta.getMedico().getId(), consulta.getPaciente().getId(), consulta.getData(), DadosAuditoria.de(consulta));
    }
}
