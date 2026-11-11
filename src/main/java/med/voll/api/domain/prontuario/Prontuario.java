package med.voll.api.domain.prontuario;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import med.voll.api.domain.auditoria.EntidadeAuditavel;
import med.voll.api.domain.consulta.Consulta;
import med.voll.api.domain.medico.Medico;
import med.voll.api.domain.paciente.Paciente;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Table(name = "prontuarios")
@Entity(name = "Prontuario")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Prontuario extends EntidadeAuditavel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medico_id")
    private Medico medico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consulta_id")
    private Consulta consulta;

    @Column(name = "data_registro")
    private LocalDateTime dataRegistro;

    @Column(name = "queixa_principal")
    private String queixaPrincipal;

    private String diagnostico;

    private String prescricao;

    private String observacoes;

    private BigDecimal peso;

    private Integer altura;

    @Column(name = "pressao_arterial")
    private String pressaoArterial;

    public Prontuario(Paciente paciente, Medico medico, Consulta consulta, DadosRegistroProntuario dados) {
        this.paciente = paciente;
        this.medico = medico;
        this.consulta = consulta;
        this.dataRegistro = LocalDateTime.now();
        this.queixaPrincipal = dados.queixaPrincipal();
        this.diagnostico = dados.diagnostico();
        this.prescricao = dados.prescricao();
        this.observacoes = dados.observacoes();
        this.peso = dados.peso();
        this.altura = dados.altura();
        this.pressaoArterial = dados.pressaoArterial();
    }
}

