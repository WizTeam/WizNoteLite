import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
//
import LiteText from './LiteText';
import LiteSelect from './LiteSelect';
import Icons from '../config/icons';

const styles = (theme) => ({
  root: {
    width: 352,
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
    height: 480 - 64,
    display: 'flex',
    flexDirection: 'column',
  },
  exportButton: {
    width: 128,
    marginLeft: 'auto',
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
  grow: {
    flexGrow: 1,
  },
  title: {
    marginBottom: theme.spacing(1),
    fontSize: 14,
    color: theme.custom.color.dialogTextPrimary,
  },
  headTitle: {
    margin: theme.spacing(0, 0, 5, 0),
  },
  select: {
    marginBottom: theme.spacing(3),
  },
});

class ExportPdfDialog extends React.Component {
  handler = {
    handleExportPdf: () => {
      const { kbGuid, noteGuid } = this.props;
      //
      if (!noteGuid || this.state.loading) {
        return;
      }
      //
      window.onPrintToPDFProgress = (progress) => {
        if (progress === 100) {
          this.setState({ loading: false });
        } else if (progress === -1) {
          this.setState({ loading: false }, this.props.onClose);
        }
      };
      //
      const { directionValue, paperSizeValue } = this.state;
      const options = {
        progressCallback: 'onPrintToPDFProgress',
        landscape: directionValue === 'landscape',
        pageSize: paperSizeValue,
      };
      //
      this.setState({ loading: true });
      //
      window.wizApi.userManager.printToPDF(kbGuid, noteGuid, options);
    },
    handleChangeDirection: async (item, value) => {
      await window.wizApi.userManager.setUserSettings('exportPdfDirection', value);
      this.setState({ directionValue: value });
    },
    handleChangePaperSize: async (item, value) => {
      await window.wizApi.userManager.setUserSettings('exportPdfPaperSize', value);
      this.setState({ paperSizeValue: value });
    },
  };

  constructor(props) {
    super(props);
    const um = window.wizApi.userManager;
    this.state = {
      loading: false,
      directionValue: um.getUserSettingsSync('exportPdfDirection', 'portrait'),
      paperSizeValue: um.getUserSettingsSync('exportPdfPaperSize', 'A4'),
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
    window.onPrintToPDFProgress = null;
  }

  render() {
    const {
      loading, directionValue, paperSizeValue,
    } = this.state;
    const {
      classes, open, onClose,
      intl,
    } = this.props;

    const directionOptions = [
      { value: 'portrait', title: intl.formatMessage({ id: 'portraitOption' }) },
      { value: 'landscape', title: intl.formatMessage({ id: 'landscapeOption' }) },
    ];

    const paperOptions = [
      { value: 'A4', title: 'A4' },
      // { value: 'B5', title: 'B5' },
      { value: 'A3', title: 'A3' },
      { value: 'A5', title: 'A5' },
      // { value: 'B4', title: 'B4' },
      // { value: 'B6', title: 'B6' },
      { value: 'Letter', title: 'Letter' },
      { value: 'Legal', title: 'Legal' },
      { value: 'Tabloid', title: 'Tabloid' },
    ];

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
            <LiteText className={classNames(classes.title, classes.headTitle)} disableUserSelect>
              <FormattedMessage id="exportPdf" />
            </LiteText>
            <LiteText className={classes.title}>
              <FormattedMessage id="directionTitle" />
            </LiteText>
            <LiteSelect
              className={classes.select}
              options={directionOptions}
              value={directionValue}
              onChange={this.handler.handleChangeDirection}
            />
            <LiteText className={classes.title}>
              <FormattedMessage id="paperSizeTitle" />
            </LiteText>
            <LiteSelect
              className={classes.select}
              options={paperOptions}
              value={paperSizeValue}
              onChange={this.handler.handleChangePaperSize}
            />
            <div className={classes.grow} />
            <Button
              disabled={loading}
              className={classes.exportButton}
              onClick={this.handler.handleExportPdf}
            >
              {
              loading
                ? <FormattedMessage id="exportLoading" />
                : <FormattedMessage id="exportPdfButton" />
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

ExportPdfDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  kbGuid: PropTypes.string.isRequired,
  noteGuid: PropTypes.string,
};

ExportPdfDialog.defaultProps = {
  open: false,
  noteGuid: null,
};

export default withStyles(styles)(injectIntl(ExportPdfDialog));
