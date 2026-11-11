package med.voll.api.domain.medico;

import med.voll.api.domain.auditoria.DadosAuditoria;

public record DadosListagemMedico(
        Long id,
        String nome,
        String email,
        String crm,
        Especialidade especialidade,
        DadosAuditoria auditoria
) {

    public DadosListagemMedico(Long id, String nome, String email, String crm, Especialidade especialidade) {
        this(id, nome, email, crm, especialidade, null);
    }

    public DadosListagemMedico(Medico medico) {
        this(medico.getId(), medico.getNome(), medico.getEmail(), medico.getCrm(), medico.getEspecialidade(), DadosAuditoria.de(medico));
    }

}
