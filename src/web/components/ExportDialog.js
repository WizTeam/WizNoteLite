import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl } from 'react-intl';
import { withStyles, withTheme } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
//
import LiteText from './LiteText';
import LiteSelect from './LiteSelect';
import NoteViewer from '../pages/NoteViewer';
import Icons from '../config/icons';

const styles = (theme) => ({
  root: {
    width: 600,
    boxSizing: 'border-box',
    display: 'flex',
    position: 'relative',
    padding: theme.spacing(4),
    backgroundColor: theme.custom.background.about,
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
    height: 300,
    display: 'flex',
    flexDirection: 'column',
  },
  viewerBox: {
    width: '100%',
    border: '2px solid #ccc',
    boxSizing: 'border-box',
    flex: 1,
  },
  exportButton: {
    backgroundColor: theme.custom.background.loginButton,
    color: theme.custom.color.loginButton,
    borderRadius: 0,
    '&:hover': {
      backgroundColor: theme.custom.background.loginButtonHover,
    },
  },
  list: {
    width: 150,
    height: 300,
    display: 'flex',
    paddingLeft: theme.spacing(4),
    flexDirection: 'column',
  },
  grow: {
    flexGrow: 1,
  },
  title: {
    margin: theme.spacing(1, 0),
  },
});

class ExportDialog extends React.Component {
  handler = {
    handleExportPng: () => {
      const { kbGuid, noteGuid } = this.props;
      if (!noteGuid || this.state.loading) {
        return;
      }
      //
      window.onCaptureScreenProgress = (progress) => {
        console.log(progress);
        if (progress === 100) {
          this.setState({ loading: false });
        }
      };
      const options = {
        progressCallback: 'onCaptureScreenProgress',
      };
      //
      this.setState({ loading: true });
      //
      window.wizApi.userManager.captureScreen(kbGuid, noteGuid, options);
    },
    handleChangePreviewTheme: (item, value) => {
      this.setState({ previewTheme: value });
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      previewTheme: null,
    };
  }

  componentDidMount() {
    const { theme } = this.props;
    this.setState({ previewTheme: theme.palette.type });
  }

  componentWillUnmount() {
  }

  render() {
    const {
      loading, previewTheme,
    } = this.state;
    const {
      classes, open, onClose,
      exportType, kbGuid, noteGuid,
    } = this.props;

    const themeOptions = [
      { value: 'light', title: 'light' },
      { value: 'dark', title: 'dark' },
    ];

    const widthOptions = [
      { value: 'pc', title: 'Pc' },
      { value: 'mobilePlus', title: 'Mobile plus' },
      { value: 'mobile', title: 'Mobile' },
    ];

    return (
      <Dialog
        open={open}
        onEscapeKeyDown={onClose}
      >
        <DialogContent className={classes.root}>
          {exportType && exportType === 'png' && (
            <>
              <div className={classes.previewBox}>
                <LiteText className={classes.title}>Export png</LiteText>
                <div className={classes.viewerBox}>
                  <NoteViewer
                    kbGuid={kbGuid}
                    noteGuid={noteGuid}
                    darkMode={previewTheme === 'dark'}
                    params={{
                      kbGuid,
                      noteGuid,
                    }}
                  />
                </div>
              </div>
              <div className={classes.list}>
                <LiteText className={classes.title}>theme</LiteText>
                <LiteSelect
                  options={themeOptions}
                  value={previewTheme}
                  onChange={this.handler.handleChangePreviewTheme}
                />
                <LiteText className={classes.title}>width</LiteText>
                <LiteSelect options={widthOptions} />
                <div className={classes.grow} />
                <Button
                  disabled={loading}
                  className={classes.exportButton}
                  onClick={this.handler.handleExportPng}
                >
                  { loading ? 'loading...' : 'export'}
                </Button>
              </div>
            </>
          )}
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

ExportDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  kbGuid: PropTypes.string.isRequired,
  noteGuid: PropTypes.string,
  exportType: PropTypes.string,
};

ExportDialog.defaultProps = {
  open: false,
  noteGuid: null,
  exportType: null,
};

export default withTheme(withStyles(styles)(injectIntl(ExportDialog)));
