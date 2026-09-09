import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, Row, Col, Typography, Progress, Table, Tag, Statistic, Button, Space, message,
  Modal, Form, InputNumber, Select, Input, Tabs, Alert, Popconfirm, Switch, Divider
} from 'antd';
import {
  FundOutlined, PlusOutlined, DollarOutlined, BookOutlined,
  TeamOutlined, WalletOutlined, ReloadOutlined, SaveOutlined,
  BankOutlined, FilePdfOutlined
} from '@ant-design/icons';
import { financieroApi } from '../api/financieroApi';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/downloadFile';
import { loadPresupuestoConfig } from '../utils/presupuestoEngine';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const money = (value) => `RD$ ${formatMoney(value)}`;

const PresupuestoPage = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMINISTRADOR', 'FINANCIERO');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [meses, setMeses] = useState(loadPresupuestoConfig().meses || 12);
  const [config, setConfig] = useState(loadPresupuestoConfig());

  const [gastoModal, setGastoModal] = useState(false);
  const [matModal, setMatModal] = useState(false);
  const [cubiertaModal, setCubiertaModal] = useState(false);
  const [extraModal, setExtraModal] = useState(false);

  const [formGasto] = Form.useForm();
  const [formMat] = Form.useForm();
  const [formCubierta] = Form.useForm();
  const [formExtra] = Form.useForm();

  const loadData = async (nextMeses = meses) => {
    setLoading(true);
    try {
      const [detRes, cfgRes] = await Promise.all([
        financieroApi.getPresupuestoDetallado({ anio: 2026, meses: nextMeses }),
        financieroApi.getPresupuestoConfig()
      ]);
      if (detRes.success) setData(detRes.data);
      if (cfgRes.success) setConfig(cfgRes.data);
    } catch (err) {
      message.error(err.message || 'No se pudo cargar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = data?.kpis || {};
  const matricula = data?.matricula || {};
  const necesidad = matricula.necesidad_fondos || {};
  const totalesMat = matricula.totales || {};
  const pctEjecucion = Math.min(100, Math.round(
    (((kpis.pagos_ejecutados || 0) + (kpis.gastos_fundacion_periodo || 0)) / Math.max(kpis.compromiso_academico || 1, 1)) * 100
  ));

  const handleFacturaUni = async (uniKey) => {
    try {
      await financieroApi.exportFacturaUniversidad(uniKey);
      message.success(`Factura fiscal ${uniKey} descargada`);
    } catch (err) {
      message.error(err.message || 'No se pudo generar la factura');
    }
  };

  const handleFacturasTodas = async () => {
    try {
      const res = await financieroApi.exportFacturasUniversidades();
      message.success(`${(res.data || []).length} facturas fiscales descargadas`);
    } catch (err) {
      message.error(err.message || 'No se pudieron generar las facturas');
    }
  };

  const persistConfig = async (next, { silent = false } = {}) => {
    const saved = await financieroApi.savePresupuestoConfig(next);
    setConfig(saved.data);
    await loadData(next.meses || meses);
    if (!silent) message.success('Configuración de presupuesto guardada');
  };

  const handleAddGasto = async () => {
    try {
      const values = await formGasto.validateFields();
      await financieroApi.createGasto(values);
      message.success('Gasto de fundación registrado');
      setGastoModal(false);
      formGasto.resetFields();
      loadData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleDeleteGasto = async (id) => {
    await financieroApi.deleteGasto(id);
    message.success('Gasto eliminado');
    loadData();
  };

  const handleAddObligatoria = async () => {
    try {
      const values = await formMat.validateFields();
      const next = {
        ...config,
        materias_obligatorias: [
          ...(config.materias_obligatorias || []),
          {
            codigo: String(values.codigo).toUpperCase().trim(),
            nombre: values.nombre,
            creditos: Number(values.creditos || 0)
          }
        ]
      };
      setMatModal(false);
      formMat.resetFields();
      await persistConfig(next);
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleRemoveObligatoria = async (codigo) => {
    const next = {
      ...config,
      materias_obligatorias: (config.materias_obligatorias || []).filter(
        (m) => String(m.codigo).toUpperCase() !== String(codigo).toUpperCase()
      )
    };
    await persistConfig(next);
  };

  const handleAddCubierta = async () => {
    try {
      const values = await formCubierta.validateFields();
      const next = {
        ...config,
        materias_cubiertas: [
          ...(config.materias_cubiertas || []),
          {
            codigo: String(values.codigo).toUpperCase().trim(),
            nombre: values.nombre,
            creditos: Number(values.creditos || 0),
            costo_fijo: Number(values.costo_fijo || 0),
            motivo: values.motivo || 'fundacion'
          }
        ]
      };
      setCubiertaModal(false);
      formCubierta.resetFields();
      await persistConfig(next);
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleRemoveCubierta = async (codigo) => {
    const next = {
      ...config,
      materias_cubiertas: (config.materias_cubiertas || []).filter(
        (m) => String(m.codigo).toUpperCase() !== String(codigo).toUpperCase()
      )
    };
    await persistConfig(next);
  };

  const handleSaveExtra = async () => {
    try {
      const values = await formExtra.validateFields();
      const next = {
        ...config,
        extras_compromiso: Number(values.extras_compromiso || 0),
        meses: Number(values.meses || meses),
        creditos_promedio_cuatrimestre: Number(values.creditos_promedio_cuatrimestre || 18),
        itbis_pct: Number(values.itbis_pct || 0) / 100,
        aplicar_itbis: values.aplicar_itbis !== false,
        cuatrimestre_actual: values.cuatrimestre_actual || config.cuatrimestre_actual,
        notas: values.notas || ''
      };
      setMeses(next.meses);
      setExtraModal(false);
      await persistConfig(next);
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const toggleCoveredFromCatalog = async (row, checked) => {
    const codigo = String(row.codigo).toUpperCase();
    let cubiertas = [...(config.materias_cubiertas || [])];
    if (checked) {
      if (!cubiertas.some((m) => String(m.codigo).toUpperCase() === codigo)) {
        cubiertas.push({
          codigo,
          nombre: row.nombre,
          creditos: row.creditos,
          costo_fijo: 0,
          motivo: /^ING/i.test(codigo) ? 'ingles' : 'fundacion'
        });
      }
    } else {
      cubiertas = cubiertas.filter((m) => String(m.codigo).toUpperCase() !== codigo);
    }
    await persistConfig({ ...config, materias_cubiertas: cubiertas });
  };

  const coveredSet = useMemo(
    () => new Set((config.materias_cubiertas || []).map((m) => String(m.codigo).toUpperCase())),
    [config]
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <FundOutlined style={{ color: '#52c41a', marginRight: 12 }} />
            Presupuesto detallado {data?.anio || 2026}
          </Title>
          <Text type="secondary">
            Compromiso de matrícula por cuatrimestre / mes / año, desglose por universidad y facturas fiscales.
          </Text>
        </div>
        <Space wrap>
          <Select
            value={meses}
            style={{ width: 160 }}
            onChange={(value) => {
              setMeses(value);
              persistConfig({ ...config, meses: value }, { silent: true });
            }}
            options={[
              { value: 4, label: '1 cuatrimestre' },
              { value: 8, label: '2 cuatrimestres' },
              { value: 12, label: 'Año completo' }
            ]}
          />
          <Button icon={<FilePdfOutlined />} onClick={handleFacturasTodas}>
            Facturas todas las U
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => loadData()} loading={loading}>
            Actualizar
          </Button>
          {canEdit && (
            <Button type="primary" icon={<SaveOutlined />} onClick={() => {
              formExtra.setFieldsValue({
                extras_compromiso: config.extras_compromiso || 0,
                meses,
                creditos_promedio_cuatrimestre: config.creditos_promedio_cuatrimestre ?? 18,
                itbis_pct: Math.round((config.itbis_pct ?? 0.18) * 100),
                aplicar_itbis: config.aplicar_itbis !== false,
                cuatrimestre_actual: config.cuatrimestre_actual || '2026-C1',
                notas: config.notas || ''
              });
              setExtraModal(true);
            }}>
              Configurar / compromiso
            </Button>
          )}
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message="Presupuesto de matrícula que debe la fundación"
        description={(
          <span>
            Se estiman créditos × tarifa por universidad + inscripción/labs/servicios de cada becario activo.
            Luego se proyecta a <strong>cuatrimestre</strong>, <strong>mes</strong> (÷4) y <strong>año</strong> (×3),
            se suma ITBIS para valor fiscal y se calcula cuánto hay que buscar (matrículas + gastos − padrinos).
          </span>
        )}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="A buscar / cuatrimestre" value={necesidad.cuatrimestre || 0} prefix="RD$ " precision={2} valueStyle={{ color: '#cf1322' }} />
            <Text type="secondary">Matrículas fiscales + gastos fundación</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="A buscar / mes" value={necesidad.mensual || 0} prefix="RD$ " precision={2} valueStyle={{ color: '#fa8c16' }} />
            <Text type="secondary">Gap vs padrinos: {money(necesidad.gap_mensual || 0)}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="A buscar / año" value={necesidad.anual || 0} prefix="RD$ " precision={2} valueStyle={{ color: '#1890ff' }} />
            <Text type="secondary">Gap anual: {money(necesidad.gap_anual || 0)}</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Matrícula fiscal / cuatrimestre" value={totalesMat.total_fiscal_cuatrimestre || 0} prefix="RD$ " precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Matrícula fiscal / mes" value={totalesMat.mensual_fiscal || 0} prefix="RD$ " precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Matrícula fiscal / año" value={totalesMat.anual_fiscal || 0} prefix="RD$ " precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="Becarios activos" value={matricula.activos || data?.activos || 0} />
            <Text type="secondary">{matricula.cuatrimestre || '—'}</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Compromiso académico (período)"
              value={kpis.compromiso_academico || 0}
              prefix="RD$ "
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary">Materias + cargos ({meses} meses)</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Gastos fundación"
              value={kpis.gastos_fundacion_periodo || 0}
              prefix="RD$ "
              precision={2}
              valueStyle={{ color: '#fa541c' }}
            />
            <Text type="secondary">{money(kpis.gastos_fundacion_mensual || 0)} / mes</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Compromiso padrinos"
              value={kpis.compromiso_padrinos_periodo || 0}
              prefix="RD$ "
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary">Disponible: {money(kpis.disponible || 0)}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Aportes recibidos" value={kpis.aportes_recibidos || 0} prefix="RD$ " precision={2} />
            <Progress percent={pctEjecucion} size="small" style={{ marginTop: 8 }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey="matricula"
          items={[
            {
              key: 'matricula',
              label: (
                <span><BankOutlined /> Matrícula por universidad</span>
              ),
              children: (
                <>
                  <Space style={{ marginBottom: 12 }} wrap>
                    <Text type="secondary">
                      Compromiso que la fundación debe cubrir ante cada universidad (valor fiscal con ITBIS).
                    </Text>
                    <Button size="small" icon={<FilePdfOutlined />} onClick={handleFacturasTodas}>
                      Descargar todas
                    </Button>
                  </Space>
                  <Table
                    loading={loading}
                    rowKey="universidad_key"
                    dataSource={matricula.por_universidad || []}
                    pagination={false}
                    columns={[
                      { title: 'Universidad', dataIndex: 'universidad', render: (t, r) => <Text strong>{r.universidad_key}</Text> },
                      { title: 'Estudiantes', dataIndex: 'estudiantes', width: 100 },
                      { title: 'Créditos', dataIndex: 'creditos', width: 90 },
                      { title: 'Subtotal / cuatr.', dataIndex: 'subtotal_cuatrimestre', render: (m) => money(m) },
                      { title: 'ITBIS', dataIndex: 'itbis_cuatrimestre', render: (m) => money(m) },
                      { title: 'Total fiscal / cuatr.', dataIndex: 'total_fiscal_cuatrimestre', render: (m) => <Text strong>{money(m)}</Text> },
                      { title: 'Mensual', dataIndex: 'mensual_fiscal', render: (m) => money(m) },
                      { title: 'Anual', dataIndex: 'anual_fiscal', render: (m) => money(m) },
                      {
                        title: 'Factura',
                        width: 120,
                        render: (row) => (
                          <Button size="small" type="primary" ghost icon={<FilePdfOutlined />} onClick={() => handleFacturaUni(row.universidad_key)}>
                            PDF
                          </Button>
                        )
                      }
                    ]}
                    expandable={{
                      expandedRowRender: (row) => (
                        <Table
                          size="small"
                          rowKey="becario_id"
                          pagination={false}
                          dataSource={row.detalle || []}
                          columns={[
                            { title: 'Estudiante', dataIndex: 'nombre' },
                            { title: 'Matrícula', dataIndex: 'matricula' },
                            { title: 'Carrera', dataIndex: 'carrera' },
                            { title: 'Créditos', dataIndex: 'creditos', width: 80 },
                            { title: 'Materias', dataIndex: 'monto_materias', render: (m) => money(m) },
                            { title: 'Cargos fijos', dataIndex: 'cargos_fijos', render: (m) => money(m) },
                            { title: 'Subtotal', dataIndex: 'subtotal', render: (m) => money(m) },
                            { title: 'Fuente', dataIndex: 'fuente_creditos', render: (f) => <Tag>{f === 'materias_crm' ? 'CRM' : 'Promedio'}</Tag> }
                          ]}
                        />
                      )
                    }}
                  />
                  <Divider />
                  <Row gutter={16}>
                    <Col xs={24} md={8}><Statistic title="Ingresos padrinos / cuatr." value={matricula.ingresos?.cuatrimestre || 0} prefix="RD$ " precision={2} /></Col>
                    <Col xs={24} md={8}><Statistic title="Gastos operación / cuatr." value={matricula.operacion?.gastos_cuatrimestre || 0} prefix="RD$ " precision={2} /></Col>
                    <Col xs={24} md={8}>
                      <Statistic
                        title="Gap a cubrir / cuatr."
                        value={necesidad.gap_cuatrimestre || 0}
                        prefix="RD$ "
                        precision={2}
                        valueStyle={{ color: (necesidad.gap_cuatrimestre || 0) > 0 ? '#cf1322' : '#52c41a' }}
                      />
                    </Col>
                  </Row>
                </>
              )
            },
            {
              key: 'resumen',
              label: (
                <span><DollarOutlined /> Partidas</span>
              ),
              children: (
                <Table
                  loading={loading}
                  rowKey="id"
                  dataSource={data?.partidas || []}
                  pagination={false}
                  columns={[
                    {
                      title: 'Partida',
                      dataIndex: 'categoria',
                      render: (c, row) => (
                        <Space>
                          <Text strong>{c}</Text>
                          <Tag color={row.tipo === 'gasto' ? 'volcano' : row.tipo === 'fundacion' ? 'purple' : 'blue'}>
                            {String(row.tipo || '').toUpperCase()}
                          </Tag>
                        </Space>
                      )
                    },
                    {
                      title: 'Asignado / compromiso',
                      dataIndex: 'asignado',
                      render: (m) => money(m)
                    },
                    {
                      title: 'Ejecutado',
                      dataIndex: 'ejecutado',
                      render: (m) => money(m)
                    },
                    {
                      title: '%',
                      render: (row) => {
                        const pct = row.asignado ? Math.min(100, Math.round((row.ejecutado / row.asignado) * 100)) : 0;
                        return <Progress percent={pct} size="small" style={{ width: 120 }} />;
                      }
                    }
                  ]}
                />
              )
            },
            {
              key: 'obligatorias',
              label: (
                <span><BookOutlined /> Materias obligatorias</span>
              ),
              children: (
                <>
                  <Space style={{ marginBottom: 12 }}>
                    <Text type="secondary">
                      Materias que deben cursar los becados. Se estiman con tarifa por crédito × estudiantes.
                    </Text>
                    {canEdit && (
                      <Button size="small" icon={<PlusOutlined />} onClick={() => setMatModal(true)}>
                        Agregar materia
                      </Button>
                    )}
                  </Space>
                  <Table
                    loading={loading}
                    rowKey="codigo"
                    dataSource={data?.materias_obligatorias || []}
                    columns={[
                      { title: 'Código', dataIndex: 'codigo', width: 110 },
                      { title: 'Materia', dataIndex: 'nombre' },
                      { title: 'Créditos', dataIndex: 'creditos', width: 90 },
                      { title: 'Estudiantes', dataIndex: 'estudiantes', width: 110 },
                      {
                        title: 'Costo unit.',
                        dataIndex: 'costo_unitario',
                        render: (m) => money(m)
                      },
                      {
                        title: 'Total compromiso',
                        dataIndex: 'total',
                        render: (m) => money(m)
                      },
                      {
                        title: 'Cobertura',
                        dataIndex: 'cubierta_fundacion',
                        render: (v) => (v ? <Tag color="purple">Fundación</Tag> : <Tag color="blue">Padrino / academia</Tag>)
                      },
                      canEdit ? {
                        title: '',
                        width: 90,
                        render: (row) => (
                          <Popconfirm title="¿Quitar de obligatorias?" onConfirm={() => handleRemoveObligatoria(row.codigo)}>
                            <Button size="small" danger>Quitar</Button>
                          </Popconfirm>
                        )
                      } : null
                    ].filter(Boolean)}
                  />
                </>
              )
            },
            {
              key: 'cubiertas',
              label: (
                <span><TeamOutlined /> Cubiertas por fundación</span>
              ),
              children: (
                <>
                  <Space style={{ marginBottom: 12 }}>
                    <Text type="secondary">
                      Inglés y otras materias que la fundación asume directamente (no se facturan al padrino).
                    </Text>
                    {canEdit && (
                      <Button size="small" icon={<PlusOutlined />} onClick={() => setCubiertaModal(true)}>
                        Agregar cobertura
                      </Button>
                    )}
                  </Space>
                  <Table
                    loading={loading}
                    rowKey="codigo"
                    dataSource={data?.materias_cubiertas || []}
                    columns={[
                      { title: 'Código', dataIndex: 'codigo', width: 110 },
                      { title: 'Materia', dataIndex: 'nombre' },
                      { title: 'Motivo', dataIndex: 'motivo', render: (m) => <Tag>{m}</Tag> },
                      { title: 'Créditos', dataIndex: 'creditos', width: 90 },
                      { title: 'Estudiantes', dataIndex: 'estudiantes', width: 110 },
                      { title: 'Costo unit.', dataIndex: 'costo_unitario', render: (m) => money(m) },
                      { title: 'Total', dataIndex: 'total', render: (m) => money(m) },
                      canEdit ? {
                        title: '',
                        width: 90,
                        render: (row) => (
                          <Popconfirm title="¿Quitar cobertura?" onConfirm={() => handleRemoveCubierta(row.codigo)}>
                            <Button size="small" danger>Quitar</Button>
                          </Popconfirm>
                        )
                      } : null
                    ].filter(Boolean)}
                  />
                  <Divider>Catálogo real en CRM (marcar cobertura)</Divider>
                  <Table
                    size="small"
                    rowKey="codigo"
                    dataSource={(data?.catalogo_materias || []).slice(0, 40)}
                    columns={[
                      { title: 'Código', dataIndex: 'codigo', width: 100 },
                      { title: 'Materia', dataIndex: 'nombre' },
                      { title: 'Créd.', dataIndex: 'creditos', width: 70 },
                      { title: 'Becados', dataIndex: 'estudiantes', width: 90 },
                      {
                        title: 'Cubre fundación',
                        width: 140,
                        render: (row) => (
                          <Switch
                            checked={coveredSet.has(String(row.codigo).toUpperCase())}
                            disabled={!canEdit}
                            onChange={(checked) => toggleCoveredFromCatalog(row, checked)}
                          />
                        )
                      }
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )
            },
            {
              key: 'gastos',
              label: (
                <span><WalletOutlined /> Gastos fundación</span>
              ),
              children: (
                <>
                  <Space style={{ marginBottom: 12 }}>
                    <Text type="secondary">
                      Sueldos y operación. Ejemplo: Erick Páez RD$ 20,000 mensuales se descuentan del presupuesto.
                    </Text>
                    {canEdit && (
                      <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => {
                        formGasto.setFieldsValue({
                          tipo: 'sueldo',
                          categoria: 'administrativo',
                          frecuencia: 'mensual',
                          monto: 20000
                        });
                        setGastoModal(true);
                      }}>
                        Nuevo gasto
                      </Button>
                    )}
                  </Space>
                  <Table
                    loading={loading}
                    rowKey="id"
                    dataSource={data?.gastos || []}
                    columns={[
                      { title: 'Descripción', dataIndex: 'descripcion' },
                      { title: 'Beneficiario', dataIndex: 'beneficiario', render: (v) => v || '—' },
                      { title: 'Tipo', dataIndex: 'tipo', render: (t) => <Tag color={t === 'sueldo' ? 'magenta' : 'default'}>{t}</Tag> },
                      { title: 'Frecuencia', dataIndex: 'frecuencia' },
                      { title: 'Monto', dataIndex: 'monto', render: (m) => money(m) },
                      { title: `Periodo (${meses} m)`, dataIndex: 'periodo', render: (m) => money(m) },
                      canEdit ? {
                        title: '',
                        width: 90,
                        render: (row) => (
                          <Popconfirm title="¿Eliminar gasto?" onConfirm={() => handleDeleteGasto(row.id)}>
                            <Button size="small" danger>Eliminar</Button>
                          </Popconfirm>
                        )
                      } : null
                    ].filter(Boolean)}
                  />
                </>
              )
            },
            {
              key: 'padrinos',
              label: 'Compromisos padrinos',
              children: (
                <Table
                  loading={loading}
                  rowKey="id"
                  dataSource={data?.padrinos || []}
                  columns={[
                    { title: 'Padrino', dataIndex: 'nombre' },
                    { title: 'Compromiso', dataIndex: 'compromiso', render: (m) => money(m) },
                    { title: 'Frecuencia', dataIndex: 'frecuencia' },
                    { title: 'Mensual equiv.', dataIndex: 'mensual', render: (m) => money(m) },
                    { title: `Periodo (${meses} m)`, dataIndex: 'periodo', render: (m) => money(m) }
                  ]}
                  pagination={{ pageSize: 12 }}
                />
              )
            }
          ]}
        />
      </Card>

      <Modal
        title="Nuevo gasto de fundación"
        open={gastoModal}
        onOk={handleAddGasto}
        onCancel={() => setGastoModal(false)}
        destroyOnClose
      >
        <Form form={formGasto} layout="vertical">
          <Form.Item name="descripcion" label="Descripción" rules={[{ required: true }]}>
            <Input placeholder="Ej. Sueldo Erick Páez" />
          </Form.Item>
          <Form.Item name="beneficiario" label="Beneficiario">
            <Input placeholder="Ej. Erick Páez" />
          </Form.Item>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Select>
              <Option value="sueldo">Sueldo / nómina</Option>
              <Option value="materia_fundacion">Materia cubierta</Option>
              <Option value="operativo">Operativo</Option>
              <Option value="otro">Otro</Option>
            </Select>
          </Form.Item>
          <Form.Item name="categoria" label="Categoría" initialValue="administrativo">
            <Select>
              <Option value="administrativo">Administrativo</Option>
              <Option value="operativo">Operativo</Option>
              <Option value="becas">Becas</Option>
              <Option value="otros">Otros</Option>
            </Select>
          </Form.Item>
          <Form.Item name="monto" label="Monto (RD$)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={500} />
          </Form.Item>
          <Form.Item name="frecuencia" label="Frecuencia" initialValue="mensual">
            <Select>
              <Option value="mensual">Mensual</Option>
              <Option value="cuatrimestral">Cuatrimestral</Option>
              <Option value="trimestral">Trimestral</Option>
              <Option value="anual">Anual</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Agregar materia obligatoria" open={matModal} onOk={handleAddObligatoria} onCancel={() => setMatModal(false)} destroyOnClose>
        <Form form={formMat} layout="vertical">
          <Form.Item name="codigo" label="Código" rules={[{ required: true }]}>
            <Input placeholder="MAT-100" />
          </Form.Item>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
            <Input placeholder="Matemática I" />
          </Form.Item>
          <Form.Item name="creditos" label="Créditos" initialValue={3} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={12} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Materia cubierta por la fundación" open={cubiertaModal} onOk={handleAddCubierta} onCancel={() => setCubiertaModal(false)} destroyOnClose>
        <Form form={formCubierta} layout="vertical">
          <Form.Item name="codigo" label="Código" rules={[{ required: true }]}>
            <Input placeholder="ING-115" />
          </Form.Item>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="creditos" label="Créditos" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="costo_fijo" label="Costo fijo fundación (RD$)" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
          <Form.Item name="motivo" label="Motivo" initialValue="fundacion">
            <Select>
              <Option value="ingles">Inglés</Option>
              <Option value="retiro">Materia retirada / reposición</Option>
              <Option value="fundacion">Cobertura fundación</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Configurar presupuesto / compromiso" open={extraModal} onOk={handleSaveExtra} onCancel={() => setExtraModal(false)} destroyOnHidden width={560}>
        <Paragraph type="secondary">
          Define créditos promedio (si el estudiante no tiene materias en CRM), ITBIS fiscal y el horizonte.
        </Paragraph>
        <Form form={formExtra} layout="vertical">
          <Form.Item name="cuatrimestre_actual" label="Cuatrimestre actual" rules={[{ required: true }]}>
            <Input placeholder="2026-C1" />
          </Form.Item>
          <Form.Item name="creditos_promedio_cuatrimestre" label="Créditos promedio / cuatrimestre" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} max={30} />
          </Form.Item>
          <Form.Item name="aplicar_itbis" label="Aplicar ITBIS al valor fiscal" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="itbis_pct" label="ITBIS (%)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={30} />
          </Form.Item>
          <Form.Item name="extras_compromiso" label="Compromiso adicional (RD$)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={1000} />
          </Form.Item>
          <Form.Item name="meses" label="Horizonte (meses)" rules={[{ required: true }]}>
            <Select options={[
              { value: 4, label: '4 (1 cuatrimestre)' },
              { value: 8, label: '8 (2 cuatrimestres)' },
              { value: 12, label: '12 (año)' }
            ]} />
          </Form.Item>
          <Form.Item name="notas" label="Notas">
            <Input.TextArea rows={3} placeholder="Observaciones del período" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PresupuestoPage;
