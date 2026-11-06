package med.voll.api.domain.dashboard;

import java.util.Map;

public record DadosMetricasDashboard(
        long totalConsultas,
        long consultasMesAtual,
        long consultasMesAnterior,
        double crescimentoPercentual,
        long consultasAgendadas,
        long consultasRealizadas,
        long consultasCanceladas,
        double taxaCancelamento,
        long totalMedicosAtivos,
        long totalPacientesAtivos,
        double mediaConsultasPorMedico,
        Map<String, Long> consultasPorEspecialidade,
        Map<String, Long> cancelamentosPorMotivo,
        Map<String, Long> consultasPorDiaSemana,
        Map<String, Long> consultasPorStatus
) {
}
