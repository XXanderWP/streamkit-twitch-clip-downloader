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
  videosLoading: boolean;
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
  videosLoading: false,
  error: '',
};

const els = {
  channelLabel: document.getElementById('channel-label'),
  folderLabel: document.getElementById('folder-label'),
  openFolderBtn: document.getElementById('open-folder-btn') as HTMLButtonElement | null,
  channelInput: document.getElementById('channel-input') as HTMLInputElement | null,
  reloadBtns: [...document.querySelectorAll<HTMLButtonElement>('.tab-reload-btn')],
  clipsList: document.getElementById('clips-list'),
  videosList: document.getElementById('videos-list'),
  clipsDownloadAll: document.getElementById('clips-download-all') as HTMLButtonElement | null,
  videosDownloadAll: document.getElementById('videos-download-all') as HTMLButtonElement | null,
  filterTitle: document.getElementById('filter-title') as HTMLInputElement | null,
  filterDateFrom: document.getElementById('filter-date-from') as HTMLInputElement | null,
  filterDateTo: document.getElementById('filter-date-to') as HTMLInputElement | null,
  filterMinViews: document.getElementById('filter-min-views') as HTMLInputElement | null,
  filterMaxViews: document.getElementById('filter-max-views') as HTMLInputElement | null,
  filterIncludeCreators: document.getElementById('filter-include-creators') as HTMLInputElement | null,
  filterExcludeCreators: document.getElementById('filter-exclude-creators') as HTMLInputElement | null,
  urlInput: document.getElementById('url-input') as HTMLInputElement | null,
  urlDownloadBtn: document.getElementById('url-download-btn'),
  errorMessage: document.getElementById('error-message') as HTMLParagraphElement | null,
  emptyMessage: document.getElementById('empty-message') as HTMLParagraphElement | null,
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
async function apiFetch<T>(path: string, options: RequestInit = {}, query: Record<string, string> = {}) {
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
  return state.downloads.some(job => job.status === 'pending' || job.status === 'downloading');
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
 * Renders one media card with a download action and optional inline progress.
 * @param item Clip or VOD metadata.
 * @param details Secondary line (views, duration).
 * @returns DOM node for the list.
 * @example renderMediaItem(clip, 'details');
 */
function renderMediaItem(
  item: { id: string; title: string; url: string; thumbnail_url: string; downloaded?: boolean },
  details: string
) {
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
  title.className = 'media-item__title';
  title.textContent = item.title;
  title.title = item.title;
  const info = document.createElement('p');
  info.className = 'media-item__details';
  info.textContent = details;
  meta.append(title, info);

  if (activeJob && activeJob.status !== 'done' && activeJob.status !== 'error') {
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

  if (activeJob?.status === 'done') {
    button.textContent = t('done');
    button.disabled = true;
  } else if (activeJob?.status === 'error') {
    button.textContent = item.downloaded ? t('download_again') : t('download');
    button.addEventListener('click', () => {
      void startDownload(item.url, item.title, item.id);
    });
  } else if (activeJob) {
    const percent = activeJob.progress?.percent ?? 0;
    button.textContent = `${t('downloading')} ${percent.toFixed(0)}%`;
    button.disabled = true;
  } else {
    button.textContent = item.downloaded ? t('download_again') : t('download');
    button.addEventListener('click', () => {
      void startDownload(item.url, item.title, item.id);
    });
  }

  actions.append(button);
  node.append(img, meta, actions);
  return node;
}

/**
 * Renders clip and VOD lists for the active tab.
 * @example renderLists();
 */
function renderLists() {
  if (els.clipsList) {
    els.clipsList.replaceChildren();
    state.clips.forEach(clip => {
      const details = `${formatDate(clip.created_at)} · ${clip.view_count} ${t('views')} · ${clip.duration.toFixed(0)}s · ${t('by')} ${clip.creator_name}`;
      els.clipsList?.append(renderMediaItem(clip, details));
    });
    ensureListSentinel(els.clipsList);
  }

  if (els.videosList) {
    els.videosList.replaceChildren();
    state.videos.forEach(video => {
      const details = `${formatDate(video.created_at)} · ${video.view_count} ${t('views')} · ${video.duration}`;
      els.videosList?.append(renderMediaItem(video, details));
    });
    ensureListSentinel(els.videosList);
  }

  if (els.clipsDownloadAll) els.clipsDownloadAll.hidden = state.clips.length === 0;
  if (els.videosDownloadAll) els.videosDownloadAll.hidden = state.videos.length === 0;

  const isEmpty =
    (state.activeTab === 'clips' && !state.clipsLoading && state.clips.length === 0) ||
    (state.activeTab === 'videos' && !state.videosLoading && state.videos.length === 0);

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
  const result = await apiFetch<{ error?: string; message?: string; ok?: boolean }>('open-folder', {
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
  if (!append) setError('');

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
  if (!result.ok) {
    setError(result.error ?? t('error_generic'));
    return;
  }

  state.channelName = result.channel ?? '';
  state.clips = append ? [...state.clips, ...(result.clips ?? [])] : (result.clips ?? []);
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
  if (!append) setError('');

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
  if (!result.ok) {
    setError(result.error ?? t('error_generic'));
    return;
  }

  state.channelName = result.channel ?? '';
  state.videos = append ? [...state.videos, ...(result.videos ?? [])] : (result.videos ?? []);
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
  if (existing && (existing.status === 'pending' || existing.status === 'downloading')) {
    return;
  }

  const result = await apiFetch<{ error?: string; message?: string; downloadId?: string; started?: boolean }>(
    'download',
    {
      method: 'POST',
      body: JSON.stringify({ url, title, mediaId }),
    }
  );

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
async function downloadAll(items: Array<{ url: string; title: string; id: string }>) {
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
