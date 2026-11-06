package med.voll.api.domain.dashboard;

import med.voll.api.domain.consulta.Consulta;
import med.voll.api.domain.consulta.ConsultaRepository;
import med.voll.api.domain.consulta.MotivoCancelamento;
import med.voll.api.domain.medico.Especialidade;
import med.voll.api.domain.medico.MedicoRepository;
import med.voll.api.domain.paciente.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    @Autowired
    private ConsultaRepository consultaRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    public DadosMetricasDashboard calcularMetricas(String periodo) {
        var agora = LocalDateTime.now();
        var normalizado = periodo != null ? periodo.toLowerCase().trim() : "30_dias";

        LocalDateTime inicioPeriodo;
        LocalDateTime inicioAnterior;
        LocalDateTime fimAnterior;

        switch (normalizado) {
            case "7_dias", "7" -> {
                inicioPeriodo = agora.minusDays(7);
                inicioAnterior = agora.minusDays(14);
                fimAnterior = inicioPeriodo;
            }
            case "90_dias", "90" -> {
                inicioPeriodo = agora.minusDays(90);
                inicioAnterior = agora.minusDays(180);
                fimAnterior = inicioPeriodo;
            }
            case "ano_atual", "365" -> {
                inicioPeriodo = agora.minusDays(365);
                inicioAnterior = agora.minusDays(730);
                fimAnterior = inicioPeriodo;
            }
            case "todos", "geral" -> {
                inicioPeriodo = LocalDateTime.of(2000, 1, 1, 0, 0);
                inicioAnterior = inicioPeriodo;
                fimAnterior = inicioPeriodo;
            }
            default -> { // 30_dias ou mes_atual
                inicioPeriodo = agora.minusDays(30);
                inicioAnterior = agora.minusDays(60);
                fimAnterior = inicioPeriodo;
            }
        }

        List<Consulta> consultasPeriodo;
        long totalConsultasCadastradas = consultaRepository.count();

        if ("todos".equalsIgnoreCase(normalizado) || "geral".equalsIgnoreCase(normalizado)) {
            consultasPeriodo = consultaRepository.findAll();
        } else {
            consultasPeriodo = consultaRepository.findAllByDataBetween(inicioPeriodo, agora);
        }

        long consultasPeriodoAnterior = 0;
        if (!"todos".equalsIgnoreCase(normalizado) && !"geral".equalsIgnoreCase(normalizado)) {
            consultasPeriodoAnterior = consultaRepository.findAllByDataBetween(inicioAnterior, fimAnterior).size();
        }

        long totalPeriodo = consultasPeriodo.size();

        // Cálculo de Crescimento Percentual
        double crescimentoPercentual = 0.0;
        if (consultasPeriodoAnterior > 0) {
            crescimentoPercentual = Math.round(((totalPeriodo - consultasPeriodoAnterior) / (double) consultasPeriodoAnterior) * 1000.0) / 10.0;
        } else if (totalPeriodo > 0 && consultasPeriodoAnterior == 0) {
            crescimentoPercentual = 100.0;
        }

        long agendadas = 0;
        long realizadas = 0;
        long canceladas = 0;

        // Distribuição por Especialidade
        Map<String, Long> consultasPorEspecialidade = new LinkedHashMap<>();
        for (Especialidade esp : Especialidade.values()) {
            consultasPorEspecialidade.put(esp.name(), 0L);
        }

        // Distribuição de Cancelamentos por Motivo
        Map<String, Long> cancelamentosPorMotivo = new LinkedHashMap<>();
        for (MotivoCancelamento m : MotivoCancelamento.values()) {
            cancelamentosPorMotivo.put(m.name(), 0L);
        }

        // Distribuição por Dia da Semana
        Map<String, Long> consultasPorDiaSemana = new LinkedHashMap<>();
        consultasPorDiaSemana.put("SEGUNDA", 0L);
        consultasPorDiaSemana.put("TERCA", 0L);
        consultasPorDiaSemana.put("QUARTA", 0L);
        consultasPorDiaSemana.put("QUINTA", 0L);
        consultasPorDiaSemana.put("SEXTA", 0L);
        consultasPorDiaSemana.put("SABADO", 0L);
        consultasPorDiaSemana.put("DOMINGO", 0L);

        for (Consulta c : consultasPeriodo) {
            // Status
            if (c.getMotivoCancelamento() != null) {
                canceladas++;
                var motivo = c.getMotivoCancelamento().name();
                cancelamentosPorMotivo.put(motivo, cancelamentosPorMotivo.getOrDefault(motivo, 0L) + 1);
            } else if (c.getData() != null && c.getData().isBefore(agora)) {
                realizadas++;
            } else {
                agendadas++;
            }

            // Especialidade
            if (c.getMedico() != null && c.getMedico().getEspecialidade() != null) {
                var esp = c.getMedico().getEspecialidade().name();
                consultasPorEspecialidade.put(esp, consultasPorEspecialidade.getOrDefault(esp, 0L) + 1);
            }

            // Dia da Semana
            if (c.getData() != null) {
                var diaSemanaNome = traduzirDiaSemana(c.getData().getDayOfWeek());
                consultasPorDiaSemana.put(diaSemanaNome, consultasPorDiaSemana.getOrDefault(diaSemanaNome, 0L) + 1);
            }
        }

        double taxaCancelamento = totalPeriodo > 0
                ? Math.round((canceladas / (double) totalPeriodo) * 1000.0) / 10.0
                : 0.0;

        long totalMedicosAtivos = medicoRepository.countByAtivoTrue();
        long totalPacientesAtivos = pacienteRepository.countByAtivoTrue();

        double mediaConsultasPorMedico = totalMedicosAtivos > 0
                ? Math.round((totalPeriodo / (double) totalMedicosAtivos) * 10.0) / 10.0
                : 0.0;

        Map<String, Long> consultasPorStatus = new LinkedHashMap<>();
        consultasPorStatus.put("AGENDADA", agendadas);
        consultasPorStatus.put("REALIZADA", realizadas);
        consultasPorStatus.put("CANCELADA", canceladas);

        return new DadosMetricasDashboard(
                totalConsultasCadastradas,
                totalPeriodo,
                consultasPeriodoAnterior,
                crescimentoPercentual,
                agendadas,
                realizadas,
                canceladas,
                taxaCancelamento,
                totalMedicosAtivos,
                totalPacientesAtivos,
                mediaConsultasPorMedico,
                consultasPorEspecialidade,
                cancelamentosPorMotivo,
                consultasPorDiaSemana,
                consultasPorStatus
        );
    }

    private String traduzirDiaSemana(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> "SEGUNDA";
            case TUESDAY -> "TERCA";
            case WEDNESDAY -> "QUARTA";
            case THURSDAY -> "QUINTA";
            case FRIDAY -> "SEXTA";
            case SATURDAY -> "SABADO";
            case SUNDAY -> "DOMINGO";
        };
    }
}
