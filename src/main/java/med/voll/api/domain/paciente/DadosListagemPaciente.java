package med.voll.api.domain.paciente;

import med.voll.api.domain.auditoria.DadosAuditoria;

public record DadosListagemPaciente(
        Long id,
        String nome,
        String email,
        String cpf,
        String telefone,
        String tipoSanguineo,
        DadosAuditoria auditoria
) {

    public DadosListagemPaciente(Long id, String nome, String email, String cpf) {
        this(id, nome, email, cpf, null, null, null);
    }

    public DadosListagemPaciente(Long id, String nome, String email, String cpf, String telefone, String tipoSanguineo) {
        this(id, nome, email, cpf, telefone, tipoSanguineo, null);
    }

    public DadosListagemPaciente(Paciente paciente) {
        this(
                paciente.getId(),
                paciente.getNome(),
                paciente.getEmail(),
                paciente.getCpf(),
                paciente.getTelefone(),
                paciente.getTipoSanguineo(),
                DadosAuditoria.de(paciente)
        );
    }

}
