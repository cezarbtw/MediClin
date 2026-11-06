/**
 * Utilitário de Exportação de Dados em CSV
 * 
 * Formata os dados com delimitador ';' padrão brasileiro, com cabeçalhos estruturados
 * e prefixo Byte Order Mark (\uFEFF) para garantia de compatibilidade com UTF-8 no
 * Microsoft Excel, LibreOffice Calc e Google Planilhas sem caracteres corrompidos.
 */

function sanitizarCampo(valor) {
  if (valor === null || valor === undefined) return '""';
  const str = String(valor).trim();
  // Se contiver aspas, ponto e vírgula ou quebra de linha, envolve em aspas e duplica aspas internas
  const escapado = str.replace(/"/g, '""');
  return `"${escapado}"`;
}

export function baixarCsv(nomeArquivo, colunas, linhas) {
  const BOM = '\uFEFF';
  const cabecalho = colunas.map((c) => sanitizarCampo(c.label || c.titulo || c.key)).join(';');

  const corpo = linhas.map((linha) => {
    return colunas
      .map((c) => {
        let val;
        if (typeof c.formatar === 'function') {
          val = c.formatar(linha[c.key], linha);
        } else {
          val = linha[c.key];
        }
        return sanitizarCampo(val);
      })
      .join(';');
  }).join('\r\n');

  const conteudoCsv = `${BOM}${cabecalho}\r\n${corpo}`;
  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta listagem de Médicos cadastrados
 */
export function exportarMedicosCsv(medicos = []) {
  const colunas = [
    { key: 'id', label: 'ID' },
    { key: 'nome', label: 'Nome Completo' },
    { key: 'crm', label: 'CRM' },
    { key: 'especialidade', label: 'Especialidade' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'email', label: 'E-mail' },
    {
      key: 'ativo',
      label: 'Status',
      formatar: (ativo) => (ativo === false ? 'Inativo' : 'Ativo'),
    },
    {
      key: 'cidade',
      label: 'Cidade/UF',
      formatar: (_, m) => (m.endereco?.cidade ? `${m.endereco.cidade}/${m.endereco.uf || ''}` : '—'),
    },
  ];

  const dataHora = new Date().toISOString().slice(0, 10);
  baixarCsv(`medicos_mediclin_${dataHora}.csv`, colunas, medicos);
}

/**
 * Exporta listagem de Pacientes cadastrados
 */
export function exportarPacientesCsv(pacientes = []) {
  const colunas = [
    { key: 'id', label: 'ID' },
    { key: 'nome', label: 'Nome Completo' },
    { key: 'cpf', label: 'CPF' },
    { key: 'email', label: 'E-mail' },
    { key: 'telefone', label: 'Telefone' },
    {
      key: 'tipoSanguineo',
      label: 'Tipo Sanguíneo',
      formatar: (v) => v || 'Não informado',
    },
    {
      key: 'convenio',
      label: 'Convênio / Plano',
      formatar: (v) => v || 'Particular',
    },
    {
      key: 'ativo',
      label: 'Status',
      formatar: (ativo) => (ativo === false ? 'Inativo' : 'Ativo'),
    },
  ];

  const dataHora = new Date().toISOString().slice(0, 10);
  baixarCsv(`pacientes_mediclin_${dataHora}.csv`, colunas, pacientes);
}

/**
 * Exporta listagem de Consultas com filtros aplicados
 */
export function exportarConsultasCsv(consultas = []) {
  const colunas = [
    { key: 'id', label: 'Código' },
    {
      key: 'data',
      label: 'Data',
      formatar: (dt, c) => {
        const val = dt || c.dataHora;
        if (!val) return '—';
        const d = new Date(val);
        return isNaN(d) ? val.slice(0, 10) : d.toLocaleDateString('pt-BR');
      },
    },
    {
      key: 'hora',
      label: 'Horário',
      formatar: (_, c) => {
        const val = c.data || c.dataHora;
        if (!val) return '—';
        const d = new Date(val);
        return isNaN(d) ? val.slice(11, 16) : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      },
    },
    { key: 'pacienteNome', label: 'Paciente' },
    { key: 'medicoNome', label: 'Médico Responsável' },
    {
      key: 'especialidade',
      label: 'Especialidade',
      formatar: (esp) => esp || 'Clínica Geral',
    },
    {
      key: 'status',
      label: 'Status',
      formatar: (st, c) => st || (c.motivoCancelamento ? 'CANCELADA' : 'AGENDADA'),
    },
    {
      key: 'motivoCancelamento',
      label: 'Motivo Cancelamento',
      formatar: (motivo) => motivo || '—',
    },
  ];

  const dataHora = new Date().toISOString().slice(0, 10);
  baixarCsv(`relatorio_consultas_mediclin_${dataHora}.csv`, colunas, consultas);
}

/**
 * Exporta resumo executivo de métricas do Dashboard
 */
export function exportarMetricasCsv(metricas, rotuloPeriodo = 'Mês Atual') {
  const linhas = [
    { indicador: 'Período de Análise', valor: rotuloPeriodo },
    { indicador: 'Total de Consultas', valor: metricas.totalConsultas || 0 },
    { indicador: 'Consultas no Período Selecionado', valor: metricas.consultasMesAtual || 0 },
    { indicador: 'Consultas no Período Anterior', valor: metricas.consultasMesAnterior || 0 },
    { indicador: 'Crescimento Percentual', valor: `${metricas.crescimentoPercentual > 0 ? '+' : ''}${metricas.crescimentoPercentual || 0}%` },
    { indicador: 'Consultas Agendadas', valor: metricas.consultasAgendadas || 0 },
    { indicador: 'Consultas Realizadas', valor: metricas.consultasRealizadas || 0 },
    { indicador: 'Consultas Canceladas', valor: metricas.consultasCanceladas || 0 },
    { indicador: 'Taxa de Cancelamento', valor: `${metricas.taxaCancelamento || 0}%` },
    { indicador: 'Médicos Ativos', valor: metricas.totalMedicosAtivos || 0 },
    { indicador: 'Pacientes Ativos', valor: metricas.totalPacientesAtivos || 0 },
    { indicador: 'Média de Consultas por Médico', valor: metricas.mediaConsultasPorMedico || 0 },
  ];

  if (metricas.consultasPorEspecialidade) {
    linhas.push({ indicador: '--- ESPECIALIDADES ---', valor: '---' });
    Object.entries(metricas.consultasPorEspecialidade).forEach(([esp, qtd]) => {
      linhas.push({ indicador: `Especialidade: ${esp}`, valor: qtd });
    });
  }

  if (metricas.cancelamentosPorMotivo) {
    linhas.push({ indicador: '--- MOTIVOS DE CANCELAMENTO ---', valor: '---' });
    Object.entries(metricas.cancelamentosPorMotivo).forEach(([motivo, qtd]) => {
      linhas.push({ indicador: `Motivo: ${motivo}`, valor: qtd });
    });
  }

  const colunas = [
    { key: 'indicador', label: 'Indicador / Métrica' },
    { key: 'valor', label: 'Valor Consolidado' },
  ];

  const dataHora = new Date().toISOString().slice(0, 10);
  baixarCsv(`metricas_executivas_mediclin_${dataHora}.csv`, colunas, linhas);
}
