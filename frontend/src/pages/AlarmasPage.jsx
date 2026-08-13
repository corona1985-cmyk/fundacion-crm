import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Typography, Space, message, Modal, Form, Input, Select, Row, Col, Statistic, Tabs, DatePicker } from 'antd';
import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, AlertOutlined, PlusOutlined, CalendarOutlined, AuditOutlined } from '@ant-design/icons';
import { alarmaApi } from '../api/alarmaApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const AlarmasPage = () => {
  const [alarmas, setAlarmas] = useState([]);
  const [summary, setSummary] = useState({ pendientes: 0, criticos: 0, medios: 0, bajos: 0 });
  const [loading, setLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState('pendiente');
  const [filterNivel, setFilterNivel] = useState(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [atenderModalVisible, setAtenderModalVisible] = useState(false);
  const [descartarModalVisible, setDescartarModalVisible] = useState(false);
  const [selectedAlarma, setSelectedAlarma] = useState(null);

  const [formCreate] = Form.useForm();
  const [formAtender] = Form.useForm();
  const [formDescartar] = Form.useForm();

  const { hasRole } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        alarmaApi.getAll({ estado: filterEstado || undefined, nivel: filterNivel || undefined, limit: 100 }),
        alarmaApi.getSummary()
      ]);

      if (listRes.success) {
        setAlarmas(listRes.data || []);
      }
      if (summaryRes.success) {
        setSummary(summaryRes.data || {});
      }
    } catch (error) {
      message.error(error.message || 'Error al cargar el centro de alarmas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterEstado, filterNivel]);

  const handleCreateAlarma = async (values) => {
    try {
      const payload = {
        ...values,
        fecha_evento: values.fecha_evento ? values.fecha_evento.format('YYYY-MM-DD') : null
      };
      const res = await alarmaApi.create(payload);
      if (res.data?.success || res.success) {
        message.success('Alarma creada exitosamente');
        setCreateModalVisible(false);
        formCreate.resetFields();
        loadData();
      }
    } catch (err) {
      message.error(err.message || 'Error al crear alarma');
    }
  };

  const handleManualSweep = async () => {
    try {
      setLoading(true);
      const res = await alarmaApi.evaluar();
      if (res.success) {
        message.success('Evaluación de reglas ejecutada correctamente');
        loadData();
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAtender = async () => {
    try {
      const values = await formAtender.validateFields();
      const res = await alarmaApi.atender(selectedAlarma.id, values);
      if (res.success) {
        message.success('Alarma marcada como atendida');
        setAtenderModalVisible(false);
        formAtender.resetFields();
        loadData();
      }
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleDescartar = async () => {
    try {
      const values = await formDescartar.validateFields();
      const res = await alarmaApi.descartar(selectedAlarma.id, values);
      if (res.success) {
        message.success('Alarma descartada');
        setDescartarModalVisible(false);
        formDescartar.resetFields();
        loadData();
      }
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const columns = [
    {
      title: 'Severidad',
      dataIndex: 'nivel',
      render: (nivel) => {
        const colors = { critico: 'red', medio: 'orange', bajo: 'blue' };
        return <Tag color={colors[nivel] || 'default'}>{nivel?.toUpperCase()}</Tag>;
      }
    },
    { title: 'Título / Asunto', dataIndex: 'titulo', render: (t) => <Text strong>{t}</Text> },
    { title: 'Descripción', dataIndex: 'descripcion' },
    {
      title: '📅 Fecha Evento / Graduación',
      dataIndex: 'fecha_evento',
      render: (fe) => fe ? <Tag color="purple"><CalendarOutlined /> {fe}</Tag> : <Text type="secondary">N/A</Text>
    },
    { title: 'Fecha Registro', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString() },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (est) => {
        const colors = { pendiente: 'volcano', atendida: 'green', descartada: 'default' };
        return <Tag color={colors[est]}>{est?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (record) => (
        record.estado === 'pendiente' && hasRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO') ? (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setSelectedAlarma(record);
                setAtenderModalVisible(true);
              }}
            >
              Atender
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setSelectedAlarma(record);
                setDescartarModalVisible(true);
              }}
            >
              Descartar
            </Button>
          </Space>
        ) : (
          record.resolucion_nota ? <Text type="secondary">{record.resolucion_nota}</Text> : null
        )
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <BellOutlined style={{ color: '#ff4d4f', marginRight: 12 }} />
          Centro de Notificaciones y Alarmas
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            Crear Nueva Alarma
          </Button>
          <Button icon={<SyncOutlined />} onClick={handleManualSweep} loading={loading}>
            Evaluar Reglas Ahora
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Total Pendientes" value={summary.pendientes || 0} prefix={<AlertOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Nivel Crítico" value={summary.criticos || 0} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Nivel Medio" value={summary.medios || 0} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Nivel Bajo" value={summary.bajos || 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="1" type="card">
        <TabPane tab={<span><BellOutlined /> TODAS LAS ALARMAS</span>} key="1">
          {/* Filter Bar */}
          <Card style={{ marginBottom: 16 }}>
            <Space wrap>
              <Select value={filterEstado} onChange={setFilterEstado} style={{ width: 160 }}>
                <Option value="pendiente">Pendientes</Option>
                <Option value="atendida">Atendidas</Option>
                <Option value="descartada">Descartadas</Option>
              </Select>
              <Select placeholder="Severidad" allowClear value={filterNivel} onChange={setFilterNivel} style={{ width: 160 }}>
                <Option value="critico">Crítico</Option>
                <Option value="medio">Medio</Option>
                <Option value="bajo">Bajo</Option>
              </Select>
            </Space>
          </Card>

          <Card>
            <Table
              dataSource={alarmas}
              columns={columns}
              rowKey="id"
              loading={loading}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><CalendarOutlined style={{ color: '#722ed1' }} /> 🎓 CALENDARIO DE GRADUACIONES DE LICEOS</span>} key="2">
          <Card title="Itinerario de Actos de Graduación y Entrega de Solicitudes">
            <Table
              dataSource={alarmas.filter(a => a.tipo === 'GRADUACION_PROXIMA')}
              columns={[
                { title: 'Evento / Becario', dataIndex: 'titulo', render: (t) => <Text strong style={{ color: '#722ed1' }}>{t}</Text> },
                {
                  title: '📅 Fecha de Graduación',
                  dataIndex: 'fecha_evento',
                  render: (fe) => fe ? <Tag color="purple" style={{ fontSize: 14, padding: '4px 8px' }}><CalendarOutlined /> {fe}</Tag> : <Text type="secondary">Fecha no especificada</Text>
                },
                { title: 'Detalles / Politécnico', dataIndex: 'descripcion' },
                {
                  title: 'Estado',
                  dataIndex: 'estado',
                  render: (est) => {
                    const colors = { pendiente: 'volcano', atendida: 'green', descartada: 'default' };
                    return <Tag color={colors[est]}>{est?.toUpperCase()}</Tag>;
                  }
                },
                {
                  title: 'Acciones',
                  key: 'acciones',
                  render: (record) => (
                    record.estado === 'pendiente' && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => {
                          setSelectedAlarma(record);
                          setAtenderModalVisible(true);
                        }}
                      >
                        Confirmar / Atender
                      </Button>
                    )
                  )
                }
              ]}
              rowKey="id"
              loading={loading}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Modal Atender Alarma */}
      <Modal
        title={`Atender Alarma: ${selectedAlarma?.titulo || ''}`}
        open={atenderModalVisible}
        onOk={handleAtender}
        onCancel={() => setAtenderModalVisible(false)}
        destroyOnHidden
      >
        <Form form={formAtender} layout="vertical">
          <Form.Item name="resolucion_nota" label="Nota de Resolución / Seguimiento Tomado" rules={[{ required: true, message: 'Ingrese una nota' }]}>
            <Input.TextArea rows={3} placeholder="Describa la solución o acción tomada (ej. estudiante citado a tutoría, pago registrado en banco)." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Descartar Alarma */}
      <Modal
        title={`Descartar Alarma: ${selectedAlarma?.titulo || ''}`}
        open={descartarModalVisible}
        onOk={handleDescartar}
        onCancel={() => setDescartarModalVisible(false)}
        destroyOnHidden
      >
        <Form form={formDescartar} layout="vertical">
          <Form.Item name="resolucion_nota" label="Justificación de Descarte" rules={[{ required: true, message: 'Ingrese justificación' }]}>
            <Input.TextArea rows={3} placeholder="Motivo por el cual se descarta esta alerta." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Crear Nueva Alarma */}
      <Modal
        title="Crear Nueva Alarma o Notificación Personalizada"
        open={createModalVisible}
        onOk={() => formCreate.submit()}
        onCancel={() => setCreateModalVisible(false)}
        destroyOnHidden
      >
        <Form form={formCreate} layout="vertical" onFinish={handleCreateAlarma}>
          <Form.Item name="titulo" label="Título / Asunto de la Alarma" rules={[{ required: true, message: 'Ingrese el título' }]}>
            <Input placeholder="Ej. Graduación de Liceo - Politécnico Canadá" />
          </Form.Item>
          <Form.Item name="tipo" label="Tipo de Alarma / Evento" initialValue="GRADUACION_PROXIMA" rules={[{ required: true }]}>
            <Select>
              <Option value="GRADUACION_PROXIMA">🎓 Graduación Próxima de Liceo / Politécnico</Option>
              <Option value="PROMEDIO_BAJO">⚠️ Bajo Índice Académico</Option>
              <Option value="DOCUMENTO_VENCIDO">📄 Documentación Vencida / Pendiente</Option>
              <Option value="PAGO_VENCIDO">💳 Pago Vencido a Universidad</Option>
              <Option value="APORTE_RETRASADO">💰 Aporte de Padrino Retrasado</Option>
            </Select>
          </Form.Item>
          <Form.Item name="nivel" label="Nivel de Severidad" initialValue="medio" rules={[{ required: true }]}>
            <Select>
              <Option value="critico">🔴 Crítico (Urgente)</Option>
              <Option value="medio">🟠 Medio (Importante)</Option>
              <Option value="bajo">🔵 Bajo (Informativo)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="fecha_evento" label="📅 Fecha de la Graduación / Evento">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Seleccione fecha de la graduación" />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción / Detalles del Evento">
            <Input.TextArea rows={3} placeholder="Detalles de la graduación, fecha, hora, requerimientos de vestimenta o entrega de certificado." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlarmasPage;
