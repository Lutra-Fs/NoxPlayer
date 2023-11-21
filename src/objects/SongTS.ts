import { v4 as uuidv4 } from 'uuid';

import { extractParenthesis } from '@APM/utils/re';
import { reExtractSongName } from '../stores/appStore';

export const DEFAULT_NULL_URL = 'NULL';
export const NULL_TRACK = { url: DEFAULT_NULL_URL, urlRefreshTimeStamp: 0 };

interface SongProps {
  cid: string | number;
  bvid: string;
  name: string;
  nameRaw: string;
  singer: string;
  singerId: string | number;
  cover: string;
  lyric?: string;
  lyricOffset?: number;
  page?: number;
  biliShazamedName?: string;
  duration: number;
  album?: string;
  addedDate?: number;
}

export default ({
  cid,
  bvid,
  name,
  singer,
  cover,
  singerId,
  lyric,
  lyricOffset,
  page,
  biliShazamedName,
  duration,
  album,
  addedDate,
}: SongProps): NoxMedia.Song => {
  return {
    id: String(cid),
    bvid,
    name,
    singer,
    cover,
    singerId,
    lyric,
    lyricOffset,
    page,
    biliShazamedName,
    nameRaw: name,
    parsedName: reExtractSongName(name, singerId),
    duration,
    album,
    addedDate,
  };
};

export const setSongBiliShazamed = (
  song: NoxMedia.Song,
  val: string | null,
) => {
  if (!val) return { ...song, biliShazamedName: val } as NoxMedia.Song;
  const biliShazamedName = extractParenthesis(val);
  return {
    ...song,
    biliShazamedName,
    nameRaw: song.name,
    name: biliShazamedName,
    parsedName: biliShazamedName,
  } as NoxMedia.Song;
};

export const removeSongBiliShazamed = (song: NoxMedia.Song) => {
  song.biliShazamedName = undefined;
  song.name = song.nameRaw;
  song.parsedName = reExtractSongName(song.name, song.singerId);
};

export const dummySong = (): NoxMedia.Song => {
  return {
    id: uuidv4(),
    bvid: '0',
    name: 'dummySong',
    nameRaw: 'dummySong',
    singer: 'dummyArtist',
    singerId: 0,
    cover: '',
    lyric: '',
    lyricOffset: 0,
    parsedName: 'dummySongParsed',
    biliShazamedName: '',
    page: 0,
    duration: 0,
  };
};

export const dummySongObj = dummySong();
