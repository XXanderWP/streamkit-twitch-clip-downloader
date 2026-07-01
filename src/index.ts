/**
 * Twitch Clip & VOD Downloader — worker entry point.
 * @see https://rocketman-streamkit.github.io/types/
 */

/** Twitch Helix clip record (subset used by the UI). */
type TwitchClip = {
  id: string;
  url: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  downloaded?: boolean;
};

/** Twitch Helix video / VOD record (subset used by the UI). */
type TwitchVideo = {
  id: string;
  url: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: string;
  user_name: string;
  viewable: string;
  downloaded?: boolean;
};

/** Persisted addon settings from `api.config.getParams()`. */
type AddonParams = {
  download_folder?: string;
  filename_template?: string;
};

/** Twitch `apiGet` proxy payload returned by the Twitch addon. */
type TwitchApiProxyResult = {
  success?: boolean;
  message?: string;
  body?: unknown;
};

/** In-memory download job tracked for the application UI. */
type WorkerDownloadJob = {
  id: string;
  url: string;
  title: string;
  mediaId?: string;
  status: 'pending' | 'downloading' | 'done' | 'error';
  progress: {
    stage: string;
    percent: number;
    speed?: string;
    eta?: string;
  };
  error?: string;
};

/** Local index of completed downloads stored in the output folder. */
type DownloadIndex = Record<string, { url: string; title: string; downloadedAt: number }>;

/** Client-side clip filters (Twitch API + local matching). */
type ClipFilters = {
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  startedAt?: string;
  endedAt?: string;
  minViews?: number;
  maxViews?: number;
  includeCreators: string[];
  excludeCreators: string[];
};

/** Earliest date Twitch clips can exist (service launch). */
const TWITCH_EPOCH_START = '2011-06-01T00:00:00Z';

/** Parsed Twitch Helix list response with cursor pagination. */
type HelixListResponse<T> = {
  data?: T[];
  pagination?: { cursor?: string };
};

/** Active download jobs keyed by yt-dlp download id. */
const downloadJobs = new Map<string, WorkerDownloadJob>();

const DOWNLOAD_INDEX_FILE = '.twitch-downloader-index.json';
const CLIPS_PAGE_SIZE = 20;
const CLIPS_FETCH_SIZE = 100;
const CLIPS_MAX_SCAN_PAGES = 10;

/**
 * Reads persisted addon settings from the main process.
 * @returns Saved config fields such as download folder and filename template.
 * @example
 * const params = await readAddonParams();
 */
async function readAddonParams(): Promise<AddonParams> {
  return api.config.getParams<AddonParams>();
}

/**
 * Rejects HTTP calls that do not include the addon web UI token.
 * @param query Incoming query parameters from the HTTP endpoint.
 * @returns Unauthorized payload or `null` when the token is valid.
 * @example
 * const denied = assertToken(query);
 * if (denied) return denied;
 */
function assertToken(query: { token?: string }) {
  if (query.token !== data.token) {
    return { error: 'Unauthorized' };
  }
  return null;
}

/**
 * Proxies a Twitch Helix GET request through the Twitch addon.
 * @param url Full Helix API URL.
 * @param scopes Optional OAuth scopes required for the call.
 * @returns Parsed JSON body from Twitch.
 * @example
 * const users = await twitchApiGet('https://api.twitch.tv/helix/users?login=shroud');
 */
async function twitchApiGet<T>(url: string, scopes: string[] = []) {
  const response = await addons.request('twitch', 'apiGet', { url, scopes });
  if (!response.success) {
    throw new Error(response.message ?? 'Twitch API request failed');
  }

  const payload = response.result as TwitchApiProxyResult;
  if (payload?.success === false) {
    throw new Error(payload.message ?? 'Twitch API request failed');
  }
  if (payload?.body === undefined || payload.body === null) {
    throw new Error('Twitch API returned empty body');
  }

  return payload.body as T;
}

/**
 * Returns the authorized Twitch channel metadata from the Twitch addon.
 * @returns Channel id, display name, and login.
 * @example
 * const { login } = await getAuthTwitchChannel();
 */
async function getAuthTwitchChannel() {
  const channel = await addons.request('twitch', 'getChannelId');
  if (!channel.success) {
    throw new Error(channel.message ?? 'Twitch is not connected');
  }
  const payload = channel.result as {
    success?: boolean;
    channelId?: string;
    displayName?: string;
    login?: string;
    username?: string;
    message?: string;
  };
  if (payload?.success === false || !payload.channelId) {
    throw new Error(payload.message ?? 'Twitch channel is unavailable');
  }
  return {
    broadcasterId: payload.channelId,
    displayName: payload.displayName ?? payload.channelId,
    login: payload.login ?? payload.username ?? '',
  };
}

/**
 * Resolves a Twitch broadcaster id from login or the signed-in channel.
 * @param login Optional channel login; falls back to the authenticated user channel.
 * @returns Broadcaster id and display name.
 * @example
 * const channel = await resolveBroadcaster('shroud');
 */
async function resolveBroadcaster(login?: string) {
  if (login) {
    const normalizedLogin = login.trim().toLowerCase();
    const users = await twitchApiGet<HelixListResponse<{ id: string; display_name: string; login: string }>>(
      `https://api.twitch.tv/helix/users?login=${encodeURIComponent(normalizedLogin)}`
    );
    const user = users.data?.[0];
    if (!user) {
      throw new Error('Channel not found');
    }
    return { broadcasterId: user.id, displayName: user.display_name };
  }

  const auth = await getAuthTwitchChannel();
  return { broadcasterId: auth.broadcasterId, displayName: auth.displayName };
}

/**
 * Builds the absolute yt-dlp output path from addon settings.
 * @param folder User-selected download folder from addon config.
 * @returns Combined folder and filename template path.
 * @example
 * const output = buildOutputPath('C:\\\\Videos');
 */
function buildOutputPath(folder: string, filenameTemplate: string) {
  const template = String(filenameTemplate || '%(title)s.%(ext)s').trim() || '%(title)s.%(ext)s';
  const separator = folder.includes('\\') ? '\\' : '/';
  return `${folder}${separator}${template}`;
}

/**
 * Ensures the user granted manage access to the configured download folder.
 * @param folder Absolute path selected in addon settings.
 * @returns Access result from the files API.
 * @example
 * await ensureDownloadFolderAccess('C:\\\\Videos');
 */
async function ensureDownloadFolderAccess(folder: string) {
  return files.requestAccess(folder, 'manage') as Promise<{ success: boolean; message?: string }>;
}

/**
 * Builds the path separator for a download folder.
 * @param folder Absolute download folder path.
 * @returns Path separator used by the folder.
 * @example
 * getFolderSeparator('C:\\\\Videos');
 */
function getFolderSeparator(folder: string) {
  return folder.includes('\\') ? '\\' : '/';
}

/**
 * Returns the absolute path to the download index file.
 * @param folder Absolute download folder path.
 * @returns Path to `.twitch-downloader-index.json`.
 * @example
 * getDownloadIndexPath('C:\\\\Videos');
 */
function getDownloadIndexPath(folder: string) {
  return `${folder}${getFolderSeparator(folder)}${DOWNLOAD_INDEX_FILE}`;
}

/**
 * Loads the persisted download index from the output folder.
 * @param folder Absolute download folder path.
 * @returns Map of media id to download metadata.
 * @example
 * const index = await loadDownloadIndex('C:\\\\Videos');
 */
async function loadDownloadIndex(folder: string): Promise<DownloadIndex> {
  const indexPath = getDownloadIndexPath(folder);
  const result = (await files.readFile(indexPath)) as { success?: boolean; data?: string };
  if (!result?.success || !result.data) {
    return {};
  }
  try {
    return JSON.parse(result.data) as DownloadIndex;
  } catch {
    return {};
  }
}

/**
 * Persists one completed download in the local index file.
 * @param folder Absolute download folder path.
 * @param mediaId Twitch clip or VOD id.
 * @param url Source media URL.
 * @param title Human-readable media title.
 * @example
 * await markMediaDownloaded('C:\\\\Videos', 'abc', 'https://clips.twitch.tv/abc', 'Clip');
 */
async function markMediaDownloaded(folder: string, mediaId: string, url: string, title: string) {
  if (!mediaId) return;
  const index = await loadDownloadIndex(folder);
  index[mediaId] = { url, title, downloadedAt: Date.now() };
  await files.writeFile(getDownloadIndexPath(folder), JSON.stringify(index, null, 2));
}

/**
 * Lists file names in the download folder for fallback existence checks.
 * @param folder Absolute download folder path.
 * @returns Lowercase file names in the folder.
 * @example
 * const names = await listDownloadFolderNames('C:\\\\Videos');
 */
async function listDownloadFolderNames(folder: string) {
  const result = (await files.readdir(folder)) as {
    success?: boolean;
    entries?: Array<{ name: string; isFile?: boolean }>;
  };
  if (!result?.success || !Array.isArray(result.entries)) {
    return [] as string[];
  }
  return result.entries.filter(entry => entry.isFile).map(entry => entry.name.toLowerCase());
}

/**
 * Checks whether a clip or VOD was already downloaded into the folder.
 * @param folder Absolute download folder path.
 * @param mediaId Twitch media id.
 * @param url Source media URL.
 * @param index Cached download index.
 * @param fileNames Cached folder file names.
 * @returns True when the media is already present.
 * @example
 * isMediaDownloaded(folder, 'abc', url, index, names);
 */
function isMediaDownloaded(
  folder: string,
  mediaId: string,
  url: string,
  index: DownloadIndex,
  fileNames: string[]
) {
  if (!folder || !mediaId) return false;
  if (index[mediaId]) return true;
  const slug = url.split('/').pop()?.toLowerCase() ?? '';
  const idLower = mediaId.toLowerCase();
  return fileNames.some(name => name.includes(idLower) || (slug && name.includes(slug)));
}

/**
 * Adds `downloaded` flag to list items based on the local index and folder scan.
 * @param folder Absolute download folder path.
 * @param items Clips or VOD entries.
 * @returns Items annotated with `downloaded`.
 * @example
 * const clips = await annotateDownloaded(folder, rawClips);
 */
async function annotateDownloaded<T extends { id: string; url: string }>(folder: string, items: T[]) {
  if (!folder) {
    return items.map(item => ({ ...item, downloaded: false }));
  }
  const index = await loadDownloadIndex(folder);
  const fileNames = await listDownloadFolderNames(folder);
  return items.map(item => ({
    ...item,
    downloaded: isMediaDownloaded(folder, item.id, item.url, index, fileNames),
  }));
}

/**
 * Converts a local folder path into a `file://` URL for `api.openUrl`.
 * @param folderPath Absolute folder path.
 * @returns File URL understood by the OS shell.
 * @example
 * toFileUrl('C:\\\\Videos');
 */
function toFileUrl(folderPath: string) {
  const normalized = folderPath.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(normalized)) {
    return `file:///${normalized}`;
  }
  return `file://${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
}

/**
 * Replaces Twitch thumbnail template variables with a fixed size.
 * @param thumbnailUrl Raw thumbnail URL from Helix.
 * @returns Usable image URL.
 * @example
 * normalizeThumbnailUrl('https://...thumb0-%{width}x%{height}.jpg');
 */
function normalizeThumbnailUrl(thumbnailUrl: string) {
  return thumbnailUrl
    .replace(/%\{width\}/g, '480')
    .replace(/%\{height\}/g, '272');
}

/**
 * Parses a date input into RFC3339 UTC for Twitch `started_at` / `ended_at`.
 * @param value Date string from the UI (`YYYY-MM-DD`).
 * @param endOfDay When true, uses 23:59:59 instead of 00:00:00.
 * @returns RFC3339 timestamp or undefined.
 * @example
 * toRfc3339Date('2024-03-01', true);
 */
function toRfc3339Date(value: string, endOfDay = false) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const suffix = endOfDay ? 'T23:59:59Z' : 'T00:00:00Z';
  return `${trimmed}${suffix}`;
}

/**
 * Parses comma-separated creator logins from a query parameter.
 * @param value Raw query string.
 * @returns Normalized creator names.
 * @example
 * parseCreatorList('user1, User2');
 */
function parseCreatorList(value: unknown) {
  if (typeof value !== 'string') return [] as string[];
  return [...new Set(value.split(',').map(item => item.trim().toLowerCase()).filter(Boolean))];
}

/**
 * Parses clip filter options from an HTTP query object.
 * @param query Endpoint query parameters.
 * @returns Normalized clip filters.
 * @example
 * const filters = parseClipFilters(query);
 */
function parseClipFilters(query: Record<string, unknown>): ClipFilters {
  const minViewsRaw = typeof query.min_views === 'string' ? Number(query.min_views) : NaN;
  const maxViewsRaw = typeof query.max_views === 'string' ? Number(query.max_views) : NaN;
  const dateFrom = typeof query.started_at === 'string' ? query.started_at.trim() : '';
  const dateTo = typeof query.ended_at === 'string' ? query.ended_at.trim() : '';
  return {
    title: typeof query.title === 'string' ? query.title.trim() : '',
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    startedAt: toRfc3339Date(dateFrom),
    endedAt: toRfc3339Date(dateTo, true),
    minViews: Number.isFinite(minViewsRaw) ? minViewsRaw : undefined,
    maxViews: Number.isFinite(maxViewsRaw) ? maxViewsRaw : undefined,
    includeCreators: parseCreatorList(query.include_creators),
    excludeCreators: parseCreatorList(query.exclude_creators),
  };
}

/**
 * Twitch requires both `started_at` and `ended_at`; fills missing bounds when only one date is set.
 * @param filters Parsed clip filters from the UI.
 * @returns API-ready date range or empty when no date filter is active.
 * @example
 * resolveClipApiDateRange({ dateTo: '2022-01-01', endedAt: '2022-01-01T23:59:59Z', ... });
 */
function resolveClipApiDateRange(filters: ClipFilters) {
  const hasFrom = Boolean(filters.dateFrom);
  const hasTo = Boolean(filters.dateTo);
  if (!hasFrom && !hasTo) {
    return { startedAt: undefined, endedAt: undefined };
  }

  let startedAt = filters.startedAt;
  let endedAt = filters.endedAt;

  if (hasFrom && !hasTo) {
    const today = new Date();
    endedAt = `${today.toISOString().slice(0, 10)}T23:59:59Z`;
  } else if (!hasFrom && hasTo) {
    startedAt = TWITCH_EPOCH_START;
  }

  return { startedAt, endedAt };
}

/**
 * Checks whether a clip matches local filter options.
 * @param clip Twitch clip record.
 * @param filters Active clip filters.
 * @returns True when the clip should be shown.
 * @example
 * matchesClipFilters(clip, filters);
 */
function matchesClipFilters(clip: TwitchClip, filters: ClipFilters) {
  const clipDate = clip.created_at.slice(0, 10);
  if (filters.dateFrom && clipDate < filters.dateFrom) {
    return false;
  }
  if (filters.dateTo && clipDate > filters.dateTo) {
    return false;
  }
  if (filters.title && !clip.title.toLowerCase().includes(filters.title.toLowerCase())) {
    return false;
  }
  if (filters.minViews !== undefined && clip.view_count < filters.minViews) {
    return false;
  }
  if (filters.maxViews !== undefined && clip.view_count > filters.maxViews) {
    return false;
  }
  const creator = clip.creator_name.toLowerCase();
  if (filters.includeCreators.length > 0) {
    const included = filters.includeCreators.some(
      name => creator === name || creator.includes(name)
    );
    if (!included) return false;
  }
  if (filters.excludeCreators.some(name => creator === name || creator.includes(name))) {
    return false;
  }
  return true;
}

/**
 * Fetches clips from Twitch with API date filters and local post-filtering.
 * @param broadcasterId Twitch broadcaster id.
 * @param filters Clip filters from the UI.
 * @param cursor Pagination cursor.
 * @returns Matching clips and the next cursor.
 * @example
 * const page = await fetchFilteredClips('123', filters, null);
 */
async function fetchFilteredClips(broadcasterId: string, filters: ClipFilters, cursor: string | null) {
  const collected: TwitchClip[] = [];
  let nextCursor = cursor;
  let scannedPages = 0;

  while (collected.length < CLIPS_PAGE_SIZE && scannedPages < CLIPS_MAX_SCAN_PAGES) {
    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
      first: String(CLIPS_FETCH_SIZE),
    });
    if (nextCursor) params.set('after', nextCursor);
    const { startedAt, endedAt } = resolveClipApiDateRange(filters);
    if (startedAt) params.set('started_at', startedAt);
    if (endedAt) params.set('ended_at', endedAt);

    const response = await twitchApiGet<HelixListResponse<TwitchClip>>(
      `https://api.twitch.tv/helix/clips?${params.toString()}`
    );
    const batch = response.data ?? [];
    nextCursor = response.pagination?.cursor ?? null;

    for (const clip of batch) {
      if (!matchesClipFilters(clip, filters)) continue;
      collected.push(clip);
      if (collected.length >= CLIPS_PAGE_SIZE) break;
    }

    if (!nextCursor || batch.length === 0) break;
    scannedPages += 1;
  }

  return {
    clips: collected.slice(0, CLIPS_PAGE_SIZE),
    cursor: nextCursor,
  };
}

/**
 * Runs yt-dlp download in the background and updates the in-memory job state.
 * @param downloadId Correlation id shared with the UI.
 * @param url Source media URL.
 * @param title Human-readable title for the UI.
 * @param folder Output directory from addon settings.
 * @param filenameTemplate yt-dlp output template.
 * @example
 * void runMediaDownload(id, url, title, folder, '%(title)s.%(ext)s');
 */
async function runMediaDownload(
  downloadId: string,
  url: string,
  title: string,
  folder: string,
  filenameTemplate: string,
  mediaId?: string
) {
  const job = downloadJobs.get(downloadId);
  if (!job) return;

  job.status = 'downloading';
  job.progress = { stage: 'starting', percent: 0 };

  const outputPath = buildOutputPath(folder, filenameTemplate);
  const result = await ytdlp.downloadFile(url, outputPath, { downloadId, concurrentFragments: 4 });

  if (!result.success) {
    job.status = 'error';
    job.error = result.message ?? result.error ?? 'Download failed';
    return;
  }

  job.status = 'done';
  job.progress = { stage: 'done', percent: 100 };
  if (mediaId) {
    await markMediaDownloaded(folder, mediaId, url, title);
  }
}

/**
 * Validates settings, registers a download job, and starts yt-dlp asynchronously.
 * @param url Public clip or VOD URL.
 * @param title Human-readable title for the UI.
 * @param mediaId Twitch media id used for duplicate detection.
 * @returns Download id when started or an error payload.
 * @example
 * const result = await startMediaDownload('https://clips.twitch.tv/Example', 'My clip', 'ClipId');
 */
async function startMediaDownload(url: string, title: string, mediaId?: string) {
  const params = await readAddonParams();
  const folder = String(params.download_folder ?? '').trim();
  if (!folder) {
    return { error: 'no_folder', message: 'Set a download folder in addon settings' };
  }

  const access = await ensureDownloadFolderAccess(folder);
  if (!access.success) {
    return { error: 'no_file_access', message: access.message ?? 'Folder access denied' };
  }

  const downloadId = random.id();
  const job: WorkerDownloadJob = {
    id: downloadId,
    url,
    title,
    mediaId,
    status: 'pending',
    progress: { stage: 'queued', percent: 0 },
  };
  downloadJobs.set(downloadId, job);

  const filenameTemplate = String(params.filename_template ?? '%(title)s.%(ext)s');
  void runMediaDownload(downloadId, url, title, folder, filenameTemplate, mediaId);

  return { downloadId, started: true };
}

void (async () => {
  await GenerateConfig([
  {
    key: 'download_folder',
    type: 'folder',
    default: '',
    pathPicker: {
      title: {
        en: 'Download folder',
        ru: 'Папка загрузки',
        uk: 'Папка завантаження',
      },
    },
    editor: {
      label: {
        en: 'Download folder',
        ru: 'Папка загрузки',
        uk: 'Папка завантаження',
      },
      required: true,
      description: {
        en: 'Folder where clips and VODs will be saved',
        ru: 'Папка, куда будут сохраняться клипы и записи',
        uk: 'Папка, куди зберігатимуться кліпи та записи',
      },
    },
  },
  {
    key: 'filename_template',
    type: 'text',
    default: '%(title)s.%(ext)s',
    editor: {
      label: {
        en: 'Filename template',
        ru: 'Шаблон имени файла',
        uk: 'Шаблон імені файлу',
      },
      description: {
        en: 'yt-dlp output template, e.g. %(uploader)s - %(title)s.%(ext)s',
        ru: 'Шаблон yt-dlp, например %(uploader)s - %(title)s.%(ext)s',
        uk: 'Шаблон yt-dlp, наприклад %(uploader)s - %(title)s.%(ext)s',
      },
    },
  },
]);

const initialParams = await readAddonParams();
if (initialParams.download_folder?.trim()) {
  await ensureDownloadFolderAccess(initialParams.download_folder.trim());
}

network.endpoints.create('state', 'GET', 'onGetState');
network.endpoints.create('clips', 'GET', 'onGetClips');
network.endpoints.create('videos', 'GET', 'onGetVideos');
network.endpoints.create('download', 'POST', 'onDownload');
network.endpoints.create('open-folder', 'POST', 'onOpenFolder');

events.On('ytdlp:download-progress', ({ downloadId, progress }) => {
  const job = downloadJobs.get(downloadId);
  if (!job) return;
  job.status = 'downloading';
  job.progress = {
    stage: progress.stage,
    percent: progress.percent,
    speed: progress.speed,
    eta: progress.eta,
  };
});

events.On('onGetState', async ({ query }) => {
  const denied = assertToken(query);
  if (denied) return denied;

  const params = await readAddonParams();
  const folder = String(params.download_folder ?? '').trim();
  if (folder) {
    await ensureDownloadFolderAccess(folder);
  }

  let twitchLogin = '';
  let twitchDisplayName = '';
  try {
    const auth = await getAuthTwitchChannel();
    twitchLogin = auth.login;
    twitchDisplayName = auth.displayName;
  } catch {
    twitchLogin = '';
    twitchDisplayName = '';
  }

  return {
    ok: true,
    downloadFolder: folder,
    filenameTemplate: String(params.filename_template ?? '%(title)s.%(ext)s'),
    downloads: [...downloadJobs.values()].slice(-20).reverse(),
    twitchLogin,
    twitchDisplayName,
  };
});

events.On('onGetClips', async ({ query }) => {
  const denied = assertToken(query);
  if (denied) return denied;

  try {
    const login = typeof query.login === 'string' ? query.login.trim() : '';
    const cursor = typeof query.cursor === 'string' ? query.cursor.trim() : '';
    const filters = parseClipFilters(query);
    const { broadcasterId, displayName } = await resolveBroadcaster(login || undefined);
    const addonParams = await readAddonParams();
    const folder = String(addonParams.download_folder ?? '').trim();
    const page = await fetchFilteredClips(broadcasterId, filters, cursor || null);
    const clips = await annotateDownloaded(folder, page.clips);

    return {
      ok: true,
      channel: displayName,
      clips,
      cursor: page.cursor,
      filters: {
        apiDateRange: Boolean(filters.dateFrom || filters.dateTo),
        localFilters: Boolean(
          filters.title ||
            filters.minViews !== undefined ||
            filters.maxViews !== undefined ||
            filters.includeCreators.length ||
            filters.excludeCreators.length
        ),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load clips',
    };
  }
});

events.On('onGetVideos', async ({ query }) => {
  const denied = assertToken(query);
  if (denied) return denied;

  try {
    const login = typeof query.login === 'string' ? query.login.trim() : '';
    const cursor = typeof query.cursor === 'string' ? query.cursor.trim() : '';
    const { broadcasterId, displayName } = await resolveBroadcaster(login || undefined);
    const addonParams = await readAddonParams();
    const folder = String(addonParams.download_folder ?? '').trim();
    const params = new URLSearchParams({
      user_id: broadcasterId,
      first: '20',
      type: 'archive',
    });
    if (cursor) params.set('after', cursor);

    const videos = await twitchApiGet<HelixListResponse<TwitchVideo>>(
      `https://api.twitch.tv/helix/videos?${params.toString()}`
    );

    const publicVideos = (videos.data ?? [])
      .filter(item => item.viewable === 'public')
      .map(item => ({
        ...item,
        thumbnail_url: normalizeThumbnailUrl(item.thumbnail_url),
      }));
    const annotatedVideos = await annotateDownloaded(folder, publicVideos);

    return {
      ok: true,
      channel: displayName,
      videos: annotatedVideos,
      cursor: videos.pagination?.cursor ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load videos',
    };
  }
});

events.On('onOpenFolder', async ({ query }) => {
  const denied = assertToken(query);
  if (denied) return denied;

  const addonParams = await readAddonParams();
  const folder = String(addonParams.download_folder ?? '').trim();
  if (!folder) {
    return { error: 'no_folder', message: 'Set a download folder in addon settings' };
  }

  const access = await ensureDownloadFolderAccess(folder);
  if (!access.success) {
    return { error: 'no_file_access', message: access.message ?? 'Folder access denied' };
  }

  api.openUrl(toFileUrl(folder));
  return { ok: true };
});

events.On('onDownload', async ({ query, body }) => {
  const denied = assertToken(query);
  if (denied) return denied;

  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  const title = typeof body?.title === 'string' ? body.title.trim() : url;
  const mediaId = typeof body?.mediaId === 'string' ? body.mediaId.trim() : '';
  if (!url) {
    return { error: 'missing_url', message: 'URL is required' };
  }

  try {
    return await startMediaDownload(url, title || url, mediaId || undefined);
  } catch (error) {
    return {
      error: 'download_failed',
      message: error instanceof Error ? error.message : 'Download failed',
    };
  }
});

})();
