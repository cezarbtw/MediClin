package med.voll.api.domain.paciente;

import med.voll.api.domain.auditoria.DadosAuditoria;
import med.voll.api.domain.endereco.Endereco;

public record DadosDetalhamentoPaciente(
        Long id,
        String nome,
        String email,
        String cpf,
        String telefone,
        Endereco endereco,
        String tipoSanguineo,
        String alergias,
        DadosAuditoria auditoria
) {
    public DadosDetalhamentoPaciente(Long id, String nome, String email, String cpf, String telefone, Endereco endereco) {
        this(id, nome, email, cpf, telefone, endereco, null, null, null);
    }

    public DadosDetalhamentoPaciente(
            Long id,
            String nome,
            String email,
            String cpf,
            String telefone,
            Endereco endereco,
            String tipoSanguineo,
            String alergias
    ) {
        this(id, nome, email, cpf, telefone, endereco, tipoSanguineo, alergias, null);
    }

    public DadosDetalhamentoPaciente(Paciente paciente) {
        this(
                paciente.getId(),
                paciente.getNome(),
                paciente.getEmail(),
                paciente.getCpf(),
                paciente.getTelefone(),
                paciente.getEndereco(),
                paciente.getTipoSanguineo(),
                paciente.getAlergias(),
                DadosAuditoria.de(paciente)
        );
    }
}
