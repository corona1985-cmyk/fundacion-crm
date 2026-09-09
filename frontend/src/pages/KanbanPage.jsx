import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, Row, Col, Typography, Tag, Select, Input, Space, Button, Statistic, Segmented, Empty, Spin, message
} from 'antd';
import { ProjectOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { becarioApi } from '../api/becarioApi';
import { useAuth } from '../context/AuthContext';
import {
  ETAPAS_OPERATIVAS, etapaMeta, riskBandLabel
} from '../utils/expedienteHelpers';
import { INDICE_MINIMO, INDICE_CRITICO } from '../utils/academicConstants';

const { Title, Text } = Typography;

const RISK_COLUMNS = [
  { key: 'ok', label: riskBandLabel('ok'), color: '#52c41a' },
  { key: 'bajo', label: riskBandLabel('bajo'), color: '#fa8c16' },
  { key: 'critico', label: riskBandLabel('critico'), color: '#f5222d' },
  { key: 'sin_indice', label: riskBandLabel('sin_indice'), color: '#8c8c8c' }
];

const KanbanCard = ({ card, canEdit, onMove, mode }) => {
  const navigate = useNavigate();
  return (
    <Card
      size="small"
      hoverable
      style={{ marginBottom: 8, borderLeft: `4px solid ${mode === 'riesgo' ? (RISK_COLUMNS.find((c) => c.key === card.risk)?.color || '#999') : etapaMeta(card.etapa).color}` }}
      onClick={() => navigate(`/becarios/${card.id}`)}
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Text strong>{card.nombre}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>{card.universidad}</Text>
        <Space wrap size={[4, 4]}>
          <Tag>{card.estado_beca}</Tag>
          {card.acum != null && (
            <Tag color={card.risk === 'ok' ? 'green' : card.risk === 'bajo' ? 'orange' : 'volcano'}>
              {Number(card.acum).toFixed(2)}
            </Tag>
          )}
          {card.docs_incompleto && <Tag color="red">Docs {card.docs_pct}%</Tag>}
        </Space>
        {canEdit && (
          <Select
            size="small"
            style={{ width: '100%' }}
            value={mode === 'riesgo' ? undefined : card.etapa}
            placeholder={mode === 'riesgo' ? 'Mover etapa…' : undefined}
            onClick={(e) => e.stopPropagation()}
            onChange={(value) => {
              onMove(card.id, value);
            }}
            options={ETAPAS_OPERATIVAS.map((e) => ({ value: e.key, label: e.label }))}
          />
        )}
      </Space>
    </Card>
  );
};

const KanbanPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [mode, setMode] = useState('etapas');
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMINISTRADOR', 'COORDINADOR', 'FINANCIERO');
  const navigate = useNavigate();

  useEffect(() => {
    const m = searchParams.get('modo');
    if (m === 'riesgo' || m === 'etapas') setMode(m);
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams]);

  const load = async (q = search) => {
    setLoading(true);
    try {
      const res = await becarioApi.getKanban({
        search: q || undefined,
        incluir_todos: '1',
        solo_activos: '0'
      });
      if (res.success) setData(res.data);
    } catch (err) {
      message.error(err.message || 'No se pudo cargar el tablero');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(() => {
    if (mode === 'riesgo') return RISK_COLUMNS;
    return ETAPAS_OPERATIVAS;
  }, [mode]);

  const buckets = mode === 'riesgo' ? (data?.byRisk || {}) : (data?.byEtapa || {});

  const handleMove = async (id, etapa) => {
    try {
      await becarioApi.setEtapa(id, etapa);
      message.success('Etapa actualizada');
      load();
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <ProjectOutlined style={{ marginRight: 10, color: '#1890ff' }} />
            Tablero Kanban
          </Title>
          <Text type="secondary">
            Flujo operativo de becarios y riesgo académico (índice mínimo {INDICE_MINIMO} / crítico {INDICE_CRITICO}).
          </Text>
        </div>
        <Space wrap>
          <Segmented
            value={mode}
            onChange={(value) => {
              setMode(value);
              setSearchParams(value === 'etapas' ? {} : { modo: value });
            }}
            options={[
              { label: 'Etapas operativas', value: 'etapas' },
              { label: 'Riesgo por índice', value: 'riesgo' }
            ]}
          />
          <Input.Search
            allowClear
            placeholder="Buscar estudiante…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={(value) => load(value)}
            style={{ width: 220 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => load()}>Actualizar</Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="En tablero" value={data?.resumen?.total || 0} prefix={<UserOutlined />} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Riesgo académico" value={data?.resumen?.riesgo || 0} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Docs incompletos" value={data?.resumen?.docs_incompletos || 0} valueStyle={{ color: '#f5222d' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Graduación" value={data?.resumen?.graduacion || 0} valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
          {columns.map((col) => {
            const list = buckets[col.key] || [];
            return (
              <div key={col.key} style={{ minWidth: 260, maxWidth: 280, flex: '0 0 260px' }}>
                <Card
                  size="small"
                  title={(
                    <Space>
                      <span style={{ width: 10, height: 10, borderRadius: 5, background: col.color, display: 'inline-block' }} />
                      <Text strong>{col.label}</Text>
                      <Tag>{list.length}</Tag>
                    </Space>
                  )}
                  styles={{ body: { maxHeight: '70vh', overflowY: 'auto', background: '#fafafa' } }}
                >
                  {list.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Vacío" />
                  ) : (
                    list.map((card) => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        canEdit={canEdit}
                        onMove={handleMove}
                        mode={mode}
                      />
                    ))
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <Card size="small" style={{ marginTop: 16 }}>
        <Text type="secondary">
          Tip: haz clic en una tarjeta para abrir el expediente 360. Desde ahí puedes editar bitácora, documentos y etapa.
          {' '}
          <Button type="link" size="small" onClick={() => navigate('/becarios')}>Ir a listado</Button>
        </Text>
      </Card>
    </div>
  );
};

export default KanbanPage;
