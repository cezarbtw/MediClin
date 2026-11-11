package med.voll.api.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import med.voll.api.domain.auditoria.AuditoriaService;
import med.voll.api.domain.auditoria.DadosPainelAuditoria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints administrativos para consulta da trilha de auditoria (LGPD / CFM).
 */
@RestController
@RequestMapping("/auditoria")
@SecurityRequirement(name = "bearer-key")
@PreAuthorize("hasRole('ADMIN')")
public class AuditoriaController {

    @Autowired
    private AuditoriaService auditoriaService;

    @GetMapping
    public ResponseEntity<DadosPainelAuditoria> consultar(
            @RequestParam(required = false) String entidade,
            @RequestParam(required = false) String usuario
    ) {
        return ResponseEntity.ok(auditoriaService.consultarPainel(entidade, usuario));
    }
}
