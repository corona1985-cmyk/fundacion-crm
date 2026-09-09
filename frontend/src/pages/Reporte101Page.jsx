import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, Card, Col, Divider, Form, Input, List, Row, Select, Space, Table, Tag, Typography, message, Popconfirm
} from 'antd';
import {
  FileTextOutlined, PrinterOutlined, SaveOutlined, DownloadOutlined, DeleteOutlined, EyeOutlined
} from '@ant-design/icons';
import { becarioApi } from '../api/becarioApi';
import { padrinoApi } from '../api/padrinoApi';
import {
  buildReporte101,
  deleteSavedReporte101,
  downloadReporte101Html,
  getCentroMeta,
  getTernaPostulacion,
  getUnconfirmedFields,
  listCentros,
  listSavedReportes101,
  openPrintableReporte101,
  renderReporte101Html,
  saveCentroMeta,
  saveReporte101
} from '../utils/reporte101';

const { Title, Text, Paragraph } = Typography;

const Reporte101Page = () => {
  const [loading, setLoading] = useState(true);
  const [becarios, setBecarios] = useState([]);
  const [padrinos, setPadrinos] = useState([]);
  const [centro, setCentro] = useState(null);
  const [year] = useState(2026);
  const [saved, setSaved] = useState([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [report, setReport] = useState(null);
  const [form] = Form.useForm();

  const buildForCentro = (centroName, metaPatch = {}) => {
    const meta = { ...getCentroMeta(centroName), ...metaPatch };
    return buildReporte101({
      centroName,
      becarios,
      padrinos,
      year,
      metaOverride: meta
    });
  };

  const applyReport = (built) => {
    setReport(built);
    setPreviewHtml(renderReporte101Html(built, { forPrint: false }));
    form.setFieldsValue({
      director: built.meta.director === 'Por confirmar' ? '' : built.meta.director,
      fecha_acto: built.meta.fecha_acto === 'Por confirmar' ? '' : built.meta.fecha_acto,
      hora: built.meta.hora || '4:00 PM',
      lugar: built.meta.lugar || '',
      anio_integracion: built.meta.anio_integracion || 'Afiliado Activo',
      honores: built.meta.honores || '',
      notas: built.meta.notas || ''
    });
  };

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      try {
        const [becRes, padRes] = await Promise.all([
          becarioApi.getAll({ page: 1, limit: 1000 }),
          padrinoApi.getAll({ page: 1, limit: 500 })
        ]);
        const becRows = becRes?.data?.becarios || [];
        const padRows = padRes?.data?.padrinos || [];
        setBecarios(becRows);
        setPadrinos(padRows);
        setSaved(listSavedReportes101());

        const centros = listCentros(becRows);
        const preferred = centros.find((c) => /canad/i.test(c.nombre) && c.tiene_terna_2026)
          || centros.find((c) => c.tiene_terna_2026)
          || centros[0];
        if (preferred) {
          setCentro(preferred.nombre);
        }
      } catch (err) {
        message.error('No se pudieron cargar los datos para el Reporte 101');
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  // Auto-generate when center + data ready
  useEffect(() => {
    if (!centro || loading || !becarios.length) return;
    const built = buildForCentro(centro);
    applyReport(built);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centro, becarios, padrinos, loading]);

  const centrosOptions = useMemo(
    () => listCentros(becarios).map((c) => ({
      value: c.nombre,
      label: `${c.nombre} · terna ${c.terna_count} · ${c.total} en CRM`
    })),
    [becarios]
  );

  const unconfirmed = useMemo(() => {
    if (!report) return getUnconfirmedFields(getCentroMeta(centro || ''));
    return report.unconfirmed || [];
  }, [report, centro]);

  const ternaPreview = useMemo(() => getTernaPostulacion(centro || ''), [centro]);

  const onCentroChange = (value) => {
    setCentro(value);
    setPreviewHtml('');
    setReport(null);
  };

  const generate = async () => {
    if (!centro) {
      message.warning('Seleccione un centro educativo');
      return null;
    }
    const values = await form.validateFields().catch(() => form.getFieldsValue());
    const metaPatch = {
      director: values.director,
      fecha_acto: values.fecha_acto,
      hora: values.hora,
      lugar: values.lugar,
      anio_integracion: values.anio_integracion,
      honores: values.honores,
      notas: values.notas
    };
    saveCentroMeta(centro, metaPatch);
    const built = buildForCentro(centro, metaPatch);
    applyReport(built);
    return built;
  };

  const handlePreview = async () => {
    const built = await generate();
    if (built) {
      message.success(
        `101 listo: ${built.premiados.length} ganador(es) confirmado(s), ${built.terna.length} en terna`
      );
    }
  };

  const handleSave = async () => {
    const built = await generate();
    if (!built) return;
    setSaved(saveReporte101(built));
    message.success('Informe 101 guardado');
  };

  const handlePrint = async () => {
    const built = await generate();
    if (!built) return;
    openPrintableReporte101(built);
  };

  const handleDownload = async () => {
    const built = await generate();
    if (!built) return;
    downloadReporte101Html(built);
    message.success('HTML descargado');
  };

  const openSaved = (item) => {
    setCentro(item.centro);
    applyReport(item);
    message.info(`Cargado: ${item.centro}`);
  };

  const removeSaved = (id) => {
    setSaved(deleteSavedReporte101(id));
    message.success('Informe eliminado');
  };

  const premiadoColumns = [
    { title: 'Ganador/a confirmado', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Carrera', dataIndex: 'carrera', key: 'carrera' },
    { title: 'Universidad', dataIndex: 'universidad_corta', key: 'uni' },
    { title: 'Padrino', dataIndex: 'padrino', key: 'padrino' }
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          <FileTextOutlined style={{ color: '#E53935', marginRight: 10 }} />
          Reporte 101 — Graduaciones por Centro
        </Title>
        <Text type="secondary">
          Solo elige el centro. Ganadores = confirmados en la BD. Terna = postulación 2026. Lo no confirmado se pide a mano.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Generar por centro" loading={loading}>
            <Form form={form} layout="vertical">
              <Form.Item label="Centro educativo" required>
                <Select
                  showSearch
                  optionFilterProp="label"
                  value={centro}
                  options={centrosOptions}
                  onChange={onCentroChange}
                  placeholder="Seleccione politécnico o liceo"
                />
              </Form.Item>

              {ternaPreview.length > 0 ? (
                <Alert
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={`Terna 2026 cargada (${ternaPreview.length})`}
                  description={ternaPreview.map((t) => t.nombre).join(' · ')}
                />
              ) : (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Este centro no tiene terna en el Excel de postulación 2026"
                />
              )}

              {unconfirmed.length > 0 ? (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Datos no confirmados — completar solo estos"
                  description="Director, fecha u otros datos del acto que aún no están en la base."
                />
              ) : (
                <Alert
                  type="success"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Datos del acto confirmados"
                  description="No hace falta llenar nada manual para este centro."
                />
              )}

              {unconfirmed.some((f) => f.key === 'director') && (
                <Form.Item name="director" label="Director(a)" rules={[{ required: true, message: 'Indique el director/a' }]}>
                  <Input placeholder="Nombre del director/a del centro" />
                </Form.Item>
              )}
              {unconfirmed.some((f) => f.key === 'fecha_acto') && (
                <Form.Item name="fecha_acto" label="Fecha del acto" rules={[{ required: true, message: 'Indique la fecha' }]}>
                  <Input placeholder="Ej. Viernes 14 de Agosto 2026" />
                </Form.Item>
              )}
              {(unconfirmed.some((f) => f.key === 'hora') || unconfirmed.some((f) => f.key === 'lugar')) && (
                <Row gutter={12}>
                  {unconfirmed.some((f) => f.key === 'hora') && (
                    <Col span={8}>
                      <Form.Item name="hora" label="Hora">
                        <Input placeholder="4:00 PM" />
                      </Form.Item>
                    </Col>
                  )}
                  {unconfirmed.some((f) => f.key === 'lugar') && (
                    <Col span={16}>
                      <Form.Item name="lugar" label="Lugar">
                        <Input placeholder="Salón / Ayuntamiento" />
                      </Form.Item>
                    </Col>
                  )}
                </Row>
              )}
              {unconfirmed.some((f) => f.key === 'anio_integracion') && (
                <Form.Item name="anio_integracion" label="Año / integración">
                  <Input placeholder="Ej. 2025" />
                </Form.Item>
              )}

              {/* Always allow optional notes/honores tweak without requiring them */}
              <Form.Item name="honores" label="Honores (opcional)">
                <Input.TextArea rows={2} placeholder="Solo si desea ajustar el texto de honores" />
              </Form.Item>
              <Form.Item name="notas" label="Notas (opcional)">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Form>

            <Space wrap>
              <Button type="primary" icon={<EyeOutlined />} onClick={handlePreview}>
                Actualizar vista 101
              </Button>
              <Button icon={<SaveOutlined />} onClick={handleSave}>
                Guardar
              </Button>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                Imprimir / PDF
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                Descargar HTML
              </Button>
            </Space>
          </Card>

          <Card title="Informes 101 guardados" style={{ marginTop: 16 }}>
            <List
              locale={{ emptyText: 'Aún no hay informes guardados' }}
              dataSource={saved}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button key="open" type="link" onClick={() => openSaved(item)}>Abrir</Button>,
                    <Button key="print" type="link" onClick={() => openPrintableReporte101(item)}>Imprimir</Button>,
                    <Popconfirm key="del" title="¿Eliminar informe?" onConfirm={() => removeSaved(item.id)}>
                      <Button type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={item.centro}
                    description={`${new Date(item.guardado_en || item.generado_en).toLocaleString('es-DO')} · ${item.totales?.premiados || 0} ganador(es)`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <span>Vista previa Reporte 101</span>
                {report ? <Tag color="red">{report.centro}</Tag> : null}
              </Space>
            }
            extra={report ? (
              <Space>
                <Tag color="gold">{report.totales.premiados} ganadores</Tag>
                <Tag color="purple">{report.totales.terna} terna</Tag>
                <Tag color="blue">{report.totales.actuales} actuales</Tag>
                <Tag color="green">{report.totales.egresados} egresados</Tag>
              </Space>
            ) : null}
          >
            {!previewHtml ? (
              <Paragraph type="secondary" style={{ margin: 0 }}>
                Seleccione un centro. El sistema arma el 101 solo: ganadores confirmados en CRM + terna del Excel 2026.
              </Paragraph>
            ) : (
              <>
                {report?.premiados?.length ? (
                  <>
                    <Title level={5} style={{ marginTop: 0 }}>Ganadores confirmados en BD</Title>
                    <Table
                      size="small"
                      pagination={false}
                      rowKey="id"
                      columns={premiadoColumns}
                      dataSource={report.premiados}
                      style={{ marginBottom: 12 }}
                    />
                  </>
                ) : (
                  <Alert
                    style={{ marginBottom: 12 }}
                    type="warning"
                    showIcon
                    message="Aún no hay ganadores confirmados en la base para este centro"
                    description="Se muestra la terna completa de postulación 2026. Cuando el ganador esté en el CRM, aparecerá automáticamente."
                  />
                )}
                <Divider style={{ margin: '12px 0' }} />
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#f8fafc',
                    maxHeight: '75vh'
                  }}
                >
                  <iframe
                    title="Vista Reporte 101"
                    srcDoc={previewHtml}
                    style={{ width: '100%', height: '70vh', border: 0, background: '#fff' }}
                  />
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reporte101Page;
