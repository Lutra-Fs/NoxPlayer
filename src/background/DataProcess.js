import { fetchVideoInfo, fetchPlayUrlPromise, fetchFavList, fetchBiliSeriesInfo } from '../utils/Data'
import Song from '../objects/Song'

const DEFAULT_BVID = 'BV1g34y1r71w'
const LAST_PLAY_LIST = 'LastPlayList'

// Load last-playist from storage, else use DEFAULT_BVID as initial list.
export const initSongList = async (setCurrentSongList) => {
    chrome.storage.local.get([LAST_PLAY_LIST], async function (result) {
        if (result[LAST_PLAY_LIST] && result[LAST_PLAY_LIST].length != 0) {
            // console.log(result)
            const defaultSongList = result[LAST_PLAY_LIST]
            defaultSongList.map(v => v['musicSrc'] = () => { return fetchPlayUrlPromise(v.bvid, v.id) })
            setCurrentSongList(defaultSongList)
        }
        else {
            const defaultSongList = await getSongList(DEFAULT_BVID)
            setCurrentSongList(defaultSongList)
        }
    })
}

export const getSongList = async (bvid) => {
    const info = await fetchVideoInfo(bvid)
    let lrc = ""
    let songs = []

    // Case of single part video
    if (info.pages.length == 1) {
        // lrc = await fetchLRC(info.title)
        return ([new Song({
            cid: info.pages[0].cid,
            bvid: bvid,
            name: info.title,
            singer: info.uploader.name,
            singerId: info.uploader.mid,
            cover: info.picSrc,
            musicSrc: () => { return fetchPlayUrlPromise(bvid, info.pages[0].cid) },
            lyric: lrc
        })])
    }

    // Can't use forEach, does not support await
    for (let index = 0; index < info.pages.length; index++) {
        let page = info.pages[index]
        // lrc = fetchLRC(page.part)
        songs.push(new Song({
            cid: page.cid,
            bvid: bvid,
            name: page.part,
            singer: info.uploader.name,
            singerId: info.uploader.mid,
            cover: info.picSrc,
            musicSrc: () => { return fetchPlayUrlPromise(bvid, page.cid) },
            lyric: lrc
        }))
    }

    return (songs)
}

const parseFavList = (favList) => {
    let favListBVid = []
    
    for (let i=0, n=favList.length; i < n; i++) {
        favListBVid.push(favList[i].bvid)
    }

    return favListBVid
}

export const getSongsFromBVids = async (infos) => {

    let songs = []

    infos.forEach(info => {
        if(!info)
            return
        // Case of single part video
        if (info.pages.length == 1) {
            // lrc = await fetchLRC(info.title)
            songs.push(new Song({
                cid: info.pages[0].cid,
                bvid: info.pages[0].bvid,
                name: info.title,
                singer: info.uploader.name,
                singerId: info.uploader.mid,
                cover: info.picSrc,
                musicSrc: () => { return fetchPlayUrlPromise(info.pages[0].bvid, info.pages[0].cid) }
            }))
        }
        else {
            // Can't use forEach, does not support await
            for (let index = 0; index < info.pages.length; index++) {
                let page = info.pages[index]
                    // lrc = fetchLRC(page.part)
                songs.push(new Song({
                    cid: page.cid,
                    bvid: page.bvid,
                    name: page.part,
                    singer: info.uploader.name,
                    singerId: info.uploader.mid,
                    cover: info.picSrc,
                    musicSrc: () => { return fetchPlayUrlPromise(page.bvid, page.cid) }

                }))
            }
        }
    })

    return (songs)
}

export const getBiliSeriesList = async (mid, sid, progressEmitter = (res) => {}, favList = []) => {
    return getSongsFromBVids(await fetchBiliSeriesInfo(mid, sid, progressEmitter, parseFavList(favList)))
}

export const getFavList = async (mid, progressEmitter = (res) => {}, favList = []) => {
    return getSongsFromBVids(await fetchFavList(mid, progressEmitter, parseFavList(favList)))
}