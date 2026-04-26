import { useState, useCallback, useRef } from 'react';
import {
  Frame,
  Button,
  Modal,
  TaskBar,
  List,
  TitleBar,
  Input,
  TextArea,
  Fieldset,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
} from '@react95/core';
import {
  Gcdef100,
  Progman46,
  ReaderClosed,
  FileText,
  User,
  Shell3215,
} from '@react95/icons';
import './App.css';

interface GossipPost {
  id: number;
  author: string;
  title: string;
  content: string;
  timestamp: Date;
  anonymous: boolean;
}

const SAMPLE_POSTS: GossipPost[] = [
  {
    id: 1,
    author: 'Anonymous',
    title: 'The coffee machine is haunted',
    content:
      'Every morning at exactly 9:15 AM, the coffee machine on the 3rd floor turns on by itself. Nobody is near it. I checked the security cameras and the timer is not set. Spooky.',
    timestamp: new Date('2026-04-25T09:30:00'),
    anonymous: true,
  },
  {
    id: 2,
    author: 'CoffeeLover42',
    title: 'Secret snack drawer in meeting room B',
    content:
      'There is a hidden snack drawer behind the whiteboard in Meeting Room B. Top shelf has the good stuff. You did not hear this from me.',
    timestamp: new Date('2026-04-25T11:00:00'),
    anonymous: false,
  },
  {
    id: 3,
    author: 'Anonymous',
    title: 'The boss plays minesweeper all day',
    content:
      'I walked past the managers office and saw a high score of 999 on Minesweeper. That takes HOURS to achieve. Just saying.',
    timestamp: new Date('2026-04-24T16:45:00'),
    anonymous: true,
  },
  {
    id: 4,
    author: 'DeskPlantFan',
    title: 'Who keeps moving the desk plants?',
    content:
      'Every Friday evening someone rearranges all the desk plants into a smiley face. Monday morning they are back to normal. Who is the plant whisperer?',
    timestamp: new Date('2026-04-24T10:20:00'),
    anonymous: false,
  },
];

type WindowId = 'main' | 'compose' | 'about' | 'post';

function App() {
  const audioRef = useRef(new Audio('/win95.mp3'));

  const playStartupSound = useCallback(() => {
    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, []);

  const [posts, setPosts] = useState<GossipPost[]>(SAMPLE_POSTS);
  const [openWindows, setOpenWindows] = useState<Set<WindowId>>(
    new Set(['main']),
  );
  const [selectedPost, setSelectedPost] = useState<GossipPost | null>(null);
  const [activeTab, setActiveTab] = useState('All Gossip');

  // Compose form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const openWindow = useCallback((window: WindowId) => {
    if (window === 'about') {
      playStartupSound();
    }
    setOpenWindows((prev) => new Set(prev).add(window));
  }, [playStartupSound]);

  const closeWindow = useCallback((window: WindowId) => {
    setOpenWindows((prev) => {
      const next = new Set(prev);
      next.delete(window);
      return next;
    });
  }, []);

  const handleSubmitPost = useCallback(() => {
    if (!newTitle.trim() || !newContent.trim()) return;

    const post: GossipPost = {
      id: Date.now(),
      author: isAnonymous ? 'Anonymous' : newAuthor || 'Anonymous',
      title: newTitle,
      content: newContent,
      timestamp: new Date(),
      anonymous: isAnonymous,
    };

    setPosts((prev) => [post, ...prev]);
    setNewTitle('');
    setNewContent('');
    setNewAuthor('');
    setIsAnonymous(false);
    closeWindow('compose');
  }, [newTitle, newContent, newAuthor, isAnonymous, closeWindow]);

  const handleSelectPost = useCallback(
    (post: GossipPost) => {
      setSelectedPost(post);
      openWindow('post');
    },
    [openWindow],
  );

  const filteredPosts =
    activeTab === 'All Gossip'
      ? posts
      : activeTab === 'Anonymous'
        ? posts.filter((p) => p.anonymous)
        : posts.filter((p) => !p.anonymous);

  const formatTime = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <Frame
      width="100vw"
      height="100vh"
      style={{
        background: '#008080',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Desktop Icons */}
      <Frame
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <Tooltip text="Open Gossip Board" delay={500}>
          <Frame
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              width: 80,
            }}
            onClick={() => openWindow('main')}
          >
            <Gcdef100 variant="32x32_4" />
            <span
              style={{
                color: 'white',
                fontSize: 12,
                textAlign: 'center',
                textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
                marginTop: 4,
              }}
            >
              GossipBoard
            </span>
          </Frame>
        </Tooltip>

        <Tooltip text="Write new gossip" delay={500}>
          <Frame
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              width: 80,
            }}
            onClick={() => openWindow('compose')}
          >
            <FileText variant="32x32_4" />
            <span
              style={{
                color: 'white',
                fontSize: 12,
                textAlign: 'center',
                textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
                marginTop: 4,
              }}
            >
              New Post
            </span>
          </Frame>
        </Tooltip>

        <Tooltip text="About GossipBoard" delay={500}>
          <Frame
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              width: 80,
            }}
            onClick={() => openWindow('about')}
          >
            <Progman46 variant="32x32_4" />
            <span
              style={{
                color: 'white',
                fontSize: 12,
                textAlign: 'center',
                textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
                marginTop: 4,
              }}
            >
              About
            </span>
          </Frame>
        </Tooltip>
      </Frame>

      {/* Main GossipBoard Window */}
      {openWindows.has('main') && (
        <Modal
          icon={<Gcdef100 variant="16x16_4" />}
          title="GossipBoard"
          titleBarOptions={[
            <TitleBar.Help
              key="help"
              onClick={() => openWindow('about')}
            />,
            <TitleBar.Maximize key="max" disabled />,
          ]}
          buttons={[{ value: 'Close', onClick: () => closeWindow('main') }]}
          style={{
            left: 120,
            top: 40,
            width: 520,
            height: 420,
          }}
          menu={[
            {
              name: 'File',
              list: (
                <List>
                  <List.Item onClick={() => openWindow('compose')}>
                    New Post
                  </List.Item>
                  <List.Divider />
                  <List.Item onClick={() => closeWindow('main')}>
                    Exit
                  </List.Item>
                </List>
              ),
            },
            {
              name: 'Help',
              list: (
                <List>
                  <List.Item onClick={() => openWindow('about')}>
                    About GossipBoard
                  </List.Item>
                </List>
              ),
            },
          ]}
        >
          <Modal.Content
            bg="white"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <Tabs
              defaultActiveTab="All Gossip"
              onChange={(title) => {
                if (typeof title === 'string') setActiveTab(title);
              }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Tab title="All Gossip">
                <Frame
                  style={{
                    overflowY: 'auto',
                    flex: 1,
                    padding: 4,
                  }}
                >
                  <List>
                    {filteredPosts.map((post) => (
                      <List.Item
                        key={post.id}
                        onClick={() => handleSelectPost(post)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '4px 8px',
                        }}
                      >
                        {post.anonymous ? (
                          <User variant="16x16_4" />
                        ) : (
                          <Avatar
                            size={20}
                            src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${post.author}`}
                          />
                        )}
                        <Frame
                          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                        >
                          <Frame
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <strong style={{ fontSize: 13 }}>{post.title}</strong>
                            <span style={{ fontSize: 11, color: '#666' }}>
                              {formatTime(post.timestamp)}
                            </span>
                          </Frame>
                          <span style={{ fontSize: 11, color: '#888' }}>
                            by {post.author}
                          </span>
                        </Frame>
                      </List.Item>
                    ))}
                  </List>
                </Frame>
              </Tab>
              <Tab title="Anonymous">
                <Frame
                  style={{
                    overflowY: 'auto',
                    flex: 1,
                    padding: 4,
                  }}
                >
                  <List>
                    {filteredPosts.map((post) => (
                      <List.Item
                        key={post.id}
                        onClick={() => handleSelectPost(post)}
                      >
                        <Frame
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <User variant="16x16_4" />
                          <strong style={{ fontSize: 13 }}>{post.title}</strong>
                          <span style={{ fontSize: 11, color: '#666' }}>
                            {formatTime(post.timestamp)}
                          </span>
                        </Frame>
                      </List.Item>
                    ))}
                  </List>
                </Frame>
              </Tab>
              <Tab title="Named">
                <Frame
                  style={{
                    overflowY: 'auto',
                    flex: 1,
                    padding: 4,
                  }}
                >
                  <List>
                    {filteredPosts.map((post) => (
                      <List.Item
                        key={post.id}
                        onClick={() => handleSelectPost(post)}
                      >
                        <Frame
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <Avatar
                            size={20}
                            src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${post.author}`}
                          />
                          <strong style={{ fontSize: 13 }}>{post.title}</strong>
                          <span style={{ fontSize: 11, color: '#666' }}>
                            by {post.author} - {formatTime(post.timestamp)}
                          </span>
                        </Frame>
                      </List.Item>
                    ))}
                  </List>
                </Frame>
              </Tab>
            </Tabs>

            <Frame
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '8px 4px 4px',
                gap: 4,
              }}
            >
              <Button onClick={() => openWindow('compose')}>
                <Frame
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <FileText variant="16x16_4" />
                  New Post
                </Frame>
              </Button>
              <span
                style={{
                  fontSize: 11,
                  color: '#666',
                  alignSelf: 'center',
                  marginLeft: 8,
                }}
              >
                {posts.length} gossip(s) total
              </span>
            </Frame>
          </Modal.Content>
        </Modal>
      )}

      {/* Compose Window */}
      {openWindows.has('compose') && (
        <Modal
          icon={<FileText variant="16x16_4" />}
          title="New Gossip Post"
          buttons={[
            {
              value: 'Post!',
              onClick: handleSubmitPost,
            },
            { value: 'Cancel', onClick: () => closeWindow('compose') },
          ]}
          style={{
            left: 180,
            top: 80,
            width: 420,
          }}
        >
          <Modal.Content
            bg="white"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <Fieldset legend="Your Details">
              <Frame
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <label style={{ fontSize: 12, width: 70 }}>Name:</label>
                <Input
                  placeholder="Your name (optional)"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  disabled={isAnonymous}
                  style={{ flex: 1 }}
                />
              </Frame>
              <Frame
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <label style={{ fontSize: 12, width: 70 }} />
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  Post anonymously
                </label>
              </Frame>
            </Fieldset>

            <Fieldset legend="Gossip">
              <Frame
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <label style={{ fontSize: 12, width: 70 }}>Title:</label>
                <Input
                  placeholder="What's the tea?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ flex: 1 }}
                />
              </Frame>
              <TextArea
                placeholder="Spill the gossip here..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={5}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </Fieldset>
          </Modal.Content>
        </Modal>
      )}

      {/* Post Detail Window */}
      {openWindows.has('post') && selectedPost && (
        <Modal
          icon={<ReaderClosed variant="16x16_4" />}
          title={selectedPost.title}
          buttons={[{ value: 'Close', onClick: () => closeWindow('post') }]}
          style={{
            left: 200,
            top: 100,
            width: 420,
          }}
        >
          <Modal.Content bg="white">
            <Frame
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: '1px solid #ccc',
              }}
            >
              {selectedPost.anonymous ? (
                <User variant="32x32_4" />
              ) : (
                <Avatar
                  size={32}
                  src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${selectedPost.author}`}
                />
              )}
              <Frame style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: 13 }}>{selectedPost.author}</strong>
                <span style={{ fontSize: 11, color: '#666' }}>
                  {formatTime(selectedPost.timestamp)}
                </span>
              </Frame>
            </Frame>
            <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              {selectedPost.content}
            </p>
          </Modal.Content>
        </Modal>
      )}

      {/* About Window */}
      {openWindows.has('about') && (
        <Modal
          icon={<Progman46 variant="32x32_4" />}
          title="About GossipBoard"
          buttons={[{ value: 'OK', onClick: () => closeWindow('about') }]}
          style={{
            left: 240,
            top: 140,
            width: 340,
          }}
        >
          <Modal.Content
            bg="white"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: 16,
            }}
          >
            <Shell3215 variant="32x32_4" />
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontFamily: 'MS Sans Serif, sans-serif',
              }}
            >
              GossipBoard v1.0
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                textAlign: 'center',
                color: '#444',
              }}
            >
              The retro-styled anonymous gossip board.
              <br />
              Post secrets. Share rumors. Stay mysterious.
            </p>
            <Frame
              style={{
                borderTop: '1px solid #ccc',
                paddingTop: 8,
                width: '100%',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 11, color: '#888' }}>
                Built with React95
                <br />
                &copy; 2026 GossipBoard Inc.
              </span>
            </Frame>
          </Modal.Content>
        </Modal>
      )}

      {/* TaskBar */}
      <TaskBar
        list={
          <List>
            <List.Item onClick={() => openWindow('main')}>
              <Frame
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Gcdef100 variant="16x16_4" />
                GossipBoard
              </Frame>
            </List.Item>
            <List.Item onClick={() => openWindow('compose')}>
              <Frame
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <FileText variant="16x16_4" />
                New Post
              </Frame>
            </List.Item>
            <List.Divider />
            <List.Item onClick={() => openWindow('about')}>
              <Frame
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Progman46 variant="32x32_4" />
                About...
              </Frame>
            </List.Item>
          </List>
        }
      />
    </Frame>
  );
}

export default App;
