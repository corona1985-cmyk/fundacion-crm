import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Space, Tag, Modal, Form, message, Typography, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { becarioApi } from '../api/becarioApi';
import { reporteApi } from '../api/reporteApi';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;
const { Option } = Select;

export const BecariosPage = () => {
  const [becarios, setBecarios] = useState([]);
  const [universidades, setUniversidades] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '', universidad_id: null, estado_beca: null });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBecario, setEditingBecario] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const loadBecarios = async (page = 1) => {
    setLoading(true);
    try {
      const response = await becarioApi.getAll({
        page,
        limit: pagination.pageSize,
        search: filters.search || undefined,
        universidad_id: filters.universidad_id || undefined,
        estado_beca: filters.estado_beca || undefined
      });
      if (response.success) {
        setBecarios(response.data.becarios || []);
        setPagination({
          current: response.data.pagination.current_page,
          pageSize: response.data.pagination.limit,
          total: response.data.pagination.total_items
        });
      }
    } catch (error) {
      message.error(error.message || 'Error al cargar becarios');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        becarioApi.getUniversidades(),
        becarioApi.getCarreras()
      ]);
      if (uRes.success) setUniversidades(uRes.data || []);
      if (cRes.success) setCarreras(cRes.data || []);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    loadBecarios(1);
  }, [filters]);

  const handleTableChange = (newPagination) => {
    loadBecarios(newPagination.current);
  };

  const handleOpenModal = (record = null) => {
    setEditingBecario(record);
    if (record) {
      form.setFieldsValue({
        nombre: record.persona?.nombre,
        apellido: record.persona?.apellido,
        cedula: record.persona?.cedula,
        email: record.persona?.email,
        telefono: record.persona?.telefono,
        direccion: record.persona?.direccion,
        universidad_id: record.universidad_id,
        carrera_id: record.carrera_id,
        centro_origen: record.centro_origen,
        estado_beca: record.estado_beca,
        promedio_general: record.promedio_general
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingBecario) {
        await becarioApi.update(editingBecario.id, values);
        message.success('Becario actualizado correctamente');
      } else {
        await becarioApi.create(values);
        message.success('Becario registrado correctamente');
      }
      setModalVisible(false);
      loadBecarios(pagination.current);
    } catch (error) {
      message.error(error.message || 'Error al guardar becario');
    }
  };

  const handleDelete = async (id) => {
    try {
      await becarioApi.delete(id);
      message.success('Becario eliminado');
      loadBecarios(pagination.current);
    } catch (error) {
      message.error(error.message || 'Error al eliminar');
    }
  };

  const columns = [
    {
      title: 'Nombre Completo',
      key: 'nombre',
      render: (record) => `${record.persona?.nombre || ''} ${record.persona?.apellido || ''}`
    },
    {
      title: 'Cédula',
      dataIndex: ['persona', 'cedula'],
    },
    {
      title: 'Universidad',
      dataIndex: ['universidad', 'nombre'],
    },
    {
      title: 'Carrera',
      dataIndex: ['carrera', 'nombre'],
    },
    {
      title: 'Politécnico / Centro Origen',
      dataIndex: 'centro_origen',
      render: (centro) => centro || '-'
    },
    {
      title: 'Graduación de Liceo',
      dataIndex: 'estado_graduacion_liceo',
      render: (estado) => (
        <Tag color={estado === 'Graduados' ? 'green' : estado?.includes('Agendado') ? 'blue' : 'orange'}>
          {estado || 'Pendiente'}
        </Tag>
      )
    },
    {
      title: 'Índice (GPA)',
      dataIndex: 'promedio_general',
      render: (gpa) => (
        gpa !== null && gpa !== undefined ? (
          <Tag color={parseFloat(gpa) >= 2.50 ? 'green' : 'volcano'}>
            {parseFloat(gpa).toFixed(2)}
          </Tag>
        ) : (
          <Tag color="cyan">Nuevo Ingreso</Tag>
        )
      )
    },
    {
      title: 'Estado Beca',
      dataIndex: 'estado_beca',
      render: (estado) => {
        const colors = { ACTIVA: 'green', SUSPENDIDA: 'orange', CANCELADA: 'red', FINALIZADA: 'blue' };
        return <Tag color={colors[estado] || 'default'}>{estado}</Tag>;
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/becarios/${record.id}`)}
          >
            Expediente
          </Button>

          {hasRole('ADMINISTRADOR', 'COORDINADOR') && (
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleOpenModal(record)}
            />
          )}

          {hasRole('ADMINISTRADOR') && (
            <Popconfirm title="¿Eliminar este becario?" onConfirm={() => handleDelete(record.id)} okText="Sí" cancelText="No">
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Gestión de Becarios</Title>
        <Space>
          <Button icon={<FileExcelOutlined />} onClick={() => reporteApi.exportExcel('becarios')}>
            Excel
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => reporteApi.exportPdf('becarios')}>
            PDF
          </Button>
          {hasRole('ADMINISTRADOR', 'COORDINADOR') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              Nuevo Becario
            </Button>
          )}
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Buscar por nombre, apellido o cédula"
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
            allowClear
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <Select
            placeholder="Filtrar por Universidad"
            style={{ width: 220 }}
            allowClear
            onChange={(val) => setFilters(prev => ({ ...prev, universidad_id: val }))}
          >
            {universidades.map(u => (
              <Option key={u.id} value={u.id}>{u.nombre}</Option>
            ))}
          </Select>
          <Select
            placeholder="Estado Beca"
            style={{ width: 160 }}
            allowClear
            onChange={(val) => setFilters(prev => ({ ...prev, estado_beca: val }))}
          >
            <Option value="ACTIVA">Activa</Option>
            <Option value="SUSPENDIDA">Suspendida</Option>
            <Option value="CANCELADA">Cancelada</Option>
            <Option value="FINALIZADA">Finalizada</Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={becarios}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modal Crear/Editar Becario */}
      <Modal
        title={editingBecario ? "Editar Becario" : "Registrar Nuevo Becario"}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Requerido' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="apellido" label="Apellido" rules={[{ required: true, message: 'Requerido' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="cedula" label="Cédula" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="001-0000000-0" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email válido requerido' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="telefono" label="Teléfono">
            <Input />
          </Form.Item>
          <Form.Item name="direccion" label="Dirección">
            <Input />
          </Form.Item>
          <Form.Item name="universidad_id" label="Universidad" rules={[{ required: true, message: 'Seleccione universidad' }]}>
            <Select placeholder="Seleccionar">
              {universidades.map(u => (
                <Option key={u.id} value={u.id}>{u.nombre}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="carrera_id" label="Carrera" rules={[{ required: true, message: 'Seleccione carrera' }]}>
            <Select placeholder="Seleccionar">
              {carreras.map(c => (
                <Option key={c.id} value={c.id}>{c.nombre}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="centro_origen" label="Centro Educativo de Origen">
            <Input />
          </Form.Item>
          {editingBecario && (
            <>
              <Form.Item name="estado_beca" label="Estado de Beca">
                <Select>
                  <Option value="ACTIVA">Activa</Option>
                  <Option value="SUSPENDIDA">Suspendida</Option>
                  <Option value="CANCELADA">Cancelada</Option>
                  <Option value="FINALIZADA">Finalizada</Option>
                </Select>
              </Form.Item>
              <Form.Item name="promedio_general" label="Índice Acumulado (GPA)">
                <Input type="number" step="0.01" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default BecariosPage;
