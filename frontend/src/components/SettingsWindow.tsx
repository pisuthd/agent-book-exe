import { Frame, Modal, Fieldset, TitleBar } from '@react95/core';
import { useAppSettings, DEFAULT_FONT_SIZE, MIN_FONT_SIZE, MAX_FONT_SIZE } from '../context/AppSettingsContext';

interface SettingsWindowProps {
  onClose: () => void;
}

export function SettingsWindow({ onClose }: SettingsWindowProps) {
  const { state, dispatch, fs } = useAppSettings();

  return (
    <Modal
      id="settings"
      icon={<span>⚙️</span>}
      title="Settings"
      titleBarOptions={<TitleBar.Close onClick={onClose} />}
      style={{ left: 260, top: 120, width: 360 }}
      buttons={[
        { value: 'Reset', onClick: () => dispatch({ type: 'RESET' }) },
        { value: 'Close', onClick: onClose },
      ]}
    >
      <Modal.Content bg="white" style={{ padding: 8 }}>
        <Fieldset legend="Display">
          <Frame style={{ flexDirection: 'column', gap: 8 }}>
            <Frame style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: fs(12), width: 80 }}>Font Size:</label>
              <input
                type="range"
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                step={1}
                value={state.fontSize}
                onChange={(e) =>
                  dispatch({ type: 'SET_FONT_SIZE', payload: parseInt(e.target.value, 10) })
                }
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: fs(12), fontWeight: 'bold', width: 32, textAlign: 'right' }}>
                {state.fontSize}px
              </span>
            </Frame>

            <Frame style={{
              background: '#ffffcc',
              border: '1px solid #cccc00',
              padding: '4px 8px',
              marginTop: 4,
            }}>
              <span style={{ fontSize: fs(11), color: '#666' }}>
                Default: {DEFAULT_FONT_SIZE}px — Range: {MIN_FONT_SIZE}–{MAX_FONT_SIZE}px
              </span>
            </Frame>
          </Frame>
        </Fieldset>
      </Modal.Content>
    </Modal>
  );
}
