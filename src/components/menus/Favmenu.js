import React from 'react';
import {
    Menu,
    Item,
    Separator,
    useContextMenu
  } from "react-contexify";
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import LinkIcon from '@mui/icons-material/Link';
import { BiliBiliIconSVG, goToBiliBili, toBiliBili } from '../bilibiliIcon'; 
import TerminalIcon from '@mui/icons-material/Terminal';
import SearchIcon from '@mui/icons-material/Search';
import "react-contexify/dist/ReactContexify.css";
import { getName } from '../../utils/re';

const MENU_ID = "favmenu";

/**
 * right-click context menu for Fav.
 * has menu items:
 * play 
 * copy name to clipboard
 * go to its bilibili page
 * search song w/ the default search engine
 * search song on bilibili
 * @returns 
 */
export default function App({ theme }) {

  // 🔥 you can use this hook from everywhere. All you need is the menu id
  const { show } = useContextMenu({
    id: MENU_ID
  });
  
  function handleItemClick ({ event, props, triggerEvent, data }) {
    console.warn( 'method not implemented', props.song );
  }

  function copyToClipboard ({ props }) {
    navigator.clipboard.writeText(getName(props.song, true));
  }
  
  function copyLinkToClipboard ({ props }) {
    navigator.clipboard.writeText(toBiliBili({ bvid: props.song.bvid, episode: props.song.page }));
  }

  function searchOnWeb ({ props }) {
    chrome.search.query({
        text: getName(props.song, true),
        disposition: "NEW_TAB",
      });
  }

  function searchInFav ({ props }) {
    props.performSearch(getName(props.song, true));
  }

  function searchOnBilibili ( {props} ) {
    window.open(`https://search.bilibili.com/all?keyword=${getName(props.song, true)}&from_source=webtop_search`);
  }

  function displayMenu (e) {
    // put whatever custom logic you need
    // you can even decide to not display the Menu
    show({
      event: e,
    });
  }

  return (
    <div>          
      <Menu id={MENU_ID} animation="slide" theme={theme}>
        <Item onClick={copyToClipboard}>
          <ContentCopyIcon/> &nbsp; {"Copy song name to clipboard"}
        </Item>
        <Item onClick={copyLinkToClipboard}>
          <LinkIcon/> &nbsp; {"Copy song link to clipboard"}
        </Item>
        <Item onClick={ ({ props }) => goToBiliBili({ bvid: props.song.bvid, episode: props.song.page }) }>
          <BiliBiliIconSVG/> &nbsp; {"Go to Bilibili page"}
        </Item>
        <Item onClick={handleItemClick}>
          <RefreshIcon/> &nbsp; {"Reload this song's bvid"}
        </Item>
        <Item onClick={searchInFav}>
          <FindInPageIcon/> &nbsp; {"Search song in this playlist"}
        </Item>
        <Item onClick={searchOnWeb}>
          <SearchIcon/> &nbsp; {"Search song on the web"}
        </Item>
        <Item onClick={searchOnBilibili}>
          <SearchIcon/> &nbsp; {"Search song on Bilibili"}
        </Item>
        <Item onClick={handleItemClick}>
          <TerminalIcon/> &nbsp; {"console.log"}
        </Item>
      </Menu>
    </div>
  );
}

App.defaultProps = {
  theme: "light"
}