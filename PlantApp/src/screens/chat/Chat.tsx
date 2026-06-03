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

type ChatUser = {
  id: string;
  nickname: string;
  joined_at: string;
  is_online: boolean;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  sender_nickname: string;
  content: string;
  type: 'group' | 'dm';
  recipient_id: string | null;
  timestamp: string;
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

type JoinResponse = {
  user: ChatUser;
  token: string;
};

type WsEvent =
  | { type: 'group_message'; message: ChatMessage }
  | { type: 'group_history'; messages: ChatMessage[] }
  | { type: 'users_list'; users: ChatUser[] }
  | { type: 'user_joined'; user: ChatUser }
  | { type: 'user_left'; user_id: string }
  | { type: 'pong' }
  | { type: 'error'; message: string };

const CHAT_HTTP_BASE = process.env.EXPO_PUBLIC_CHAT_APP ?? 'https://chat-backend-4nzg.onrender.com';
const CHAT_WS_BASE = process.env.EXPO_PUBLIC_CHAT_WS_APP ?? 'wss://chat-backend-4nzg.onrender.com';

export default function ChatScreen() {
  const { theme } = useTheme();
  const { styles } = useChatStyles();
  const { currentUser: authUser } = useAuth();

  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatToken, setChatToken] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const joinedAuthUidRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const chatNickname = useMemo(() => {
    if (!authUser) return '';
    const displayName = authUser.displayName?.trim();
    if (displayName) return displayName;
    const emailPrefix = authUser.email?.split('@')?.[0]?.trim();
    if (emailPrefix) return emailPrefix;
    return `user_${authUser.uid.slice(0, 6)}`;
  }, [authUser]);

  const onlineCount = useMemo(() => onlineUsers.filter((u) => u.is_online).length, [onlineUsers]);

  const isImageContent = useCallback((value: string) => {
    if (!value) return false;
    if (value.startsWith('data:image/')) return true;
    if (/^https?:\/\/.+\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(value)) return true;
    return value.includes('/image/upload/') || value.includes('cloudinary');
  }, []);

  const pendingImagePreviewUri = useMemo(() => {
    if (!pendingImageBase64) return pendingImageUri;
    return `data:image/jpeg;base64,${pendingImageBase64}`;
  }, [pendingImageBase64, pendingImageUri]);

  const formatTime = useCallback((isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '--:--';
    return new Intl.DateTimeFormat('es-CR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }, []);

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
            if (typeof body.detail === 'string') {
              detail = body.detail;
            } else if (body.detail?.message) {
              detail = body.detail.message;
            }
          } catch {
            // Ignore JSON parse failure and use fallback detail.
          }
          throw new Error(detail);
        }

        return response.json() as Promise<T>;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    []
  );

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
      try {
        socket.close();
      } catch {
        // Ignore close errors.
      }
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
            setMessages((prev) => (prev.some((item) => item.id === payload.message.id) ? prev : [...prev, payload.message]));
            return;
          }

          if (payload.type === 'group_history') {
            setMessages(payload.messages);
            return;
          }

          if (payload.type === 'users_list') {
            setOnlineUsers(payload.users);
            return;
          }

          if (payload.type === 'user_joined') {
            setOnlineUsers((prev) => {
              const withoutCurrent = prev.filter((u) => u.id !== payload.user.id);
              return [...withoutCurrent, payload.user];
            });
            return;
          }

          if (payload.type === 'user_left') {
            setOnlineUsers((prev) => prev.map((u) => (u.id === payload.user_id ? { ...u, is_online: false } : u)));
            return;
          }

          if (payload.type === 'error') {
            console.warn('Chat WS error:', payload.message);
          }
        } catch (error) {
          console.warn('No se pudo parsear evento WS', error);
        }
      };

      socket.onerror = () => {
        setConnectionState('disconnected');
      };

      socket.onclose = () => {
        setConnectionState('disconnected');
      };
    },
    [clearSocket]
  );

  const loadInitialData = useCallback(
    async (authToken: string) => {
      setLoadingData(true);
      try {
        const [users, groupMessages] = await Promise.all([
          request<ChatUser[]>('/api/chat/users', {}, authToken),
          request<ChatMessage[]>('/api/chat/messages?limit=100', {}, authToken),
        ]);

        setOnlineUsers(users);
        setMessages(groupMessages);
      } finally {
        setLoadingData(false);
      }
    },
    [request]
  );

  const handleJoin = useCallback(async () => {
    if (!authUser) {
      setJoinError('Primero debes iniciar sesión en la app para entrar al chat.');
      return;
    }

    if (!chatNickname) {
      setJoinError('No pudimos obtener tu nombre de usuario para el chat.');
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
      console.error('Error al unirse al chat', error);
      const isNetworkError = error instanceof TypeError;
      setJoinError(
        isNetworkError
          ? `No hay conexión al chat (${CHAT_HTTP_BASE}). Revisa internet del emulador y vuelve a intentar.`
          : 'No se pudo conectar al chat. Intenta de nuevo.'
      );
      setConnectionState('disconnected');
    } finally {
      setJoining(false);
    }
  }, [authUser, chatNickname, connectWebSocket, loadInitialData, request]);

  const handleSendMessage = useCallback(async () => {
    const content = messageText.trim();
    const hasImage = Boolean(pendingImageBase64);
    const payloadContent = hasImage || content;

    if (!payloadContent || !chatToken) {
      return;
    }

    setSendingMessage(true);
    try {
      let messageContent = content;

      if (hasImage) {
        const formData = new FormData();
        formData.append('file', {
          uri: pendingImageUri ?? '',
          type: 'image/jpeg',
          name: 'chat-image.jpg',
        } as any);

        const uploadResponse = await fetch(`${CHAT_HTTP_BASE}/api/chat/media/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${chatToken}`,
            'X-User-Token': chatToken,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('No se pudo subir la imagen.');
        }

        const media = (await uploadResponse.json()) as MediaAttachment;
        messageContent = media.url;
      }

      const createdMessage = await request<ChatMessage>(
        '/api/chat/messages',
        {
          method: 'POST',
          body: JSON.stringify({
            type: 'group',
            content: messageContent,
          }),
        },
        chatToken,
      );

      setMessages((prev) => (prev.some((item) => item.id === createdMessage.id) ? prev : [...prev, createdMessage]));
      setMessageText('');
      setPendingImageBase64(null);
      setPendingImageUri(null);
    } catch (error) {
      console.error('Error enviando mensaje', error);
    } finally {
      setSendingMessage(false);
    }
  }, [chatToken, messageText, pendingImageBase64, pendingImageUri, request]);

  const handlePickImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    const asset = result.assets?.[0];
    if (!result.canceled && asset?.base64) {
      setPendingImageBase64(asset.base64);
      setPendingImageUri(asset.uri);
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      clearSocket();
      setChatUser(null);
      setMessages([]);
      setOnlineUsers([]);
      joinedAuthUidRef.current = null;
      setConnectionState('disconnected');
      return;
    }

    if (joinedAuthUidRef.current === authUser.uid && chatUser) {
      return;
    }

    void handleJoin();
  }, [authUser, chatUser, clearSocket, handleJoin]);

  useEffect(() => {
    return () => {
      clearSocket();
    };
  }, [clearSocket]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.card,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.headerBadge, { backgroundColor: theme.colors.secondary }]}>
            <MaterialCommunityIcons name="message-text-outline" size={22} color={theme.colors.secondaryForeground} />
          </View>

          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: theme.colors.foreground }]}>Chat</Text>
            <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}> 
              {chatUser ? `Conectado como ${chatUser.nickname}` : 'Conectando con tu cuenta de la app...'}
            </Text>
          </View>

          <View style={[styles.pill, { backgroundColor: theme.colors.accent }]}>
            <Text style={[styles.pillText, { color: theme.colors.accentForeground }]}>{onlineCount} en línea</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.heroIcon, { backgroundColor: theme.colors.primary }]}>
              <MaterialCommunityIcons name="forum-outline" size={28} color={theme.colors.primaryForeground} />
            </View>
            <Text style={[styles.heroTitle, { color: theme.colors.foreground }]}>Sala grupal en vivo</Text>
            <Text style={[styles.heroText, { color: theme.colors.mutedForeground }]}> 
              {connectionState === 'connected'
                ? 'Listo para enviar mensajes. Usa la caja de texto de abajo.'
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

          {loadingData ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.mutedForeground }]}>Cargando mensajes...</Text>
            </View>
          ) : null}

          <View style={styles.messagesList}>
            {messages.map((message) => {
              const incoming = message.sender_id !== chatUser?.id;
              return (
                <View
                  key={message.id}
                  style={[styles.messageRow, incoming ? styles.incomingRow : styles.outgoingRow]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      {
                        backgroundColor: incoming ? theme.colors.muted : theme.colors.secondary,
                      },
                      incoming ? styles.incomingBubble : styles.outgoingBubble,
                    ]}
                  >
                    {incoming && (
                      <Text style={[styles.messageAuthor, { color: theme.colors.primary }]}>
                        {message.sender_nickname}
                      </Text>
                    )}
                      {message.content.startsWith('data:image/') ? (
                        <Image source={{ uri: message.content }} style={styles.messageImage} />
                      ) : (
                        <Text style={[styles.messageText, { color: theme.colors.foreground }]}>{message.content}</Text>
                      )}
                    <Text style={[styles.messageTime, { color: theme.colors.mutedForeground }]}>
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>
                </View>
              );
            })}

            {!loadingData && messages.length === 0 ? (
              <View style={[styles.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
                <Text style={[styles.emptyStateText, { color: theme.colors.mutedForeground }]}>
                  No hay mensajes todavía. Sé el primero en escribir.
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.composer,
              keyboardVisible ? styles.composerKeyboardVisible : styles.composerKeyboardHidden,
              {
                backgroundColor: theme.colors.card,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <Pressable
              style={[styles.attachButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
              onPress={handlePickImage}
              disabled={Boolean(!chatUser) || !chatToken}
            >
              <MaterialCommunityIcons name="image-plus" size={20} color={theme.colors.primary} />
            </Pressable>

            <View style={[styles.inputMock, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <MaterialCommunityIcons name="message-text-outline" size={20} color={theme.colors.mutedForeground} />
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder={pendingImageBase64 ? 'Escribe un comentario opcional' : 'Escribe un mensaje'}
                placeholderTextColor={theme.colors.mutedForeground}
                style={[styles.inputText, { color: theme.colors.foreground }]}
                editable={Boolean(chatUser)}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
            </View>

            <Pressable
              style={[
                styles.sendButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: (messageText.trim().length > 0 || pendingImageBase64) && chatToken ? 1 : 0.6,
                },
              ]}
              onPress={handleSendMessage}
              disabled={(!messageText.trim().length && !pendingImageBase64) || !chatToken}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={18} color={theme.colors.primaryForeground} />
                  <Text style={[styles.sendButtonLabel, { color: theme.colors.primaryForeground }]}></Text>
                </>
              )}
            </Pressable>
          </View>

          {pendingImagePreviewUri ? (
            <View style={[styles.imagePreviewRow, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
              <View style={[styles.imagePreviewCard, { borderColor: theme.colors.border }]}> 
                <Image source={{ uri: pendingImagePreviewUri }} style={styles.imagePreview} />
                <Pressable style={[styles.removeImageButton, { backgroundColor: theme.colors.destructive }]} onPress={() => { setPendingImageBase64(null); setPendingImageUri(null); }}>
                  <MaterialCommunityIcons name="close" size={16} color={theme.colors.primaryForeground} />
                </Pressable>
              </View>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
