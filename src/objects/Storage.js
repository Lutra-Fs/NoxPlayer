import { getBiliSeriesList } from '../background/DataProcess'
import { v4 as uuidv4 } from 'uuid';
import { fetchPlayUrlPromise } from '../utils/Data'
import { getVersion } from '../utils/versionupdater/versionupdater'

// https://space.bilibili.com/5053504/channel/seriesdetail?sid=2664851
const INITIAL_PLAYLIST = ['5053504', '2664851']
export const MY_FAV_LIST_KEY = 'MyFavList'
export const FAV_FAV_LIST_KEY = 'FavFavList-Special'
const LYRIC_MAPPING = 'LyricMappings'
const LAST_PLAY_LIST = 'LastPlayList'
const PLAYER_SETTINGS = 'PlayerSetting'
const CURRENT_PLAYING = 'CurrentPlaying'
export const FAVLIST_AUTO_UPDATE_TIMESTAMP = 'favListAutoUpdateTimestamp'

export const EXPORT_OPTIONS = {
    local: '本地',
    dropbox: 'Dropbox',
    personal: '私有云',
}

export const dummyFavList = (favName) => {
    return {
        songList: [],
        info: { title: favName, id: ('FavList-' + uuidv4()) },
        // this is not a Set because we need to serialize this 
        // for importing/exporting playlists.
        subscribeUrls: [],
        settings: {
            autoRSSUpdate: false,
        },
        useBiliShazam: false,
        bannedBVids: [],
    }
}

export const dummyFavListFromList = (list) => {
    let newList = dummyFavList("");
    for (const [key, val] of Object.entries(list)) {
        newList[key] = val;
    }
    return newList;
}

export const DEFAULT_SETTING = { 
    playMode: 'shufflePlay',
    defaultPlayMode: 'shufflePlay',
    defaultVolume: 1,
    autoRSSUpdate: false,
    skin: "诺莺nox",
    parseSongName: false,
    keepSearchedSongListWhenPlaying: false,
    settingExportLocation: EXPORT_OPTIONS.local,
    personalCloudIP: "",
    noxVersion: getVersion(),
    hideCoverInMobile: false,
}

/**
 * wrapper for chrome.storage.local.get. return the 
 * local stored objects given a key.
 * @param {string} key 
 * @returns 
 */
export const readLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
            resolve(result[key]);
        });
    });
};

export const setLocalStorage = async (key, val) => {
    chrome.storage.local.set({ [key]: val })
}

export const saveFav = async (updatedToList) => {
    return await chrome.storage.local.set({ [updatedToList.info.id]: updatedToList })
}

/**
 * wrapper for getting the current playerSetting.
 * if setting is not initialized, initialize and return the default one.
 * @returns playerSetting
 */
const getPlayerSetting = async () => {
    const settings = await readLocalStorage(PLAYER_SETTINGS);
    // console.log(settings)
    if (settings == undefined) {
        this.setPlayerSetting(DEFAULT_SETTING);
        return DEFAULT_SETTING;
    }
    return (settings);
}

/**
 * wrapper for getting the current playerSetting's value given a key.
 * if key doesnt exist (an older version?) then return the default value.
 * @param {string} key 
 * @returns value in playerSetting
 */
export const getPlayerSettingKey = async (key = null) => {
    let settings = await getPlayerSetting();
    if (key === null) {
        return settings;
    }
    if (settings.hasOwnProperty(key)) {
        return settings[key];
    } else {
        return DEFAULT_SETTING[key];
    }
}

export const saveMyFavList = (newList, callbackFunc = () => {console.debug('saveMyFavList called.')} ) => {
    chrome.storage.local.set({ [MY_FAV_LIST_KEY]: newList.map(v => v.info.id) }, callbackFunc)
}

/**
 * cleans up all orphan playlists.
 */
export const storageCleanup = async () => {
    chrome.storage.local.get(null).then(console.log)
    return;
    const locallyStored = await chrome.storage.local.get(null);
    const playListKeyList = locallyStored[MY_FAV_LIST_KEY];
    setLocalStorage(LYRIC_MAPPING, []);
    setLocalStorage(LAST_PLAY_LIST, []);
    setLocalStorage(FAVLIST_AUTO_UPDATE_TIMESTAMP, []);
    for (const [key, val] of Object.entries(locallyStored)) {
        if (!key.includes('FavList-')) continue;
        if (playListKeyList.includes(key)) continue;
        setLocalStorage(key, undefined);
    }
    
const LYRIC_MAPPING = 'LyricMappings'
const LAST_PLAY_LIST = 'LastPlayList'
}

export default class StorageManager {
    constructor() {
        this.setFavLists = () => { }
        this.setPlayerSettingInst = () => { }
        this.latestFavLists = []
    }

    async initFavLists() {
        const _self = this
        chrome.storage.local.get([MY_FAV_LIST_KEY], function (result) {
            //console.log(result);
            if (Object.keys(result).length != 0) {
                _self.initWithStorage(result[MY_FAV_LIST_KEY])
            }
            else {
                chrome.storage.local.set({ [MY_FAV_LIST_KEY]: [] }, async function () {
                    _self.initWithDefault()
                    // window.open('https://github.com/lovegaoshi/azusa-player/wiki/%E6%AC%A2%E8%BF%8E%E9%A1%B5')
                });
            }
        });
    }

    async initWithStorage(FavListIDs) {
        const _self = this
        chrome.storage.local.get(FavListIDs, function (result) {
            let FavLists = []
            let FavListsSorted = []
            // Sort result base on ID
            for (let [key, value] of Object.entries(result)) {
                value.songList.map((v) => v['musicSrc'] = () => { return fetchPlayUrlPromise(v.bvid, v.id) })
                FavLists.push(value)

            }
            FavListIDs.map((id) => {
                FavListsSorted.push(FavLists.find((v) => v.info.id == id))
            })
            //console.log(FavListsSorted)
            _self.setFavLists(FavListsSorted)
            _self.latestFavLists = FavListsSorted
        })
    }

    async initWithDefault() {
        const _self = this
        let favfavlist = dummyFavList('我的最爱')
        favfavlist.info.id = "FavList-Special-Favorite"
        setLocalStorage(FAV_FAV_LIST_KEY, favfavlist)
        let value = dummyFavList('闹闹的歌切')
        value.songList = await getBiliSeriesList({mid: INITIAL_PLAYLIST[0], sid: INITIAL_PLAYLIST[1]})
        value.subscribeUrls = ['https://space.bilibili.com/5053504/channel/seriesdetail?sid=2664851']
        chrome.storage.local.set({
            [value.info.id]: value,
            [LAST_PLAY_LIST]: [],
            [LYRIC_MAPPING]: [],
            [CURRENT_PLAYING]: {cid: null, playUrl: null},
        }, function () {
            //console.log('key is set to ' + value.info.id);
            //console.log('Value is set to ' + value);
            chrome.storage.local.set({ [MY_FAV_LIST_KEY]: [value.info.id] }, function () {
                _self.setFavLists([value])
                _self.latestFavLists = [value]
            })
        });
    }

    deletFavList(id, newFavLists) {
        const _self = this
        chrome.storage.local.remove(id, function () {
            const newFavListsIds = newFavLists.map(v => v.info.id)
            chrome.storage.local.set({ [MY_FAV_LIST_KEY]: newFavListsIds }, function () {
                _self.setFavLists(newFavLists)
                _self.latestFavLists = newFavLists
            })
        })
    }

    addFavList(favName) {
        const _self = this
        const value = dummyFavList(favName)
        chrome.storage.local.set({ [value.info.id]: value }, function () {
            _self.latestFavLists.push(value)
            _self.saveMyFavList(_self.latestFavLists, function () {
                _self.setFavLists([..._self.latestFavLists])

                //console.log('AddedFav ' + value.info.id);
            })
        });
        return value
    }

    saveMyFavList(newList, callbackFunc = () => {console.debug('saveMyFavList called.')} ) {
        this.latestFavLists = newList
        chrome.storage.local.set({ [MY_FAV_LIST_KEY]: newList.map(v => v.info.id) }, callbackFunc)
    }

    updateFavList(updatedToList) {
        const _self = this
        console.debug('saving favList', updatedToList.info.title)
        switch (updatedToList.info.id) {
            case FAV_FAV_LIST_KEY:
                setLocalStorage(FAV_FAV_LIST_KEY, updatedToList)
                return
        }
        chrome.storage.local.set({ [updatedToList.info.id]: updatedToList }, function () {
            const index = _self.latestFavLists.findIndex(f => f.info.id == updatedToList.info.id)
            _self.latestFavLists[index].songList = updatedToList.songList
            if (updatedToList.subscribeUrls) {
                _self.latestFavLists[index].subscribeUrls = updatedToList.subscribeUrls
            }
            _self.setFavLists([..._self.latestFavLists])
        });
    }

    setLastPlayList(audioLists) {
        chrome.storage.local.set({ [LAST_PLAY_LIST]: audioLists })
    }

    setCurrentPlaying(cid, musicSrc) {
        chrome.storage.local.set({ [CURRENT_PLAYING]: {cid:cid, playUrl:musicSrc} })
    }

    async setLyricOffset(songId, lrcOffset) {
        const lyricMappings = await this.readLocalStorage(LYRIC_MAPPING)
        const detailIndex = lyricMappings.findIndex(l => l.id == songId)
        if (detailIndex != -1) {
            lyricMappings[detailIndex].lrcOffset = lrcOffset
            chrome.storage.local.set({ [LYRIC_MAPPING]: lyricMappings })
        }
    }

    async setLyricDetail(songId, lrc) {
        const lyricMappings = await this.readLocalStorage(LYRIC_MAPPING)
        const detailIndex = lyricMappings.findIndex(l => l.id == songId)
        if (detailIndex != -1) {
            lyricMappings[detailIndex].lrc = lrc
        }
        else {
            lyricMappings.push({ key: songId, id: songId, lrc: lrc, lrcOffset: 0 })
        }
        chrome.storage.local.set({ [LYRIC_MAPPING]: lyricMappings })
    }
    async getLyricDetail(songId) {
        const lyricMappings = await this.readLocalStorage(LYRIC_MAPPING)
        const detail = lyricMappings.find(l => l.id == songId)
        return detail;
    }

    async readLocalStorage(key) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([key], function (result) {
                resolve(result[key]);
            });
        });
    };

    async getPlayerSetting() {
        const settings = await this.readLocalStorage(PLAYER_SETTINGS)
        // console.log(settings)
        if (settings == undefined) {
            this.setPlayerSetting(DEFAULT_SETTING)
            return DEFAULT_SETTING
        }
        return (settings)
    }

    async setPlayerSetting(newSettings) {
        chrome.storage.local.set({ [PLAYER_SETTINGS]: newSettings })
        this.setPlayerSettingInst(newSettings)
    }

    async exportStorageRaw() {
        return chrome.storage.local.get(null);
    }

    async exportStorage() {
        chrome.storage.local.get(null, function (items) { // null implies all items
            // Convert object to a string.
            let result = JSON.stringify(items);
            const bytes = new TextEncoder().encode(result);
            const blob = new Blob([bytes], {
                type: "application/json;charset=utf-8"
            });

            const href = window.URL.createObjectURL(blob);
            const link = document.createElement('a')
            link.href = href
            link.download = 'AzusaPlayerStorage_' + new Date().toISOString().slice(0, 10) + '.json'
            document.body.appendChild(link)
            link.click()
        });
    }
    async importStorageRaw(content) {
        chrome.storage.local.clear(() => {
            chrome.storage.local.set(content, () => {
                this.initFavLists()
            })
        })
    }

    async importStorage() {
        const _self = this
        const upload = document.createElement('input')
        upload.type = "file"
        document.body.appendChild(upload)

        upload.addEventListener("change", handleFiles, false);
        function handleFiles() {
            let fileReader = new FileReader();
            fileReader.onload = function () {
                let parsedJSON = JSON.parse(fileReader.result);
                console.log(parsedJSON);
                // your code to consume the json
                _self.importStorageRaw(parsedJSON);
            }
            fileReader.readAsText(this.files[0]);
        }
        upload.click()
    }
}




