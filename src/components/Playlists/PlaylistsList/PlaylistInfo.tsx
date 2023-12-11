import React from 'react';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AlbumOutlinedIcon from '@mui/icons-material/AlbumOutlined';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import { contextMenu } from 'react-contexify';

import useApp from '@stores/useApp';
import AddToPlaylistButton from './ButtonAddToPlaylist';
import DeletePlaylistButton from './ButtonDeletePlaylist';
import PlayPlaylistButton from './ButtonPlayPlaylist';
import CreateAsPlaylistButton from './ButtonCreateAsPlaylist';

interface Props {
  playlist: NoxMedia.Playlist;
  key2: string;
  setSelectedList: (playlist: NoxMedia.Playlist) => void;
  handleAddToFavClick: (playlist: NoxMedia.Playlist) => void;
  onPlayAllFromFav: (playlist: NoxMedia.Playlist) => void;
  handleDeleteFavClick: (playlist: NoxMedia.Playlist) => void;
  handleCreateAsFavClick: (playlist: NoxMedia.Song[]) => void;
}

export function PlaylistInfo({
  playlist,
  key2,
  setSelectedList,
  handleAddToFavClick,
  onPlayAllFromFav,
  handleDeleteFavClick,
}: Props) {
  const { CRUDBtn, CRUDIcon, DiskIcon, outerLayerBtn } = useApp(
    (state) => state.playerStyle,
  );
  return (
    <React.Fragment key={key2}>
      <ListItemButton
        disableRipple
        sx={outerLayerBtn}
        onContextMenu={(event) => {
          event.preventDefault();
          contextMenu.show({
            id: 'favlistmenu',
            event,
            props: {
              favlist: playlist,
            },
          });
        }}
      >
        <ListItemButton
          style={{ maxWidth: 'calc(100% - 84px)' }}
          onClick={() => setSelectedList(playlist)}
          id={playlist.id}
        >
          <ListItemIcon sx={DiskIcon}>
            <AlbumOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{ fontSize: '1.1em' }}
            primary={playlist.title}
          />
        </ListItemButton>
        <Box component='div' sx={CRUDBtn}>
          <PlayPlaylistButton
            sx={CRUDIcon}
            playlist={playlist}
            onPlayAllFromFav={onPlayAllFromFav}
          />
          <AddToPlaylistButton
            sx={CRUDIcon}
            playlist={playlist}
            handleAddToFavClick={handleAddToFavClick}
          />
          <DeletePlaylistButton
            sx={CRUDIcon}
            playlist={playlist}
            handleDeleteFavClick={handleDeleteFavClick}
          />
        </Box>
      </ListItemButton>
    </React.Fragment>
  );
}

export function SearchlistEntry({
  playlist,
  setSelectedList,
  handleAddToFavClick,
  onPlayAllFromFav,
  handleCreateAsFavClick,
}: Props) {
  const { CRUDBtn, CRUDIcon, DiskIcon, outerLayerBtn } = useApp(
    (state) => state.playerStyle,
  );
  return (
    <React.Fragment key={playlist.id}>
      <ListItemButton disableRipple sx={outerLayerBtn}>
        <ListItemButton
          style={{ maxWidth: 'calc(100% - 84px)' }}
          onClick={() => setSelectedList(playlist)}
          id={playlist.id}
        >
          <ListItemIcon sx={DiskIcon}>
            <ManageSearchIcon />
          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{ fontSize: '1.1em' }}
            primary={playlist.title}
          />
        </ListItemButton>
        <Box component='div' sx={CRUDBtn}>
          <PlayPlaylistButton
            sx={CRUDIcon}
            playlist={playlist}
            onPlayAllFromFav={onPlayAllFromFav}
          />
          <AddToPlaylistButton
            sx={CRUDIcon}
            playlist={playlist}
            handleAddToFavClick={handleAddToFavClick}
          />
          <CreateAsPlaylistButton
            sx={CRUDIcon}
            playlist={playlist}
            handleCreateAsFavClick={handleCreateAsFavClick}
          />
        </Box>
      </ListItemButton>
    </React.Fragment>
  );
}
