import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag, Spin, message, Button, Space } from 'antd';
import {
  UserOutlined, TeamOutlined, DollarOutlined, BellOutlined, ArrowUpOutlined, ArrowDownOutlined,
  WarningOutlined, FileProtectOutlined, TrophyOutlined, ProjectOutlined, AlertOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { becarioApi } from '../api/becarioApi';
import { padrinoApi } from '../api/padrinoApi';
import { financieroApi } from '../api/financieroApi';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    becariosCount: 0,
    padrinosCount: 0,
    totalIngresos: 0,
    totalEgresos: 0,
  });
  const [shortcuts, setShortcuts] = useState({});
  const [chartData, setChartData] = useState([]);
  const [overduePagos, setOverduePagos] = useState([]);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [becariosRes, padrinosRes, resumenRes, vencidosRes, shortRes] = await Promise.all([
        becarioApi.getAll({ limit: 1 }),
        padrinoApi.getAll({ limit: 1 }),
        financieroApi.getResumenFinanciero(),
        financieroApi.getPagosVencidos(),
        becarioApi.getDashboardShortcuts()
      ]);

      setKpis({
        becariosCount: becariosRes.data?.pagination?.total_items || 0,
        padrinosCount: padrinosRes.data?.pagination?.total_items || 0,
        totalIngresos: resumenRes.data?.total_ingresos || 0,
        totalEgresos: resumenRes.data?.total_egresos || 0
      });
      setOverduePagos(vencidosRes.data || []);
      setShortcuts(shortRes.data || {});
      setChartData([
        {
          name: 'Total Financiero',
          Ingresos: resumenRes.data?.total_ingresos || 0,
          Egresos: resumenRes.data?.total_egresos || 0
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      message.error('No se pudo cargar el panel.', 6);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const columns = [
    {
      title: 'Becario',
      dataIndex: ['becario', 'persona'],
      render: (persona, row) => (persona ? `${persona.nombre} ${persona.apellido}` : (row.becario_id ? `#${row.becario_id}` : 'N/A'))
    },
    { title: 'Monto', dataIndex: 'monto', render: (monto) => `RD$ ${parseFloat(monto || 0).toLocaleString()}` },
    { title: 'Vencimiento', dataIndex: 'fecha_vencimiento' },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (estado) => <Tag color="error">{String(estado || '').toUpperCase()}</Tag>
    },
    {
      title: '',
      render: (row) => row.becario_id ? (
        <Button size="small" type="link" onClick={() => navigate(`/becarios/${row.becario_id}`)}>Expediente</Button>
      ) : null
    }
  ];

  const shortcutCards = [
    { title: 'Índice bajo / riesgo', value: shortcuts.riesgo_academico || 0, color: '#fa8c16', icon: <WarningOutlined />, onClick: () => navigate('/kanban?modo=riesgo') },
    { title: 'Pagos vencidos', value: shortcuts.pagos_vencidos || 0, color: '#cf1322', icon: <DollarOutlined />, onClick: () => navigate('/financiero') },
    { title: 'Docs incompletos', value: shortcuts.docs_incompletos || 0, color: '#722ed1', icon: <FileProtectOutlined />, onClick: () => navigate('/kanban') },
    { title: 'En graduación', value: shortcuts.graduaciones || 0, color: '#13c2c2', icon: <TrophyOutlined />, onClick: () => navigate('/kanban') },
    { title: 'Alarmas pendientes', value: shortcuts.alarmas_pendientes || 0, color: '#ff4d4f', icon: <AlertOutlined />, onClick: () => navigate('/alarmas') },
    { title: 'Kanban (activos)', value: shortcuts.activos || 0, color: '#1890ff', icon: <ProjectOutlined />, onClick: () => navigate('/kanban') }
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Panel de Control (Dashboard)</Title>
        <Space wrap>
          <Button type="primary" icon={<ProjectOutlined />} onClick={() => navigate('/kanban')}>Kanban</Button>
          <Button onClick={() => navigate('/becarios')}>Becarios</Button>
          <Button onClick={() => navigate('/alarmas')}>Alarmas</Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {shortcutCards.map((item) => (
          <Col xs={24} sm={12} md={8} lg={4} key={item.title}>
            <Card hoverable onClick={item.onClick} styles={{ body: { padding: 14 } }}>
              <Statistic title={item.title} value={item.value} prefix={item.icon} valueStyle={{ color: item.color, fontSize: 22 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>Clic para abrir</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/becarios')}>
            <Statistic title="Becarios (total)" value={kpis.becariosCount} prefix={<UserOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/padrinos')}>
            <Statistic title="Padrinos e Inst." value={kpis.padrinosCount} prefix={<TeamOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/financiero')}>
            <Statistic title="Total Ingresos" value={kpis.totalIngresos} precision={2} prefix={<ArrowUpOutlined style={{ color: '#3f8600' }} />} suffix="DOP" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/presupuesto')}>
            <Statistic title="Total Egresos" value={kpis.totalEgresos} precision={2} prefix={<ArrowDownOutlined style={{ color: '#cf1322' }} />} suffix="DOP" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Resumen de Flujo Financiero (Ingresos vs Egresos)">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `RD$ ${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="Ingresos" fill="#52c41a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresos" fill="#ff4d4f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span><BellOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />Pagos vencidos / pendientes</span>}
            extra={<Button type="link" onClick={() => navigate('/financiero')}>Ver todos</Button>}
          >
            <Table dataSource={overduePagos.slice(0, 8)} columns={columns} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
