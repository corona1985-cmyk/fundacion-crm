import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Space, Divider, message, Tag } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, DownloadOutlined, AuditOutlined, TrophyOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

const { Title, Text, Paragraph } = Typography;

const ReportesPage = () => {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (tipo, format) => {
    const key = `${tipo}-${format}`;
    setDownloading(key);
    try {
      const response = await axiosClient.get(`/reportes/export/${format}`, {
        params: { tipo },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_${tipo}_${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success(`Reporte de ${tipo} en ${format.toUpperCase()} descargado correctamente`);
    } catch (err) {
      message.error('Error al generar el reporte descargable');
    } finally {
      setDownloading(null);
    }
  };

  const reportModules = [
    {
      title: 'Reporte General de Becarios y Graduaciones',
      icon: <TrophyOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      desc: 'Listado consolidado de becarios activos, promedios acumulados, universidades, carreras, politécnicos de origen y estatus de graduación de liceo.',
      tipo: 'becarios'
    },
    {
      title: 'Reporte de Padrinos y Aportes Financieros',
      icon: <TeamOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      desc: 'Historial completo de depósitos y aportes realizados por padrinos individuales e instituciones corporativas.',
      tipo: 'padrinos'
    },
    {
      title: 'Reporte de Egresos y Pagos Universitarios',
      icon: <DollarOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      desc: 'Detalle de cheques y transferencias bancarias emitidos a UTESA, PUCMM y O&M por concepto de colegiaturas y matrículas.',
      tipo: 'egresos'
    },
    {
      title: 'Reporte de Alarmas e Itinerario de Graduaciones',
      icon: <AuditOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      desc: 'Calendario de graduaciones agendadas, alertas de bajo índice académico y vencimientos de pagos.',
      tipo: 'alarmas'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <DownloadOutlined style={{ color: '#1890ff', marginRight: 12 }} />
          Centro de Reportes y Exportación de Datos
        </Title>
        <Text type="secondary">Genera e imprime reportes ejecutivos e itinerarios oficiales en formato Excel y PDF.</Text>
      </div>

      <Row gutter={[16, 16]}>
        {reportModules.map((item, idx) => (
          <Col xs={24} md={12} key={idx}>
            <Card hoverable style={{ height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                {item.icon}
                <div>
                  <Title level={4} style={{ margin: 0 }}>{item.title}</Title>
                  <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                    {item.desc}
                  </Paragraph>
                </div>
              </div>
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Button
                  icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
                  loading={downloading === `${item.tipo}-excel`}
                  onClick={() => handleDownload(item.tipo, 'excel')}
                >
                  Exportar Excel (.xlsx)
                </Button>
                <Button
                  type="primary"
                  danger
                  icon={<FilePdfOutlined />}
                  loading={downloading === `${item.tipo}-pdf`}
                  onClick={() => handleDownload(item.tipo, 'pdf')}
                >
                  Exportar PDF (.pdf)
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ReportesPage;
