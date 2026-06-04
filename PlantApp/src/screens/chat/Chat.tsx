import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/desingSystem';
import { useAuth } from '../../context/AuthContext';
import { useChatStyles } from './Chat.style';

// ─────────────────────────────── types ───────────────────────────────────────

type ChatUser = {
  id: string;
  nickname: string;
  joined_at: string;
  is_online: boolean;
  public_key?: string | null;
};

type MediaAttachment = {
  url: string;
  public_id: string;
  resource_type: 'image' | 'video' | 'raw';
  format: string;
  size_bytes: number;
  original_filename: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  sender_nickname: string;
  content: string;
  type: 'group' | 'dm';
  recipient_id: string | null;
  timestamp: string;
  ttl?: number | null;
  expires_at?: string | null;
  allow_read_receipt?: boolean;
  media?: MediaAttachment | null;
};

type JoinResponse = { user: ChatUser; token: string };

type WsEvent =
  | { type: 'group_message'; message: ChatMessage }
  | { type: 'dm_message'; message: ChatMessage }
  | { type: 'group_history'; messages: ChatMessage[] }
  | { type: 'users_list'; users: ChatUser[] }
  | { type: 'user_joined'; user: ChatUser }
  | { type: 'user_left'; user_id: string }
  | { type: 'read_receipt'; message_id: string; reader_id: string }
  | { type: 'pong' }
  | { type: 'error'; message: string };

type Tab = 'group' | 'dm';

const TTL_OPTIONS = [
  { label: 'Sin TTL', value: null },
  { label: '30 s', value: 30 },
  { label: '5 min', value: 300 },
  { label: '1 h', value: 3600 },
];

const CHAT_HTTP_BASE =
  process.env.EXPO_PUBLIC_CHAT_APP ?? 'https://chat-backend-4nzg.onrender.com';
const CHAT_WS_BASE =
  process.env.EXPO_PUBLIC_CHAT_WS_APP ?? 'wss://chat-backend-4nzg.onrender.com';

// ─────────────────────────────── component ───────────────────────────────────

export default function ChatScreen() {
  const { theme } = useTheme();
  const { styles } = useChatStyles();
  const { currentUser: authUser } = useAuth();

  // ── connection state ────────────────────────────────────────────────────
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [connectionState, setConnectionState] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');

  // ── chat data ───────────────────────────────────────────────────────────
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [chatToken, setChatToken] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<ChatMessage[]>([]);
  const [readReceipts, setReadReceipts] = useState<Record<string, string[]>>({}); // message_id → reader_ids

  // ── UI state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('group');
  const [selectedDmUser, setSelectedDmUser] = useState<ChatUser | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [selectedTtl, setSelectedTtl] = useState<number | null>(null);
  const [showTtlOptions, setShowTtlOptions] = useState(false);

  // ── refs ────────────────────────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const joinedAuthUidRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  // ─────────────────────────────── derived ─────────────────────────────────

  const chatNickname = useMemo(() => {
    if (!authUser) return '';
    const displayName = authUser.displayName?.trim();
    if (displayName) return displayName;
    const emailPrefix = authUser.email?.split('@')?.[0]?.trim();
    if (emailPrefix) return emailPrefix;
    return `user_${authUser.uid.slice(0, 6)}`;
  }, [authUser]);

  const onlineCount = useMemo(
    () => onlineUsers.filter((u) => u.is_online).length,
    [onlineUsers],
  );

  const otherUsers = useMemo(
    () => onlineUsers.filter((u) => u.id !== chatUser?.id),
    [onlineUsers, chatUser],
  );

  const visibleMessages = useMemo(() => {
    if (activeTab === 'group') return groupMessages;
    if (!selectedDmUser) return [];
    return dmMessages.filter(
      (m) =>
        (m.sender_id === chatUser?.id && m.recipient_id === selectedDmUser.id) ||
        (m.sender_id === selectedDmUser.id && m.recipient_id === chatUser?.id),
    );
  }, [activeTab, groupMessages, dmMessages, selectedDmUser, chatUser]);

  const formatTime = useCallback((isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '--:--';
    return new Intl.DateTimeFormat('es-CR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }, []);

  const isImageUrl = useCallback((value: string) => {
    if (!value) return false;
    if (/^https?:\/\/.+\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(value)) return true;
    return value.includes('/image/upload/') || value.includes('cloudinary');
  }, []);

  // ─────────────────────────────── HTTP helper ──────────────────────────────

  const request = useCallback(
    async <T,>(path: string, options: RequestInit = {}, authToken?: string): Promise<T> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
        headers['X-User-Token'] = authToken;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(`${CHAT_HTTP_BASE}${path}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
        if (!response.ok) {
          let detail = `Error ${response.status}`;
          try {
            const body = (await response.json()) as { detail?: string | { message?: string } };
            if (typeof body.detail === 'string') detail = body.detail;
            else if (body.detail?.message) detail = body.detail.message;
          } catch {
            // ignore
          }
          throw new Error(detail);
        }
        return response.json() as Promise<T>;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [],
  );

  // ─────────────────────────────── WebSocket ────────────────────────────────

  const clearSocket = useCallback(() => {
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
    if (wsRef.current) {
      const socket = wsRef.current;
      wsRef.current = null;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      try { socket.close(); } catch { /* ignore */ }
    }
  }, []);

  const connectWebSocket = useCallback(
    (authToken: string) => {
      clearSocket();
      setConnectionState('connecting');
      const socket = new WebSocket(`${CHAT_WS_BASE}/ws/${authToken}`);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnectionState('connected');
        pingRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as WsEvent;

          if (payload.type === 'group_message') {
            setGroupMessages((prev) =>
              prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message],
            );
          } else if (payload.type === 'dm_message') {
            setDmMessages((prev) =>
              prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message],
            );
          } else if (payload.type === 'group_history') {
            setGroupMessages(payload.messages);
          } else if (payload.type === 'users_list') {
            setOnlineUsers(payload.users);
          } else if (payload.type === 'user_joined') {
            setOnlineUsers((prev) => {
              const filtered = prev.filter((u) => u.id !== payload.user.id);
              return [...filtered, payload.user];
            });
          } else if (payload.type === 'user_left') {
            setOnlineUsers((prev) =>
              prev.map((u) => (u.id === payload.user_id ? { ...u, is_online: false } : u)),
            );
          } else if (payload.type === 'read_receipt') {
            setReadReceipts((prev) => {
              const existing = prev[payload.message_id] ?? [];
              if (existing.includes(payload.reader_id)) return prev;
              return { ...prev, [payload.message_id]: [...existing, payload.reader_id] };
            });
          }
        } catch (error) {
          console.warn('WS parse error:', error);
        }
      };

      socket.onerror = () => setConnectionState('disconnected');
      socket.onclose = () => setConnectionState('disconnected');
    },
    [clearSocket],
  );

  // Send read receipt when messages arrive
  const markRead = useCallback(
    (messageId: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'mark_read', message_id: messageId }));
      }
    },
    [],
  );

  // ─────────────────────────────── join ────────────────────────────────────

  const loadInitialData = useCallback(
    async (authToken: string) => {
      setLoadingData(true);
      try {
        const [users, history] = await Promise.all([
          request<ChatUser[]>('/api/chat/users', {}, authToken),
          request<ChatMessage[]>('/api/chat/messages?limit=100', {}, authToken),
        ]);
        setOnlineUsers(users);
        setGroupMessages(history);
      } finally {
        setLoadingData(false);
      }
    },
    [request],
  );

  const handleJoin = useCallback(async () => {
    if (!authUser) {
      setJoinError('Primero debes iniciar sesión en la app.');
      return;
    }
    if (!chatNickname) {
      setJoinError('No se pudo obtener tu nombre de usuario.');
      return;
    }
    setJoinError('');
    setJoining(true);
    setConnectionState('connecting');
    try {
      const joined = await request<JoinResponse>('/api/chat/join', {
        method: 'POST',
        body: JSON.stringify({ nickname: chatNickname }),
      });
      setChatUser(joined.user);
      setChatToken(joined.token);
      await loadInitialData(joined.token);
      connectWebSocket(joined.token);
      joinedAuthUidRef.current = authUser.uid;
    } catch (error) {
      const isNetworkError = error instanceof TypeError;
      setJoinError(
        isNetworkError
          ? `Sin conexión al chat (${CHAT_HTTP_BASE}). Revisa internet del emulador.`
          : 'No se pudo conectar al chat. Intenta de nuevo.',
      );
      setConnectionState('disconnected');
    } finally {
      setJoining(false);
    }
  }, [authUser, chatNickname, connectWebSocket, loadInitialData, request]);

  // ─────────────────────────────── send ────────────────────────────────────

  const handleSendMessage = useCallback(async () => {
    const content = messageText.trim();
    const hasImage = Boolean(pendingImageUri);
    if ((!content && !hasImage) || !chatToken || !chatUser) return;

    setSendingMessage(true);
    try {
      let messageContent = content;

      // Upload image if pending
      if (hasImage && pendingImageUri) {
        const formData = new FormData();
        formData.append('file', {
          uri: pendingImageUri,
          type: 'image/jpeg',
          name: 'chat-image.jpg',
        } as any);

        const uploadRes = await fetch(`${CHAT_HTTP_BASE}/api/chat/media/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${chatToken}`,
            'X-User-Token': chatToken,
          },
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('No se pudo subir la imagen.');
        const media = (await uploadRes.json()) as MediaAttachment;
        messageContent = media.url;
      }

      const isDm = activeTab === 'dm' && selectedDmUser != null;
      const body = {
        type: isDm ? 'dm' : 'group',
        content: messageContent || '📷',
        ...(isDm ? { recipient_id: selectedDmUser!.id } : {}),
        ...(selectedTtl ? { ttl: selectedTtl } : {}),
        allow_read_receipt: true,
      };

      const created = await request<ChatMessage>(
        '/api/chat/messages',
        { method: 'POST', body: JSON.stringify(body) },
        chatToken,
      );

      if (isDm) {
        setDmMessages((prev) =>
          prev.some((m) => m.id === created.id) ? prev : [...prev, created],
        );
      } else {
        setGroupMessages((prev) =>
          prev.some((m) => m.id === created.id) ? prev : [...prev, created],
        );
      }

      setMessageText('');
      setPendingImageUri(null);
      setSelectedTtl(null);
      setShowTtlOptions(false);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    } finally {
      setSendingMessage(false);
    }
  }, [
    activeTab, chatToken, chatUser, messageText,
    pendingImageUri, request, selectedDmUser, selectedTtl,
  ]);

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      setPendingImageUri(asset.uri);
    }
  }, []);

  // ─────────────────────────────── effects ─────────────────────────────────

  useEffect(() => {
    if (!authUser) {
      clearSocket();
      setChatUser(null);
      setGroupMessages([]);
      setDmMessages([]);
      setOnlineUsers([]);
      joinedAuthUidRef.current = null;
      setConnectionState('disconnected');
      return;
    }
    if (joinedAuthUidRef.current === authUser.uid && chatUser) return;
    void handleJoin();
  }, [authUser, chatUser, clearSocket, handleJoin]);

  useEffect(() => () => clearSocket(), [clearSocket]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [visibleMessages.length]);

  // Auto-mark last message as read
  useEffect(() => {
    const last = visibleMessages[visibleMessages.length - 1];
    if (last && last.sender_id !== chatUser?.id && last.allow_read_receipt) {
      markRead(last.id);
    }
  }, [visibleMessages, chatUser, markRead]);

  // ─────────────────────────────── render helpers ───────────────────────────

  const statusColor = useMemo(() => {
    if (connectionState === 'connected') return '#22c55e';
    if (connectionState === 'connecting') return '#f59e0b';
    return '#ef4444';
  }, [connectionState]);

  const renderMessage = useCallback(
    (message: ChatMessage) => {
      const isOwn = message.sender_id === chatUser?.id;
      const receipts = readReceipts[message.id] ?? [];
      const isRead = receipts.length > 0;
      const hasMedia = message.media?.url || isImageUrl(message.content);
      const mediaUrl = message.media?.url ?? (isImageUrl(message.content) ? message.content : null);
      const textContent = mediaUrl ? null : message.content;

      return (
        <View
          key={message.id}
          style={[styles.messageRow, isOwn ? styles.outgoingRow : styles.incomingRow]}
        >
          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isOwn
                  ? theme.colors.secondary
                  : theme.colors.muted,
              },
              isOwn ? styles.outgoingBubble : styles.incomingBubble,
            ]}
          >
            {!isOwn && (
              <Text style={[styles.messageAuthor, { color: theme.colors.primary }]}>
                {message.sender_nickname}
              </Text>
            )}

            {mediaUrl ? (
              <Image source={{ uri: mediaUrl }} style={styles.messageImage} resizeMode="cover" />
            ) : (
              <Text style={[styles.messageText, { color: theme.colors.foreground }]}>
                {textContent}
              </Text>
            )}

            {/* TTL badge */}
            {message.ttl ? (
              <View style={[styles.ttlBadge, { backgroundColor: theme.colors.accent + '40' }]}>
                <MaterialCommunityIcons name="timer-outline" size={10} color={theme.colors.accentForeground} />
                <Text style={[styles.ttlBadgeText, { color: theme.colors.accentForeground }]}>
                  {message.ttl < 60
                    ? `${message.ttl}s`
                    : message.ttl < 3600
                    ? `${Math.floor(message.ttl / 60)}min`
                    : `${Math.floor(message.ttl / 3600)}h`}
                </Text>
              </View>
            ) : null}

            {/* Footer: time + read receipt */}
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, { color: theme.colors.mutedForeground }]}>
                {formatTime(message.timestamp)}
              </Text>
              {isOwn && message.allow_read_receipt && (
                <MaterialCommunityIcons
                  name={isRead ? 'check-all' : 'check'}
                  size={13}
                  color={isRead ? theme.colors.primary : theme.colors.mutedForeground}
                />
              )}
            </View>
          </View>
        </View>
      );
    },
    [chatUser, formatTime, isImageUrl, readReceipts, styles, theme],
  );

  // ─────────────────────────────── JSX ─────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <View style={[styles.headerBadge, { backgroundColor: theme.colors.secondary }]}>
            <MaterialCommunityIcons name="message-text-outline" size={22} color={theme.colors.secondaryForeground} />
          </View>

          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: theme.colors.foreground }]}>Chat</Text>
            <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}>
              {chatUser
                ? `Conectado como ${chatUser.nickname}`
                : joining
                ? 'Conectando...'
                : 'Sin conexión'}
            </Text>
          </View>

          {/* Status dot + online count */}
          <View style={[styles.pill, { backgroundColor: theme.colors.accent }]}>
            <Text style={[styles.pillText, { color: theme.colors.accentForeground }]}>
              {onlineCount} en línea
            </Text>
          </View>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: statusColor, marginLeft: 10 }} />
        </View>

        {/* ── Tab bar: Grupo / DM ── */}
        <View style={[styles.tabBar, { backgroundColor: theme.colors.muted, borderColor: theme.colors.border }]}>
          {(['group', 'dm'] as Tab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && [styles.tabItemActive, { backgroundColor: theme.colors.card }],
              ]}
              onPress={() => {
                setActiveTab(tab);
                if (tab === 'group') setSelectedDmUser(null);
              }}
            >
              <MaterialCommunityIcons
                name={tab === 'group' ? 'forum-outline' : 'message-arrow-right-outline'}
                size={16}
                color={activeTab === tab ? theme.colors.primary : theme.colors.mutedForeground}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab ? theme.colors.primary : theme.colors.mutedForeground },
                ]}
              >
                {tab === 'group' ? 'Grupo' : 'Mensaje directo'}
              </Text>
            </Pressable>
          ))}
        </View>


        {/* ── Users list (visible in DM tab) ── */}
        {activeTab === 'dm' && otherUsers.length > 0 && (
          <View style={styles.usersList}>
            {otherUsers.map((u) => {
              const isSelected = selectedDmUser?.id === u.id;
              const initial = u.nickname.charAt(0).toUpperCase();
              return (
                <Pressable
                  key={u.id}
                  style={[
                    styles.userRow,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.secondary + '30'
                        : theme.colors.card,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                    isSelected && styles.userRowSelected,
                  ]}
                  onPress={() => setSelectedDmUser(isSelected ? null : u)}
                >
                  {/* Avatar */}
                  <View
                    style={[
                      styles.userAvatar,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.userAvatarInitial,
                        {
                          color: isSelected
                            ? theme.colors.primaryForeground
                            : theme.colors.accentForeground,
                        },
                      ]}
                    >
                      {initial}
                    </Text>
                  </View>

                  {/* Name + status */}
                  <View style={styles.userRowCenter}>
                    <Text
                      style={[styles.userRowName, { color: theme.colors.foreground }]}
                      numberOfLines={1}
                    >
                      {u.nickname}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View
                        style={[
                          styles.userDot,
                          {
                            backgroundColor: u.is_online
                              ? '#22c55e'
                              : theme.colors.mutedForeground,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.userRowStatus,
                          { color: u.is_online ? '#22c55e' : theme.colors.mutedForeground },
                        ]}
                      >
                        {u.is_online ? 'En línea' : 'Desconectado'}
                      </Text>
                    </View>
                  </View>

                  {/* Chevron */}
                  <MaterialCommunityIcons
                    name={isSelected ? 'chevron-down' : 'chevron-right'}
                    size={20}
                    color={isSelected ? theme.colors.primary : theme.colors.mutedForeground}
                  />
                </Pressable>
              );
            })}
          </View>
        )}



        {/* ── DM recipient banner ── */}
        {activeTab === 'dm' && selectedDmUser && (
          <View
            style={[
              styles.dmBanner,
              {
                marginHorizontal: 16,
                marginTop: 8,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.primary + '60',
              },
            ]}
          >
            <View style={styles.dmBannerLeft}>
              <MaterialCommunityIcons name="lock-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.dmBannerText, { color: theme.colors.foreground }]}>
                DM con {selectedDmUser.nickname}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedDmUser(null)}>
              <MaterialCommunityIcons name="close" size={18} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>
        )}

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Hero card */}
          <View style={[styles.heroCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.heroIcon, { backgroundColor: theme.colors.primary }]}>
              <MaterialCommunityIcons
                name={activeTab === 'group' ? 'forum-outline' : 'message-lock-outline'}
                size={26}
                color={theme.colors.primaryForeground}
              />
            </View>
            <Text style={[styles.heroTitle, { color: theme.colors.foreground }]}>
              {activeTab === 'group' ? 'Sala grupal en vivo' : 'Mensajes directos'}
            </Text>
            <Text style={[styles.heroText, { color: theme.colors.mutedForeground }]}>
              {connectionState === 'connected'
                ? activeTab === 'group'
                  ? 'Chat grupal activo. Todos los usuarios pueden leer estos mensajes.'
                  : selectedDmUser
                  ? `Conversación privada con ${selectedDmUser.nickname}.`
                  : 'Selecciona un usuario arriba para iniciar un mensaje directo.'
                : joining
                ? 'Conectando al servidor de chat...'
                : 'Sin conexión al chat por ahora.'}
            </Text>

            {!!joinError && (
              <View style={[styles.errorBox, { borderColor: theme.colors.destructive, backgroundColor: theme.colors.card }]}>
                <Text style={[styles.errorText, { color: theme.colors.destructive }]}>{joinError}</Text>
                <Pressable onPress={handleJoin} style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.retryButtonText, { color: theme.colors.primaryForeground }]}>Reintentar</Text>
                </Pressable>
              </View>
            )}
          </View>

          {loadingData && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.mutedForeground }]}>Cargando mensajes...</Text>
            </View>
          )}

          <View style={styles.messagesList}>
            {visibleMessages.map(renderMessage)}

            {!loadingData && visibleMessages.length === 0 && connectionState === 'connected' && (
              <View style={[styles.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
                <Text style={[styles.emptyStateText, { color: theme.colors.mutedForeground }]}>
                  {activeTab === 'dm' && !selectedDmUser
                    ? 'Selecciona un usuario para iniciar un DM.'
                    : 'No hay mensajes todavía. Sé el primero en escribir.'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* ── Composer ── */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* TTL options row */}
          {showTtlOptions && (
            <View style={[styles.ttlRow, { backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
              <MaterialCommunityIcons name="timer-outline" size={16} color={theme.colors.mutedForeground} />
              {TTL_OPTIONS.map((opt) => {
                const active = selectedTtl === opt.value;
                return (
                  <Pressable
                    key={String(opt.value)}
                    style={[
                      styles.ttlChip,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.muted,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => setSelectedTtl(opt.value)}
                  >
                    <Text style={[styles.ttlChipText, { color: active ? theme.colors.primaryForeground : theme.colors.foreground }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Image preview */}
          {pendingImageUri && (
            <View style={[styles.imagePreviewRow, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
              <View style={[styles.imagePreviewCard, { borderColor: theme.colors.border }]}>
                <Image source={{ uri: pendingImageUri }} style={styles.imagePreview} />
                <Pressable
                  style={[styles.removeImageButton, { backgroundColor: theme.colors.destructive }]}
                  onPress={() => setPendingImageUri(null)}
                >
                  <MaterialCommunityIcons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            </View>
          )}

          <View
            style={[
              styles.composer,
              keyboardVisible ? styles.composerKeyboardVisible : styles.composerKeyboardHidden,
              { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
            ]}
          >
            {/* Attach image */}
            <Pressable
              style={[styles.attachButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
              onPress={handlePickImage}
              disabled={!chatUser || !chatToken}
            >
              <MaterialCommunityIcons name="image-plus" size={20} color={theme.colors.primary} />
            </Pressable>

            {/* TTL toggle */}
            <Pressable
              style={[
                styles.attachButton,
                {
                  borderColor: selectedTtl ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selectedTtl ? theme.colors.primary + '20' : theme.colors.background,
                },
              ]}
              onPress={() => setShowTtlOptions((v) => !v)}
              disabled={!chatUser || !chatToken}
            >
              <MaterialCommunityIcons
                name="timer-outline"
                size={20}
                color={selectedTtl ? theme.colors.primary : theme.colors.mutedForeground}
              />
            </Pressable>

            {/* Text input */}
            <View style={[styles.inputMock, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder={
                  activeTab === 'dm' && !selectedDmUser
                    ? 'Selecciona un usuario primero'
                    : pendingImageUri
                    ? 'Escribe un comentario opcional'
                    : 'Escribe un mensaje...'
                }
                placeholderTextColor={theme.colors.mutedForeground}
                style={[styles.inputText, { color: theme.colors.foreground }]}
                editable={Boolean(chatUser) && (activeTab === 'group' || Boolean(selectedDmUser))}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                multiline={false}
              />
            </View>

            {/* Send */}
            <Pressable
              style={[
                styles.sendButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity:
                    (messageText.trim().length > 0 || pendingImageUri) &&
                    chatToken &&
                    (activeTab === 'group' || selectedDmUser)
                      ? 1
                      : 0.5,
                },
              ]}
              onPress={handleSendMessage}
              disabled={
                (!messageText.trim() && !pendingImageUri) ||
                !chatToken ||
                (activeTab === 'dm' && !selectedDmUser) ||
                sendingMessage
              }
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color={theme.colors.primaryForeground} />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
