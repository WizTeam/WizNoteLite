import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl } from 'react-intl';
import { withStyles, withTheme } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
//
import LiteText from '../components/LiteText';
import LiteSelect from '../components/LiteSelect';
import NoteViewer from '../pages/NoteViewer';
import Icons from '../config/icons';

const styles = (theme) => ({
  root: {
    width: 840,
    boxSizing: 'border-box',
    display: 'flex',
    position: 'relative',
    padding: `32px !important`,
    backgroundColor: theme.custom.background.about,
  },
  paper: {
    maxWidth: 'unset',
  },
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 12,
    color: theme.custom.color.contentToolIcon,
    userSelect: 'none',
    '&:hover': {
      color: theme.custom.color.contentToolIconHover,
    },
    '& .MuiIconButton-root': {
      padding: 6,
      borderRadius: 0,
    },
  },
  previewBox: {
    flex: 1,
    height: 384,
    display: 'flex',
    flexDirection: 'column',
  },
  viewerBox: {
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box',
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    zIndex: 0,
    backgroundColor: theme.custom.background.previewBackdrop,
    color: theme.custom.color.matchedText,
  },
  exportButton: {
    backgroundColor: theme.custom.background.dialogButtonBlack,
    color: theme.custom.color.dialogButtonBlack,
    borderRadius: 0,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: theme.custom.background.dialogButtonBlackHover,
    },
    '&.Mui-disabled': {
      color: theme.custom.color.dialogButtonBlack,
      opacity: 0.5,
    },
  },
  list: {
    width: 128,
    height: 'auto',
    display: 'flex',
    paddingLeft: theme.spacing(4),
    flexDirection: 'column',
  },
  grow: {
    flexGrow: 1,
  },
  title: {
    margin: theme.spacing(1, 0),
    fontSize: 14,
    color: theme.custom.color.dialogTextPrimary,
  },
  pc: {
    border: '1px solid #d8d8d8 !important',
    width: 600,
  },
  mobilePlus: {
    border: 'solid 6px #333333',
    borderBottom: 0,
    borderRadius: '40px 40px 0 0',
    overflow: 'hidden',
    width: 450 + 6 * 2,
    margin: 'auto',
  },
  mobile: {
    border: 'solid 6px #333333',
    borderBottom: 0,
    borderRadius: '40px 40px 0 0',
    overflow: 'hidden',
    width: 375 + 6 * 2,
    margin: 'auto',
  },
  darkBorderColor: {
    borderColor: '#d8d8d8',
  },
  lightBorderColor: {
    borderColor: '#333333',
  },
});

const PC_WIDTH = 600;
const MOBILE_PLUS_WIDTH = 450;
const MOBILE_WIDTH = 375;

class ExportPngDialog extends React.Component {
  handler = {
    handleExportPng: () => {
      const { kbGuid, noteGuid } = this.props;
      //
      if (!noteGuid || this.state.loading) {
        return;
      }
      //
      window.onCaptureScreenProgress = (progress) => {
        if (progress === 100) {
          this.setState({ loading: false });
        } else if (progress === -1) {
          this.setState({ loading: false }, this.props.onClose);
        }
      };
      //
      const { widthValue, previewTheme } = this.state;
      const width = widthValue;
      let padding = 16;
      if (widthValue === MOBILE_PLUS_WIDTH) {
        padding = 24;
      } else if (widthValue === PC_WIDTH) {
        padding = 32;
      }
      //
      const options = {
        progressCallback: 'onCaptureScreenProgress',
        theme: previewTheme,
        width,
        padding,
      };
      //
      this.setState({ loading: true });
      //
      window.wizApi.userManager.captureScreen(kbGuid, noteGuid, options);
    },
    handleChangePreviewTheme: async (item, value) => {
      await window.wizApi.userManager.setUserSettings('exportPngTheme', value);
      this.setState({ previewTheme: value });
    },
    handleChangeWidth: async (item, value) => {
      await window.wizApi.userManager.setUserSettings('exportPngWidth', value);
      this.setState({ widthValue: value });
    },
  };

  constructor(props) {
    super(props);
    const um = window.wizApi.userManager;
    this.state = {
      loading: false,
      previewTheme: um.getUserSettingsSync('exportPngTheme', props.theme.palette.type),
      widthValue: um.getUserSettingsSync('exportPngWidth', MOBILE_WIDTH),
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
    window.onCaptureScreenProgress = null;
  }

  render() {
    const {
      loading, previewTheme, widthValue,
    } = this.state;
    const {
      classes, open, onClose,
      kbGuid, noteGuid, intl,
    } = this.props;

    const themeOptions = [
      { value: 'light', title: intl.formatMessage({ id: 'lightOption' }) },
      { value: 'dark', title: intl.formatMessage({ id: 'darkOption' }) },
    ];

    const widthOptions = [
      { value: PC_WIDTH, title: intl.formatMessage({ id: 'pcOption' }) },
      { value: MOBILE_PLUS_WIDTH, title: intl.formatMessage({ id: 'mobilePlusOption' }) },
      { value: MOBILE_WIDTH, title: intl.formatMessage({ id: 'mobileOption' }) },
    ];

    let padding = 16;
    if (widthValue === PC_WIDTH) {
      padding = 32;
    } else if (widthValue === MOBILE_PLUS_WIDTH) {
      padding = 24;
    }

    return (
      <Dialog
        open={open}
        onEscapeKeyDown={onClose}
        classes={{
          paper: classes.paper,
        }}
      >
        <DialogContent className={classes.root}>
          <div className={classes.previewBox}>
            <LiteText className={classes.title} disableUserSelect>
              {intl.formatMessage({ id: 'exportPng' })}
            </LiteText>
            <div className={classNames(
              classes.viewerBox,
              widthValue === PC_WIDTH && classes.pc,
              widthValue === MOBILE_PLUS_WIDTH && classes.mobilePlus,
              widthValue === MOBILE_WIDTH && classes.mobile,
              previewTheme === 'dark' && classes.darkBorderColor,
              previewTheme === 'light' && classes.lightBorderColor,
            )}
            >
              <NoteViewer
                kbGuid={kbGuid}
                noteGuid={noteGuid}
                darkMode={previewTheme === 'dark'}
                params={{
                  padding: `${padding}`,
                }}
              />
              <Backdrop
                className={classNames(
                  classes.backdrop,
                )}
                open={loading}
              >
                <CircularProgress color="inherit" />
              </Backdrop>
            </div>
          </div>
          <div className={classes.list}>
            <LiteText className={classes.title}>
              {intl.formatMessage({ id: 'themeTitle' })}
            </LiteText>
            <LiteSelect
              options={themeOptions}
              value={previewTheme}
              onChange={this.handler.handleChangePreviewTheme}
            />
            <LiteText className={classes.title}>
              {intl.formatMessage({ id: 'widthTitle' })}
            </LiteText>
            <LiteSelect
              options={widthOptions}
              value={widthValue}
              onChange={this.handler.handleChangeWidth}
            />
            <div className={classes.grow} />
            <Button
              disabled={loading}
              className={classes.exportButton}
              onClick={this.handler.handleExportPng}
            >
              {
              loading
                ? intl.formatMessage({ id: 'exportLoading' })
                : intl.formatMessage({ id: 'exportButton' })
              }
            </Button>
          </div>
          <div className={classes.close}>
            <IconButton color="inherit" onClick={onClose}>
              <Icons.ClearIcon />
            </IconButton>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}

ExportPngDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  kbGuid: PropTypes.string.isRequired,
  noteGuid: PropTypes.string,
};

ExportPngDialog.defaultProps = {
  open: false,
  noteGuid: null,
};

export default withTheme(withStyles(styles)(injectIntl(ExportPngDialog)));
