import React, { useState, useEffect } from 'react';
import { Table, Card, Tabs, Button, Tag, Modal, Form, Input, InputNumber, Select, Space, Progress, Descriptions, message, Typography, Popconfirm } from 'antd';
import { PlusOutlined, CheckCircleOutlined, DollarOutlined, PieChartOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { financieroApi } from '../api/financieroApi';
import { becarioApi } from '../api/becarioApi';
import { reporteApi } from '../api/reporteApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const FinancieroPage = () => {
  const [pagos, setPagos] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [resumen, setResumen] = useState({});
  const [becarios, setBecarios] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [pagoModalVisible, setPagoModalVisible] = useState(false);
  const [marcarModalVisible, setMarcarModalVisible] = useState(false);
  const [presupuestoModalVisible, setPresupuestoModalVisible] = useState(false);
  const [selectedPago, setSelectedPago] = useState(null);

  const [formPago] = Form.useForm();
  const [formMarcar] = Form.useForm();
  const [formPresupuesto] = Form.useForm();

  const { hasRole } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [pagosRes, presRes, resumenRes, becRes] = await Promise.all([
        financieroApi.getPagos({ limit: 100 }),
        financieroApi.getEjecucionPresupuesto({ anio: 2026 }),
        financieroApi.getResumenFinanciero(),
        becarioApi.getAll({ limit: 100 })
      ]);

      if (pagosRes.success) setPagos(pagosRes.data?.pagos || []);
      if (presRes.success) setPresupuestos(presRes.data || []);
      if (resumenRes.success) setResumen(resumenRes.data || {});
      if (becRes.success) setBecarios(becRes.data?.becarios || []);
    } catch (error) {
      message.error(error.message || 'Error al cargar módulo financiero');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePago = async () => {
    try {
      const values = await formPago.validateFields();
      const res = await financieroApi.createPago(values);
      if (res.success) {
        message.success('Pago creado exitosamente');
        setPagoModalVisible(false);
        formPago.resetFields();
        loadData();
      }
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleMarcarPagado = async () => {
    try {
      const values = await formMarcar.validateFields();
      const res = await financieroApi.marcarPagado(selectedPago.id, values);
      if (res.success) {
        message.success('Pago registrado como pagado');
        setMarcarModalVisible(false);
        formMarcar.resetFields();
        loadData();
      }
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleCreatePresupuesto = async () => {
    try {
      const values = await formPresupuesto.validateFields();
      const res = await financieroApi.createPresupuesto(values);
      if (res.success) {
        message.success('Presupuesto asignado exitosamente');
        setPresupuestoModalVisible(false);
        formPresupuesto.resetFields();
        loadData();
      }
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const pagoColumns = [
    {
      title: 'Becario',
      key: 'becario',
      render: (r) => `${r.becario?.persona?.nombre || ''} ${r.becario?.persona?.apellido || ''}`
    },
    { title: 'Concepto', dataIndex: 'concepto', render: (c) => c?.toUpperCase() },
    { title: 'Monto', dataIndex: 'monto', render: (m) => `RD$ ${parseFloat(m).toLocaleString()}` },
    { title: 'Vencimiento', dataIndex: 'fecha_vencimiento' },
    { title: 'Fecha Pago', dataIndex: 'fecha_pago', render: (fp) => fp || '-' },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (e) => {
        const colors = { pagado: 'green', pendiente: 'orange', atrasado: 'red' };
        return <Tag color={colors[e]}>{e?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (record) => (
        record.estado !== 'pagado' && hasRole('ADMINISTRADOR', 'FINANCIERO') ? (
          <Button
            type="primary"
            ghost
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setSelectedPago(record);
              setMarcarModalVisible(true);
            }}
          >
            Pagar
          </Button>
        ) : null
      )
    }
  ];

  const presupuestoColumns = [
    { title: 'Categoría', dataIndex: 'categoria', render: (c) => c.toUpperCase() },
    { title: 'Año / Mes', key: 'periodo', render: (r) => `${r.anio} / ${r.mes}` },
    { title: 'Monto Asignado', dataIndex: 'monto_asignado', render: (m) => `RD$ ${parseFloat(m).toLocaleString()}` },
    { title: 'Monto Ejecutado', dataIndex: 'monto_ejecutado', render: (m) => `RD$ ${parseFloat(m).toLocaleString()}` },
    { title: 'Disponible', dataIndex: 'disponible', render: (d) => `RD$ ${parseFloat(d).toLocaleString()}` },
    {
      title: '% Ejecución',
      dataIndex: 'porcentaje_ejecucion',
      render: (pct) => <Progress percent={pct} size="small" status={pct > 100 ? 'exception' : 'active'} />
    }
  ];

  const tabItems = [
    {
      key: '1',
      label: 'Pagos a Universidades',
      children: (
        <Table
          dataSource={pagos}
          columns={pagoColumns}
          rowKey="id"
          loading={loading}
        />
      )
    },
    {
      key: '2',
      label: 'Presupuesto y Ejecución',
      children: (
        <Table
          dataSource={presupuestos}
          columns={presupuestoColumns}
          rowKey="id"
          loading={loading}
        />
      )
    },
    {
      key: '3',
      label: 'Resumen Consolidado',
      children: (
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Ingresos Totales (Aportes)">
            RD$ {parseFloat(resumen.ingresos_totales || 0).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Pagos Universitarios Realizados">
            RD$ {parseFloat(resumen.pagos_becas || 0).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Gastos Administrativos">
            RD$ {parseFloat(resumen.gastos_admin || 0).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Balance Disponible">
            <Text type={resumen.balance >= 0 ? 'success' : 'danger'} strong>
              RD$ {parseFloat(resumen.balance || 0).toLocaleString()}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Gestión Financiera</Title>
        <Space>
          <Button icon={<FileExcelOutlined />} onClick={() => reporteApi.exportExcel('financiero')}>
            Excel
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => reporteApi.exportPdf('financiero')}>
            PDF
          </Button>
          {hasRole('ADMINISTRADOR', 'FINANCIERO') && (
            <>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setPagoModalVisible(true)}>
                Nuevo Pago Univ.
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => setPresupuestoModalVisible(true)}>
                Asignar Presupuesto
              </Button>
            </>
          )}
        </Space>
      </div>

      <Card>
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Card>

      {/* Modal Nuevo Pago */}
      <Modal
        title="Registrar Nuevo Pago Universitario"
        open={pagoModalVisible}
        onOk={handleCreatePago}
        onCancel={() => setPagoModalVisible(false)}
        destroyOnHidden
      >
        <Form form={formPago} layout="vertical">
          <Form.Item name="becario_id" label="Becario" rules={[{ required: true, message: 'Seleccione becario' }]}>
            <Select placeholder="Seleccionar Becario" showSearch optionFilterProp="children">
              {becarios.map(b => (
                <Option key={b.id} value={b.id}>
                  {b.persona?.nombre} {b.persona?.apellido} - {b.persona?.cedula}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="concepto" label="Concepto" rules={[{ required: true }]}>
            <Select placeholder="Seleccionar">
              <Option value="inscripcion">Inscripción</Option>
              <Option value="mensualidad">Mensualidad</Option>
              <Option value="matricula">Matrícula</Option>
              <Option value="otro">Otro Concepto</Option>
            </Select>
          </Form.Item>

          <Form.Item name="monto" label="Monto (RD$)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="fecha_vencimiento" label="Fecha de Vencimiento (YYYY-MM-DD)" rules={[{ required: true }]}>
            <Input placeholder="2026-02-15" />
          </Form.Item>

          <Form.Item name="observaciones" label="Observaciones">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Marcar Pagado */}
      <Modal
        title="Confirmar Pago Realizado"
        open={marcarModalVisible}
        onOk={handleMarcarPagado}
        onCancel={() => setMarcarModalVisible(false)}
        destroyOnHidden
      >
        <Form form={formMarcar} layout="vertical">
          <Form.Item name="fecha_pago" label="Fecha de Pago (YYYY-MM-DD)" initialValue={new Date().toISOString().split('T')[0]}>
            <Input />
          </Form.Item>

          <Form.Item name="comprobante" label="Número de Comprobante / Recibo">
            <Input placeholder="REC-998877" />
          </Form.Item>

          <Form.Item name="observaciones" label="Observaciones">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Asignar Presupuesto */}
      <Modal
        title="Asignar Presupuesto Mensual"
        open={presupuestoModalVisible}
        onOk={handleCreatePresupuesto}
        onCancel={() => setPresupuestoModalVisible(false)}
        destroyOnHidden
      >
        <Form form={formPresupuesto} layout="vertical">
          <Form.Item name="categoria" label="Categoría" initialValue="becas" rules={[{ required: true }]}>
            <Select>
              <Option value="becas">Becas Estudiantiles</Option>
              <Option value="administrativo">Gastos Administrativos</Option>
              <Option value="operativo">Gastos Operativos</Option>
              <Option value="otros">Otros Egresos</Option>
            </Select>
          </Form.Item>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item name="anio" label="Año" initialValue={2026} rules={[{ required: true }]}>
              <InputNumber style={{ width: 140 }} />
            </Form.Item>

            <Form.Item name="mes" label="Mes (1-12)" initialValue={1} rules={[{ required: true }]}>
              <InputNumber min={1} max={12} style={{ width: 140 }} />
            </Form.Item>

            <Form.Item name="monto_asignado" label="Monto Asignado (RD$)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 180 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default FinancieroPage;
