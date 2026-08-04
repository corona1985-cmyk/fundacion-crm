import React, { useState, useEffect } from 'react';
import { Table, Card, Tabs, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, message, Typography } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { padrinoApi } from '../api/padrinoApi';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;
const { Option } = Select;

const PadrinosPage = () => {
  const [padrinos, setPadrinos] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(false);

  const [padrinoModalVisible, setPadrinoModalVisible] = useState(false);
  const [institucionModalVisible, setInstitucionModalVisible] = useState(false);
  const [formPadrino] = Form.useForm();
  const [formInstitucion] = Form.useForm();

  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [padRes, instRes] = await Promise.all([
        padrinoApi.getAll({ limit: 100 }),
        padrinoApi.getInstituciones()
      ]);

      if (padRes.success) setPadrinos(padRes.data?.padrinos || []);
      if (instRes.success) setInstituciones(instRes.data || []);
    } catch (error) {
      message.error(error.message || 'Error al cargar padrinos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePadrino = async () => {
    try {
      const values = await formPadrino.validateFields();
      await padrinoApi.create(values);
      message.success('Padrino registrado correctamente');
      setPadrinoModalVisible(false);
      formPadrino.resetFields();
      loadData();
    } catch (error) {
      if (error.message) message.error(error.message);
    }
  };

  const handleCreateInstitucion = async () => {
    try {
      const values = await formInstitucion.validateFields();
      await padrinoApi.createInstitucion(values);
      message.success('Institución registrada correctamente');
      setInstitucionModalVisible(false);
      formInstitucion.resetFields();
      loadData();
    } catch (error) {
      if (error.message) message.error(error.message);
    }
  };

  const padrinoColumns = [
    {
      title: 'Nombre / Razón Social',
      key: 'nombre',
      render: (record) => record.tipo === 'juridica' ? record.razon_social : `${record.persona?.nombre || ''} ${record.persona?.apellido || ''}`
    },
    { title: 'Tipo', dataIndex: 'tipo', render: (t) => <Tag color={t === 'natural' ? 'blue' : 'purple'}>{t.toUpperCase()}</Tag> },
    { title: 'Cédula / RNC', dataIndex: ['persona', 'cedula'] },
    { title: 'Email', dataIndex: ['persona', 'email'] },
    { title: 'Compromiso', dataIndex: 'monto_compromiso', render: (m) => `RD$ ${parseFloat(m || 0).toLocaleString()}` },
    { title: 'Frecuencia', dataIndex: 'frecuencia', render: (f) => f.toUpperCase() },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => navigate(`/padrinos/${record.id}`)}
        >
          Ver Detalle
        </Button>
      )
    }
  ];

  const institucionColumns = [
    { title: 'Nombre Institución', dataIndex: 'nombre' },
    { title: 'Contacto', dataIndex: 'contacto' },
    { title: 'Teléfono', dataIndex: 'telefono' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Estado', dataIndex: 'activo', render: (act) => <Tag color={act ? 'green' : 'red'}>{act ? 'ACTIVA' : 'INACTIVA'}</Tag> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Padrinos e Instituciones Públicas</Title>
        <Space>
          {hasRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO') && (
            <>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setPadrinoModalVisible(true)}>
                Nuevo Padrino
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => setInstitucionModalVisible(true)}>
                Nueva Institución
              </Button>
            </>
          )}
        </Space>
      </div>

      <Card>
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Padrinos Estudiantiles" key="1">
            <Table
              dataSource={padrinos}
              columns={padrinoColumns}
              rowKey="id"
              loading={loading}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Instituciones Públicas (Gubernamentales)" key="2">
            <Table
              dataSource={instituciones}
              columns={institucionColumns}
              rowKey="id"
              loading={loading}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Modal Nuevo Padrino */}
      <Modal
        title="Registrar Nuevo Padrino"
        open={padrinoModalVisible}
        onOk={handleCreatePadrino}
        onCancel={() => setPadrinoModalVisible(false)}
        destroyOnClose
        width={600}
      >
        <Form form={formPadrino} layout="vertical">
          <Form.Item name="tipo" label="Tipo de Padrino" initialValue="natural" rules={[{ required: true }]}>
            <Select>
              <Option value="natural">Persona Natural</Option>
              <Option value="juridica">Persona Jurídica (Empresa)</Option>
            </Select>
          </Form.Item>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item name="nombre" label="Nombre Contac." rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="apellido" label="Apellido Contac." rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Space>

          <Form.Item name="razon_social" label="Razón Social (si es empresa)">
            <Input placeholder="Grupo Industrial del Cibao S.A." />
          </Form.Item>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item name="cedula" label="Cédula / RNC" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input />
            </Form.Item>
          </Space>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item name="monto_compromiso" label="Monto Compromiso (RD$)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 240 }} />
            </Form.Item>

            <Form.Item name="frecuencia" label="Frecuencia" initialValue="mensual">
              <Select style={{ width: 240 }}>
                <Option value="mensual">Mensual</Option>
                <Option value="trimestral">Trimestral</Option>
                <Option value="anual">Anual</Option>
                <Option value="unico">Único</Option>
              </Select>
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* Modal Nueva Institución */}
      <Modal
        title="Registrar Institución Pública"
        open={institucionModalVisible}
        onOk={handleCreateInstitucion}
        onCancel={() => setInstitucionModalVisible(false)}
        destroyOnClose
      >
        <Form form={formInstitucion} layout="vertical">
          <Form.Item name="nombre" label="Nombre Institución" rules={[{ required: true }]}>
            <Input placeholder="Ministerio de Educación Superior (MESCYT)" />
          </Form.Item>
          <Form.Item name="contacto" label="Persona de Contacto">
            <Input />
          </Form.Item>
          <Form.Item name="telefono" label="Teléfono">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PadrinosPage;
