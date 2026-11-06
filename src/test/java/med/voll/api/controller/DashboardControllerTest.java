package med.voll.api.controller;

import med.voll.api.domain.dashboard.DadosMetricasDashboard;
import med.voll.api.domain.dashboard.DashboardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private DashboardService dashboardService;

    @Test
    @DisplayName("Deveria devolver codigo http 200 ao requisitar metricas com autenticacao")
    @WithMockUser
    void obterMetricas_cenario1() throws Exception {
        var dados = new DadosMetricasDashboard(
                100L,
                25L,
                20L,
                25.0,
                15L,
                8L,
                2L,
                8.0,
                5L,
                40L,
                5.0,
                Map.of("CARDIOLOGIA", 10L),
                Map.of("PACIENTE_DESISTIU", 2L),
                Map.of("SEGUNDA", 5L),
                Map.of("AGENDADA", 15L, "REALIZADA", 8L, "CANCELADA", 2L)
        );

        when(dashboardService.calcularMetricas(anyString())).thenReturn(dados);

        var response = mvc.perform(get("/dashboard/metricas?periodo=30_dias")
                        .contentType(MediaType.APPLICATION_JSON))
                .andReturn().getResponse();

        assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());
        assertThat(response.getContentAsString()).contains("\"totalConsultas\":100");
        assertThat(response.getContentAsString()).contains("\"taxaCancelamento\":8.0");
        assertThat(response.getContentAsString()).contains("\"crescimentoPercentual\":25.0");
    }

    @Test
    @DisplayName("Deveria devolver codigo http 403 quando usuario nao esta autenticado")
    void obterMetricas_cenario2() throws Exception {
        var response = mvc.perform(get("/dashboard/metricas"))
                .andReturn().getResponse();

        assertThat(response.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
    }
}
