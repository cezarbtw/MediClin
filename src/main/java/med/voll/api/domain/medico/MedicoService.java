package med.voll.api.domain.medico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MedicoService {

    @Autowired
    private MedicoRepository repository;

    @Transactional
    public Medico cadastrar(DadosCadastroMedico dados) {
        var medico = new Medico(dados);
        return repository.save(medico);
    }

    public Page<DadosListagemMedico> listar(Pageable paginacao) {
        return repository.findAllByAtivoTrue(paginacao).map(DadosListagemMedico::new);
    }

    @Transactional
    public DadosDetalhamentoMedico atualizar(DadosAtualizacaoMedico dados) {
        var medico = repository.getReferenceById(dados.id());
        medico.atualizarInformacoes(dados);
        repository.saveAndFlush(medico);
        return new DadosDetalhamentoMedico(medico);
    }

    @Transactional
    public DadosDetalhamentoMedico atualizarPorId(Long id, DadosAtualizacaoMedico dados) {
        var dadosComId = new DadosAtualizacaoMedico(id, dados.nome(), dados.telefone(), dados.endereco());
        var medico = repository.getReferenceById(id);
        medico.atualizarInformacoes(dadosComId);
        repository.saveAndFlush(medico);
        return new DadosDetalhamentoMedico(medico);
    }

    @Transactional
    public void excluir(Long id) {
        var medico = repository.getReferenceById(id);
        medico.excluir();
        repository.saveAndFlush(medico);
    }

    public DadosDetalhamentoMedico detalhar(Long id) {
        var medico = repository.getReferenceById(id);
        return new DadosDetalhamentoMedico(medico);
    }

}
