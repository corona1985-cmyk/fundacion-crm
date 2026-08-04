import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Typography, Space, message, Modal, Form, Input, Select, Row, Col, Statistic } from 'antd';
import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, AlertOutlined } from '@ant-design/icons';
import { alarmaApi } from '../api/alarmaApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const AlarmasPage = () => {
  const [alarmas, setAlarmas] = useState([]);
  const [summary, setSummary] = useState({ pendientes: 0, criticos: 0, medios: 0, bajos: 0 });
  const [loading, setLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState('pendiente');
  const [filterNivel, setFilterNivel] = useState(null);

  const [atenderModalVisible, setAtenderModalVisible] = useState(false);
  const [descartarModalVisible, setDescartarModalVisible] = useState(false);
  const [selectedAlarma, setSelectedAlarma] = useState(null);

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
    { title: 'Fecha Generación', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleString() },
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
        <Button icon={<SyncOutlined />} onClick={handleManualSweep} loading={loading}>
          Evaluar Reglas Ahora
        </Button>
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
    </div>
  );
};

export default AlarmasPage;
