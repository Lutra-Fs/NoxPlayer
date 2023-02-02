import { Logger } from "./Logger";
import VideoInfo from "../objects/VideoInfo";
import Bottleneck from "bottleneck";

const logger = new Logger("Data.js")
/**
 * limits to bilibili API call to 200ms/call using bottleneck. 
 * 100ms/call seems to brick IP after ~ 400 requests.
 */
const biliApiLimiter = new Bottleneck({
    minTime: 200,
    maxConcurrent: 5,
})
/**
 *  Video src info
 */
const URL_PLAY_URL = "https://api.bilibili.com/x/player/playurl?cid={cid}&bvid={bvid}&qn=64&fnval=16"
/**
 *  BVID -> CID
 */
const URL_BVID_TO_CID = "https://api.bilibili.com/x/player/pagelist?bvid={bvid}&jsonp=jsonp"
/**
 *  Video Basic Info
 */
const URL_VIDEO_INFO = "http://api.bilibili.com/x/web-interface/view?bvid={bvid}"
/**
 *  channel series API Extract Info
 */
const URL_BILISERIES_INFO = "https://api.bilibili.com/x/series/archives?mid={mid}&series_id={sid}&only_normal=true&sort=desc&pn={pn}&ps=30"
/**
 *  channel series API Extract Info
 */
const URL_BILICOLLE_INFO = 'https://api.bilibili.com/x/polymer/space/seasons_archives_list?mid={mid}&season_id={sid}&sort_reverse=false&page_num={pn}&page_size=30'
/**
 *  channel API Extract Info
 */
const URL_BILICHANNEL_INFO = "https://api.bilibili.com/x/space/arc/search?mid={mid}&pn={pn}&jsonp=jsonp"
/**
 *  Fav List
 */
const URL_FAV_LIST = "https://api.bilibili.com/x/v3/fav/resource/list?media_id={mid}&pn={pn}&ps=20&keyword=&order=mtime&type=0&tid=0&platform=web&jsonp=jsonp"
/**
 *  BILIBILI search API. 
 */
const URL_BILI_SEARCH = "https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword={keyword}&page={pn}"
/**
 *  LRC Mapping
 */
const URL_LRC_MAPPING = "https://raw.githubusercontent.com/kenmingwang/azusa-player-lrcs/main/mappings.txt"
/**
 *  LRC Base
 */
const URL_LRC_BASE = "https://raw.githubusercontent.com/kenmingwang/azusa-player-lrcs/main/{songFile}"
/**
 *  QQ SongSearch API
 */
const URL_QQ_SEARCH = "https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?key={KeyWord}"
/**
 *  QQ LyricSearchAPI
 */
const URL_QQ_LYRIC = "https://i.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid={SongMid}&g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8&nobase64=1"

/**
 * 
 * @param {string} bvid 
 * @param {string} cid 
 * @returns 
 */
export const fetchPlayUrlPromise = async (bvid, cid) => {
    // Fetch cid from bvid if needed
    if (!cid)
        cid = await fetchCID(bvid).catch((err) => console.log(err))

    // Returns a promise that resolves into the audio stream url
    return (new Promise((resolve, reject) => {
        // console.log('Data.js Calling fetchPlayUrl:' + URL_PLAY_URL.replace("{bvid}", bvid).replace("{cid}", cid))
        chrome.storage.local.get(['CurrentPlaying','PlayerSetting'], function (result) {
            // To prohibit current playing audio from fetching a new audio stream
            // If single loop, retreive the promise again.
            if (result.CurrentPlaying && result.CurrentPlaying.cid == cid && result.PlayerSetting.playMode == 'singleLoop'){
                // fixed return point; but why when repeat is single loop, a new promise is retrieved? 
                resolve(result.CurrentPlaying.playUrl)
            }
            else {
                fetch(URL_PLAY_URL.replace("{bvid}", bvid).replace("{cid}", cid))
                    .then(res => res.json())
                    .then(json => resolve(extractResponseJson(json, 'AudioUrl')))
                    .catch((err) => reject(console.log(err)))
            }
        })
    }));
}

/**
 * 
 * @param {string} bvid 
 * @returns 
 */
export const fetchCID = async (bvid) => {
    //console.log('Data.js Calling fetchCID:' + URL_BVID_TO_CID.replace("{bvid}", bvid))
    const res = await fetch(URL_BVID_TO_CID.replace("{bvid}", bvid))
    const json = await res.json()
    const cid = extractResponseJson(json, 'CID')
    return cid
}

// Refactor needed for this func
export const fetchLRC = async (name, setLyric, setSongTitle) => {
    //console.log('Data.js Calling: fetchLRC')
    // Get song mapping name and song name from title
    const res = await fetch(URL_LRC_MAPPING)
    const mappings = await res.text()
    const songs = mappings.split("\n")
    const songName = extractSongName(name)
    setSongTitle(songName)

    const songFile = songs.find((v, i, a) => v.includes(songName))
    // use song name to get the LRC
    try {
        const lrc = await fetch(URL_LRC_BASE.replace('{songFile}', songFile))
        if (lrc.status != '200') {
            setLyric('[00:00.000] 无法找到歌词')
            return
        }

        const text = await lrc.text()
        setLyric(text.replaceAll('\r\n', '\n'))
        return text.replaceAll('\r\n', '\n')
    } catch (error) {
        setLyric('[00:00.000] 无法找到歌词')
        return
    }

}

/**
 * 
 * @param {string} bvid 
 * @returns 
 */
export const fetchVideoInfoRaw = async (bvid) => {
    logger.info("calling fetchVideoInfo")
    const res = await fetch(URL_VIDEO_INFO.replace('{bvid}', bvid))
    const json = await res.json()
    try {
        const data = json.data
        const v = new VideoInfo(
            data.title,
            data.desc,
            data.videos,
            data.pic,
            data.owner,
            data.pages.map((s) => { return ({ bvid: bvid, part: s.part, cid: s.cid }) }),
            bvid)
        return v
    } catch (error) {
        console.warning('Some issue happened when fetching', bvid)
    }
}

/**
 * 
 * @param {string} bvid 
 * @param {function} progressEmit 
 * @returns 
 */
export const fetchVideoInfo = async (bvid, progressEmit = () => {}) => {
    return biliApiLimiter.schedule(() => {
        progressEmit()
        return fetchVideoInfoRaw(bvid)
    })
}


/**
 * fetch biliseries. copied from yt-dlp.
 * this API does not provide the total number of videos in a list, but will return an empty list if 
 * the queried page exceeds the number of videos; so use a while loop and break when empty is detected
 * everything else is copied from fetchFavList.
 * @param {string} mid 
 * @param {string} sid 
 * @param {function} progressEmitter 
 * @param {array} favList 
 * @returns 
 */
export const fetchBiliSeriesList = async (mid, sid, progressEmitter, favList = []) => {
    logger.info("calling fetchBiliSeriesList")
    let page = 0
    let res = await fetch(URL_BILISERIES_INFO.replace('{mid}', mid).replace('{sid}', sid).replace('{pn}', page))
    let json = await res.json()
    let data = json.data

    let BVidPromises = []
    // albeit slow, this is a good way to not get banned....
    for (let i=0, n=data.archives.length; i < n; i++) {
        if (favList.includes(data.archives[i].bvid)) {
            console.debug('skipped duplicate bvid during rss feed update', data.archives[i].bvid)
            continue
        }
        BVidPromises.push(fetchVideoInfo(data.archives[i].bvid, () => {progressEmitter(parseInt(100 * (i + 1) / data.archives.length))}))        
    }
    let videoInfos = []
    await Promise.all(BVidPromises).then(res => {
        videoInfos = res
    })
    return videoInfos
}

/**
 * 
// copied from ytdlp. applies to collections such as:
// https://space.bilibili.com/287837/channel/collectiondetail?sid=793137
 * @param {string} mid 
 * @param {string} sid 
 * @param {function} progressEmitter 
 * @param {array} favList 
 * @returns 
 */
export const fetchBiliColleList = async (mid, sid, progressEmitter, favList = []) => {
    logger.info("calling fetchBiliColleList")
    const res = await fetch(URL_BILICOLLE_INFO.replace('{mid}', mid).replace('{sid}', sid).replace('{pn}', 1))
    const json = await res.clone().json()
    const data = json.data

    const mediaCount = data.meta.total
    let totalPagesRequired = 1 + Math.floor(mediaCount / data.page.page_size)

    const BVidPromises = []
    const pagesPromises = [res]

    for (let page = 2; page <= totalPagesRequired; page++) {
        pagesPromises.push(await fetch(URL_BILICOLLE_INFO.replace('{mid}', mid).replace('{sid}', sid).replace('{pn}', page)))
    }

    let videoInfos = []
    await Promise.all(pagesPromises)
        .then(async function (v) {
            for (let index = 0, n = v.length; index < n; index++) {
                await v[index].json().then(js => js.data.archives.map(m => {
                    if (!favList.includes(m.bvid)) {
                        BVidPromises.push(fetchVideoInfo(m.bvid, () => {progressEmitter(parseInt(100 * (index + 1) / n))}))
                    }
                }))
            }
            await Promise.all(BVidPromises).then(res => {
                videoInfos = res
            })
        })

    return videoInfos
}

/**
 * 
// copied from ytdlp. applies to bibibili channels such as:
// https://space.bilibili.com/355371630/video
 * @param {string} mid 
 * @param {function} progressEmitter 
 * @param {array} favList 
 * @returns 
 */
export const fetchBiliChannelList = async (mid, progressEmitter, favList = []) => {
    logger.info("calling fetchBiliColleList")
    const res = await fetch(URL_BILICHANNEL_INFO.replace('{mid}', mid).replace('{pn}', 1))
    const json = await res.clone().json()
    const data = json.data

    const mediaCount = data.page.count
    let totalPagesRequired = 1 + Math.floor(mediaCount / data.page.ps)

    const BVidPromises = []
    const pagesPromises = [res]

    for (let page = 2; page <= totalPagesRequired; page++) {
        pagesPromises.push(await fetch(URL_BILICHANNEL_INFO.replace('{mid}', mid).replace('{pn}', page)))
    }

    let videoInfos = []
    await Promise.all(pagesPromises)
        .then(async function (v) {
            for (let index = 0, n = v.length; index < n; index++) {
                await v[index].json().then(js => js.data.list.vlist.map(m => {
                    if (!favList.includes(m.bvid)) {
                        BVidPromises.push(fetchVideoInfo(m.bvid, () => {progressEmitter(parseInt(100 * (index + 1) / n))}))
                    }
                }))
            }
            await Promise.all(BVidPromises).then(res => {
                videoInfos = res
            })
        })

    return videoInfos
}

/**
 * 
 * @param {string} url 
 * @param {function} progressEmitter 
 * @param {array} favList 
 * @returns 
 */
export const fetchGenericPaginatedList = async (url, progressEmitter, favList = []) => {
    logger.info("calling fetchGenricPaginatedList");
    url = 'https://steria.vplayer.tk/api/musics/{pn}';
    let res = await fetch(url.replace('{pn}', 1));
    let videoInfos = [await res.json()];

    for (let page = 2; true; page++) {
        videoInfos.push(await (await fetch(url.replace('{pn}', page))).json());
        if (videoInfos[videoInfos.length - 1].length == 0) break;
    }

    return videoInfos
}

/**
 * 
// copied from ytdlp. applies to bibibili fav lists such as:
// https://space.bilibili.com/355371630/video
 * @param {string} mid 
 * @param {function} progressEmitter 
 * @param {array} favList 
 * @returns 
 */
export const fetchFavList = async (mid, progressEmitter, favList = []) => {
    logger.info("calling fetchFavList")
    const res = await fetch(URL_FAV_LIST.replace('{mid}', mid).replace('{pn}', 1))
    const json = await res.clone().json()
    const data = json.data

    const mediaCount = data.info.media_count
    let totalPagesRequired = 1 + Math.floor(mediaCount / 20)

    const BVidPromises = []
    const pagesPromises = [res]

    for (let page = 2; page <= totalPagesRequired; page++) {
        pagesPromises.push(fetch(URL_FAV_LIST.replace('{mid}', mid).replace('{pn}', page)))
    }

    let videoInfos = []
    await Promise.all(pagesPromises)
        .then(async function (v) {
            // console.log(BVidPromises)
            for (let index = 0; index < v.length; index++) {
                await v[index].json().then(js => js.data.medias.map(m => {
                    if (!favList.includes(m.bvid)) {
                        BVidPromises.push(fetchVideoInfo(m.bvid))
                    }
                }))
            }

            await Promise.all(BVidPromises).then(res => {
                videoInfos = res
            })
        })

    return videoInfos
}

/**
 * Private Util to extract json, see https://github.com/SocialSisterYi/bilibili-API-collect
 * @param {Object} json 
 * @param {string} field 
 * @returns 
 */
const extractResponseJson = (json, field) => {
    if (field === 'AudioUrl') {
        return json.data.dash.audio[0].baseUrl
    } else if (field === 'CID') {
        return json.data[0].cid
    } else if (field == 'AudioInfo') {
        return {}
    }
}

/**
 * use regex to extract songnames from a string. default to whatever in 《》
 * @param {string} name 
 * @returns parsed songname.
 */
export const extractSongName = (name) => {
    const nameReg = new RegExp("《.*》"); // For single-list BVID, we need to extract name from title
    const res = nameReg.exec(name)
    if (res)
        return (res.length > 0 ? res[0].substring(1, res[0].length - 1) : "") // Remove the brackets

    // var nameReg = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/ // Check if name is just one string, no special chars
    // if(!nameReg.test(name))
    return (name)
}

export const searchLyricOptions = async (searchKey, setOptions, setLyric) => {
    logger.info("calling searchLyricOptions")
    if (searchKey == "") {
        setOptions([])
        return
    }
    const res = await fetch(URL_QQ_SEARCH.replace("{KeyWord}", searchKey))
    const json = await res.json()
    const data = json.data.song.itemlist
    const slimData = data.map((s, v) => { return { key: s.mid, songMid: s.mid, label: v + '. ' + s.name + ' / ' + s.singer } })

    setOptions(slimData)
}

export const searchLyric = async (searchMID, setLyric) => {
    logger.info("calling searchLyric")
    const res = await fetch(URL_QQ_LYRIC.replace("{SongMid}", searchMID))
    const json = await res.json()
    if (!json.lyric) {
        setLyric('[00:00.000] 无法找到歌词,请手动搜索')
        return
    }
    const data = json.lyric
    // console.log(data)
    setLyric(data)
}