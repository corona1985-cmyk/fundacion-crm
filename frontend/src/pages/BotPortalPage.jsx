import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Typography, Space, Avatar, Badge, Row, Col, Tag } from 'antd';
import { RobotOutlined, SendOutlined, UserOutlined, TrophyOutlined, BulbOutlined } from '@ant-design/icons';
import { botApi } from '../api/botApi';

const { Title, Text } = Typography;

const BotPortalPage = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `🤖 *ASISTENTE INTELIGENTE CRM* 🎓\n\n¡Bienvenido!\n\nPuedo buscar en la base de datos y aprender.\n\nEjemplos:\n• *índice Freily*\n• *quiénes tienen índice bajo*\n• *cuántos becarios activos hay*\n• *aprende: teléfono => 809-995-0808*\n\nEscribe *#* para el menú.`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query || !query.trim()) return;

    const userMsg = { sender: 'user', text: query.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const response = await botApi.chat(query.trim());
      const botReply = response.reply || 'No se recibió respuesta del asistente.';
      setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
    } catch (error) {
      console.error('Error enviando consulta:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '❌ Ocurrió un error al conectar con el servidor de consultas.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => (
      <div key={idx} style={{ minHeight: line.trim() === '' ? '8px' : 'auto', marginBottom: '2px' }}>
        {line.split(/(\*[^*]+\*|_[^_]+_|\`[^`]+\`)/g).map((part, pIdx) => {
          if (part.startsWith('*') && part.endsWith('*')) {
            return <strong key={pIdx} style={{ color: '#002140' }}>{part.slice(1, -1)}</strong>;
          }
          if (part.startsWith('_') && part.endsWith('_')) {
            return <em key={pIdx} style={{ color: '#595959' }}>{part.slice(1, -1)}</em>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={pIdx} style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', color: '#096dd9' }}>{part.slice(1, -1)}</code>;
          }
          return part;
        })}
      </div>
    ));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#001529', padding: '24px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '850px',
          height: '85vh',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          border: 'none',
          display: 'flex',
          flexDirection: 'column'
        }}
        bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #002140 0%, #003a8c 100%)', padding: '20px 28px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space size={14}>
            <TrophyOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            <div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                Portal de Consultas CRM - Fundación
              </Title>
              <Text style={{ color: '#bae7ff', fontSize: '13px' }}>
                ● Respuestas en Vivo sin WhatsApp | Sin Escaneo de QR
              </Text>
            </div>
          </Space>
          <Badge status="processing" text={<span style={{ color: '#52c41a', fontWeight: 'bold' }}>En Línea</span>} />
        </div>

        {/* Action Pills Bar */}
        <div style={{ padding: '12px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button type="dashed" onClick={() => handleSend('#')}># Menú Principal</Button>
          <Button type="primary" ghost onClick={() => handleSend('indice ?')}>📋 Lista de Estudiantes (91)</Button>
          <Button onClick={() => handleSend('indice Yesly')}>🎓 Promedio Yesly</Button>
          <Button onClick={() => handleSend('itinerario de graduaciones')}>🎓 Graduaciones</Button>
          <Button onClick={() => handleSend('factura Bryan Collado')}>📑 Facturas Padrinos</Button>
        </div>

        {/* Chat Messages */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f0f2f5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: '12px' }}>
              {msg.sender === 'bot' && <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#002140', flexShrink: 0, marginTop: '4px' }} size="large" />}
              <div
                style={{
                  maxWidth: '80%',
                  padding: '16px 20px',
                  borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: msg.sender === 'user' ? '#1890ff' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : '#262626',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontSize: '14.5px',
                  lineHeight: '1.6'
                }}
              >
                {msg.sender === 'user' ? msg.text : renderFormattedText(msg.text)}
              </div>
              {msg.sender === 'user' && <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', flexShrink: 0, marginTop: '4px' }} size="large" />}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#002140' }} size="large" />
              <div style={{ padding: '12px 20px', borderRadius: '20px', background: '#ffffff', color: '#8c8c8c' }}>
                ⏳ Consultando base de datos del CRM...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
          <Input.Search
            placeholder="Escribe # o consulta (ejemplo: indice Yesly, indice ?)"
            enterButton={<Button type="primary" icon={<SendOutlined />}>Enviar Consulta</Button>}
            size="large"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSearch={() => handleSend()}
            loading={loading}
          />
        </div>
      </Card>
    </div>
  );
};

export default BotPortalPage;
