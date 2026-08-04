import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tabs, Descriptions, Table, Tag, Button, Space, Typography, Modal, Form, Select, Input, Upload, Popconfirm, DatePicker } from 'antd';
import { ArrowLeftOutlined, UploadOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { becarioApi } from '../api/becarioApi';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

export const BecarioDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotifications();
  const { hasRole } = useAuth();

  const [becario, setBecario] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);

  const [uploadForm] = Form.useForm();
  const [enrollForm] = Form.useForm();

  const fetchBecarioDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await becarioApi.getById(id);
      if (res.success) {
        setBecario(res.data);
      }
      const docsRes = await becarioApi.getDocs(id);
      if (docsRes.success) {
        setDocumentos(docsRes.data);
      }
    } catch (err) {
      showError('Error al cargar expediente del becario: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    fetchBecarioDetail();
  }, [fetchBecarioDetail]);

  const handleUploadDocument = async (values) => {
    if (fileList.length === 0) {
      showError('Por favor selecciona un archivo para subir.');
      return;
    }
    const formData = new FormData();
    formData.append('becario_id', id);
    formData.append('tipo_documento', values.tipo_documento);
    if (values.fecha_vencimiento) {
      formData.append('fecha_vencimiento', values.fecha_vencimiento.format('YYYY-MM-DD'));
    }
    formData.append('archivo', fileList[0].originFileObj);

    try {
      const res = await becarioApi.uploadDoc(formData);
      if (res.success) {
        showSuccess('Documento subido a la nube correctamente');
        setUploadModalVisible(false);
        uploadForm.resetFields();
        setFileList([]);
        fetchBecarioDetail();
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      const res = await becarioApi.deleteDoc(docId);
      if (res.success) {
        showSuccess('Documento eliminado de la nube');
        fetchBecarioDetail();
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleEnrollSubject = async (values) => {
    try {
      const res = await becarioApi.enrollSubject(id, values);
      if (res.success) {
        showSuccess('Materia inscrita correctamente');
        setEnrollModalVisible(false);
        enrollForm.resetFields();
        fetchBecarioDetail();
      }
    } catch (err) {
      showError(err.message);
    }
  };

  if (loading || !becario) return <Card loading={true} />;

  const { persona } = becario;

  const academicColumns = [
    { title: 'Código', dataIndex: ['materia', 'codigo'] },
    { title: 'Materia', dataIndex: ['materia', 'nombre'] },
    { title: 'Créditos', dataIndex: ['materia', 'creditos'] },
    { title: 'Ciclo', dataIndex: ['ciclo', 'nombre'] },
    {
      title: 'Calificación',
      dataIndex: 'calificacion',
      render: (cal) => cal ? parseFloat(cal).toFixed(2) : 'Pendiente'
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (est) => {
        const colors = { EN_CURSO: 'blue', APROBADA: 'green', REPROBADA: 'red', RETIRADA: 'orange' };
        return <Tag color={colors[est] || 'default'}>{est}</Tag>;
      }
    }
  ];

  const docColumns = [
    { title: 'Nombre Archivo', dataIndex: 'nombre_archivo' },
    { title: 'Tipo', dataIndex: 'tipo_documento', render: (t) => <Tag color="geekblue">{t}</Tag> },
    { title: 'Fecha Subida', dataIndex: 'fecha_subida', render: (d) => new Date(d).toLocaleDateString() },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (record) => (
        <Space>
          {record.download_url && (
            <Button
              type="primary"
              ghost
              icon={<DownloadOutlined />}
              size="small"
              href={record.download_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver / Descargar
            </Button>
          )}
          {hasRole('ADMINISTRADOR', 'COORDINADOR') && (
            <Popconfirm title="¿Eliminar archivo?" onConfirm={() => handleDeleteDocument(record.id)}>
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const pagoColumns = [
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
    }
  ];

  const tabItems = [
    {
      key: '1',
      label: 'Datos Personales',
      children: (
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Nombre">{persona.nombre}</Descriptions.Item>
          <Descriptions.Item label="Apellido">{persona.apellido}</Descriptions.Item>
          <Descriptions.Item label="Cédula">{persona.cedula}</Descriptions.Item>
          <Descriptions.Item label="Email">{persona.email}</Descriptions.Item>
          <Descriptions.Item label="Teléfono">{persona.telefono || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Dirección">{persona.direccion || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Universidad">{becario.universidad?.nombre}</Descriptions.Item>
          <Descriptions.Item label="Carrera">{becario.carrera?.nombre}</Descriptions.Item>
          <Descriptions.Item label="Centro de Origen">{becario.centro_origen || 'N/A'}</Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: '2',
      label: 'Historial Académico',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            {hasRole('ADMINISTRADOR', 'COORDINADOR') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setEnrollModalVisible(true)}>
                Inscribir Materias
              </Button>
            )}
          </div>
          <Table
            dataSource={becario.materias_cursadas || []}
            columns={academicColumns}
            rowKey="id"
            pagination={false}
          />
        </>
      )
    },
    {
      key: '3',
      label: 'Documentos en Nube',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            {hasRole('ADMINISTRADOR', 'COORDINADOR') && (
              <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
                Subir Documento
              </Button>
            )}
          </div>
          <Table
            dataSource={documentos}
            columns={docColumns}
            rowKey="id"
            pagination={false}
          />
        </>
      )
    },
    {
      key: '4',
      label: 'Pagos Universitarios',
      children: (
        <Table
          dataSource={becario.pagos || []}
          columns={pagoColumns}
          rowKey="id"
          pagination={false}
        />
      )
    }
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/becarios')} style={{ marginBottom: 16 }}>
        Volver a Becarios
      </Button>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>{persona.nombre} {persona.apellido}</Title>
            <Text type="secondary">Cédula: {persona.cedula} | Email: {persona.email}</Text>
          </div>
          <Space>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              Índice Acumulado: {parseFloat(becario.promedio_general || 0).toFixed(2)}
            </Tag>
            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
              {becario.estado_beca}
            </Tag>
          </Space>
        </div>
      </Card>

      <Card>
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Card>

      {/* Modal Upload Document */}
      <Modal
        title="Subir Expediente o Documento a Nube"
        open={uploadModalVisible}
        onOk={() => uploadForm.submit()}
        onCancel={() => setUploadModalVisible(false)}
        destroyOnHidden
      >
        <Form form={uploadForm} layout="vertical" onFinish={handleUploadDocument}>
          <Form.Item name="tipo_documento" label="Tipo de Documento" rules={[{ required: true, message: 'Seleccione un tipo' }]}>
            <Select placeholder="Seleccionar">
              <Option value="CEDULA">Cédula de Identidad</Option>
              <Option value="CERTIFICADO_ESTUDIOS">Certificado de Estudios</Option>
              <Option value="TITULO_BACHILLER">Título de Bachiller</Option>
              <Option value="RECORD_NOTAS">Récord de Notas</Option>
              <Option value="ACTA_NACIMIENTO">Acta de Nacimiento</Option>
              <Option value="OTRO">Otro Documento</Option>
            </Select>
          </Form.Item>
          <Form.Item name="fecha_vencimiento" label="Fecha Vencimiento (Opcional)">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="Archivo (PDF, JPG, PNG)" required>
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Seleccionar Archivo</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Enroll Subject */}
      <Modal
        title="Inscribir Materia"
        open={enrollModalVisible}
        onOk={() => enrollForm.submit()}
        onCancel={() => setEnrollModalVisible(false)}
        destroyOnHidden
      >
        <Form form={enrollForm} layout="vertical" onFinish={handleEnrollSubject}>
          <Form.Item name="materia_id" label="Materia ID" rules={[{ required: true, message: 'Ingrese ID de materia' }]}>
            <Input placeholder="Ej. 1" />
          </Form.Item>
          <Form.Item name="ciclo_id" label="Ciclo Académico ID" rules={[{ required: true, message: 'Ingrese ID de ciclo' }]}>
            <Input placeholder="Ej. 1" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BecarioDetailPage;
