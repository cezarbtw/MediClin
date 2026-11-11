package med.voll.api.domain.consulta;

import med.voll.api.domain.auditoria.DadosAuditoria;
import med.voll.api.domain.medico.Especialidade;

import java.time.LocalDateTime;

public record DadosListagemConsulta(
        Long id,
        Long idMedico,
        String medicoNome,
        Especialidade especialidade,
        Long idPaciente,
        String pacienteNome,
        LocalDateTime data,
        MotivoCancelamento motivoCancelamento,
        String status,
        DadosAuditoria auditoria
) {
    public DadosListagemConsulta(
            Long id,
            Long idMedico,
            String medicoNome,
            Especialidade especialidade,
            Long idPaciente,
            String pacienteNome,
            LocalDateTime data,
            MotivoCancelamento motivoCancelamento,
            String status
    ) {
        this(id, idMedico, medicoNome, especialidade, idPaciente, pacienteNome, data, motivoCancelamento, status, null);
    }

    public DadosListagemConsulta(Consulta consulta) {
        this(
                consulta.getId(),
                consulta.getMedico() != null ? consulta.getMedico().getId() : null,
                consulta.getMedico() != null ? consulta.getMedico().getNome() : null,
                consulta.getMedico() != null ? consulta.getMedico().getEspecialidade() : null,
                consulta.getPaciente() != null ? consulta.getPaciente().getId() : null,
                consulta.getPaciente() != null ? consulta.getPaciente().getNome() : null,
                consulta.getData(),
                consulta.getMotivoCancelamento(),
                consulta.getMotivoCancelamento() != null ? "CANCELADA" : "AGENDADA",
                DadosAuditoria.de(consulta)
        );
    }
}

