import { fetchPlayUrlPromise } from '@APM/utils/mediafetch/resolveURL';
import { getR128Gain, addR128Gain } from '@APM/utils/ffmpeg/r128Store';
import r128gain from './ffmpeg';
import { r128gain2Volume } from '../Utils';

interface Props {
  song: NoxMedia.Song;
  getSource: (song: NoxMedia.Song) => Promise<string>;
}
const getOrSetR128Gain = async ({
  song,
  getSource = async (v) => (await fetchPlayUrlPromise(v)).url,
}: Props) => {
  const r128Val = getR128Gain(song);
  if (r128Val !== null) {
    return r128gain2Volume(r128Val);
  }
  const source = await getSource(song);
  const val = await r128gain(source);
  addR128Gain(song, val);
  return r128gain2Volume(val);
};

export default getOrSetR128Gain;