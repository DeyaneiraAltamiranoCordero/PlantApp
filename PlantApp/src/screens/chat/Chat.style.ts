import { StyleSheet } from 'react-native';
import { useTheme } from '../../theme/desingSystem';

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },

  // ── Header ─────────────────────────────────────────────────────────────
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
  headerCopy: { flex: 1, marginLeft: 12, gap: 2 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 18 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '700' },

  // ── Tab bar ─────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 2,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabItemActive: {},
  tabLabel: { fontSize: 13, fontWeight: '600' },

  // ── Users list (DM) ─────────────────────────────────────────────────────
  usersList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 12,
  },
  userRowSelected: { borderWidth: 2 },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitial: { fontSize: 14, fontWeight: '700' },
  userRowCenter: { flex: 1, gap: 2 },
  userRowName: { fontSize: 14, fontWeight: '600' },
  userRowStatus: { fontSize: 11, fontWeight: '500' },
  userDot: { width: 8, height: 8, borderRadius: 4 },
  // kept for compat
  usersRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  userChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  userChipSelected: { borderWidth: 2 },
  userChipLabel: { fontSize: 12, fontWeight: '600' },

  // ── Scroll ──────────────────────────────────────────────────────────────
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
  },

  // ── Hero card ───────────────────────────────────────────────────────────
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    marginBottom: 4,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 17, fontWeight: '700' },
  heroText: { fontSize: 13, lineHeight: 19 },

  // ── Error / retry ───────────────────────────────────────────────────────
  errorBox: { borderWidth: 1, borderRadius: 14, padding: 10, gap: 8 },
  errorText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: { fontSize: 12, fontWeight: '700' },

  // ── Loading / empty ─────────────────────────────────────────────────────
  loadingState: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  loadingText: { fontSize: 13, fontWeight: '600' },
  emptyState: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14 },
  emptyStateText: { fontSize: 13, lineHeight: 18 },

  // ── Message list ─────────────────────────────────────────────────────────
  messagesList: { gap: 8 },
  messageRow: { width: '100%', flexDirection: 'row' },
  incomingRow: { justifyContent: 'flex-start' },
  outgoingRow: { justifyContent: 'flex-end' },
  messageBubble: {
    maxWidth: '84%',
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  incomingBubble: { borderBottomLeftRadius: 6 },
  outgoingBubble: { borderBottomRightRadius: 6 },
  messageAuthor: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageImage: { width: 220, height: 220, borderRadius: 16, marginTop: 4 },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 6,
  },
  messageTime: { fontSize: 11, fontWeight: '500' },
  ttlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ttlBadgeText: { fontSize: 10, fontWeight: '700' },
  readIcon: {},

  // ── DM banner ────────────────────────────────────────────────────────────
  dmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 2,
  },
  dmBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dmBannerText: { fontSize: 13, fontWeight: '600' },
  dmBannerClose: {},

  // ── Composer ─────────────────────────────────────────────────────────────
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  composerKeyboardHidden: { paddingBottom: 80 },
  composerKeyboardVisible: { paddingBottom: 14 },
  attachButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  inputMock: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  inputText: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Image preview ─────────────────────────────────────────────────────────
  imagePreviewRow: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  imagePreviewCard: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: { width: '100%', height: '100%' },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── TTL options ───────────────────────────────────────────────────────────
  ttlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  ttlChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  ttlChipActive: {},
  ttlChipText: { fontSize: 11, fontWeight: '700' },
});

export function useChatStyles() {
  const { theme } = useTheme();
  return { styles, theme };
}
