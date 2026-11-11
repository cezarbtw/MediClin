package med.voll.api.controller;

import med.voll.api.domain.endereco.DadosEndereco;
import med.voll.api.domain.medico.DadosAtualizacaoMedico;
import med.voll.api.domain.medico.DadosCadastroMedico;
import med.voll.api.domain.medico.Especialidade;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureJsonTesters
@ActiveProfiles("test")
@Transactional
class AuditoriaControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JacksonTester<DadosCadastroMedico> dadosCadastroMedicoJson;

    @Autowired
    private JacksonTester<DadosAtualizacaoMedico> dadosAtualizacaoMedicoJson;

    @Test
    @DisplayName("Deveria bloquear acesso ao painel de auditoria para usuario nao autenticado")
    void auditoriaSemAutenticacao() throws Exception {
        var response = mvc.perform(get("/auditoria")).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
    }

    @Test
    @DisplayName("Deveria negar acesso ao painel de auditoria para perfil RECEPCIONISTA")
    @WithMockUser(username = "recepcao@mediclin.med", roles = "RECEPCIONISTA")
    void auditoriaRecepcionistaNegado() throws Exception {
        var response = mvc.perform(get("/auditoria")).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
    }

    @Test
    @DisplayName("Deveria negar acesso ao painel de auditoria para perfil MEDICO")
    @WithMockUser(username = "medico@mediclin.med", roles = "MEDICO")
    void auditoriaMedicoNegado() throws Exception {
        var response = mvc.perform(get("/auditoria")).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
    }

    @Test
    @DisplayName("Deveria permitir consulta ao painel de auditoria para ADMIN e rastrear gravacoes via API")
    @WithMockUser(username = "admin.chefe@mediclin.med", roles = "ADMIN")
    void auditoriaAdminIntegracaoCompleta() throws Exception {
        var cadastro = new DadosCadastroMedico(
                "Dr. Trilha Auditoria",
                "trilha@mediclin.med",
                "11999990000",
                "987654",
                Especialidade.ORTOPEDIA,
                new DadosEndereco("Av Paulista", "Bela Vista", "01310100", "Sao Paulo", "SP", "1500", null)
        );

        var postResponse = mvc.perform(post("/medicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dadosCadastroMedicoJson.write(cadastro).getJson()))
                .andReturn().getResponse();

        assertThat(postResponse.getStatus()).isEqualTo(HttpStatus.CREATED.value());
        assertThat(postResponse.getContentAsString()).contains("\"criadoPor\":\"admin.chefe@mediclin.med\"");
        assertThat(postResponse.getContentAsString()).contains("\"atualizadoPor\":\"admin.chefe@mediclin.med\"");

        var auditResponse = mvc.perform(get("/auditoria?entidade=MEDICO&usuario=admin.chefe"))
                .andReturn().getResponse();

        assertThat(auditResponse.getStatus()).isEqualTo(HttpStatus.OK.value());
        assertThat(auditResponse.getContentAsString()).contains("Dr. Trilha Auditoria");
        assertThat(auditResponse.getContentAsString()).contains("\"criadoPor\":\"admin.chefe@mediclin.med\"");

        // Atualiza o registro e valida o retorno de atualização
        var atualizacao = new DadosAtualizacaoMedico(null, "Dr. Trilha Atualizado", "11988881111", null);
        // Extrai ID do POST via regex simples no JSON de resposta
        String idStr = postResponse.getContentAsString().replaceAll(".*\"id\":(\\d+).*", "$1");
        Long idMedico = Long.valueOf(idStr);

        var putResponse = mvc.perform(put("/medicos/" + idMedico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dadosAtualizacaoMedicoJson.write(atualizacao).getJson()))
                .andReturn().getResponse();

        assertThat(putResponse.getStatus()).isEqualTo(HttpStatus.OK.value());
        assertThat(putResponse.getContentAsString()).contains("\"nome\":\"Dr. Trilha Atualizado\"");
        assertThat(putResponse.getContentAsString()).contains("\"atualizadoPor\":\"admin.chefe@mediclin.med\"");
    }
}
