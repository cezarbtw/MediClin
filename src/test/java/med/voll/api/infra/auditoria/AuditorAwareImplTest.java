package med.voll.api.infra.auditoria;

import med.voll.api.domain.usuario.PerfilUsuario;
import med.voll.api.domain.usuario.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;

class AuditorAwareImplTest {

    private final AuditorAwareImpl auditorAware = new AuditorAwareImpl();

    @AfterEach
    void limparContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Deveria retornar SISTEMA quando nao houver autenticacao no SecurityContextHolder")
    void semAutenticacao() {
        SecurityContextHolder.clearContext();
        assertThat(auditorAware.getCurrentAuditor()).contains(AuditorAwareImpl.AUDITOR_SISTEMA);
    }

    @Test
    @DisplayName("Deveria retornar SISTEMA quando autenticacao for anonima")
    void usuarioAnonimo() {
        var anon = new AnonymousAuthenticationToken(
                "key",
                "anonymousUser",
                AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")
        );
        SecurityContextHolder.getContext().setAuthentication(anon);

        assertThat(auditorAware.getCurrentAuditor()).contains(AuditorAwareImpl.AUDITOR_SISTEMA);
    }

    @Test
    @DisplayName("Deveria retornar login do Usuario autenticado via SecurityContextHolder")
    void usuarioAutenticado() {
        var usuario = new Usuario("admin@mediclin.med.br", "senha", PerfilUsuario.ADMIN);
        var auth = new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThat(auditorAware.getCurrentAuditor()).contains("admin@mediclin.med.br");
    }
}
