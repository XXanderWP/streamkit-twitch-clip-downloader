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
  status: 'pending' | 'downloading' | 'done' | 'error';
  progress: {
    stage: string;
    percent: number;
    speed?: string;
    eta?: string;
  };
  error?: string;
};

/** Parsed Twitch Helix list response with cursor pagination. */
type HelixListResponse<T> = {
  data?: T[];
  pagination?: { cursor?: string };
};

/** Active download jobs keyed by yt-dlp download id. */
const downloadJobs = new Map<string, WorkerDownloadJob>();

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
  filenameTemplate: string
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
}

/**
 * Validates settings, registers a download job, and starts yt-dlp asynchronously.
 * @param url Public clip or VOD URL.
 * @param title Human-readable title for the UI.
 * @returns Download id when started or an error payload.
 * @example
 * const result = await startMediaDownload('https://clips.twitch.tv/Example', 'My clip');
 */
async function startMediaDownload(url: string, title: string) {
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
    status: 'pending',
    progress: { stage: 'queued', percent: 0 },
  };
  downloadJobs.set(downloadId, job);

  const filenameTemplate = String(params.filename_template ?? '%(title)s.%(ext)s');
  void runMediaDownload(downloadId, url, title, folder, filenameTemplate);

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
    const { broadcasterId, displayName } = await resolveBroadcaster(login || undefined);
    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
      first: '20',
    });
    if (cursor) params.set('after', cursor);

    const clips = await twitchApiGet<HelixListResponse<TwitchClip>>(
      `https://api.twitch.tv/helix/clips?${params.toString()}`
    );

    return {
      ok: true,
      channel: displayName,
      clips: clips.data ?? [],
      cursor: clips.pagination?.cursor ?? null,
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
    const params = new URLSearchParams({
      user_id: broadcasterId,
      first: '20',
      type: 'archive',
    });
    if (cursor) params.set('after', cursor);

    const videos = await twitchApiGet<HelixListResponse<TwitchVideo>>(
      `https://api.twitch.tv/helix/videos?${params.toString()}`
    );

    const publicVideos = (videos.data ?? []).filter(item => item.viewable === 'public');

    return {
      ok: true,
      channel: displayName,
      videos: publicVideos,
      cursor: videos.pagination?.cursor ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load videos',
    };
  }
});

events.On('onDownload', async ({ query, body }) => {
  const denied = assertToken(query);
  if (denied) return denied;

  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  const title = typeof body?.title === 'string' ? body.title.trim() : url;
  if (!url) {
    return { error: 'missing_url', message: 'URL is required' };
  }

  try {
    return await startMediaDownload(url, title || url);
  } catch (error) {
    return {
      error: 'download_failed',
      message: error instanceof Error ? error.message : 'Download failed',
    };
  }
});

})();
