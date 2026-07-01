/** Addon manifest id used in worker HTTP routes. */
const ADDON_ID = 'XXanderWP/streamkit-twitch-clip-downloader';

/** UI strings for en / ru / uk. */
const I18N = {
  en: {
    title: 'Twitch Clip & VOD Downloader',
    loading: 'Loading…',
    channel: 'Channel login',
    reload: 'Reload',
    tab_clips: 'Clips',
    tab_videos: 'VODs',
    tab_url: 'By URL',
    url_label: 'Twitch clip or VOD URL',
    download: 'Download',
    download_again: 'Download again',
    download_all: 'Download all',
    downloads: 'Downloads',
    open_folder: 'Open folder',
    filters: 'Filters',
    filter_title: 'Title contains',
    filter_date_from: 'Date from',
    filter_date_to: 'Date to',
    filter_min_views: 'Min views',
    filter_max_views: 'Max views',
    filter_include_creators: 'Include creators',
    filter_exclude_creators: 'Exclude creators',
    filter_hint:
      'Twitch API filters by date range. Title, views, and creators are filtered locally after loading.',
    clear_filters: 'Clear filters',
    modal_title: 'Title',
    modal_date: 'Date',
    modal_views: 'Views',
    modal_duration: 'Duration',
    modal_creator: 'Creator',
    modal_channel: 'Channel',
    modal_open_on_twitch: 'Open on Twitch',
    close: 'Close',
    empty: 'No items found.',
    folder_missing: 'Set a download folder in addon settings.',
    channel_prefix: 'Channel:',
    folder_prefix: 'Save to:',
    views: 'views',
    by: 'by',
    error_generic: 'Something went wrong',
    downloading: 'Downloading…',
    queued: 'Queued',
    done: 'Done',
    failed: 'Failed',
  },
  ru: {
    title: 'Загрузчик клипов и записей Twitch',
    loading: 'Загрузка…',
    channel: 'Логин канала',
    reload: 'Обновить',
    tab_clips: 'Клипы',
    tab_videos: 'Записи',
    tab_url: 'По URL',
    url_label: 'URL клипа или записи Twitch',
    download: 'Скачать',
    download_again: 'Загрузить повторно',
    download_all: 'Скачать всё',
    downloads: 'Загрузки',
    open_folder: 'Открыть папку',
    filters: 'Фильтры',
    filter_title: 'Название содержит',
    filter_date_from: 'Дата от',
    filter_date_to: 'Дата до',
    filter_min_views: 'Мин. просмотров',
    filter_max_views: 'Макс. просмотров',
    filter_include_creators: 'Включить авторов',
    filter_exclude_creators: 'Исключить авторов',
    filter_hint:
      'Диапазон дат фильтруется через Twitch API. Название, просмотры и авторы фильтруются локально после загрузки.',
    clear_filters: 'Очистить фильтры',
    modal_title: 'Название',
    modal_date: 'Дата',
    modal_views: 'Просмотры',
    modal_duration: 'Длительность',
    modal_creator: 'Автор',
    modal_channel: 'Канал',
    modal_open_on_twitch: 'Открыть на Twitch',
    close: 'Закрыть',
    empty: 'Ничего не найдено.',
    folder_missing: 'Укажите папку загрузки в настройках аддона.',
    channel_prefix: 'Канал:',
    folder_prefix: 'Папка:',
    views: 'просмотров',
    by: 'автор',
    error_generic: 'Произошла ошибка',
    downloading: 'Загрузка…',
    queued: 'В очереди',
    done: 'Готово',
    failed: 'Ошибка',
  },
  uk: {
    title: 'Завантажувач кліпів і записів Twitch',
    loading: 'Завантаження…',
    channel: 'Логін каналу',
    reload: 'Оновити',
    tab_clips: 'Кліпи',
    tab_videos: 'Записи',
    tab_url: 'За URL',
    url_label: 'URL кліпу або запису Twitch',
    download: 'Завантажити',
    download_again: 'Завантажити повторно',
    download_all: 'Завантажити все',
    downloads: 'Завантаження',
    open_folder: 'Відкрити папку',
    filters: 'Фільтри',
    filter_title: 'Назва містить',
    filter_date_from: 'Дата від',
    filter_date_to: 'Дата до',
    filter_min_views: 'Мін. переглядів',
    filter_max_views: 'Макс. переглядів',
    filter_include_creators: 'Включити авторів',
    filter_exclude_creators: 'Виключити авторів',
    filter_hint:
      'Діапазон дат фільтрується через Twitch API. Назва, перегляди та автори фільтруються локально після завантаження.',
    clear_filters: 'Очистити фільтри',
    modal_title: 'Назва',
    modal_date: 'Дата',
    modal_views: 'Перегляди',
    modal_duration: 'Тривалість',
    modal_creator: 'Автор',
    modal_channel: 'Канал',
    modal_open_on_twitch: 'Відкрити на Twitch',
    close: 'Закрити',
    empty: 'Нічого не знайдено.',
    folder_missing: 'Вкажіть папку завантаження в налаштуваннях аддона.',
    channel_prefix: 'Канал:',
    folder_prefix: 'Папка:',
    views: 'переглядів',
    by: 'автор',
    error_generic: 'Сталася помилка',
    downloading: 'Завантаження…',
    queued: 'У черзі',
    done: 'Готово',
    failed: 'Помилка',
  },
} as const;

type Locale = keyof typeof I18N;

/** Clip filters sent to the worker clips endpoint. */
type ClipFilterState = {
  title: string;
  dateFrom: string;
  dateTo: string;
  minViews: string;
  maxViews: string;
  includeCreators: string;
  excludeCreators: string;
};

/** Clip item returned by the worker clips endpoint. */
type ClipItem = {
  id: string;
  url: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  broadcaster_name: string;
  creator_name: string;
  creator_profile_image_url?: string;
  downloaded?: boolean;
};

/** VOD item returned by the worker videos endpoint. */
type VideoItem = {
  id: string;
  url: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: string;
  user_name: string;
  downloaded?: boolean;
};

/** Download job mirrored from worker state. */
type DownloadJob = {
  id: string;
  url: string;
  title: string;
  status: string;
  progress: { stage: string; percent: number };
  error?: string;
};

/** Application UI state. */
type AppState = {
  locale: Locale;
  token: string;
  apiBase: string;
  activeTab: 'clips' | 'videos' | 'url';
  clips: ClipItem[];
  videos: VideoItem[];
  clipsCursor: string | null;
  videosCursor: string | null;
  channelName: string;
  twitchLogin: string;
  downloadFolder: string;
  downloads: DownloadJob[];
  clipsLoading: boolean;
  clipsReloading: boolean;
  clipsLoadingMore: boolean;
  videosLoading: boolean;
  videosReloading: boolean;
  videosLoadingMore: boolean;
  error: string;
};

const params = new URLSearchParams(window.location.search);
const token = params.get('token') ?? '';
const apiBase = `http://localhost:${window.location.port}/addon/${ADDON_ID}`;

/** Detects UI locale from browser language. */
function detectLocale(): Locale {
  const lang = (navigator.language || 'en').slice(0, 2);
  if (lang === 'ru' || lang === 'uk') return lang;
  return 'en';
}

const state: AppState = {
  locale: detectLocale(),
  token,
  apiBase,
  activeTab: 'clips',
  clips: [],
  videos: [],
  clipsCursor: null,
  videosCursor: null,
  channelName: '',
  twitchLogin: '',
  downloadFolder: '',
  downloads: [],
  clipsLoading: false,
  clipsReloading: false,
  clipsLoadingMore: false,
  videosLoading: false,
  videosReloading: false,
  videosLoadingMore: false,
  error: '',
};

const els = {
  channelLabel: document.getElementById('channel-label'),
  folderLabel: document.getElementById('folder-label'),
  openFolderBtn: document.getElementById(
    'open-folder-btn'
  ) as HTMLButtonElement | null,
  channelInput: document.getElementById(
    'channel-input'
  ) as HTMLInputElement | null,
  reloadBtns: [
    ...document.querySelectorAll<HTMLButtonElement>('.tab-reload-btn'),
  ],
  clipsList: document.getElementById('clips-list'),
  videosList: document.getElementById('videos-list'),
  clipsDownloadAll: document.getElementById(
    'clips-download-all'
  ) as HTMLButtonElement | null,
  videosDownloadAll: document.getElementById(
    'videos-download-all'
  ) as HTMLButtonElement | null,
  filterTitle: document.getElementById(
    'filter-title'
  ) as HTMLInputElement | null,
  filterDateFrom: document.getElementById(
    'filter-date-from'
  ) as HTMLInputElement | null,
  filterDateTo: document.getElementById(
    'filter-date-to'
  ) as HTMLInputElement | null,
  filterMinViews: document.getElementById(
    'filter-min-views'
  ) as HTMLInputElement | null,
  filterMaxViews: document.getElementById(
    'filter-max-views'
  ) as HTMLInputElement | null,
  filterIncludeCreators: document.getElementById(
    'filter-include-creators'
  ) as HTMLInputElement | null,
  filterExcludeCreators: document.getElementById(
    'filter-exclude-creators'
  ) as HTMLInputElement | null,
  filterClearBtn: document.getElementById(
    'filter-clear-btn'
  ) as HTMLButtonElement | null,
  mediaModal: document.getElementById('media-modal'),
  mediaModalBackdrop: document.getElementById('media-modal-backdrop'),
  mediaModalClose: document.getElementById(
    'media-modal-close'
  ) as HTMLButtonElement | null,
  mediaModalIframe: document.getElementById(
    'media-modal-iframe'
  ) as HTMLIFrameElement | null,
  mediaModalInfo: document.getElementById('media-modal-info'),
  urlInput: document.getElementById('url-input') as HTMLInputElement | null,
  urlDownloadBtn: document.getElementById('url-download-btn'),
  errorMessage: document.getElementById(
    'error-message'
  ) as HTMLParagraphElement | null,
  emptyMessage: document.getElementById(
    'empty-message'
  ) as HTMLParagraphElement | null,
  downloadsPanel: document.getElementById('downloads-panel'),
  downloadsList: document.getElementById('downloads-list'),
  tabs: [...document.querySelectorAll<HTMLButtonElement>('.tab')],
  panels: {
    clips: document.getElementById('panel-clips'),
    videos: document.getElementById('panel-videos'),
    url: document.getElementById('panel-url'),
  },
};

let pollTimer: number | null = null;
let reobserveClipsSentinel: (() => void) | null = null;
let reobserveVideosSentinel: (() => void) | null = null;
let activeModalMedia: { kind: 'clip' | 'video'; item: ClipItem | VideoItem } | null = null;
let modalDownloadButton: HTMLButtonElement | null = null;

/**
 * Returns a localized UI string for the active locale.
 * @param key Translation key.
 * @returns Localized label.
 * @example t('download');
 */
function t(key: keyof (typeof I18N)['en']) {
  return I18N[state.locale][key] ?? I18N.en[key];
}

/**
 * Applies static i18n labels from data attributes.
 * @example applyStaticI18n();
 */
function applyStaticI18n() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(node => {
    const key = node.dataset.i18n as keyof (typeof I18N)['en'] | undefined;
    if (key) node.textContent = t(key);
  });
  document.title = t('title');
}

/**
 * Builds an authenticated addon API URL.
 * @param path Endpoint path relative to the addon worker.
 * @param query Optional query parameters.
 * @returns Full request URL including the UI token.
 * @example apiUrl('clips', { login: 'shroud' });
 */
function apiUrl(path: string, query: Record<string, string> = {}) {
  const search = new URLSearchParams({ token, ...query });
  return `${apiBase}/${path}?${search.toString()}`;
}

/**
 * Performs an authenticated JSON request to the addon worker.
 * @param path Endpoint path.
 * @param options Fetch options.
 * @returns Parsed JSON body.
 * @example const data = await apiFetch('state');
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  query: Record<string, string> = {}
) {
  const response = await fetch(apiUrl(path, query), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  return response.json() as Promise<T>;
}

/**
 * Reads clip filter values from the clips tab form.
 * @returns Current clip filter state.
 * @example const filters = readClipFilters();
 */
function readClipFilters(): ClipFilterState {
  return {
    title: els.filterTitle?.value.trim() ?? '',
    dateFrom: els.filterDateFrom?.value ?? '',
    dateTo: els.filterDateTo?.value ?? '',
    minViews: els.filterMinViews?.value.trim() ?? '',
    maxViews: els.filterMaxViews?.value.trim() ?? '',
    includeCreators: els.filterIncludeCreators?.value.trim() ?? '',
    excludeCreators: els.filterExcludeCreators?.value.trim() ?? '',
  };
}

/**
 * Converts clip filter state into query parameters for the worker.
 * @param filters Clip filter form state.
 * @returns Query object for `GET clips`.
 * @example buildClipQuery(readClipFilters());
 */
function buildClipQuery(filters: ClipFilterState) {
  const query: Record<string, string> = {};
  if (filters.title) query.title = filters.title;
  if (filters.dateFrom) query.started_at = filters.dateFrom;
  if (filters.dateTo) query.ended_at = filters.dateTo;
  if (filters.minViews) query.min_views = filters.minViews;
  if (filters.maxViews) query.max_views = filters.maxViews;
  if (filters.includeCreators) query.include_creators = filters.includeCreators;
  if (filters.excludeCreators) query.exclude_creators = filters.excludeCreators;
  return query;
}

/**
 * Clears all clip filter inputs in the clips tab.
 * @example clearClipFilters();
 */
function clearClipFilters() {
  if (els.filterTitle) els.filterTitle.value = '';
  if (els.filterDateFrom) els.filterDateFrom.value = '';
  if (els.filterDateTo) els.filterDateTo.value = '';
  if (els.filterMinViews) els.filterMinViews.value = '';
  if (els.filterMaxViews) els.filterMaxViews.value = '';
  if (els.filterIncludeCreators) els.filterIncludeCreators.value = '';
  if (els.filterExcludeCreators) els.filterExcludeCreators.value = '';
}

/**
 * Builds a Twitch profile URL for a login.
 * @param login Twitch username.
 * @returns HTTPS profile URL.
 * @example twitchProfileUrl('Shroud');
 */
function twitchProfileUrl(login: string) {
  return `https://www.twitch.tv/${login.trim().toLowerCase()}`;
}

/**
 * Builds a Twitch embed URL for clips or VODs.
 * @param kind Media type.
 * @param mediaId Twitch clip or video id.
 * @returns Embed iframe URL.
 * @example buildTwitchEmbedUrl('clip', 'AwkwardHelplessSalamanderSwiftRage');
 */
function buildTwitchEmbedUrl(kind: 'clip' | 'video', mediaId: string) {
  const parent = window.location.hostname || 'localhost';
  if (kind === 'clip') {
    return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(mediaId)}&parent=${encodeURIComponent(parent)}`;
  }
  return `https://player.twitch.tv/?video=${encodeURIComponent(mediaId)}&parent=${encodeURIComponent(parent)}&autoplay=false`;
}

/**
 * Opens a Twitch URL in the system browser through the worker.
 * @param url HTTPS Twitch URL.
 * @example await openExternalUrl('https://www.twitch.tv/shroud');
 */
async function openExternalUrl(url: string) {
  setError('');
  const result = await apiFetch<{
    error?: string;
    message?: string;
    ok?: boolean;
  }>('open-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  if (result.error) {
    setError(result.message ?? result.error);
  }
}

/**
 * Updates a download button label and handler for a clip or VOD item.
 * @param button Target button element.
 * @param item Media metadata used for the download request.
 * @example configureDownloadButton(button, clip);
 */
function configureDownloadButton(
  button: HTMLButtonElement,
  item: { url: string; title: string; id: string; downloaded?: boolean }
) {
  const activeJob = findDownloadByUrl(item.url);
  button.replaceChildren();
  button.onclick = null;

  if (activeJob?.status === 'done') {
    button.textContent = t('done');
    button.disabled = true;
    return;
  }

  if (activeJob?.status === 'error') {
    button.textContent = item.downloaded ? t('download_again') : t('download');
    button.disabled = false;
    button.onclick = () => {
      void startDownload(item.url, item.title, item.id);
    };
    return;
  }

  if (activeJob) {
    const percent = activeJob.progress?.percent ?? 0;
    button.textContent = `${t('downloading')} ${percent.toFixed(0)}%`;
    button.disabled = true;
    return;
  }

  button.textContent = item.downloaded ? t('download_again') : t('download');
  button.disabled = false;
  button.onclick = () => {
    void startDownload(item.url, item.title, item.id);
  };
}

/**
 * Appends a clickable creator row with avatar to the modal facts list.
 * @param list Definition list element.
 * @param clip Clip metadata.
 * @example appendModalCreatorRow(list, clip);
 */
function appendModalCreatorRow(list: HTMLDListElement, clip: ClipItem) {
  const dt = document.createElement('dt');
  dt.textContent = t('modal_creator');
  const dd = document.createElement('dd');
  dd.className = 'media-modal__creator';

  const row = document.createElement('div');
  row.className = 'media-modal__creator-row';

  if (clip.creator_profile_image_url) {
    const avatar = document.createElement('img');
    avatar.className = 'media-modal__creator-avatar';
    avatar.src = clip.creator_profile_image_url;
    avatar.alt = '';
    avatar.loading = 'lazy';
    row.append(avatar);
  }

  const name = document.createElement('span');
  name.className = 'media-modal__creator-name';
  name.textContent = clip.creator_name;
  name.addEventListener('click', () => {
    void openExternalUrl(twitchProfileUrl(clip.creator_name));
  });
  row.append(name);
  dd.append(row);
  list.append(dt, dd);
}

/**
 * Fills the media preview modal info panel.
 * @param kind Media type.
 * @param item Clip or VOD metadata.
 * @example fillMediaModalInfo('clip', clip);
 */
function fillMediaModalInfo(kind: 'clip' | 'video', item: ClipItem | VideoItem) {
  if (!els.mediaModalInfo) return;
  els.mediaModalInfo.replaceChildren();

  const heading = document.createElement('h2');
  heading.className = 'media-modal__title';
  heading.id = 'media-modal-title';
  heading.textContent = item.title;

  const list = document.createElement('dl');
  list.className = 'media-modal__facts';

  const addFact = (label: string, value: string) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    list.append(dt, dd);
  };

  addFact(t('modal_date'), formatDate(item.created_at));
  addFact(t('modal_views'), String(item.view_count));
  addFact(
    t('modal_duration'),
    kind === 'clip'
      ? `${(item as ClipItem).duration.toFixed(0)}s`
      : (item as VideoItem).duration
  );

  if (kind === 'clip') {
    appendModalCreatorRow(list, item as ClipItem);
    addFact(t('modal_channel'), (item as ClipItem).broadcaster_name);
  } else {
    addFact(t('modal_channel'), (item as VideoItem).user_name);
  }

  const actions = document.createElement('div');
  actions.className = 'media-modal__actions';
  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'btn btn-primary';
  modalDownloadButton = downloadBtn;
  configureDownloadButton(downloadBtn, item);

  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'btn';
  openBtn.textContent = t('modal_open_on_twitch');
  openBtn.addEventListener('click', () => {
    void openExternalUrl(item.url);
  });
  actions.append(downloadBtn, openBtn);

  els.mediaModalInfo.append(heading, list, actions);
}

/**
 * Opens the Twitch player modal for a clip or VOD.
 * @param kind Media type.
 * @param item Clip or VOD metadata.
 * @example openMediaModal('video', vod);
 */
function openMediaModal(kind: 'clip' | 'video', item: ClipItem | VideoItem) {
  if (!els.mediaModal || !els.mediaModalIframe) return;
  activeModalMedia = { kind, item };
  fillMediaModalInfo(kind, item);
  els.mediaModalIframe.src = buildTwitchEmbedUrl(kind, item.id);
  els.mediaModal.hidden = false;
  els.mediaModalClose?.focus();
}

/**
 * Closes the Twitch player modal and unloads the iframe.
 * @example closeMediaModal();
 */
function closeMediaModal() {
  if (!els.mediaModal || !els.mediaModalIframe) return;
  activeModalMedia = null;
  modalDownloadButton = null;
  els.mediaModal.hidden = true;
  els.mediaModalIframe.src = 'about:blank';
}

/**
 * Formats an ISO date for the list UI.
 * @param value ISO timestamp.
 * @returns Short locale date string.
 * @example formatDate('2026-01-15T12:00:00Z');
 */
function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString(state.locale);
  } catch {
    return value;
  }
}

/**
 * Returns whether a URL already has an active download job.
 * @param url Clip or VOD URL.
 * @returns Matching download job if present.
 * @example findDownloadByUrl('https://clips.twitch.tv/Example');
 */
function findDownloadByUrl(url: string) {
  return state.downloads.find(job => job.url === url);
}

/**
 * Returns true when at least one download is still running.
 * @example hasActiveDownloads();
 */
function hasActiveDownloads() {
  return state.downloads.some(
    job => job.status === 'pending' || job.status === 'downloading'
  );
}

/**
 * Renders the global error banner.
 * @param message Error text or empty string to hide.
 * @example setError('Twitch is not connected');
 */
function setError(message: string) {
  state.error = message;
  if (!els.errorMessage) return;
  els.errorMessage.hidden = !message;
  els.errorMessage.textContent = message;
}

/**
 * Appends an intersection observer sentinel to a scrollable list.
 * @param list Scrollable list element.
 * @returns Sentinel node.
 * @example ensureListSentinel(els.clipsList);
 */
function ensureListSentinel(list: HTMLElement | null) {
  if (!list) return null;
  let sentinel = list.querySelector<HTMLElement>('.list-sentinel');
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.className = 'list-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
  }
  list.append(sentinel);
  return sentinel;
}

/**
 * Appends clip metadata with a clickable creator link.
 * @param clip Clip metadata.
 * @param container Details paragraph element.
 * @example appendClipDetails(clip, info);
 */
function appendClipDetails(clip: ClipItem, container: HTMLElement) {
  container.append(
    document.createTextNode(
      `${formatDate(clip.created_at)} · ${clip.view_count} ${t('views')} · ${clip.duration.toFixed(0)}s · ${t('by')} `
    )
  );
  const creator = document.createElement('span');
  creator.className = 'media-item__creator';
  creator.textContent = clip.creator_name;
  creator.addEventListener('click', event => {
    event.stopPropagation();
    void openExternalUrl(twitchProfileUrl(clip.creator_name));
  });
  container.append(creator);
}

/**
 * Appends VOD metadata to the details line.
 * @param video VOD metadata.
 * @param container Details paragraph element.
 * @example appendVideoDetails(video, info);
 */
function appendVideoDetails(video: VideoItem, container: HTMLElement) {
  container.textContent = `${formatDate(video.created_at)} · ${video.view_count} ${t('views')} · ${video.duration}`;
}

/**
 * Renders one media card with a download action and optional inline progress.
 * @param kind Media type (`clip` or `video`).
 * @param item Clip or VOD metadata.
 * @returns DOM node for the list.
 * @example renderMediaItem('clip', clip);
 */
function renderMediaItem(kind: 'clip' | 'video', item: ClipItem | VideoItem) {
  const activeJob = findDownloadByUrl(item.url);
  const node = document.createElement('article');
  node.className = 'media-item';

  const img = document.createElement('img');
  img.className = 'media-item__thumb';
  img.src = item.thumbnail_url;
  img.alt = '';
  img.loading = 'lazy';
  img.addEventListener('error', () => {
    img.hidden = true;
    node.classList.add('media-item--no-thumb');
  });

  const meta = document.createElement('div');
  meta.className = 'media-item__meta';
  const title = document.createElement('h3');
  title.className = 'media-item__title media-item__title--clickable';
  title.textContent = item.title;
  title.title = item.title;
  title.addEventListener('click', () => {
    openMediaModal(kind, item);
  });
  const info = document.createElement('p');
  info.className = 'media-item__details';
  if (kind === 'clip') {
    appendClipDetails(item as ClipItem, info);
  } else {
    appendVideoDetails(item as VideoItem, info);
  }
  meta.append(title, info);

  if (
    activeJob &&
    activeJob.status !== 'done' &&
    activeJob.status !== 'error'
  ) {
    node.classList.add('media-item--downloading');
    const progressWrap = document.createElement('div');
    progressWrap.className = 'media-item__progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'media-item__progress-bar';
    progressBar.style.width = `${Math.max(0, Math.min(100, activeJob.progress?.percent ?? 0))}%`;
    progressWrap.append(progressBar);
    meta.append(progressWrap);
  }

  const actions = document.createElement('div');
  actions.className = 'media-item__actions';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-primary';
  configureDownloadButton(button, item);

  actions.append(button);
  node.append(img, meta, actions);
  return node;
}

/**
 * Creates a StreamKit-style loading indicator for list states.
 * @param mode `full` replaces the list; `inline` is shown at the bottom while paging.
 * @returns Loader element.
 * @example createListLoader('full');
 */
function createListLoader(mode: 'full' | 'inline') {
  const node = document.createElement('div');
  node.className = `list-loader list-loader--${mode}`;

  const orbital = document.createElement('div');
  orbital.className = 'list-loader__orbital';

  const outer = document.createElement('div');
  outer.className = 'list-loader__ring list-loader__ring--outer';

  const inner = document.createElement('div');
  inner.className = 'list-loader__ring list-loader__ring--inner';

  const core = document.createElement('div');
  core.className = 'list-loader__core';

  orbital.append(outer, inner, core);

  const text = document.createElement('p');
  text.className = 'list-loader__text';
  text.textContent = t('loading');

  const dots = document.createElement('span');
  dots.className = 'list-loader__dots';
  dots.append(
    document.createElement('span'),
    document.createElement('span'),
    document.createElement('span')
  );
  text.append(dots);

  node.append(orbital, text);
  return node;
}

/**
 * Renders clips or VOD items inside a scrollable list container.
 * @param listEl Target list element.
 * @param options Render options for loading states and items.
 * @example renderMediaList(els.clipsList, { reloading: false, items: state.clips, ... });
 */
function renderMediaList(
  listEl: HTMLElement | null,
  options: {
    kind: 'clip' | 'video';
    reloading: boolean;
    loadingMore: boolean;
    items: ClipItem[] | VideoItem[];
  }
) {
  if (!listEl) return;

  listEl.replaceChildren();

  if (options.reloading) {
    listEl.append(createListLoader('full'));
    return;
  }

  options.items.forEach(item => {
    listEl.append(renderMediaItem(options.kind, item));
  });

  ensureListSentinel(listEl);

  if (options.loadingMore) {
    listEl.append(createListLoader('inline'));
  }
}

/**
 * Renders clip and VOD lists for the active tab.
 * @example renderLists();
 */
function renderLists() {
  renderMediaList(els.clipsList, {
    kind: 'clip',
    reloading: state.clipsReloading,
    loadingMore: state.clipsLoadingMore,
    items: state.clips,
  });

  renderMediaList(els.videosList, {
    kind: 'video',
    reloading: state.videosReloading,
    loadingMore: state.videosLoadingMore,
    items: state.videos,
  });

  if (els.clipsDownloadAll)
    els.clipsDownloadAll.hidden = state.clips.length === 0;
  if (els.videosDownloadAll)
    els.videosDownloadAll.hidden = state.videos.length === 0;

  const isEmpty =
    (state.activeTab === 'clips' &&
      !state.clipsLoading &&
      !state.clipsReloading &&
      state.clips.length === 0) ||
    (state.activeTab === 'videos' &&
      !state.videosLoading &&
      !state.videosReloading &&
      state.videos.length === 0);

  if (els.emptyMessage) {
    els.emptyMessage.hidden = !isEmpty || Boolean(state.error);
    els.emptyMessage.textContent = t('empty');
  }

  reobserveClipsSentinel?.();
  reobserveVideosSentinel?.();
}

/**
 * Renders active download jobs and progress bars.
 * @example renderDownloads();
 */
function renderDownloads() {
  if (!els.downloadsList || !els.downloadsPanel) return;
  els.downloadsList.replaceChildren();
  els.downloadsPanel.hidden = state.downloads.length === 0;

  const hadActive = hasActiveDownloads();

  state.downloads.forEach(job => {
    const row = document.createElement('div');
    row.className = 'download-job';

    const main = document.createElement('div');
    const title = document.createElement('p');
    title.className = 'download-job__title';
    title.textContent = job.title;
    const barWrap = document.createElement('div');
    barWrap.className = 'download-job__progress';
    const bar = document.createElement('div');
    bar.className = 'download-job__bar';
    const percent = Math.max(0, Math.min(100, job.progress?.percent ?? 0));
    bar.style.width = `${percent}%`;
    barWrap.append(bar);
    main.append(title, barWrap);

    const status = document.createElement('div');
    status.className = 'download-job__status';
    if (job.status === 'done') {
      status.textContent = t('done');
      status.classList.add('download-job__status--done');
    } else if (job.status === 'error') {
      status.textContent = job.error || t('failed');
      status.classList.add('download-job__status--error');
    } else if (job.status === 'pending') {
      status.textContent = t('queued');
    } else {
      status.textContent = `${t('downloading')} ${percent.toFixed(0)}%`;
    }

    row.append(main, status);
    els.downloadsList?.append(row);
  });

  renderLists();

  if (
    activeModalMedia &&
    modalDownloadButton &&
    els.mediaModal &&
    !els.mediaModal.hidden
  ) {
    configureDownloadButton(modalDownloadButton, activeModalMedia.item);
  }

  if (hadActive && !hasActiveDownloads()) {
    if (state.activeTab === 'clips') void loadClips(false);
    if (state.activeTab === 'videos') void loadVideos(false);
  }
}

/**
 * Schedules state polling with a shorter interval while downloads are active.
 * @example schedulePolling();
 */
function schedulePolling() {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
  }
  const interval = hasActiveDownloads() ? 500 : 2000;
  pollTimer = window.setInterval(() => {
    void refreshState();
  }, interval);
}

/**
 * Refreshes worker state (folder, downloads).
 * @example await refreshState();
 */
async function refreshState() {
  const result = await apiFetch<{
    ok?: boolean;
    downloadFolder?: string;
    downloads?: DownloadJob[];
    twitchLogin?: string;
    twitchDisplayName?: string;
  }>('state');

  state.downloadFolder = result.downloadFolder ?? '';
  state.downloads = result.downloads ?? [];

  if (result.twitchLogin && !state.twitchLogin) {
    state.twitchLogin = result.twitchLogin;
    if (els.channelInput && !els.channelInput.value.trim()) {
      els.channelInput.value = result.twitchLogin;
    }
  }

  if (els.folderLabel) {
    els.folderLabel.textContent = state.downloadFolder
      ? `${t('folder_prefix')} ${state.downloadFolder}`
      : t('folder_missing');
  }

  if (els.openFolderBtn) {
    els.openFolderBtn.hidden = !state.downloadFolder;
  }

  renderDownloads();
  schedulePolling();
}

/**
 * Opens the configured download folder through the worker.
 * @example await openDownloadFolder();
 */
async function openDownloadFolder() {
  setError('');
  const result = await apiFetch<{
    error?: string;
    message?: string;
    ok?: boolean;
  }>('open-folder', {
    method: 'POST',
    body: '{}',
  });
  if (result.error) {
    setError(result.message ?? result.error);
  }
}

/**
 * Loads clips for the current or custom channel.
 * @param append When true, appends the next page.
 * @example await loadClips(false);
 */
async function loadClips(append = false) {
  if (state.clipsLoading) return;
  if (append && !state.clipsCursor) return;

  state.clipsLoading = true;
  state.clipsReloading = !append;
  state.clipsLoadingMore = append;
  if (!append) setError('');
  renderLists();

  const login = els.channelInput?.value.trim() ?? '';
  const query: Record<string, string> = {
    ...buildClipQuery(readClipFilters()),
  };
  if (login) query.login = login;
  if (append && state.clipsCursor) query.cursor = state.clipsCursor;

  const result = await apiFetch<{
    ok?: boolean;
    error?: string;
    channel?: string;
    clips?: ClipItem[];
    cursor?: string | null;
  }>('clips', {}, query);

  state.clipsLoading = false;
  state.clipsReloading = false;
  state.clipsLoadingMore = false;

  if (!result.ok) {
    setError(result.error ?? t('error_generic'));
    renderLists();
    return;
  }

  state.channelName = result.channel ?? '';
  state.clips = append
    ? [...state.clips, ...(result.clips ?? [])]
    : (result.clips ?? []);
  state.clipsCursor = result.cursor ?? null;

  if (els.channelLabel) {
    els.channelLabel.textContent = `${t('channel_prefix')} ${state.channelName}`;
  }
  renderLists();
}

/**
 * Loads public VODs for the current or custom channel.
 * @param append When true, appends the next page.
 * @example await loadVideos(false);
 */
async function loadVideos(append = false) {
  if (state.videosLoading) return;
  if (append && !state.videosCursor) return;

  state.videosLoading = true;
  state.videosReloading = !append;
  state.videosLoadingMore = append;
  if (!append) setError('');
  renderLists();

  const login = els.channelInput?.value.trim() ?? '';
  const query: Record<string, string> = {};
  if (login) query.login = login;
  if (append && state.videosCursor) query.cursor = state.videosCursor;

  const result = await apiFetch<{
    ok?: boolean;
    error?: string;
    channel?: string;
    videos?: VideoItem[];
    cursor?: string | null;
  }>('videos', {}, query);

  state.videosLoading = false;
  state.videosReloading = false;
  state.videosLoadingMore = false;

  if (!result.ok) {
    setError(result.error ?? t('error_generic'));
    renderLists();
    return;
  }

  state.channelName = result.channel ?? '';
  state.videos = append
    ? [...state.videos, ...(result.videos ?? [])]
    : (result.videos ?? []);
  state.videosCursor = result.cursor ?? null;

  if (els.channelLabel) {
    els.channelLabel.textContent = `${t('channel_prefix')} ${state.channelName}`;
  }
  renderLists();
}

/**
 * Starts a download through the worker yt-dlp endpoint.
 * @param url Clip or VOD URL.
 * @param title Display title for progress UI.
 * @param mediaId Twitch media id for duplicate detection.
 * @example await startDownload('https://clips.twitch.tv/Example', 'Funny moment', 'ClipId');
 */
async function startDownload(url: string, title: string, mediaId?: string) {
  setError('');

  const existing = findDownloadByUrl(url);
  if (
    existing &&
    (existing.status === 'pending' || existing.status === 'downloading')
  ) {
    return;
  }

  const result = await apiFetch<{
    error?: string;
    message?: string;
    downloadId?: string;
    started?: boolean;
  }>('download', {
    method: 'POST',
    body: JSON.stringify({ url, title, mediaId }),
  });

  if (result.error) {
    setError(result.message ?? result.error);
    return;
  }

  if (result.downloadId) {
    state.downloads = [
      {
        id: result.downloadId,
        url,
        title,
        status: 'pending',
        progress: { stage: 'queued', percent: 0 },
      },
      ...state.downloads.filter(job => job.id !== result.downloadId),
    ];
    renderDownloads();
    schedulePolling();
  }

  void refreshState();
}

/**
 * Queues downloads for every item currently shown in the active list.
 * @param items Clip or VOD entries to download.
 * @example await downloadAll(state.clips);
 */
async function downloadAll(
  items: Array<{ url: string; title: string; id: string }>
) {
  for (const item of items) {
    const existing = findDownloadByUrl(item.url);
    if (existing && existing.status !== 'error' && existing.status !== 'done') {
      continue;
    }
    await startDownload(item.url, item.title, item.id);
  }
}

/**
 * Wires infinite scroll for a list container.
 * @param listEl Scrollable list element.
 * @param hasMore Returns whether another page is available.
 * @param isLoading Returns whether a request is in flight.
 * @param onLoadMore Callback for loading the next page.
 * @returns Configured observer.
 * @example setupInfiniteScroll(els.clipsList, ...);
 */
function setupInfiniteScroll(
  listEl: HTMLElement | null,
  hasMore: () => boolean,
  isLoading: () => boolean,
  onLoadMore: () => void
) {
  if (!listEl) return null;

  const observer = new IntersectionObserver(
    entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      if (!hasMore() || isLoading()) return;
      onLoadMore();
    },
    {
      root: listEl,
      rootMargin: '120px',
      threshold: 0,
    }
  );

  const observe = () => {
    observer.disconnect();
    const sentinel = ensureListSentinel(listEl);
    if (sentinel) observer.observe(sentinel);
  };

  observe();
  return { observer, observe };
}

/**
 * Switches the visible tab panel.
 * @param tab Tab id.
 * @example setActiveTab('videos');
 */
function setActiveTab(tab: AppState['activeTab']) {
  state.activeTab = tab;
  els.tabs.forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });

  Object.entries(els.panels).forEach(([key, panel]) => {
    if (!panel) return;
    const active = key === tab;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });

  renderLists();
}

/** Wires UI events and starts initial data load. */
function bindEvents() {
  /**
   * Reloads data for the currently active tab.
   * @example reloadActiveTab();
   */
  const reloadActiveTab = () => {
    if (state.activeTab === 'clips') void loadClips();
    else if (state.activeTab === 'videos') void loadVideos();
    else void refreshState();
  };

  /**
   * Submits the active tab reload when Enter is pressed in a text field.
   * @param input Input element to listen on.
   * @example bindEnterToReload(els.channelInput);
   */
  const bindEnterToReload = (input: HTMLInputElement | null) => {
    input?.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      reloadActiveTab();
    });
  };

  els.tabs.forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab as AppState['activeTab'] | undefined;
      if (!tab) return;
      setActiveTab(tab);
      if (tab === 'clips' && state.clips.length === 0) void loadClips();
      if (tab === 'videos' && state.videos.length === 0) void loadVideos();
    });
  });

  els.reloadBtns.forEach(button => {
    button.addEventListener('click', reloadActiveTab);
  });

  bindEnterToReload(els.channelInput);
  bindEnterToReload(els.filterTitle);
  bindEnterToReload(els.filterMinViews);
  bindEnterToReload(els.filterMaxViews);
  bindEnterToReload(els.filterIncludeCreators);
  bindEnterToReload(els.filterExcludeCreators);

  els.filterDateFrom?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      reloadActiveTab();
    }
  });
  els.filterDateTo?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      reloadActiveTab();
    }
  });

  els.filterClearBtn?.addEventListener('click', () => {
    clearClipFilters();
    if (state.activeTab === 'clips') void loadClips();
  });

  els.mediaModalClose?.addEventListener('click', closeMediaModal);
  els.mediaModalBackdrop?.addEventListener('click', closeMediaModal);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && els.mediaModal && !els.mediaModal.hidden) {
      closeMediaModal();
    }
  });
  if (els.mediaModalClose) {
    els.mediaModalClose.setAttribute('aria-label', t('close'));
  }

  els.openFolderBtn?.addEventListener('click', () => {
    void openDownloadFolder();
  });

  els.clipsDownloadAll?.addEventListener('click', () => {
    void downloadAll(state.clips);
  });

  els.videosDownloadAll?.addEventListener('click', () => {
    void downloadAll(state.videos);
  });

  els.urlDownloadBtn?.addEventListener('click', () => {
    const url = els.urlInput?.value.trim() ?? '';
    if (!url) return;
    void startDownload(url, url);
  });

  els.urlInput?.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const url = els.urlInput?.value.trim() ?? '';
    if (!url) return;
    void startDownload(url, url);
  });

  const clipsScroll = setupInfiniteScroll(
    els.clipsList,
    () => Boolean(state.clipsCursor),
    () => state.clipsLoading,
    () => void loadClips(true)
  );
  reobserveClipsSentinel = clipsScroll?.observe ?? null;

  const videosScroll = setupInfiniteScroll(
    els.videosList,
    () => Boolean(state.videosCursor),
    () => state.videosLoading,
    () => void loadVideos(true)
  );
  reobserveVideosSentinel = videosScroll?.observe ?? null;
}

/**
 * Bootstraps the application window.
 * @example void init();
 */
async function init() {
  applyStaticI18n();
  bindEvents();
  await refreshState();
  await loadClips();
}

void init();
