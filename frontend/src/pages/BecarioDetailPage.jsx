import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Descriptions, Table, Tag, Button, Space, Typography, Modal, Form, Select,
  Input, Upload, Popconfirm, DatePicker, Progress, Row, Col, Statistic, Timeline, Alert, InputNumber
} from 'antd';
import {
  ArrowLeftOutlined, UploadOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined,
  EditOutlined, ProjectOutlined, AlertOutlined, DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { becarioApi } from '../api/becarioApi';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney, personName } from '../utils/downloadFile';
import {
  ETAPAS_OPERATIVAS, BITACORA_TIPOS, etapaMeta, riskBand, riskBandLabel
} from '../utils/expedienteHelpers';
import { INDICE_MINIMO } from '../utils/academicConstants';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const BecarioDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotifications();
  const { hasRole, user } = useAuth();
  const canEdit = hasRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO');

  const [becario, setBecario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [bitacoraModalVisible, setBitacoraModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);

  const [uploadForm] = Form.useForm();
  const [enrollForm] = Form.useForm();
  const [bitacoraForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchBecarioDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await becarioApi.getExpediente(id);
      if (res.success) setBecario(res.data);
    } catch (err) {
      showError('Error al cargar expediente: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    fetchBecarioDetail();
  }, [fetchBecarioDetail]);

  const handleUploadDocument = async (values) => {
    if (fileList.length === 0) {
      showError('Selecciona un archivo.');
      return;
    }
    const formData = new FormData();
    formData.append('becario_id', id);
    formData.append('tipo_documento', values.tipo_documento);
    if (values.fecha_vencimiento) {
      formData.append('fecha_vencimiento', values.fecha_vencimiento.format('YYYY-MM-DD'));
    }
    formData.append('archivo', fileList[0].originFileObj);

    try {
      const res = await becarioApi.uploadDoc(formData);
      if (res.success) {
        showSuccess('Documento registrado en el expediente');
        setUploadModalVisible(false);
        uploadForm.resetFields();
        setFileList([]);
        fetchBecarioDetail();
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await becarioApi.deleteDoc(docId);
      showSuccess('Documento eliminado');
      fetchBecarioDetail();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleEnrollSubject = async (values) => {
    try {
      await becarioApi.enrollSubject(id, values);
      showSuccess('Materia inscrita');
      setEnrollModalVisible(false);
      enrollForm.resetFields();
      fetchBecarioDetail();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleAddBitacora = async (values) => {
    try {
      await becarioApi.addBitacora(id, {
        ...values,
        fecha: values.fecha ? values.fecha.format('YYYY-MM-DD') : undefined,
        autor: user?.username || user?.nombre || 'Equipo FRP'
      });
      showSuccess('Nota agregada a la bitácora');
      setBitacoraModalVisible(false);
      bitacoraForm.resetFields();
      fetchBecarioDetail();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleChangeEtapa = async (etapa) => {
    try {
      await becarioApi.setEtapa(id, etapa);
      showSuccess('Etapa operativa actualizada');
      fetchBecarioDetail();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await becarioApi.update(id, values);
      showSuccess('Expediente actualizado');
      setEditModalVisible(false);
      fetchBecarioDetail();
    } catch (err) {
      if (err.message) showError(err.message);
    }
  };

  if (loading || !becario) return <Card loading />;

  const persona = becario.persona || {};
  const etapa = etapaMeta(becario.etapa_operativa);
  const risk = riskBand(becario);
  const checklist = becario.checklist || { items: [], porcentaje: 0, incompleto: true };

  const academicColumns = [
    { title: 'Código', dataIndex: ['materia', 'codigo'] },
    { title: 'Materia', dataIndex: ['materia', 'nombre'] },
    { title: 'Créditos', dataIndex: ['materia', 'creditos'] },
    { title: 'Ciclo', dataIndex: ['ciclo', 'nombre'] },
    {
      title: 'Calificación',
      dataIndex: 'calificacion',
      render: (cal) => (cal != null ? parseFloat(cal).toFixed(2) : 'Pendiente')
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (est) => {
        const colors = { EN_CURSO: 'blue', APROBADA: 'green', REPROBADA: 'red', RETIRADA: 'orange' };
        return <Tag color={colors[est] || 'default'}>{est}</Tag>;
      }
    }
  ];

  const docColumns = [
    { title: 'Archivo', dataIndex: 'nombre_archivo' },
    { title: 'Tipo', dataIndex: 'tipo_documento', render: (t) => <Tag color="geekblue">{t}</Tag> },
    {
      title: 'Subida',
      dataIndex: 'fecha_subida',
      render: (d) => (d ? new Date(d).toLocaleDateString('es-DO') : '—')
    },
    {
      title: 'Vence',
      dataIndex: 'fecha_vencimiento',
      render: (d) => d || '—'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (record) => (
        <Space>
          {record.download_url && (
            <Button size="small" icon={<DownloadOutlined />} href={record.download_url} target="_blank" rel="noreferrer">
              Ver
            </Button>
          )}
          {canEdit && (
            <Popconfirm title="¿Eliminar?" onConfirm={() => handleDeleteDocument(record.id)}>
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const pagoColumns = [
    { title: 'Concepto', dataIndex: 'concepto', render: (c) => String(c || '').toUpperCase() },
    { title: 'Monto', dataIndex: 'monto', render: (m) => `RD$ ${formatMoney(m)}` },
    { title: 'Vencimiento', dataIndex: 'fecha_vencimiento' },
    { title: 'Fecha pago', dataIndex: 'fecha_pago', render: (fp) => fp || '—' },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (e) => {
        const colors = { pagado: 'green', pendiente: 'orange', atrasado: 'red', vencido: 'red' };
        return <Tag color={colors[e] || 'default'}>{String(e || '').toUpperCase()}</Tag>;
      }
    }
  ];

  const tabItems = [
    {
      key: 'resumen',
      label: 'Resumen',
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic title="Índice acumulado" value={becario.promedio_general != null ? Number(becario.promedio_general) : 'N/D'} precision={2} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic title="Índice cuatrimestral" value={becario.indice_cuatrimestral != null ? Number(becario.indice_cuatrimestral) : 'N/D'} precision={2} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic title="Docs completos" value={`${checklist.completos || 0}/${checklist.total || 5}`} />
                <Progress percent={checklist.porcentaje || 0} size="small" status={checklist.incompleto ? 'exception' : 'success'} />
              </Card>
            </Col>
          </Row>
          {risk !== 'ok' && risk !== 'sin_indice' && (
            <Alert
              type={risk === 'critico' ? 'error' : 'warning'}
              showIcon
              style={{ marginBottom: 16 }}
              message={`Riesgo académico: ${riskBandLabel(risk)} (mínimo requerido ${INDICE_MINIMO})`}
            />
          )}
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Universidad">{becario.universidad?.nombre || becario.universidad_nombre || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Carrera">{becario.carrera?.nombre || becario.carrera_nombre || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Centro">{becario.centro_origen || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Matrícula">{becario.matricula || 'N/D'}</Descriptions.Item>
            <Descriptions.Item label="Estado beca">{becario.estado_beca}</Descriptions.Item>
            <Descriptions.Item label="Grad. liceo">{becario.estado_graduacion_liceo || 'Pendiente'}</Descriptions.Item>
            <Descriptions.Item label="Etapa operativa">
              <Tag color={etapa.color}>{etapa.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Padrinos">
              {(becario.padrinos || []).length
                ? becario.padrinos.map((p) => personName(p)).join(', ')
                : 'Por asignar'}
            </Descriptions.Item>
          </Descriptions>
        </>
      )
    },
    {
      key: 'datos',
      label: 'Datos personales',
      children: (
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Nombre">{persona.nombre}</Descriptions.Item>
          <Descriptions.Item label="Apellido">{persona.apellido}</Descriptions.Item>
          <Descriptions.Item label="Cédula">{persona.cedula}</Descriptions.Item>
          <Descriptions.Item label="Email">{persona.email}</Descriptions.Item>
          <Descriptions.Item label="Teléfono">{persona.telefono || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Dirección">{persona.direccion || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Fecha selección">{becario.fecha_seleccion || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Ciclo actual">{becario.ciclo_actual || 'N/A'}</Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'academico',
      label: 'Historial académico',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            {canEdit && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setEnrollModalVisible(true)}>
                Inscribir materia
              </Button>
            )}
          </div>
          <Table dataSource={becario.materias_cursadas || []} columns={academicColumns} rowKey="id" pagination={false} />
        </>
      )
    },
    {
      key: 'documentos',
      label: 'Documentos / checklist',
      children: (
        <>
          <Card size="small" title="Checklist obligatorio" style={{ marginBottom: 16 }}>
            <Row gutter={[12, 12]}>
              {(checklist.items || []).map((item) => (
                <Col xs={24} sm={12} md={8} key={item.tipo}>
                  <Card size="small" type="inner">
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Text strong>{item.label}</Text>
                      {item.presente && !item.vencido && <Tag color="green">Completo</Tag>}
                      {item.presente && item.vencido && <Tag color="orange">Vencido</Tag>}
                      {!item.presente && <Tag color="red">Falta</Tag>}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
            <Progress percent={checklist.porcentaje || 0} style={{ marginTop: 12 }} status={checklist.incompleto ? 'active' : 'success'} />
          </Card>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            {canEdit && (
              <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
                Subir documento
              </Button>
            )}
          </div>
          <Table dataSource={becario.documentos || []} columns={docColumns} rowKey="id" pagination={false} />
        </>
      )
    },
    {
      key: 'padrinos',
      label: 'Padrinos',
      children: (
        <>
          <Table
            dataSource={becario.padrinos || []}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: 'Sin padrino asignado' }}
            columns={[
              { title: 'Nombre', render: (_, r) => personName(r) },
              { title: 'Razón social', dataIndex: 'razon_social' },
              {
                title: 'Compromiso',
                dataIndex: 'monto_compromiso',
                render: (m) => `RD$ ${formatMoney(m)}`
              },
              {
                title: '',
                render: (_, r) => (
                  <Button size="small" onClick={() => navigate(`/padrinos/${r.id}`)}>Ver padrino</Button>
                )
              }
            ]}
          />
          <Title level={5} style={{ marginTop: 24 }}>Aportes vinculados</Title>
          <Table
            size="small"
            dataSource={becario.aportes_padrinos || []}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            columns={[
              { title: 'Fecha', dataIndex: 'fecha_recepcion' },
              { title: 'Monto', dataIndex: 'monto', render: (m) => `RD$ ${formatMoney(m)}` },
              { title: 'Medio', dataIndex: 'medio_pago' },
              { title: 'Ref.', dataIndex: 'referencia' }
            ]}
          />
        </>
      )
    },
    {
      key: 'pagos',
      label: 'Pagos',
      children: (
        <Table dataSource={becario.pagos || []} columns={pagoColumns} rowKey="id" pagination={false} />
      )
    },
    {
      key: 'alarmas',
      label: `Alarmas (${(becario.alarmas || []).length})`,
      children: (
        <Table
          dataSource={becario.alarmas || []}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'Sin alarmas vinculadas' }}
          columns={[
            {
              title: 'Nivel',
              dataIndex: 'nivel',
              render: (n) => <Tag color={n === 'critico' ? 'red' : n === 'medio' ? 'orange' : 'blue'}>{String(n || '').toUpperCase()}</Tag>
            },
            { title: 'Título', dataIndex: 'titulo', render: (t, r) => t || r.tipo },
            { title: 'Estado', dataIndex: 'estado', render: (e) => <Tag>{String(e || '').toUpperCase()}</Tag> },
            {
              title: '',
              render: () => (
                <Button size="small" icon={<AlertOutlined />} onClick={() => navigate('/alarmas')}>
                  Centro de alarmas
                </Button>
              )
            }
          ]}
        />
      )
    },
    {
      key: 'bitacora',
      label: `Bitácora (${(becario.bitacora || []).length})`,
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            {canEdit && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                bitacoraForm.setFieldsValue({ tipo: 'nota', fecha: dayjs() });
                setBitacoraModalVisible(true);
              }}>
                Nueva nota
              </Button>
            )}
          </div>
          {(becario.bitacora || []).length === 0 ? (
            <Paragraph type="secondary">Aún no hay seguimiento registrado. Agrega llamadas, WhatsApp, tutorías o notas.</Paragraph>
          ) : (
            <Timeline
              items={(becario.bitacora || []).map((entry) => ({
                color: entry.tipo === 'whatsapp' ? 'green' : entry.tipo === 'llamada' ? 'blue' : 'gray',
                children: (
                  <div>
                    <Space wrap>
                      <Text strong>{entry.fecha}</Text>
                      <Tag>{entry.tipo}</Tag>
                      <Text type="secondary">{entry.autor}</Text>
                      {canEdit && (
                        <Popconfirm title="¿Eliminar nota?" onConfirm={async () => {
                          await becarioApi.deleteBitacora(id, entry.id);
                          fetchBecarioDetail();
                        }}>
                          <Button size="small" type="link" danger>Eliminar</Button>
                        </Popconfirm>
                      )}
                    </Space>
                    <div>{entry.nota}</div>
                  </div>
                )
              }))}
            />
          )}
        </>
      )
    }
  ];

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/becarios')}>Volver</Button>
        <Button icon={<ProjectOutlined />} onClick={() => navigate('/kanban')}>Ver en Kanban</Button>
        <Button icon={<DollarOutlined />} onClick={() => navigate('/financiero')}>Financiero</Button>
        {canEdit && (
          <Button icon={<EditOutlined />} onClick={() => {
            editForm.setFieldsValue({
              nombre: persona.nombre,
              apellido: persona.apellido,
              cedula: persona.cedula,
              email: persona.email,
              telefono: persona.telefono,
              direccion: persona.direccion,
              centro_origen: becario.centro_origen,
              matricula: becario.matricula,
              estado_beca: becario.estado_beca,
              estado_graduacion_liceo: becario.estado_graduacion_liceo,
              promedio_general: becario.promedio_general,
              indice_cuatrimestral: becario.indice_cuatrimestral,
              etapa_operativa: becario.etapa_operativa
            });
            setEditModalVisible(true);
          }}>
            Editar expediente
          </Button>
        )}
      </Space>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>{persona.nombre} {persona.apellido}</Title>
            <Text type="secondary">
              Cédula: {persona.cedula} | Email: {persona.email}
              {becario.matricula ? ` | Matrícula: ${becario.matricula}` : ''}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                <Text type="secondary">Etapa:</Text>
                <Select
                  value={becario.etapa_operativa}
                  style={{ minWidth: 200 }}
                  disabled={!canEdit}
                  onChange={handleChangeEtapa}
                  options={ETAPAS_OPERATIVAS.map((e) => ({ value: e.key, label: e.label }))}
                />
              </Space>
            </div>
          </div>
          <Space wrap>
            <Tag color={risk === 'ok' ? 'green' : risk === 'bajo' ? 'orange' : risk === 'critico' ? 'volcano' : 'default'} style={{ fontSize: 14, padding: '4px 12px' }}>
              Índice acum.: {becario.promedio_general != null ? Number(becario.promedio_general).toFixed(2) : 'N/A'}
            </Tag>
            {becario.indice_cuatrimestral != null && (
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                Cuatr.: {Number(becario.indice_cuatrimestral).toFixed(2)}
              </Tag>
            )}
            <Tag color={etapa.color} style={{ fontSize: 14, padding: '4px 12px' }}>{etapa.label}</Tag>
            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>{becario.estado_beca}</Tag>
          </Space>
        </div>
      </Card>

      <Card>
        <Tabs defaultActiveKey="resumen" items={tabItems} />
      </Card>

      <Modal title="Subir documento" open={uploadModalVisible} onOk={() => uploadForm.submit()} onCancel={() => setUploadModalVisible(false)} destroyOnHidden>
        <Form form={uploadForm} layout="vertical" onFinish={handleUploadDocument}>
          <Form.Item name="tipo_documento" label="Tipo" rules={[{ required: true }]}>
            <Select placeholder="Seleccionar">
              <Option value="CEDULA">Cédula</Option>
              <Option value="CERTIFICADO_ESTUDIOS">Certificado de estudios</Option>
              <Option value="TITULO_BACHILLER">Título de bachiller</Option>
              <Option value="RECORD_NOTAS">Récord de notas</Option>
              <Option value="ACTA_NACIMIENTO">Acta de nacimiento</Option>
              <Option value="OTRO">Otro</Option>
            </Select>
          </Form.Item>
          <Form.Item name="fecha_vencimiento" label="Vencimiento (opcional)">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="Archivo" required>
            <Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList: fl }) => setFileList(fl)} maxCount={1}>
              <Button icon={<UploadOutlined />}>Seleccionar</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Inscribir materia" open={enrollModalVisible} onOk={() => enrollForm.submit()} onCancel={() => setEnrollModalVisible(false)} destroyOnHidden>
        <Form form={enrollForm} layout="vertical" onFinish={handleEnrollSubject}>
          <Form.Item name="codigo" label="Código" rules={[{ required: true }]}>
            <Input placeholder="MAT-100" />
          </Form.Item>
          <Form.Item name="nombre" label="Nombre materia" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="creditos" label="Créditos" initialValue={3}>
            <InputNumber style={{ width: '100%' }} min={0} max={12} />
          </Form.Item>
          <Form.Item name="ciclo_nombre" label="Ciclo" initialValue="2026-1">
            <Input />
          </Form.Item>
          <Form.Item name="materia_id" initialValue={Date.now()} hidden><Input /></Form.Item>
          <Form.Item name="ciclo_id" initialValue={1} hidden><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Nueva nota de bitácora" open={bitacoraModalVisible} onOk={() => bitacoraForm.submit()} onCancel={() => setBitacoraModalVisible(false)} destroyOnHidden>
        <Form form={bitacoraForm} layout="vertical" onFinish={handleAddBitacora}>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Select options={BITACORA_TIPOS} />
          </Form.Item>
          <Form.Item name="fecha" label="Fecha" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="nota" label="Nota" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Detalle del seguimiento..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Editar expediente" open={editModalVisible} onOk={handleSaveEdit} onCancel={() => setEditModalVisible(false)} width={640} destroyOnHidden>
        <Form form={editForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}><Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="apellido" label="Apellido" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="cedula" label="Cédula"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="matricula" label="Matrícula"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="telefono" label="Teléfono"><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="direccion" label="Dirección"><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="centro_origen" label="Centro de origen"><Input /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="estado_beca" label="Estado beca">
                <Select options={['ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'FINALIZADA'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="etapa_operativa" label="Etapa">
                <Select options={ETAPAS_OPERATIVAS.map((e) => ({ value: e.key, label: e.label }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="promedio_general" label="Índice acumulado"><InputNumber style={{ width: '100%' }} min={0} max={4} step={0.01} /></Form.Item></Col>
            <Col span={12}><Form.Item name="indice_cuatrimestral" label="Índice cuatrimestral"><InputNumber style={{ width: '100%' }} min={0} max={4} step={0.01} /></Form.Item></Col>
            <Col span={24}><Form.Item name="estado_graduacion_liceo" label="Estado graduación liceo"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default BecarioDetailPage;
