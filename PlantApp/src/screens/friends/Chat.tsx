import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/desingSystem';

const sampleMessages = [
  {
    id: '1',
    author: 'Mia',
    text: 'Hola, ¿cómo va tu colección hoy?',
    time: '09:42',
    incoming: true,
  },
  {
    id: '2',
    author: 'Tú',
    text: 'Estoy revisando el riego de las plantas.',
    time: '09:44',
    incoming: false,
  },
  {
    id: '3',
    author: 'Mia',
    text: 'Perfecto, acá se ven todos los chats organizados en un solo lugar.',
    time: '09:45',
    incoming: true,
  },
];

export default function FriendsScreen() {
  const { theme } = useTheme();

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
            <MaterialCommunityIcons
              name="message-text-outline"
              size={22}
              color={theme.colors.secondaryForeground}
            />
          </View>

          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: theme.colors.foreground }]}>Chat</Text>
            <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}>
              Conversaciones y mensajes de la comunidad.
            </Text>
          </View>

          <View style={[styles.pill, { backgroundColor: theme.colors.accent }]}>
            <Text style={[styles.pillText, { color: theme.colors.accentForeground }]}>3 en línea</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
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
            <Text style={[styles.heroTitle, { color: theme.colors.foreground }]}>Diseño de chat</Text>
            <Text style={[styles.heroText, { color: theme.colors.mutedForeground }]}>
              Esta pantalla es solo visual por ahora. Después conectamos mensajes, estados y envío.
            </Text>
          </View>

          <View style={styles.messagesList}>
            {sampleMessages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.incoming ? styles.incomingRow : styles.outgoingRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    {
                      backgroundColor: message.incoming ? theme.colors.muted : theme.colors.secondary,
                    },
                    message.incoming ? styles.incomingBubble : styles.outgoingBubble,
                  ]}
                >
                  {message.incoming && (
                    <Text style={[styles.messageAuthor, { color: theme.colors.primary }]}>
                      {message.author}
                    </Text>
                  )}
                  <Text style={[styles.messageText, { color: theme.colors.foreground }]}>
                    {message.text}
                  </Text>
                  <Text style={[styles.messageTime, { color: theme.colors.mutedForeground }]}>
                    {message.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.composer,
            {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.inputMock, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.colors.mutedForeground} />
            <Text style={[styles.inputText, { color: theme.colors.mutedForeground }]}>Escribe un mensaje</Text>
          </View>

          <View style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="send-outline" size={20} color={theme.colors.primaryForeground} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messagesList: {
    gap: 12,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
  },
  incomingRow: {
    justifyContent: 'flex-start',
  },
  outgoingRow: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '84%',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  incomingBubble: {
    borderBottomLeftRadius: 8,
  },
  outgoingBubble: {
    borderBottomRightRadius: 8,
  },
  messageAuthor: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  inputMock: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  inputText: {
    fontSize: 15,
    fontWeight: '500',
  },
  sendButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
