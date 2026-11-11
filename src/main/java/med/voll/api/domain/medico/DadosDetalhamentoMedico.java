package med.voll.api.domain.medico;

import med.voll.api.domain.auditoria.DadosAuditoria;
import med.voll.api.domain.endereco.Endereco;

public record DadosDetalhamentoMedico(
        Long id,
        String nome,
        String email,
        String crm,
        String telefone,
        Especialidade especialidade,
        Endereco endereco,
        DadosAuditoria auditoria
) {

    public DadosDetalhamentoMedico(Long id, String nome, String email, String crm, String telefone, Especialidade especialidade, Endereco endereco) {
        this(id, nome, email, crm, telefone, especialidade, endereco, null);
    }

    public DadosDetalhamentoMedico(Medico medico) {
        this(
                medico.getId(),
                medico.getNome(),
                medico.getEmail(),
                medico.getCrm(),
                medico.getTelefone(),
                medico.getEspecialidade(),
                medico.getEndereco(),
                DadosAuditoria.de(medico)
        );
    }
}
