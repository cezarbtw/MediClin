package med.voll.api.infra.auditoria;

import med.voll.api.domain.consulta.Consulta;
import med.voll.api.domain.consulta.ConsultaRepository;
import med.voll.api.domain.endereco.DadosEndereco;
import med.voll.api.domain.medico.DadosAtualizacaoMedico;
import med.voll.api.domain.medico.DadosCadastroMedico;
import med.voll.api.domain.medico.Especialidade;
import med.voll.api.domain.medico.Medico;
import med.voll.api.domain.medico.MedicoRepository;
import med.voll.api.domain.paciente.DadosCadastroPaciente;
import med.voll.api.domain.paciente.Paciente;
import med.voll.api.domain.paciente.PacienteRepository;
import med.voll.api.domain.prontuario.DadosRegistroProntuario;
import med.voll.api.domain.prontuario.Prontuario;
import med.voll.api.domain.prontuario.ProntuarioRepository;
import med.voll.api.domain.usuario.PerfilUsuario;
import med.voll.api.domain.usuario.Usuario;
import med.voll.api.domain.usuario.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@ActiveProfiles("test")
@Import(AuditoriaConfig.class)
class AuditoriaPersistenceTest {

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private ConsultaRepository consultaRepository;

    @Autowired
    private ProntuarioRepository prontuarioRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TestEntityManager em;

    @AfterEach
    void limparContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Deveria preencher automaticamente criado_em, atualizado_em, criado_por e atualizado_por em todas as entidades sensiveis")
    void preencherAuditoriaNaCriacaoDeTodasEntidades() {
        autenticarComo("admin.auditor@mediclin.med", "ROLE_ADMIN");

        var usuario = usuarioRepository.saveAndFlush(new Usuario("operador@mediclin.med", "hash", PerfilUsuario.RECEPCIONISTA));
        var medico = medicoRepository.saveAndFlush(new Medico(dadosMedico("Dr. Auditor", "auditor.crm@mediclin.med", "123456")));
        var paciente = pacienteRepository.saveAndFlush(new Paciente(dadosPaciente("Paciente Auditado", "pac.audit@email.com", "111.222.333-44")));
        var consulta = consultaRepository.saveAndFlush(new Consulta(null, medico, paciente, LocalDateTime.now().plusDays(2), null));
        var prontuario = prontuarioRepository.saveAndFlush(new Prontuario(
                paciente,
                medico,
                consulta,
                new DadosRegistroProntuario(
                        paciente.getId(),
                        medico.getId(),
                        consulta.getId(),
                        "Cefaleia",
                        "Enxaqueca tensional",
                        "Analgesico",
                        "Observacao",
                        new BigDecimal("70.00"),
                        175,
                        "120/80"
                )
        ));

        for (var entidade : List.of(usuario, medico, paciente, consulta, prontuario)) {
            assertThat(entidade.getCriadoEm()).isNotNull();
            assertThat(entidade.getAtualizadoEm()).isNotNull();
            assertThat(entidade.getCriadoPor()).isEqualTo("admin.auditor@mediclin.med");
            assertThat(entidade.getAtualizadoPor()).isEqualTo("admin.auditor@mediclin.med");
        }
    }

    @Test
    @DisplayName("Deveria usar SISTEMA como auditor quando nao houver usuario autenticado no contexto")
    void preencherSistemaSemUsuarioAutenticado() {
        SecurityContextHolder.clearContext();

        var usuario = usuarioRepository.saveAndFlush(new Usuario("autocadastro@email.com", "hash", PerfilUsuario.RECEPCIONISTA));
        var medico = medicoRepository.saveAndFlush(new Medico(dadosMedico("Dr. Sistema", "sistema.med@mediclin.med", "654321")));

        assertThat(usuario.getCriadoPor()).isEqualTo(AuditorAwareImpl.AUDITOR_SISTEMA);
        assertThat(usuario.getAtualizadoPor()).isEqualTo(AuditorAwareImpl.AUDITOR_SISTEMA);
        assertThat(usuario.getCriadoEm()).isNotNull();

        assertThat(medico.getCriadoPor()).isEqualTo(AuditorAwareImpl.AUDITOR_SISTEMA);
        assertThat(medico.getAtualizadoPor()).isEqualTo(AuditorAwareImpl.AUDITOR_SISTEMA);
        assertThat(medico.getCriadoEm()).isNotNull();
    }

    @Test
    @DisplayName("Deveria preservar criado_por e criado_em e atualizar atualizado_por e atualizado_em na edicao por outro usuario")
    void preservarCriacaoEAtualizarModificacao() throws InterruptedException {
        autenticarComo("criador@mediclin.med", "ROLE_RECEPCIONISTA");
        var medico = medicoRepository.saveAndFlush(new Medico(dadosMedico("Dr. Original", "orig@mediclin.med", "778899")));
        Long medicoId = medico.getId();
        em.clear();

        var antesDaEdicao = medicoRepository.findById(medicoId).orElseThrow();
        var criadoEmNoBanco = antesDaEdicao.getCriadoEm();
        var criadoPorNoBanco = antesDaEdicao.getCriadoPor();

        Thread.sleep(25);
        autenticarComo("editor.admin@mediclin.med", "ROLE_ADMIN");
        antesDaEdicao.atualizarInformacoes(new DadosAtualizacaoMedico(medicoId, "Dr. Editado", "(11) 98888-7777", null));
        medicoRepository.saveAndFlush(antesDaEdicao);

        em.clear();
        var recarregado = medicoRepository.findById(medicoId).orElseThrow();

        assertThat(recarregado.getNome()).isEqualTo("Dr. Editado");
        assertThat(recarregado.getCriadoPor()).isEqualTo("criador@mediclin.med");
        assertThat(recarregado.getCriadoPor()).isEqualTo(criadoPorNoBanco);
        assertThat(recarregado.getCriadoEm()).isEqualTo(criadoEmNoBanco);
        assertThat(recarregado.getAtualizadoPor()).isEqualTo("editor.admin@mediclin.med");
        assertThat(recarregado.getAtualizadoEm()).isAfter(criadoEmNoBanco);
    }

    private void autenticarComo(String login, String role) {
        var auth = new UsernamePasswordAuthenticationToken(
                login,
                null,
                List.of(new SimpleGrantedAuthority(role))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private DadosCadastroMedico dadosMedico(String nome, String email, String crm) {
        return new DadosCadastroMedico(nome, email, "11999999999", crm, Especialidade.CARDIOLOGIA, dadosEndereco());
    }

    private DadosCadastroPaciente dadosPaciente(String nome, String email, String cpf) {
        return new DadosCadastroPaciente(nome, email, "11988887777", cpf, dadosEndereco());
    }

    private DadosEndereco dadosEndereco() {
        return new DadosEndereco("Rua Teste", "Centro", "01001000", "Sao Paulo", "SP", "10", null);
    }
}
