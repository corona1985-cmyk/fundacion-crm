import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag, Spin } from 'antd';
import { UserOutlined, TeamOutlined, DollarOutlined, BellOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
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
  const [chartData, setChartData] = useState([]);
  const [overduePagos, setOverduePagos] = useState([]);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [becariosRes, padrinosRes, resumenRes, vencidosRes] = await Promise.all([
        becarioApi.getAll({ limit: 1 }),
        padrinoApi.getAll({ limit: 1 }),
        financieroApi.getResumenFinanciero(),
        financieroApi.getPagosVencidos()
      ]);

      const becariosCount = becariosRes.data?.pagination?.total_items || 0;
      const padrinosCount = padrinosRes.data?.pagination?.total_items || 0;
      const totalIngresos = resumenRes.data?.total_ingresos || 0;
      const totalEgresos = resumenRes.data?.total_egresos || 0;

      setKpis({ becariosCount, padrinosCount, totalIngresos, totalEgresos });
      setOverduePagos(vencidosRes.data || []);

      setChartData([
        { name: 'Total Financiero', Ingresos: totalIngresos, Egresos: totalEgresos }
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
      render: (persona) => persona ? `${persona.nombre} ${persona.apellido}` : 'N/A'
    },
    {
      title: 'Universidad',
      dataIndex: ['becario', 'universidad', 'nombre'],
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      render: (monto) => `RD$ ${parseFloat(monto).toLocaleString()}`
    },
    {
      title: 'Vencimiento',
      dataIndex: 'fecha_vencimiento',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (estado) => <Tag color="error">{estado.toUpperCase()}</Tag>
    }
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Panel de Control (Dashboard)</Title>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Becarios Activos"
              value={kpis.becariosCount}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Padrinos e Inst."
              value={kpis.padrinosCount}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Ingresos Recibidos"
              value={kpis.totalIngresos}
              precision={2}
              prefix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
              suffix="DOP"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Egresos Pagados"
              value={kpis.totalEgresos}
              precision={2}
              prefix={<ArrowDownOutlined style={{ color: '#cf1322' }} />}
              suffix="DOP"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts & Alarms Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Resumen de Flujo Financiero (Ingresos vs Egresos)">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `RD$ ${value.toLocaleString()}`} />
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
            title={
              <span>
                <BellOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                Alarmas de Pagos Vencidos Recientes
              </span>
            }
          >
            <Table
              dataSource={overduePagos.slice(0, 5)}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              onRow={(record) => ({
                onClick: () => navigate('/financiero'),
                style: { cursor: 'pointer' }
              })}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
