import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Popover, List, Typography, Tag, Button } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const { Header, Sider, Content, Footer } = Layout;
const { Text, Title } = Typography;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { alarms, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/becarios', icon: <UserOutlined />, label: 'Becarios' },
    { key: '/padrinos', icon: <TeamOutlined />, label: 'Padrinos e Inst.' },
    { key: '/financiero', icon: <DollarOutlined />, label: 'Gestión Financiera' },
    { key: '/alarmas', icon: <BellOutlined />, label: 'Centro de Alarmas' },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '4px 8px' }}>
          <Text strong>{user?.username || 'Usuario'}</Text>
          <br />
          <Tag color="blue" style={{ marginTop: 4 }}>{user?.rol || 'ROL'}</Tag>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const notificationContent = (
    <div style={{ width: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
        <Text strong>Pagos Vencidos / Alarmas</Text>
        <Button type="link" size="small" onClick={() => navigate('/alarmas')}>Ver todas</Button>
      </div>
      <List
        size="small"
        dataSource={alarms.slice(0, 5)}
        renderItem={(item) => (
          <List.Item key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/alarmas')}>
            <List.Item.Meta
              avatar={<Avatar icon={<BellOutlined />} style={{ backgroundColor: '#ff4d4f' }} />}
              title={<Text type="danger" style={{ fontSize: 13 }}>Pago Atrasado</Text>}
              description={`Monto: RD$ ${parseFloat(item.monto).toLocaleString()} - ${item.becario?.persona?.nombre || ''}`}
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={240}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? 0 : 20,
          background: '#002140'
        }}>
          <TrophyOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: collapsed ? 0 : 12 }} />
          {!collapsed && (
            <Title level={5} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
              CRM FUNDACIÓN
            </Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 1
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Popover content={notificationContent} trigger="click" placement="bottomRight">
              <Badge count={unreadCount} overflowCount={99}>
                <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 18 }} />} />
              </Badge>
            </Popover>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                <Text strong>{user?.username || 'Usuario'}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '24px 24px 0', minHeight: 280 }}>
          <Outlet />
        </Content>

        <Footer style={{ textAlign: 'center', color: '#8c8c8c' }}>
          Fundación "Rompiendo Paradigmas" CRM ©2026 - Gestión de Becas Estudiantiles
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
