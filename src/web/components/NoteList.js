import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { injectIntl, FormattedMessage } from 'react-intl';
//
import { fade, withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Badge from '@material-ui/core/Badge';
//
import InfiniteScroll from './InfiniteScroller';
import SearchBox from './SearchBox';
// import SyncingIcon from './SyncingIcon';
import LiteText from './LiteText';
import Icons from '../config/icons';
import NoteListItem from './NoteListItem';
import Scrollbar from './Scrollbar';

const styles = (theme) => ({
  container: {
    // height: '100vh',
  },
  root: {
    width: '100%',
    // maxWidth: '36ch',
    // backgroundColor: 'transparent',
    overflowY: 'auto',
    minHeight: '100%',
  },
  root_mac: {
    height: '100%',
  },
  inline: {
    display: 'inline',
  },
  selectedItem: {
    backgroundColor: `${theme.custom.background.noteListActive} !important`,
    '&:after': {
      display: 'none !important',
    },
  },
  selectedItem_green: {
    backgroundColor: `${theme.custom.background.contentGreen} !important`,
  },
  selectedItem_yellow: {
    backgroundColor: `${theme.custom.background.contentYellow} !important`,
  },
  grow: {
    flexGrow: 1,
  },
  search: {
    display: 'flex',
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    // width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      // width: '20ch',
    },
  },
  currentNoteTypeName: {
    color: theme.custom.color.noteTypeButton,
    userSelect: 'none',
    marginLeft: 12,
  },
  overflow: {
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  menuItem: {
    fontSize: 15,
    '& .MuiSvgIcon-root': {
      marginRight: 11,
    },
  },
  selectedIcon: {
    width: 15,
    height: 15,
    fontSize: 15,
    marginRight: theme.spacing(2),
  },
  toolbar: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    minHeight: theme.spacing(4),
    marginBottom: theme.spacing(1),
  },
  toolBarIcon: {
    width: theme.spacing(3),
    height: theme.spacing(3),
    color: theme.custom.color.sidebarIcon,
  },
  activeStarIcon: {
    color: theme.custom.color.activeStarIcon,
  },
  defaultStarIcon: {
    stroke: theme.custom.color.defaultStarIcon,
    color: theme.custom.color.defaultStarIcon,
  },
  toolbarIconButton: {
    margin: theme.spacing(0, 0.5),
  },
  badge: {
    top: 6,
    right: 4,
    height: 6,
    minWidth: 6,
  },
});

class NoteList extends React.Component {
  handler = {
    handleLoadNotes: async (pageIndex, callback) => {
      const { type, tag, kbGuid } = this.props;
      const { notes } = this.state;
      try {
        const options = {
          searchText: this._searchText.trim(),
        };
        if (type === 'tag') {
          options.tags = tag?.key;
        } else if (type === 'starred') {
          options.starred = true;
        } else if (type === 'trash') {
          options.trash = true;
        }
        //
        if (this.state.filter === 'starred') {
          options.starred = true;
        }
        //
        const pageSize = 50;
        const start = this._needResetNotes ? 0 : (pageIndex - 1) * pageSize;
        this._needResetNotes = false;
        //
        const subNotes = await window.wizApi.userManager.queryNotes(
          kbGuid, start, pageSize, options,
        );
        //
        let currentNotes;
        if (start === 0) {
          currentNotes = subNotes;
        } else {
          currentNotes = notes.concat(subNotes);
        }
        const hasMore = subNotes.length === pageSize;
        if (!this._searchText) {
          this.sortNotes(currentNotes);
        }
        this.setState({
          notes: currentNotes,
          hasMore,
        }, () => {
          if (this.props.onChangeNotes) {
            this.props.onChangeNotes(currentNotes, options);
          }
        });
        //
        callback();
      } catch (err) {
        console.error(err);
        callback(err);
      }
    },

    handleOpenMenu: (e) => {
      this.setState({
        anchorEl: e.currentTarget,
      });
    },

    handleStarredFilterToggle: () => {
      const { filter } = this.state;
      this.setState({ filter: filter === 'starred' ? 'notes' : 'starred' }, this.resetNotes);
    },

    handleCloseMenu: () => {
      this.setState({
        anchorEl: null,
      });
    },

    handleCreateMarkdownNote: () => {
      this.handler.handleCloseMenu();
      this.props.onCreateNote('lite/markdown');
    },

    handleCreateOutlineNote: () => {
      this.handler.handleCloseMenu();
      this.props.onCreateNote('lite/outline');
    },

    handleSearchNotes: () => {
      this.setState({
        isShowSearch: true,
      });
    },

    handleSearch: async (searchText) => {
      this._searchText = searchText;
      this.resetNotes({
        resetFilter: true,
      });
    },

    handleClearSearch: () => {
      this._searchText = '';
      this.setState({
        isShowSearch: false,
      });
      this.resetNotes({
        resetFilter: true,
      });
    },

    handleCancelStarNote: (note) => {
      //
      if (!this.accept(note)) {
        this.handler.handleDeleteNotes(this.props.kbGuid, [note.guid]);
      }
    },

    handleDeleteNotes: (kbGuid, noteGuids) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      if (noteGuids.length === 0) {
        return;
      }
      const { notes } = this.state;
      const currentNotes = [].concat(notes);
      noteGuids.forEach((guid) => {
        const index = currentNotes.findIndex((elem) => elem.guid === guid);
        if (index !== -1) {
          currentNotes.splice(index, 1);
        }
      });
      this.setState({
        notes: currentNotes,
      });

      if (noteGuids.indexOf(this.props.selectedNoteGuid) !== -1) {
        this.props.onSelectNote(null);
      }
    },

    handleShowContextMenu: (event, note) => {
      this.contextMenuNote = note;
      event.preventDefault();
      this.setState({
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
      });
    },

    handleFirstOpenSidebar: async () => {
      await window.wizApi.userManager.setUserSettings('isFirstOpenSidebar', false);
      this.setState({
        isFirst: false,
      });
    },

    handleCloseContextMenu: () => {
      this.setState({
        mouseX: null,
        mouseY: null,
      });
    },

    handleDeleteNote: async () => {
      const note = this.contextMenuNote;
      this.contextMenuNote = note;
      this.handler.handleCloseContextMenu();
      if (!note) {
        return;
      }
      //
      try {
        await window.wizApi.userManager.deleteNote(this.props.kbGuid, note.guid, note);
      } catch (err) {
        alert(err.message);
      }
    },

    handlePutBackNote: async () => {
      const note = this.contextMenuNote;
      this.contextMenuNote = note;
      this.handler.handleCloseContextMenu();
      if (!note) {
        return;
      }
      //
      try {
        await window.wizApi.userManager.putBackNote(this.props.kbGuid, note.guid, note);
      } catch (err) {
        alert(err.message);
      }
    },

    handleSyncStart: (kbGuid) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      this.setState({
        // isSyncing: true,
      });
    },

    handleNewNote: (kbGuid, note) => {
      const props = this.props;
      if (kbGuid !== props.kbGuid) {
        return;
      }
      //
      if (!this.accept(note)) {
        props.onSelectNote(note);
        if (this.props.type === 'notes') {
          this.resetNotes({
            resetFilter: true,
          });
        } else {
          props.onRequestChangeType('notes');
        }
        return;
      }
      //
      const { notes } = this.state;
      // eslint-disable-next-line no-param-reassign
      note.animation = 'enter';
      const currentNotes = [note].concat(notes);
      this.sortNotes(currentNotes);
      this.setState({
        notes: currentNotes,
      });
      props.onSelectNote(note);
    },

    handleDownloadNotes: (kbGuid, downloadedNotes) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      if (!downloadedNotes) {
        return;
      }
      if (downloadedNotes.length === 0) {
        return;
      }
      const { notes } = this.state;
      const currentNotes = [].concat(notes);
      for (const note of downloadedNotes) {
        const index = currentNotes.findIndex((elem) => elem.guid === note.guid);
        const exists = index !== -1 && currentNotes[index];
        const accept = this.accept(note);
        if (accept) {
          if (exists) {
            Object.assign(exists, note);
          } else {
            currentNotes.push(note);
          }
        } else {
          // eslint-disable-next-line no-lonely-if
          if (exists) {
            currentNotes.splice(index, 1);
          }
        }
      }
      this.sortNotes(currentNotes);
      this.setState({
        notes: currentNotes,
      });
    },

    handleModifyNote: (kbGuid, note) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      const { notes } = this.state;
      const currentNotes = [].concat(notes);
      const exists = currentNotes.find((elem) => elem.guid === note.guid);
      if (exists) {
        Object.assign(exists, note);
        this.sortNotes(currentNotes);
        this.setState({
          notes: currentNotes,
        });
      }
    },

    handlePutBackNotes: (kbGuid, notesGuid) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      if (this.props.type === 'trash') {
        this.handler.handleDeleteNotes(kbGuid, notesGuid);
      }
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      notes: [],
      isShowSearch: false,
      // isSyncing: false,
      anchorEl: null,
      hasMore: true,
      filter: 'notes',
      category: 'modify',
      mouseX: null,
      mouseY: null,
      isFirst: window.wizApi.userManager.getUserSettingsSync('isFirstOpenSidebar', true),
    };
    this._needResetNotes = true;
    this._searchText = '';
  }

  componentDidMount() {
    this.initEvents();
  }


  componentDidUpdate(prevProps) {
    const { type, tag } = this.props;
    if (type !== prevProps.type
      || (type === 'tag' && tag !== prevProps.tag)) {
      this._searchText = '';
      this.resetNotes({
        resetFilter: true,
      });
    }
  }

  componentWillUnmount() {
    this.removeEvents();
  }

  accept(note) {
    const { type, tag } = this.props;
    const { filter } = this.state;
    if (type === 'notes') {
      if (filter === 'starred') {
        if (!note.starred) {
          return false;
        }
      }
      return !note.trash;
    }
    if (type === 'starred') {
      return note.starred;
    }
    if (type === 'trash') {
      return !!note.trash;
    }
    //
    if (note.trash) {
      return false;
    }
    //
    if (type === 'tag') {
      const tagKey = tag.key;
      if (filter === 'starred') {
        if (!note.starred) {
          return false;
        }
      }
      if (!note.tags) {
        return false;
      }
      return note.tags.indexOf(`#${tagKey}/`) !== -1;
    }
    //
    console.error(`unknown type: ${type}`);
    return false;
  }

  resetNotes(options = {}) {
    setTimeout(() => {
      this._needResetNotes = true;
      const newState = {
        hasMore: true,
      };
      if (options.resetFilter) {
        newState.filter = null;
      }
      this.setState(newState);
    });
  }


  sortNotes(currentNotes) {
    currentNotes.sort(
      (note1, note2) => new Date(note2.modified).valueOf() - new Date(note1.modified).valueOf(),
    );
  }


  initEvents() {
    window.wizApi.userManager.on('syncStart', this.handler.handleSyncStart);
    window.wizApi.userManager.on('newNote', this.handler.handleNewNote);
    window.wizApi.userManager.on('downloadNotes', this.handler.handleDownloadNotes);
    window.wizApi.userManager.on('modifyNote', this.handler.handleModifyNote);
    window.wizApi.userManager.on('uploadNote', this.handler.handleModifyNote);
    window.wizApi.userManager.on('putBackNotes', this.handler.handlePutBackNotes);
    window.wizApi.userManager.on('deleteNotes', this.handler.handleDeleteNotes);
  }

  removeEvents() {
    window.wizApi.userManager.off('syncStart', this.handler.handleSyncStart);
    window.wizApi.userManager.off('newNote', this.handler.handleNewNote);
    window.wizApi.userManager.off('downloadNotes', this.handler.handleDownloadNotes);
    window.wizApi.userManager.off('modifyNote', this.handler.handleModifyNote);
    window.wizApi.userManager.off('uploadNote', this.handler.handleModifyNote);
    window.wizApi.userManager.off('putBackNotes', this.handler.handlePutBackNotes);
    window.wizApi.userManager.off('deleteNotes', this.handler.handleDeleteNotes);
  }

  render() {
    const {
      classes,
      className, onSelectNote, selectedNoteGuid,
      // onSync,
      intl, type, tag,
      backgroundType, kbGuid,
    } = this.props;
    //
    const {
      isShowSearch, notes, hasMore,
      // isSyncing,
      anchorEl,
      filter, category, isFirst,
      mouseX, mouseY,
    } = this.state;
    //
    const isFilterStarred = filter === 'starred';
    const noteTypeMap = {
      notes: intl.formatMessage({ id: 'allNoteTitle' }),
      starred: intl.formatMessage({ id: 'starredNoteTitle' }),
      tag: intl.formatMessage({ id: 'tagNoteTitle' }),
      trash: intl.formatMessage({ id: 'trash' }),
    };
    //
    let currentNoteTypeName = noteTypeMap[type];
    if (type === 'tag') {
      currentNoteTypeName = tag?.title || currentNoteTypeName;
    }
    //
    const isTrash = type === 'trash';
    //
    return (
      <div className={classNames(classes.container, className)}>
        <Toolbar className={classes.toolbar}>
          {isShowSearch && (
            <SearchBox
              onSearch={this.handler.handleSearch}
              onClear={this.handler.handleClearSearch}
            />
          )}
          {!isShowSearch && (
            <>
              <IconButton
                aria-label="toggle sidebar"
                onClick={() => {
                  if (isFirst) {
                    this.handler.handleFirstOpenSidebar();
                  }
                  this.props.onToggleDrawer();
                }}
              >
                <Badge classes={{ badge: classes.badge }} color="secondary" variant="dot" invisible={!isFirst}>
                  <Icons.ToggleSideDrawerIcon className={classes.toolBarIcon} />
                </Badge>
              </IconButton>
              {!!currentNoteTypeName && (
                <LiteText
                  title={currentNoteTypeName}
                  className={classNames(classes.currentNoteTypeName, classes.overflow)}
                >
                  {currentNoteTypeName}
                </LiteText>
              )}
              <div className={classes.grow} />
              <IconButton className={classes.toolbarIconButton} aria-label="toggle starred" color="inherit" onClick={this.handler.handleStarredFilterToggle}>
                {isFilterStarred && (
                  <Icons.ActiveStarIcon
                    className={classNames(classes.toolBarIcon, classes.activeStarIcon)}
                  />
                )}
                {!isFilterStarred && (
                  <Icons.DefaultStarIcon
                    className={classNames(classes.toolBarIcon, classes.defaultStarIcon)}
                  />
                )}
              </IconButton>
              <IconButton className={classes.toolbarIconButton} aria-label="search" color="inherit" onClick={this.handler.handleSearchNotes}>
                <Icons.SearchIcon className={classes.toolBarIcon} />
              </IconButton>
              {/* <IconButton
                className={classes.toolbarIconButton}
                aria-label="sync data" color="inherit"
                onClick={onSync}
                disabled={isSyncing}>
                {isSyncing && <SyncingIcon />}
                {!isSyncing && <Icons.RefreshIcon className={classes.toolBarIcon} />}
              </IconButton> */}
              <IconButton
                className={classes.toolbarIconButton}
                aria-label="create note"
                color="inherit"
                // onClick={this.handler.handleOpenMenu}
                onClick={this.handler.handleCreateMarkdownNote}
                ref={anchorEl}
              >
                <Icons.AddIcon className={classes.toolBarIcon} />
              </IconButton>
            </>
          )}
        </Toolbar>
        <InfiniteScroll
          pageStart={0}
          style={{
            height: 'calc(100% - 48px)',
          }}
          loadMore={this.handler.handleLoadNotes}
          hasMore={hasMore}
          // loader={<div className="loader" key={0}>Loading ...</div>}
          useWindow={false}
        >
          <Scrollbar>
            <List
              className={classNames(classes.root)}
              disablePadding
            >
              {notes.map((note) => (
                <NoteListItem
                  key={note.guid}
                  kbGuid={kbGuid}
                  note={note}
                  backgroundType={backgroundType}
                  selected={selectedNoteGuid === note.guid}
                  dateType={category}
                  animation={note.animation}
                  onSelectNote={onSelectNote}
                  onShowContextMenu={this.handler.handleShowContextMenu}
                  onCancelStarNote={this.handler.handleCancelStarNote}
                />
              ))}
            </List>
          </Scrollbar>
        </InfiniteScroll>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handler.handleCloseMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          getContentAnchorEl={null}
        >
          <MenuItem
            className={classes.menuItem}
            onClick={this.handler.handleCreateMarkdownNote}
          >
            <Icons.MarkdownIcon />
            {intl.formatMessage({ id: 'menuNewMarkdownNote' })}
          </MenuItem>
          <MenuItem
            className={classes.menuItem}
            onClick={this.handler.handleCreateOutlineNote}
          >
            <Icons.OutlineIcon />
            {intl.formatMessage({ id: 'menuNewOutlineNote' })}
          </MenuItem>
        </Menu>

        <Menu
          keepMounted
          open={mouseY !== null}
          onClose={this.handler.handleCloseContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            mouseY !== null && mouseX !== null
              ? { top: mouseY, left: mouseX }
              : undefined
          }
        >
          <MenuItem onClick={this.handler.handleDeleteNote}><FormattedMessage id="menuDelete" /></MenuItem>
          {isTrash && <MenuItem onClick={this.handler.handlePutBackNote}><FormattedMessage id="menuPushBack" /></MenuItem>}
        </Menu>
      </div>
    );
  }
}

NoteList.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  backgroundType: PropTypes.string,
  onSelectNote: PropTypes.func.isRequired,
  onRequestChangeType: PropTypes.func.isRequired,
  selectedNoteGuid: PropTypes.string,
  onCreateNote: PropTypes.func,
  // onSync: PropTypes.func,
  onChangeNotes: PropTypes.func,
  onToggleDrawer: PropTypes.func.isRequired,
  kbGuid: PropTypes.string,
  type: PropTypes.string.isRequired,
  tag: PropTypes.object,
  intl: PropTypes.object.isRequired,
};

NoteList.defaultProps = {
  className: null,
  backgroundType: 'white',
  selectedNoteGuid: '',
  onCreateNote: null,
  // onSync: null,
  onChangeNotes: null,
  kbGuid: null,
  tag: null,
};


export default withStyles(styles)(injectIntl(NoteList));
