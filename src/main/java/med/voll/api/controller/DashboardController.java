package med.voll.api.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import med.voll.api.domain.dashboard.DadosMetricasDashboard;
import med.voll.api.domain.dashboard.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@SecurityRequirement(name = "bearer-key")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/metricas")
    public ResponseEntity<DadosMetricasDashboard> obterMetricas(
            @RequestParam(name = "periodo", required = false, defaultValue = "30_dias") String periodo
    ) {
        var metricas = dashboardService.calcularMetricas(periodo);
        return ResponseEntity.ok(metricas);
    }

}
