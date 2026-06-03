
import { StyleSheet } from 'react-native';
import { useTheme } from '../../theme/desingSystem';

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
  scrollView: {
    flex: 1,
    
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
  errorBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  messagesList: {
    gap: 12,
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
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
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 18,
    marginTop: 2,
  },
  messageTime: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyStateText: {
    fontSize: 13,
    lineHeight: 18,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  composerKeyboardHidden: {
    paddingBottom: 80,
  },
  composerKeyboardVisible: {
    paddingBottom: 12,
  },
  attachButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  sendButton: {
    minWidth: 92,
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  sendButtonLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  imagePreviewRow: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  imagePreviewCard: {
    width: 110,
    height: 110,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function useChatStyles() {
  const { theme } = useTheme();
  return { styles, theme };
}
