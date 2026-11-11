package med.voll.api.domain.prontuario;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProntuarioRepository extends JpaRepository<Prontuario, Long> {
    @EntityGraph(attributePaths = {"paciente", "medico"})
    List<Prontuario> findAll();

    Page<Prontuario> findByPacienteIdOrderByDataRegistroDesc(Long pacienteId, Pageable pageable);
    List<Prontuario> findByPacienteIdOrderByDataRegistroDesc(Long pacienteId);
    Optional<Prontuario> findByConsultaId(Long consultaId);
}

