package med.voll.api.domain.auditoria;

import med.voll.api.domain.consulta.ConsultaRepository;
import med.voll.api.domain.medico.MedicoRepository;
import med.voll.api.domain.paciente.PacienteRepository;
import med.voll.api.domain.prontuario.ProntuarioRepository;
import med.voll.api.domain.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Consolida a trilha de auditoria (criação e modificações) das entidades sensíveis
 * do sistema para visualização exclusiva de administradores.
 */
@Service
public class AuditoriaService {

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

    @Transactional(readOnly = true)
    public DadosPainelAuditoria consultarPainel(String filtroEntidade, String filtroUsuario) {
        List<DadosRegistroAuditoria> todos = new ArrayList<>();

        medicoRepository.findAll().forEach(m -> todos.add(toRegistro(
                "MEDICO",
                m.getId(),
                m.getNome() + " (CRM " + m.getCrm() + ")",
                Boolean.FALSE.equals(m.getAtivo()) ? "INATIVO" : "ATIVO",
                m
        )));

        pacienteRepository.findAll().forEach(p -> todos.add(toRegistro(
                "PACIENTE",
                p.getId(),
                p.getNome() + " (CPF " + p.getCpf() + ")",
                Boolean.FALSE.equals(p.getAtivo()) ? "INATIVO" : "ATIVO",
                p
        )));

        consultaRepository.findAll().forEach(c -> {
            String pac = c.getPaciente() != null ? c.getPaciente().getNome() : "Paciente";
            String med = c.getMedico() != null ? c.getMedico().getNome() : "Médico";
            String st = c.getMotivoCancelamento() != null ? "CANCELADA" : "AGENDADA";
            todos.add(toRegistro("CONSULTA", c.getId(), pac + " com " + med, st, c));
        });

        prontuarioRepository.findAll().forEach(pr -> {
            String pac = pr.getPaciente() != null ? pr.getPaciente().getNome() : "Paciente";
            todos.add(toRegistro("PRONTUARIO", pr.getId(), pac + " · " + pr.getDiagnostico(), "REGISTRADO", pr));
        });

        usuarioRepository.findAll().forEach(u -> todos.add(toRegistro(
                "USUARIO",
                u.getId(),
                u.getLogin(),
                u.getPerfil() != null ? u.getPerfil().name() : "USER",
                u
        )));

        Map<String, Long> porEntidade = new LinkedHashMap<>();
        for (String tipo : List.of("MEDICO", "PACIENTE", "CONSULTA", "PRONTUARIO", "USUARIO")) {
            long qtd = todos.stream().filter(r -> tipo.equals(r.entidade())).count();
            porEntidade.put(tipo, qtd);
        }

        LocalDateTime limite24h = LocalDateTime.now().minusHours(24);
        long alterados24h = todos.stream()
                .filter(r -> r.atualizadoEm() != null && r.atualizadoEm().isAfter(limite24h))
                .count();
        long modificados = todos.stream().filter(AuditoriaService::foiModificado).count();

        String entidadeNorm = (filtroEntidade != null && !filtroEntidade.isBlank() && !"TODAS".equalsIgnoreCase(filtroEntidade))
                ? filtroEntidade.trim().toUpperCase(Locale.ROOT)
                : null;
        String termoUsuario = (filtroUsuario != null && !filtroUsuario.isBlank())
                ? filtroUsuario.trim().toLowerCase(Locale.ROOT)
                : null;

        List<DadosRegistroAuditoria> filtrados = todos.stream()
                .filter(r -> entidadeNorm == null || entidadeNorm.equals(r.entidade()))
                .filter(r -> matchesBusca(r, termoUsuario))
                .sorted(Comparator.comparing(
                        DadosRegistroAuditoria::atualizadoEm,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ).thenComparing(
                        DadosRegistroAuditoria::criadoEm,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();

        return new DadosPainelAuditoria(todos.size(), alterados24h, modificados, porEntidade, filtrados);
    }

    private static DadosRegistroAuditoria toRegistro(
            String entidade,
            Long id,
            String identificador,
            String statusRegistro,
            EntidadeAuditavel e
    ) {
        return new DadosRegistroAuditoria(
                entidade,
                id,
                identificador,
                statusRegistro,
                e.getCriadoEm(),
                e.getCriadoPor(),
                e.getAtualizadoEm(),
                e.getAtualizadoPor()
        );
    }

    private static boolean foiModificado(DadosRegistroAuditoria r) {
        if (r.criadoEm() == null || r.atualizadoEm() == null) {
            return false;
        }
        return r.atualizadoEm().isAfter(r.criadoEm().plusSeconds(1))
                || !Objects.equals(r.criadoPor(), r.atualizadoPor());
    }

    private static boolean matchesBusca(DadosRegistroAuditoria r, String termo) {
        if (termo == null) {
            return true;
        }
        return containsIgnoreCase(r.criadoPor(), termo)
                || containsIgnoreCase(r.atualizadoPor(), termo)
                || containsIgnoreCase(r.identificador(), termo);
    }

    private static boolean containsIgnoreCase(String value, String termLower) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(termLower);
    }
}
