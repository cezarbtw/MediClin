package med.voll.api.domain.consulta;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    boolean existsByPacienteIdAndDataBetween(Long idPaciente, LocalDateTime primeiroHorario, LocalDateTime ultimoHorario);

    boolean existsByMedicoIdAndDataAndMotivoCancelamentoIsNull(Long idMedico, LocalDateTime data);

    @EntityGraph(attributePaths = {"medico", "paciente"})
    Page<Consulta> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"medico", "paciente"})
    List<Consulta> findAllByDataBetween(LocalDateTime inicio, LocalDateTime fim);

    @EntityGraph(attributePaths = {"medico", "paciente"})
    List<Consulta> findAll();
}
