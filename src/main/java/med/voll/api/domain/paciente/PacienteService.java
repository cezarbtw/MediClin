package med.voll.api.domain.paciente;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PacienteService {

    @Autowired
    private PacienteRepository repository;

    @Transactional
    public Paciente cadastrar(DadosCadastroPaciente dados) {
        var paciente = new Paciente(dados);
        return repository.save(paciente);
    }

    public Page<DadosListagemPaciente> listar(Pageable paginacao) {
        return repository.findAllByAtivoTrue(paginacao).map(DadosListagemPaciente::new);
    }

    @Transactional
    public DadosDetalhamentoPaciente atualizar(DadosAtualizacaoPaciente dados) {
        var paciente = repository.getReferenceById(dados.id());
        paciente.atualizarInformacoes(dados);
        repository.saveAndFlush(paciente);
        return new DadosDetalhamentoPaciente(paciente);
    }

    @Transactional
    public DadosDetalhamentoPaciente atualizarPorId(Long id, DadosAtualizacaoPaciente dados) {
        var dadosComId = new DadosAtualizacaoPaciente(id, dados.nome(), dados.telefone(), dados.endereco());
        var paciente = repository.getReferenceById(id);
        paciente.atualizarInformacoes(dadosComId);
        repository.saveAndFlush(paciente);
        return new DadosDetalhamentoPaciente(paciente);
    }

    @Transactional
    public void excluir(Long id) {
        var paciente = repository.getReferenceById(id);
        paciente.excluir();
        repository.saveAndFlush(paciente);
    }

    public DadosDetalhamentoPaciente detalhar(Long id) {
        var paciente = repository.getReferenceById(id);
        return new DadosDetalhamentoPaciente(paciente);
    }

}
