import React from 'react';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

import { useNoxSetting } from '@APM/stores/useApp';
import useFavList from '@hooks/useFavList';
import { skinPreset } from '@styles/skin';
import Search from './Search';
import Menu from '../menus/Favlistmenu';
import Fav from '../Fav/Fav';
import FavListHeader from './FavListHeader/FavListHeader';
import PlaylistList from './FavListEntry/PlaylistList';

const { colorTheme } = skinPreset;

export function FavList() {
  const _ = useNoxSetting((state) => state.playlistShouldReRender);
  const {
    selectedList,
    setSearchInputVal,

    handleDeleteFromSearchList,
    handleAddToFavClick,
    updateSubscribeFavList,
  } = useFavList();

  return (
    <React.Fragment>
      <Menu theme={colorTheme.generalTheme} />
      <Search setSearchInputVal={setSearchInputVal} />
      <br />
      <Box // Mid Grid -- SideBar
        style={{
          overflow: 'hidden',
          marginTop: '18px',
          maxHeight: 'calc(100vh - 208px)',
          backgroundColor: colorTheme.FavListBackgroundColor,
        }}
        sx={{ gridArea: 'sidebar' }}
      >
        <FavListHeader
          sx={AddFavIcon}
          color={colorTheme.myPlayListCaptionColor}
        />
        <Divider light />
        <PlaylistList />
      </Box>
      <Box // Mid Grid -- Fav Detail
        style={{
          maxHeight: '100%',
          paddingTop: '20px',
          paddingLeft: '20px',
          overflow: 'auto',
        }}
        sx={{ gridArea: 'Lrc', padding: '0.2em' }}
      >
        <Fav
          handleDeleteFromSearchList={handleDeleteFromSearchList}
          handleAddToFavClick={handleAddToFavClick}
          // TODO: fix
          // @ts-ignore
          rssUpdate={(subscribeUrls: string[]) =>
            updateSubscribeFavList({
              playlist: selectedList,
              subscribeUrls,
            })
          }
        />
      </Box>
    </React.Fragment>
  );
}

export const outerLayerBtn = { padding: 'unset' };

export const CRUDBtn = {
  ':hover': {
    cursor: 'default',
  },
  paddingLeft: '8px',
  paddingRight: '8px',
};

const AddFavIcon = {
  ':hover': {
    cursor: 'pointer',
  },
  width: '1em',
  color: colorTheme.playListIconColor,
};

export const DiskIcon = {
  minWidth: '36px',
};
