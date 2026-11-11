package med.voll.api.infra.auditoria;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

/**
 * Resolve o autor da operação atual a partir do {@link SecurityContextHolder}.
 * Retorna "SISTEMA" para operações anônimas (ex: auto-cadastro, rotinas internas).
 */
public class AuditorAwareImpl implements AuditorAware<String> {

    public static final String AUDITOR_SISTEMA = "SISTEMA";

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return Optional.of(AUDITOR_SISTEMA);
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            String username = userDetails.getUsername();
            if (username != null && !username.isBlank()) {
                return Optional.of(username);
            }
        }

        String name = authentication.getName();
        if (name == null || name.isBlank() || "anonymousUser".equalsIgnoreCase(name)) {
            return Optional.of(AUDITOR_SISTEMA);
        }

        return Optional.of(name);
    }
}
