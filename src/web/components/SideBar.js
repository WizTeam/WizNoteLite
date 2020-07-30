import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Drawer from '@material-ui/core/Drawer';
// import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
//

import Scrollbar from './Scrollbar';
import CommonHeader from './CommonHeader';
// import LiteText from './LiteText';
import Tags from './Tags';
import Icons from '../config/icons';

const SIDEBAR_WIDTH = '15%';
const SIDEBAR_MIN_WIDTH = 192;
const SIDEBAR_MAX_WIDTH = 320;

const styles = (theme) => ({
  drawer: {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    overflow: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
      delay: 0,
    }),
  },
  drawerPaper: {
    width: '100%',
    height: '100vh',
    position: 'initial',
    background: theme.custom.background.sideDrawer,
  },
  drawerTitle: {
    width: '100%',
    height: 64,
    lineHeight: '64px',
    paddingLeft: theme.spacing(2),
    boxSizing: 'border-box',
    color: theme.custom.color.drawerTitle,
    fontSize: 14,
    userSelect: 'none',
  },
  header: {
    marginBottom: theme.spacing(1),
  },
  listItem: {
    color: theme.custom.color.drawerText,
    '&:hover': {
      'background-color': theme.custom.background.sidebarItemHover,
    },
    maxHeight: 32,
  },
  itemPrimary: {
    fontSize: 14,
    paddingLeft: theme.spacing(2),
    whiteSpace: 'nowrap',
  },
  drawerContainer: {
    overflow: 'auto',
    width: '100%',
  },
  inheritColor: {
    color: 'inherit',
  },
  itemSelected: {
    'background-color': `${theme.custom.background.sidebarItemHover} !important`,
    '&:hover': {
      'background-color': theme.custom.background.sidebarItemHover,
    },
  },
  sidebarFooter: {
    display: 'flex',
    padding: theme.spacing(0, 1),
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  updateButton: {
    color: theme.custom.color.drawerTitle,
    '&:hover': {
      'background-color': theme.custom.background.sidebarItemHover,
    },
  },
  settingButton: {
    color: theme.custom.color.drawerTitle,
    '&:hover': {
      'background-color': theme.custom.background.sidebarItemHover,
    },
  },
  overflow: {
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  buttonText: {
    marginLeft: theme.spacing(1),
  },
  avatar: {
    width: 24,
    height: 24,
    fontSize: 14,
  },
  tooltipPopper: {
    left: '40px !important',
  },
  tooltip: {
    backgroundColor: '#fff',
    color: '#333333',
  },
  tooltipArrow: {
    color: '#fff',
    left: '0px !important',
    bottom: '5px !important',
    marginLeft: '0 !important',
    marginBottom: '-1em !important',
    width: '1.41em',
    height: '1em',
    '&::before': {
      transform: 'rotate(-45deg)',
      transformOrigin: '0 100% !important',
    },
  },
  menuItem: {
    fontSize: 14,
  },
  grow: {
    flex: 1,
  },
});

class SideBar extends React.Component {
  handler = {
    handleTagsChanged: async (kbGuid) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      //
      this.resetAllTags();
    },
    handleTagRenamed: async (kbGuid, noteGuid, from, to) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      //
      console.log(from);
      console.log(to);
      this.resetAllTags();
    },
    handleOpenMenu: (e) => {
      this.setState({
        anchorEl: e.currentTarget,
      });
    },
    handleCloseMenu: () => {
      this.setState({
        anchorEl: null,
      });
    },

    handleSync: () => {
      const { syncLoading, syncSuccess } = this.state;
      if (syncLoading || syncSuccess) return;
      window.wizApi.userManager.syncKb(this.props.kbGuid, {
        noWait: true,
      });
    },

    handleLogout: () => {
      this.handler.handleCloseMenu();
      window.wizApi.userManager.logout();
    },

    handleSyncStart: (kbGuid) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      //
      this.setState({ syncLoading: true });
    },

    handleSyncFinish: (kbGuid, result) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      //
      this.setState({
        syncLoading: false,
        syncSuccess: !result.error,
      }, this.delayClose);
    },

    handleWindowResize: () => {
      if (!this._drawerRef) {
        return;
      }
      //
      const sideBarWidth = this.calWidth();
      this._drawerRef.style.width = `${sideBarWidth}px`;
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      tags: {},
      showTrash: false,
      anchorEl: null,
      syncLoading: false,
      syncSuccess: false,
    };
  }

  componentDidMount() {
    this.initEvents();
    this.resetAllTags();
    this.resetTrashItem();
    window.wizApi.userManager.on('tagsChanged', this.handler.handleTagsChanged);
    window.wizApi.userManager.on('tagRenamed', this.handler.handleTagRenamed);
    window.wizApi.userManager.on('syncStart', this.handler.handleSyncStart);
    window.wizApi.userManager.on('syncFinish', this.handler.handleSyncFinish);
    window.addEventListener('resize', this.handler.handleWindowResize);
  }

  componentWillUnmount() {
    window.wizApi.userManager.off('tagsChanged', this.handler.handleTagsChanged);
    window.wizApi.userManager.off('tagRenamed', this.handler.handleTagRenamed);
    window.wizApi.userManager.off('syncStart', this.handler.handleSyncStart);
    window.wizApi.userManager.off('syncFinish', this.handler.handleSyncFinish);
    window.removeEventListener('resize', this.handler.handleWindowResize);
  }

  async resetAllTags() {
    const tags = await window.wizApi.userManager.getAllTags(this.props.kbGuid);
    this.setState({ tags });
  }

  async resetTrashItem() {
    const hasNotesInTrash = await window.wizApi.userManager.hasNotesInTrash(this.props.kbGuid);
    this.setState({
      showTrash: hasNotesInTrash,
    });
  }

  calWidth() {
    if (!this.props.open) {
      return 0;
    }
    //
    let sideBarWidth = Math.floor(window.innerWidth * 0.15);
    if (sideBarWidth > SIDEBAR_MAX_WIDTH) {
      sideBarWidth = SIDEBAR_MAX_WIDTH;
    } else if (sideBarWidth < SIDEBAR_MIN_WIDTH) {
      sideBarWidth = SIDEBAR_MIN_WIDTH;
    }
    return sideBarWidth;
  }

  delayClose() {
    if (this.state.syncSuccess) {
      setTimeout(() => {
        this.setState({ syncSuccess: false }, this.handler.handleCloseMenu);
      }, 1000);
    } else {
      this.handler.handleCloseMenu();
    }
  }

  initEvents() {
    window.wizApi.userManager.on('deleteNotes', () => {
      this.setState({
        showTrash: true,
      });
    });
    window.wizApi.userManager.on('downloadNotes', (kbGuid, downloadedNotes) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      if (!downloadedNotes) {
        return;
      }
      if (downloadedNotes.length === 0) {
        return;
      }
      if (this.state.showTrash) {
        return;
      }
      for (const note of downloadedNotes) {
        if (note.trash) {
          this.setState({
            showTrash: true,
          });
          return;
        }
      }
    });
  }

  //
  render() {
    const {
      classes, onChangeType, type, open, onTagSelected,
      intl, user, selectedTag, onClickLogin,
      // onClickSetting,
    } = this.props;
    const {
      tags, showTrash, anchorEl,
      syncLoading,
      syncSuccess,
    } = this.state;
    //
    const sideBarWidth = this.calWidth();
    const drawerStyle = {
      width: open ? sideBarWidth : 0,
      // 不能直接设置minWidth，否则显示的时候动画有问题
    };
    const isLogin = user && !user.isLocalUser;
    const items = [
      { type: 'notes', text: intl.formatMessage({ id: 'allNoteTitle' }) },
      { type: 'starred', text: intl.formatMessage({ id: 'starredNoteTitle' }) },
    ];

    if (showTrash) {
      items.push(
        { type: 'trash', text: intl.formatMessage({ id: 'trash' }) },
      );
    }

    return (
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
        style={drawerStyle}
        ref={(node) => { this._drawerRef = node; }}
      >
        <CommonHeader
          showLogo
          showUserType
          liteLogo
          className={classes.header}
          onUpgradeVip={this.props.onUpgradeVip}
        />
        <List disablePadding>
          {items.map((item) => (
            <ListItem
              button
              key={item.type}
              onClick={() => onChangeType(item.type)}
              selected={item.type === type}
              classes={{
                selected: classes.itemSelected,
              }}
              className={classes.listItem}
            >
              <ListItemText
                className={classes.inheritColor}
                primary={item.text}
                classes={{
                  primary: classes.itemPrimary,
                }}
              />
            </ListItem>
          ))}
        </List>
        <Scrollbar themeType="dark">
          <Tags
            data={tags}
            onSelected={onTagSelected}
            selectedTag={type === 'tag' ? selectedTag : null}
          />
        </Scrollbar>
        <div className={classes.sidebarFooter}>
          {!isLogin && (
            <Tooltip
              title={intl.formatMessage({ id: 'loginTooltip' })}
              arrow
              disableFocusListener
              classes={{
                popper: classes.tooltipPopper,
                tooltip: classes.tooltip,
                arrow: classes.tooltipArrow,
              }}
            >
              <Button disableFocusRipple className={classes.updateButton} onClick={onClickLogin}>
                <Avatar className={classes.avatar} />
                <span className={classNames(classes.overflow, classes.buttonText)}>
                  {intl.formatMessage({ id: 'buttonLogin' })}
                </span>
              </Button>
            </Tooltip>
          )}
          {isLogin && (
            <>
              <Button className={classes.updateButton} onClick={this.handler.handleOpenMenu}>
                <Avatar className={classes.avatar}>
                  {user.displayName.slice(0, 1)}
                </Avatar>
                <span className={classNames(classes.overflow, classes.buttonText)}>
                  {user.displayName}
                </span>
              </Button>
              {/* 暂时隐藏 设置入口 */}
              {/* <IconButton className={classes.settingButton} onClick={onClickSetting}>
                <Icons.SettingIcon />
              </IconButton> */}
            </>
          )}
        </div>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handler.handleCloseMenu}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          getContentAnchorEl={null}
        >
          <MenuItem
            className={classes.menuItem}
            onClick={this.handler.handleSync}
          >
            {intl.formatMessage({ id: 'buttonSync' })}
            <div className={classes.grow} />
            {syncLoading && <CircularProgress size={16} color="inherit" />}
            {syncSuccess && <Icons.SelectedIcon style={{ maxHeight: 21 }} />}
          </MenuItem>
          <MenuItem
            className={classes.menuItem}
            onClick={this.handler.handleLogout}
          >
            {intl.formatMessage({ id: 'buttonLogout' })}
          </MenuItem>
        </Menu>
      </Drawer>
    );
  }
}


SideBar.propTypes = {
  classes: PropTypes.object.isRequired,
  onChangeType: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  kbGuid: PropTypes.string.isRequired,
  onTagSelected: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  selectedTag: PropTypes.object,
  open: PropTypes.bool,
  onClickLogin: PropTypes.func.isRequired,
  onUpgradeVip: PropTypes.func.isRequired,
  // onClickSetting: PropTypes.func.isRequired,
};

SideBar.defaultProps = {
  open: false,
  selectedTag: null,
};


export default withStyles(styles)(injectIntl(SideBar));
