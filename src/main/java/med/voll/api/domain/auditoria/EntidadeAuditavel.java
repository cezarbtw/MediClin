package med.voll.api.domain.auditoria;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Superclasse mapeada que fornece carimbos de data/hora e autoria automáticos
 * via Spring Data JPA Auditing para conformidade com LGPD e normas do CFM.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
public abstract class EntidadeAuditavel {

    @CreatedDate
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @LastModifiedDate
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @CreatedBy
    @Column(name = "criado_por", nullable = false, updatable = false, length = 100)
    private String criadoPor;

    @LastModifiedBy
    @Column(name = "atualizado_por", nullable = false, length = 100)
    private String atualizadoPor;
}
