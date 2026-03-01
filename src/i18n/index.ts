/**
 * Centralised Tamil localisation — same pattern as the Stalker Portal's
 * get_localization() → word dictionary → get_word(key).
 *
 * Usage:
 *   import { t, tc } from '../i18n'
 *   t('app_title')          → 'ஐபிடிவி பிளேயர்'
 *   tc(3, 'season')         → '3 சீசன்கள்'
 */

/* ─── Word dictionary ────────────────────────────────────── */
const WORDS: Record<string, string> = {

  /* ── App shell ── */
  app_title:              'ஐபிடிவி பிளேயர்',

  /* ── Navigation tabs ── */
  tab_channels:           'சேனல்கள்',
  tab_movies:             'திரைப்படங்கள்',
  tab_series:             'தொடர்கள்',
  tab_favorites:          'பிடித்தவை',
  tab_radio:              'வானொலி',

  /* ── Continue watching ── */
  continue_watching:      'தொடர்ந்து பார்க்கவும்',
  clear_all:              'அனைத்தும் அழி',

  /* ── Navigation ── */
  back:                   '← பின்னால்',

  /* ── Loading states ── */
  loading:                'ஏற்றுகிறது',
  loading_channels:       'சேனல்கள் ஏற்றுகிறது...',
  loading_movies:         'திரைப்படங்கள் ஏற்றுகிறது...',
  loading_series:         'தொடர்கள் ஏற்றுகிறது...',
  loading_radio:          'வானொலி சேனல்கள் ஏற்றுகிறது...',
  loading_content:        'உள்ளடக்கம் ஏற்றுகிறது...',
  loading_episodes:       'அத்தியாயங்கள் ஏற்றுகிறது...',
  loading_seasons:        'சீசன்கள் ஏற்றுகிறது...',
  loading_stream:         'நேரோடை ஏற்றுகிறது…',
  loading_ellipsis:       'ஏற்றுகிறது...',

  /* ── Empty states ── */
  no_channels:            'சேனல்கள் ஏதுவும் இல்லை',
  no_radio:               'வானொலி நிலையங்கள் ஏதுவும் இல்லை',
  no_movies:              'திரைப்படங்கள் ஏதுமில்லை',
  no_series:              'தொடர்கள் ஏதுமில்லை',
  no_favorites:           'பிடித்தவை ஏதுமில்லை',

  /* ── Favorites ── */
  my_favorites:           'என் பிடித்தவை',
  fav_add:                'பிடித்தவையில் சேர்',
  fav_remove:             'பிடித்தவையிலிருந்து நீக்கு',

  /* ── Seasons / Episodes ── */
  seasons:                'சீசன்கள்',
  season:                 'சீசன்',
  episodes:               'அத்தியாயங்கள்',
  episode:                'அத்தியாயம்',
  episode_short:          'அத்தி.',
  found:                  'கிடைத்தது',

  /* ── Sort bar ── */
  sort_default:           'இயல்புநிலை',
  sort_recent:            'சமீபத்தில் பார்த்தவை',
  items_label:            'பட்டம்',
  items_labels:           'பட்டங்கள்',

  /* ── Video player ── */
  player_close:           'மூடு (Esc)',
  player_live_badge:      '● நேரலிவே',
  player_playing_badge:   '▶ பார்க்கிறேன்',
  player_error_hint:      'வேறு நேரோடையை முயற்சிக்கவும் அல்லது உங்கள் இணைப்பை சரிபார்க்கவும்',
  player_retry:           '↺ மீண்டும் முயற்சி',
  player_shortcuts:       'ஒவ்வோரிடம்: இயங்கு/ஏன் · ←/→: 10வி.நெளிஞ்சு · ↑/↓: ஒலி · M: மூட்டு · F: நிறை · Esc: மூடு',

  /* ── Search bar ── */
  search_placeholder:     'சேனல்கள், திரைப்படங்கள், தொடர்கள் தேடு...',
  search_results:         'தேடல் முடிவுகள்',
  search_results_for:     'இதற்கான முடிவுகள்',
  search_channels:        'சேனல்கள்',
  search_movies:          'திரைப்படங்கள்',
  search_series:          'தொடர்கள்',
  search_loading:         'தேடுகிறது...',
  search_no_results:      'முடிவுகள் எதுவும் இல்லை',
  search_min_chars:       'குறைந்தபட்சம் 2 எழுத்துக்கள் உள்ளிடவும்',

  /* ── Alerts / errors ── */
  err_no_channel_stream:  'சேனல் நேரோடை இணைப்பு கிடையாது',
  err_stream_failed:      'நேரோடை உருவாக்க தோல்வியுற்றது',
  err_channel_play:       'சேனல் இயக்க தோல்வியுற்றது',
  err_no_movie_stream:    'திரைப்படம் நேரோடை இணைப்பு கிடையாது',
  err_movie_play:         'திரைப்படம் இயக்க தோல்வியுற்றது',
  err_no_seasons:         'இந்த தொடருக்கு சீசன்கள் கிடைக்கவில்லை',
  err_seasons_failed:     'சீசன்கள் ஏற்ற தோல்வியுற்றது',
  err_no_episodes:        'இந்த சீசனுக்கு அத்தியாயங்கள் கிடைக்கவில்லை',
  err_no_episodes_season: 'இந்த சீசனுக்கு அத்தியாயங்கள் ஏதுமில்லை',
  err_episodes_failed:    'அத்தியாயங்கள் ஏற்ற தோல்வியுற்றது',
  err_episode_play:       'அத்தியாயம் இயக்க தோல்வியுற்றது',
  err_episode_details:    'அத்தியாய விவரங்கள் ஏற்ற தோல்வியுற்றது',
  err_episode_stream_na:  'அத்தியாய நேரோடை இணைப்பு கிடையாது',
  err_series_id_invalid:  'தொடர் ஐடி சரியானதல்ல',
  err_series_navigate:    'தொடர் தாவலுக்கு சென்று அத்தியாயங்களை பாருங்கள்',
  err_season_info_na:     'சீசன் தகவல் கிடையவில்லை',
  err_series_info_na:     'தொடர் தகவல் கிடையவில்லை',

  /* ── Fallback names ── */
  unnamed_channel:        'சேனல்',
  unnamed_title:          'தலைப்பில்லாதது',
  unnamed_season:         'சீசன்',
  unnamed_episode:        'அத்தியாயம்',
}

/**
 * Equivalent to get_word(key) in the Stalker Portal.
 * Returns the Tamil string for the given key, or the key itself as fallback.
 */
export function t(key: string): string {
  return WORDS[key] ?? key
}

/**
 * Count-aware helper — returns "{n} {word}" with singular/plural form.
 * tc(1, 'season')  → '1 சீசன்'
 * tc(3, 'season')  → '3 சீசன்கள்'
 */
export function tc(n: number, key: string): string {
  const plural = `${key}s`          // e.g. 'seasons'
  const base   = n === 1 ? WORDS[key] ?? key : WORDS[plural] ?? WORDS[key] ?? key
  return `${n} ${base}`
}

export default WORDS
