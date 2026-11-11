package med.voll.api.domain.usuario;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import med.voll.api.domain.auditoria.EntidadeAuditavel;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Table(name = "usuarios")
@Entity(name = "Usuario")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Usuario extends EntidadeAuditavel implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String login;
    private String senha;

    @Enumerated(EnumType.STRING)
    private PerfilUsuario perfil = PerfilUsuario.RECEPCIONISTA;

    @Column(name = "token_recuperacao")
    private String tokenRecuperacao;

    @Column(name = "expiracao_token_recuperacao")
    private LocalDateTime expiracaoTokenRecuperacao;

    public Usuario(String login, String senha) {
        this.login = login;
        this.senha = senha;
        this.perfil = PerfilUsuario.RECEPCIONISTA;
    }

    public Usuario(String login, String senha, PerfilUsuario perfil) {
        this.login = login;
        this.senha = senha;
        this.perfil = (perfil != null) ? perfil : PerfilUsuario.RECEPCIONISTA;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        var roles = new ArrayList<GrantedAuthority>();
        if (perfil != null) {
            roles.add(new SimpleGrantedAuthority("ROLE_" + perfil.name()));
        }
        roles.add(new SimpleGrantedAuthority("ROLE_USER"));
        return roles;
    }

    public String gerarTokenRecuperacao() {
        this.tokenRecuperacao = UUID.randomUUID().toString();
        this.expiracaoTokenRecuperacao = LocalDateTime.now().plusMinutes(30);
        return this.tokenRecuperacao;
    }

    public boolean isTokenRecuperacaoValido(String token) {
        if (this.tokenRecuperacao == null || this.expiracaoTokenRecuperacao == null) {
            return false;
        }
        return this.tokenRecuperacao.equals(token) && this.expiracaoTokenRecuperacao.isAfter(LocalDateTime.now());
    }

    public void redefinirSenha(String novaSenhaCriptografada) {
        this.senha = novaSenhaCriptografada;
        this.tokenRecuperacao = null;
        this.expiracaoTokenRecuperacao = null;
    }

    @Override
    public String getPassword() {
        return senha;
    }

    @Override
    public String getUsername() {
        return login;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
