/**
 * My StreamKit Addon
 * @see https://rocketman-streamkit.github.io/types/
 */

network.endpoints.create('state', 'GET', 'onGetState');

events.On('onGetState', ({ query }) => {
  if (query.token !== data.token) {
    return { error: 'Unauthorized' };
  }
  return { ok: true, addonId: data.id };
});
