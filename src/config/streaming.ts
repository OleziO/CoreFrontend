/**
 * Публічні дані про трансляції ліги.
 *
 * Канал один і статичний, тож живе в конфігу, а не в API. Плеєр Twitch вбудовується
 * лише з дозволених доменів — `parent` має збігатися з hostname сторінки, інакше
 * iframe лишається порожнім (див. https://dev.twitch.tv/docs/embed/video-and-clips/).
 */

export const TWITCH_CHANNEL = 'core_league'

export const TWITCH_CHANNEL_URL = `https://www.twitch.tv/${TWITCH_CHANNEL}`

/** URL вбудованого плеєра Twitch для поточного домену сторінки. */
export function buildTwitchPlayerUrl (parentHost: string, channel: string = TWITCH_CHANNEL): string {
  const params = new URLSearchParams({
    channel,
    parent: parentHost,
    autoplay: 'true',
    muted: 'true'
  })
  return `https://player.twitch.tv/?${params.toString()}`
}
