import { useState } from 'react';
import { Frame, Modal, Button, Input, Fieldset, RadioButton, TitleBar } from '@react95/core';
import { useAppSettings } from '../context/AppSettingsContext';
import { useMarketData } from '../hooks/useMarketData';
import type { NewsDirection } from '../types';

interface NewsWindowProps {
  onClose: () => void;
}

const directionArrow = (dir: NewsDirection) => {
  switch (dir) {
    case 'bullish': return '▲';
    case 'bearish': return '▼';
    case 'neutral': return '─';
    case 'volatility': return '⇅';
  }
};

const directionColor = (dir: NewsDirection) => {
  switch (dir) {
    case 'bullish': return '#008000';
    case 'bearish': return '#cc0000';
    case 'neutral': return '#888';
    case 'volatility': return '#cc8800';
  }
};

export function NewsWindow({ onClose }: NewsWindowProps) {
  const { fs } = useAppSettings();
  const { pair, loading, error, updatePrice, addNews, deleteNews, refetch } = useMarketData();
  
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [direction, setDirection] = useState<NewsDirection>('bullish');
  const [magnitude, setMagnitude] = useState('1.0');
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'idle'>('idle');
  const [copied, setCopied] = useState(false);

  const curlCommand = `curl -X POST http://127.0.0.1:9002/mcp/8966388da8c682ca5af1399620572f4a225a922795630c5723a1c4b875d2a54b/openclaw-gateway \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"tools/call","id":1,"params":{"agent":"agentbook-one.eth","message":"market has shifted, try check and tell other agents"}}'`;

  const handleCopy = () => {
    navigator.clipboard.writeText(curlCommand).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePublish = async () => {
    if (!headline.trim()) return;
    await addNews(headline, summary, direction, parseFloat(magnitude) || 0);
    setHeadline('');
    setSummary('');
    setMagnitude('1.0');
  };

  const handlePriceUpdate = async () => {
    const newPrice = parseFloat(priceInput);
    if (isNaN(newPrice) || newPrice <= 0) return;
    await updatePrice(newPrice);
    setEditingPrice(false);
    setPriceInput('');
  };

  const handleQuickPrice = async (delta: number) => {
    if (!pair) return;
    const newPrice = pair.price + delta;
    
    // Track direction
    if (newPrice > pair.price) {
      setPriceDirection('up');
    } else if (newPrice < pair.price) {
      setPriceDirection('down');
    }
    
    await updatePrice(newPrice);
    
    // Reset to idle after 2 seconds
    setTimeout(() => setPriceDirection('idle'), 2000);
  };

  const getPriceEmoji = () => {
    switch (priceDirection) {
      case 'up': return '🟢';
      case 'down': return '🔴';
      default: return '🟡';
    }
  };

  return (
    <Modal
      id="news"
      icon={<span>📰</span>}
      title="News & Price Control"
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      style={{ left: 140, top: 50, width: 560, height: 520 }}
      buttons={[{ value: 'Close', onClick: onClose }]}
    >
      <Modal.Content bg="white" style={{ overflow: 'auto', padding: 8 }}>
        
        {/* Error State */}
        {error && (
          <Frame style={{ 
            padding: 8, 
            background: '#fff0f0', 
            border: '1px solid #cc0000',
            marginBottom: 8,
          }}>
            <span style={{ color: '#cc0000' }}>Error: {error}</span>
            <Button style={{ marginLeft: 8, fontSize: fs(9) }} onClick={refetch}>Retry</Button>
          </Frame>
        )}

        {/* Loading State */}
        {loading && !pair && (
          <Frame style={{ textAlign: 'center', padding: 20 }}>
            <span>Loading market data...</span>
          </Frame>
        )}

        {/* Live Price */}
        {pair && (
          <Frame style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
            padding: '6px 8px',
            background: '#ffffcc',
            border: '1px solid #cccc00',
          }}>
            <span style={{ fontSize: fs(11), fontWeight: 'bold' }}>{getPriceEmoji()} {pair.base}/{pair.quote}:</span>
            
            {editingPrice ? (
              <>
                <Input
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder={pair.price.toString()}
                  style={{ width: 120, fontSize: fs(14) }}
                  autoFocus
                />
                <Button style={{ fontSize: fs(10) }} onClick={handlePriceUpdate}>✓</Button>
                <Button style={{ fontSize: fs(10) }} onClick={() => setEditingPrice(false)}>✕</Button>
              </>
            ) : (
              <>
                <span 
                  style={{ fontSize: fs(16), fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => { setEditingPrice(true); setPriceInput(pair.price.toString()); }}
                >
                  ${pair.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <Button style={{ fontSize: fs(9), padding: '2px 4px' }} onClick={() => handleQuickPrice(100)}>+100</Button>
                <Button style={{ fontSize: fs(9), padding: '2px 4px' }} onClick={() => handleQuickPrice(-100)}>-100</Button>
                <Button style={{ fontSize: fs(9), padding: '2px 4px' }} onClick={() => handleQuickPrice(1000)}>+1K</Button>
                <Button style={{ fontSize: fs(9), padding: '2px 4px' }} onClick={() => handleQuickPrice(-1000)}>-1K</Button>
              </>
            )}
          </Frame>
        )}

        {/* MVP Info Banner */}
        <Frame style={{ 
          padding: '6px 8px', 
          background: '#ffffcc', 
          border: '1px solid #cccc00',
          marginBottom: 10,
        }}>
          <Frame style={{ fontSize: fs(11), fontWeight: 'bold', color: '#cc8800', marginBottom: 4 }}>
            💡 Try it
          </Frame>
          <Frame style={{ fontSize: fs(11), lineHeight: 1.3, marginBottom: 6 }}>
            We allow anyone to manipulate external news and price for agents to react. Please wait a moment for its heartbeat to pick up, or curl one of the AXL public nodes:
          </Frame>
          <Frame style={{
            background: '#1a1a2e',
            padding: '6px 8px',
            position: 'relative',
            borderTop: '2px solid #404040',
            borderLeft: '2px solid #404040',
            borderRight: '2px solid white',
            borderBottom: '2px solid white',
          }}>
            <pre style={{
              margin: 0,
              fontSize: fs(9),
              color: '#00ff88',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              lineHeight: 1.4,
            }}>
{curlCommand}
            </pre>
            <Button
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                fontSize: fs(9),
                padding: '1px 6px',
                minWidth: 'auto',
                background: copied ? '#00aa00' : '#808080',
                color: 'white',
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </Button>
          </Frame>
        </Frame>

        {/* Create News Event */}
        <Fieldset legend="Publish News" style={{ marginBottom: 10 }}>
          <Frame style={{ marginBottom: 6 }}>
            <label style={{ fontSize: fs(11), display: 'block', marginBottom: 2 }}>Headline:</label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Bitcoin ETF sees record $1B daily inflow"
              style={{ width: '100%' }}
            />
          </Frame>
          
          <Frame style={{ marginBottom: 6 }}>
            <label style={{ fontSize: fs(11), display: 'block', marginBottom: 2 }}>Summary (2-3 sentences):</label>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Institutional investors continue to accumulate..."
              style={{ width: '100%', height: 50 }}
            />
          </Frame>

          <Frame style={{ display: 'flex', gap: 16, marginBottom: 6, alignItems: 'center' }}>
            <Frame>
              <label style={{ fontSize: fs(11), marginBottom: 4, display: 'block' }}>Direction:</label>
              <Frame style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {(['bullish', 'bearish', 'neutral', 'volatility'] as const).map((dir) => (
                  <label key={dir} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: fs(10), cursor: 'pointer' }}>
                    <RadioButton checked={direction === dir} onChange={() => setDirection(dir)} />
                    {dir.charAt(0).toUpperCase() + dir.slice(1)}
                  </label>
                ))}
              </Frame>
            </Frame>
            <Frame>
              <label style={{ fontSize: fs(11), display: 'block', marginBottom: 2 }}>Magnitude (%):</label>
              <Input value={magnitude} onChange={(e) => setMagnitude(e.target.value)} style={{ width: 80 }} />
            </Frame>
          </Frame>
 

          <Button 
            style={{ fontSize: fs(11), fontWeight: 'bold' }}
            onClick={handlePublish}
            disabled={!headline.trim()}
          >
            📰 Publish News
          </Button>
        </Fieldset>

        {/* News List */}
        <Fieldset legend={`News (${pair?.news?.length || 0})`}>
          <Frame style={{ flexDirection: 'column', gap: 6, maxHeight: 200, overflow: 'auto' }}>
            {pair?.news?.length === 0 && (
              <span style={{ fontSize: fs(11), color: '#888' }}>No news yet. Publish one above!</span>
            )}
            {pair?.news?.map((item) => (
              <Frame key={item.id} style={{ 
                padding: '4px 6px', 
                borderBottom: '1px solid #eee',
                background: '#fafafa',
              }}>
                <Frame style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Frame style={{ flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: fs(11), fontWeight: 'bold' }}>"{item.headline}"</span>
                    <span style={{ fontSize: fs(10), color: '#666', marginTop: 2 }}>{item.summary}</span>
                    <span style={{
                      fontSize: fs(10),
                      color: directionColor(item.direction as NewsDirection),
                      fontWeight: 'bold',
                    }}>
                      {item.magnitude >= 0 ? '+' : ''}{item.magnitude}% {directionArrow(item.direction as NewsDirection)}
                    </span>
                  </Frame>
                  <Button
                    style={{ fontSize: fs(9), padding: '0px 4px', minWidth: 'auto', color: '#cc0000' }}
                    onClick={() => deleteNews(item.id)}
                  >
                    ✕
                  </Button>
                </Frame>
              </Frame>
            ))}
          </Frame>
        </Fieldset>
      </Modal.Content>
    </Modal>
  );
}