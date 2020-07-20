import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
//
import LiteText from '../components/LiteText';
import Icons from '../config/icons';

const styles = (theme) => ({
  root: {
    width: 352,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    padding: theme.spacing(4),
    backgroundColor: theme.custom.background.about,
  },
  logo: {
    width: 72,
    height: 72,
  },
  name: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: theme.spacing(2),
    color: theme.custom.color.logoName,
    fontWeight: 600,
  },
  button: {
    color: theme.custom.color.forgetPasswordButton,
    padding: '0 2px',
    textDecoration: 'none',
    fontSize: 14,
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
  version: {
    fontSize: 14,
    color: theme.custom.color.dialogText,
    textAlign: 'center',
    marginTop: theme.spacing(4),
  },
  vditor: {
    marginTop: theme.spacing(6),
  },
  license: {
    marginTop: theme.spacing(2),
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
  hr: {
    width: '100%',
    minHeight: 1,
    height: 1,
    marginTop: theme.spacing(6),
    backgroundColor: theme.custom.color.hr,
    position: 'relative',
    '& .MuiSvgIcon-root': {
      position: 'absolute',
      left: '50%',
      top: 0,
      backgroundColor: theme.custom.background.about,
      padding: '0 3px',
      transform: 'translate(-50%, -55%)',
      color: theme.custom.color.windowBarTool,
    },
  },
  buttonBox: {
    display: 'flex',
    width: '100%',
    padding: theme.spacing(0, 2),
    marginTop: theme.spacing(4),
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    '& .MuiButton-root': {
      backgroundColor: theme.custom.background.platformButton,
      color: theme.custom.color.platformButton,
      borderRadius: 0,
      padding: '6px 12px',
      '&:hover': {
        backgroundColor: theme.custom.background.platformButtonHover,
      },
    },
    '& .MuiSvgIcon-root': {
      marginRight: 17,
    },
  },
});

class AboutDialog extends React.Component {
  handler = {
    handleGotoVditor: () => {
      window.open('https://github.com/Vanessa219/vditor');
    },
    handleGotoGithub: () => {
      window.open('https://github.com/WizTeam/WizNoteLite');
    },
    handleGotoDocker: () => {
      window.open('https://hub.docker.com/r/wiznote/wizserver');
    },
  };

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const {
      classes, open, onClose,
    } = this.props;

    const version = window.wizApi.version;
    const releaseNotesLink = 'https://wiz.cn/pages/go?blogName=lite-release-notes';

    return (
      <Dialog
        open={open}
        onEscapeKeyDown={onClose}
      >
        <DialogContent className={classes.root}>
          <Icons.LiteLogoIcon className={classes.logo} />
          <LiteText disableUserSelect className={classes.name}>WizNote Lite</LiteText>
          <div
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: `Version ${version}&nbsp;&nbsp;(<a class="${classes.button}" target="_blank" href="${releaseNotesLink}">release notes</a>)`,
            }}
            className={classes.version}
          />
          <div className={classes.buttonBox}>
            <Button onClick={this.handler.handleGotoGithub}>
              <Icons.GithubIcon />
              GitHub
            </Button>
            <Button onClick={this.handler.handleGotoDocker}>
              <Icons.DockerIcon />
              Docker
            </Button>
          </div>
          <div className={classes.hr}>
            <Icons.HeartIcon />
          </div>
          <Button
            disableRipple
            className={classNames(classes.button, classes.vditor)}
            onClick={this.handler.handleGotoVditor}
          >
            Vditor.js
          </Button>
          {/* 暂时屏蔽 */}
          {/* <Button
            disableRipple
            className={classNames(classes.button, classes.license)}
          >
            License and Open Source Notices
          </Button> */}
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

AboutDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

AboutDialog.defaultProps = {
  open: false,
};

export default withStyles(styles)(injectIntl(AboutDialog));
