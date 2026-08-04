import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Table, Button, Space, Typography, Spin, Modal, Form, InputNumber, Input, Select, DatePicker, message } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DollarOutlined } from '@ant-design/icons';
import { padrinoApi } from '../api/padrinoApi';
import { becarioApi } from '../api/becarioApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const PadrinoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [padrino, setPadrino] = useState(null);
  const [aportes, setAportes] = useState([]);
  const [allBecarios, setAllBecarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [aporteModalVisible, setAporteModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [formAporte] = Form.useForm();
  const [formAssign] = Form.useForm();

  const loadPadrinoDetail = async () => {
    setLoading(true);
    try {
      const res = await padrinoApi.getById(id);
      if (res.success) {
        setPadrino(res.data);
      }
      const aportesRes = await padrinoApi.getAportes({ padrino_id: id });
      if (aportesRes.success) setAportes(aportesRes.data?.aportes || []);
    } catch (error) {
      message.error(error.message || 'Error al cargar detalle del padrino');
    } finally {
      setLoading(false);
    }
  };

  const loadBecariosList = async () => {
    try {
      const res = await becarioApi.getAll({ limit: 100 });
      if (res.success) setAllBecarios(res.data?.becarios || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  useEffect(() => {
    loadPadrinoDetail();
    loadBecariosList();
  }, [id]);

  const handleRegisterAporte = async (values) => {
    try {
      await padrinoApi.createAportePadrino(id, values);
      message.success('Aporte financiero registrado exitosamente');
      setAporteModalVisible(false);
      formAporte.resetFields();
      loadPadrinoDetail();
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleAssignBecario = async (values) => {
    try {
      await padrinoApi.assignPadrinoToBecario(values.becario_id, {
        padrino_id: id,
        observaciones: values.observaciones
      });
      message.success('Estudiante asignado al padrino exitosamente');
      setAssignModalVisible(false);
      formAssign.resetFields();
      loadPadrinoDetail();
    } catch (error) {
      message.error(error.message);
    }
  };

  if (loading || !padrino) {
    return <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  const persona = padrino.persona || {};
  const isJuridica = padrino.tipo === 'juridica';
  const displayName = isJuridica ? padrino.razon_social : `${persona.nombre} ${persona.apellido}`;

  const aporteColumns = [
    { title: 'Fecha Recepción', dataIndex: 'fecha_recepcion' },
    { title: 'Monto', dataIndex: 'monto', render: (m) => `RD$ ${parseFloat(m).toLocaleString()}` },
    { title: 'Medio de Pago', dataIndex: 'medio_pago', render: (mp) => <Tag color="blue">{mp?.toUpperCase()}</Tag> },
    { title: 'Referencia', dataIndex: 'referencia', render: (r) => r || '-' },
    { title: 'Observaciones', dataIndex: 'observaciones', render: (o) => o || '-' }
  ];

  const becarioColumns = [
    {
      title: 'Estudiante',
      key: 'nombre',
      render: (record) => `${record.persona?.nombre || ''} ${record.persona?.apellido || ''}`
    },
    { title: 'Universidad', dataIndex: ['universidad', 'nombre'] },
    { title: 'Carrera', dataIndex: ['carrera', 'nombre'] },
    {
      title: 'Acción',
      key: 'accion',
      render: (record) => (
        <Button size="small" onClick={() => navigate(`/becarios/${record.id}`)}>
          Ver Expediente
        </Button>
      )
    }
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/padrinos')} style={{ marginBottom: 16 }}>
        Volver a Padrinos
      </Button>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>{displayName}</Title>
            <Text type="secondary">Cédula/RNC: {persona.cedula} | Tipo: {padrino.tipo.toUpperCase()}</Text>
          </div>
          <Space>
            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
              Total Aportado: RD$ {parseFloat(padrino.total_aportado || 0).toLocaleString()}
            </Tag>
            <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>
              Compromiso: RD$ {parseFloat(padrino.monto_compromiso || 0).toLocaleString()} ({padrino.frecuencia})
            </Tag>
          </Space>
        </div>
      </Card>

      <Card title="Historial de Aportes Financieros Recibidos" extra={
        hasRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO') && (
          <Button type="primary" icon={<DollarOutlined />} onClick={() => setAporteModalVisible(true)}>
            Registrar Aporte
          </Button>
        )
      } style={{ marginBottom: 24 }}>
        <Table
          dataSource={aportes}
          columns={aporteColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Card title="Estudiantes Becados Asignados" extra={
        hasRole('ADMINISTRADOR', 'COORDINADOR') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAssignModalVisible(true)}>
            Asignar Becario
          </Button>
        )
      }>
        <Table
          dataSource={padrino.becarios || []}
          columns={becarioColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* Modal Registrar Aporte */}
      <Modal
        title="Registrar Nuevo Aporte del Padrino"
        open={aporteModalVisible}
        onOk={() => formAporte.submit()}
        onCancel={() => setAporteModalVisible(false)}
        destroyOnClose
      >
        <Form form={formAporte} layout="vertical" onFinish={handleRegisterAporte}>
          <Form.Item name="monto" label="Monto Recibido (RD$)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="medio_pago" label="Medio de Pago" initialValue="transferencia" rules={[{ required: true }]}>
            <Select>
              <Option value="transferencia">Transferencia Bancaria</Option>
              <Option value="cheque">Cheque</Option>
              <Option value="efectivo">Efectivo</Option>
            </Select>
          </Form.Item>
          <Form.Item name="referencia" label="Referencia Bancaria">
            <Input placeholder="TRF-99887766" />
          </Form.Item>
          <Form.Item name="observaciones" label="Observaciones">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Asignar Becario */}
      <Modal
        title="Asignar Becario a este Padrino"
        open={assignModalVisible}
        onOk={() => formAssign.submit()}
        onCancel={() => setAssignModalVisible(false)}
        destroyOnClose
      >
        <Form form={formAssign} layout="vertical" onFinish={handleAssignBecario}>
          <Form.Item name="becario_id" label="Seleccionar Becario" rules={[{ required: true }]}>
            <Select placeholder="Seleccionar Becario">
              {allBecarios.map(b => (
                <Option key={b.id} value={b.id}>{b.persona?.nombre} {b.persona?.apellido} ({b.universidad?.nombre})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="observaciones" label="Observaciones de la asignación">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PadrinoDetailPage;
