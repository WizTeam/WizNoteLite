import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles, withTheme } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import CommonHeader from './CommonHeader';
import NoteEditor from './NoteEditor';
import Icons from '../config/icons';
// import FocusBtn from './FocusBtn';
import SyncBtn from './SyncBtn';
import Scrollbar from './Scrollbar';

const styles = (theme) => ({
  main: {
    backgroundColor: theme.custom.background.content,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    // overflowX: 'hidden',
  },
  main_green: {
    backgroundColor: theme.custom.background.contentGreen,
  },
  main_yellow: {
    backgroundColor: theme.custom.background.contentYellow,
  },
  header: {
    top: 0,
    height: 24,
    width: '100%',
    zIndex: 100,
    background: 'transparent',
  },
  header_mac: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    position: 'relative',
    // padding: theme.spacing(3),
  },
  toolBar: {
    display: 'flex',
    position: 'absolute',
    right: theme.spacing(3),
    top: theme.spacing(4),
    bottom: theme.spacing(3),
    flexDirection: 'column',
    zIndex: 10,
    pointerEvents: 'none',
  },
  iconButton: {
    '&:not(:nth-last-child(1))': {
      marginBottom: theme.spacing(2),
    },
    '&:hover $icon': {
      color: theme.custom.color.contentToolIconHover,
    },
    pointerEvents: 'all',
  },
  emptyBlock: {
    flex: 1,
  },
  icon: {
    width: theme.spacing(3),
    height: theme.spacing(3),
    color: theme.custom.color.contentToolIcon,
  },
});

class Content extends React.Component {
  handler = {
    handleFullScreen: () => {
      this.props.onRequestFullScreen();
    },
    handleResize: () => {
      const isFullScreen = window.wizApi.windowManager.isFullScreen();
      if (isFullScreen !== this.state.isFullScreen) {
        this.setState({ isFullScreen });
      }
    },
    handleCaptureScreen: () => {
      const { kbGuid, note } = this.props;
      if (!note) {
        return;
      }
      //
      window.onCaptureScreenProgress = (progress) => {
        console.log(progress);
      };
      const options = {
        progressCallback: 'onCaptureScreenProgress',
      };
      window.wizApi.userManager.captureScreen(kbGuid, note.guid, options);
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      isFullScreen: false,
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handler.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handler.handleResize);
  }

  render() {
    const {
      note, kbGuid, classes,
      isSearch, theme, backgroundType, onClickTag,
    } = this.props;
    const { isFullScreen } = this.state;
    //
    const isLite = theme.palette.type !== 'dark';
    const backgroundColorClassName = `main_${backgroundType}`;
    const backgroundClass = isLite && (classes[backgroundColorClassName] ?? '');

    const hasFullScreenButton = window.wizApi.isElectron && window.wizApi.windowManager.platform === 'darwin';


    return (
      <main
        className={classNames(classes.main, backgroundClass)}
      >
        <CommonHeader
          systemButton
          className={classNames(classes.header, window.wizApi.platform.isMac && classes.header_mac)}
          onRequestFullScreen={this.props.onRequestFullScreen}
        />
        {note && !isSearch && (
        <div className={classes.toolBar}>
          <IconButton className={classes.iconButton} onClick={this.handler.handleCaptureScreen}>
            <Icons.MoreHorizIcon className={classes.icon} />
          </IconButton>
          <IconButton className={classes.iconButton}>
            <Icons.TableContentIcon className={classes.icon} />
          </IconButton>
          <IconButton className={classes.iconButton}>
            <Icons.LinkIcon className={classes.icon} />
          </IconButton>
          {hasFullScreenButton && (
          <IconButton className={classes.iconButton} onClick={this.handler.handleFullScreen}>
            {isFullScreen && <Icons.QuitFullScreenIcon className={classes.icon} />}
            {!isFullScreen && <Icons.FullScreenIcon className={classes.icon} />}
          </IconButton>
          )}
          <div className={classes.emptyBlock} />
          <SyncBtn
            className={classes.iconButton}
            iconClassName={classes.icon}
            onCreateAccount={this.props.onCreateAccount}
            kbGuid={kbGuid}
            note={note}
          />
          {/* Focus 模式不完善，暂时屏蔽 */}
          {/* <FocusBtn className={classes.iconButton} iconClassName={classes.icon} /> */}
        </div>
        )}
        <div className={classes.content}>
          <Scrollbar>
            <NoteEditor
              note={note}
              kbGuid={kbGuid}
              onClickTag={onClickTag}
            />
          </Scrollbar>
        </div>
      </main>
    );
  }
}

Content.propTypes = {
  theme: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  kbGuid: PropTypes.string.isRequired,
  isSearch: PropTypes.bool.isRequired,
  note: PropTypes.object,
  backgroundType: PropTypes.string,
  onCreateAccount: PropTypes.func.isRequired,
  onClickTag: PropTypes.func.isRequired,
  onRequestFullScreen: PropTypes.func.isRequired,
};

Content.defaultProps = {
  note: null,
  backgroundType: 'white',
};

export default withTheme(withStyles(styles)(Content));
