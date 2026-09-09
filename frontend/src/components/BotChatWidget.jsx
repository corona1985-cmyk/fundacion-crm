import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, Badge, Space, Typography, Tooltip, Avatar } from 'antd';
import { RobotOutlined, SendOutlined, CloseOutlined, ExpandOutlined, ShrinkOutlined, BulbOutlined, QuestionCircleOutlined, UserOutlined } from '@ant-design/icons';
import { botApi } from '../api/botApi';

const { Text, Title } = Typography;

const BotChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `🤖 *ASISTENTE INTELIGENTE CRM* 🎓\n\nBusco dentro de la base de datos (becarios, padrinos, índices, alarmas, finanzas) y puedo aprender.\n\nPrueba:\n• *índice Freily*\n• *quiénes tienen índice bajo*\n• *becados del Canadá*\n• *aprende: teléfono fundación => 809-995-0808*\n\nEscribe *#* para el menú.`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastExchange, setLastExchange] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
      setLastExchange({ query: query.trim(), reply: botReply });
    } catch (error) {
      console.error('Error enviando consulta al bot:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '❌ Ocurrió un error al consultar la base de datos del CRM.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const teachPrompt = () => {
    const sample = window.prompt(
      'Enseña al bot (formato: pregunta => respuesta)',
      'horario de atención => Lunes a viernes 8:00 a.m. - 5:00 p.m.'
    );
    if (sample && sample.includes('=>')) {
      handleSend(`aprende: ${sample}`);
    }
  };

  // Helper function to format WhatsApp Markdown into rich React elements
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split text into lines
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold replacement *text*
      let parts = [line];
      
      return (
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
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <Button
          type="primary"
          shape="round"
          size="large"
          icon={<RobotOutlined style={{ fontSize: '22px' }} />}
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            height: '54px',
            padding: '0 24px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 6px 20px rgba(24, 144, 255, 0.4)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #1890ff 0%, #003a8c 100%)',
            border: 'none'
          }}
        >
          Asistente de Consultas CRM
          <Badge status="processing" color="#52c41a" />
        </Button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <Card
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: isExpanded ? '650px' : '420px',
            height: isExpanded ? '750px' : '580px',
            maxHeight: '90vh',
            maxWidth: '94vw',
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #e8e8e8'
          }}
          bodyStyle={{
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #002140 0%, #003a8c 100%)',
              color: '#fff',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Space>
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <div>
                <Title level={5} style={{ color: '#fff', margin: 0, fontSize: '15px' }}>
                  Asistente Inteligente CRM
                </Title>
                <Text style={{ color: '#bae7ff', fontSize: '12px' }}>
                  ● Busca en la BD · Aprende respuestas
                </Text>
              </div>
            </Space>
            <Space>
              <Tooltip title={isExpanded ? 'Contraer' : 'Expandir'}>
                <Button
                  type="text"
                  icon={isExpanded ? <ShrinkOutlined style={{ color: '#fff' }} /> : <ExpandOutlined style={{ color: '#fff' }} />}
                  onClick={() => setIsExpanded(!isExpanded)}
                />
              </Tooltip>
              <Tooltip title="Cerrar">
                <Button
                  type="text"
                  icon={<CloseOutlined style={{ color: '#fff' }} />}
                  onClick={() => setIsOpen(false)}
                />
              </Tooltip>
            </Space>
          </div>

          {/* Quick Buttons Bar */}
          <div
            style={{
              padding: '8px 12px',
              background: '#f5f7fa',
              borderBottom: '1px solid #f0f0f0',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            <Space size={6}>
              <Button size="small" type="dashed" onClick={() => handleSend('#')}>
                # Menú
              </Button>
              <Button size="small" type="primary" ghost onClick={() => handleSend('índice bajo')}>
                ⚠️ Índice bajo
              </Button>
              <Button size="small" onClick={() => handleSend('cuántos becarios activos hay')}>
                📊 Estadísticas
              </Button>
              <Button size="small" onClick={() => handleSend('alarmas pendientes')}>
                🚨 Alarmas
              </Button>
              <Button size="small" onClick={() => handleSend('becados del Canadá')}>
                🏫 Canadá
              </Button>
              <Button size="small" onClick={() => handleSend('índice Freily')}>
                🎓 Freily
              </Button>
              <Button size="small" icon={<BulbOutlined />} onClick={teachPrompt}>
                Enseñar
              </Button>
            </Space>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              background: '#eef2f5',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                {msg.sender === 'bot' && (
                  <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#002140', flexShrink: 0, marginTop: '4px' }} size="small" />
                )}
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: msg.sender === 'user' ? '#1890ff' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : '#262626',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    fontSize: '13.5px',
                    lineHeight: '1.5'
                  }}
                >
                  {msg.sender === 'user' ? msg.text : renderFormattedText(msg.text)}
                </div>
                {msg.sender === 'user' && (
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', flexShrink: 0, marginTop: '4px' }} size="small" />
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#002140' }} size="small" />
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: '16px',
                    background: '#ffffff',
                    color: '#8c8c8c',
                    fontSize: '13px'
                  }}
                >
                  ⏳ Consultando la base de datos del CRM...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
            {lastExchange ? (
              <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>¿Útil?</Text>
                <Button
                  size="small"
                  onClick={() => {
                    botApi.markUseful(lastExchange.query, lastExchange.reply);
                    setMessages((prev) => [...prev, { sender: 'bot', text: '👍 Gracias. Usaré este tipo de consulta como referencia.' }]);
                    setLastExchange(null);
                  }}
                >
                  Sí
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    botApi.markNotUseful(lastExchange.query, lastExchange.reply);
                    setMessages((prev) => [...prev, { sender: 'bot', text: '📝 Anotado. Puedes corregirme con: `aprende: pregunta => respuesta correcta`' }]);
                    setLastExchange(null);
                  }}
                >
                  No
                </Button>
              </div>
            ) : null}
            <Input.Search
              placeholder="Pregunta en lenguaje natural… (ej: índice Freily, alarmas, índice bajo)"
              enterButton={<SendOutlined />}
              size="large"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onSearch={() => handleSend()}
              loading={loading}
            />
          </div>
        </Card>
      )}
    </>
  );
};

export default BotChatWidget;
