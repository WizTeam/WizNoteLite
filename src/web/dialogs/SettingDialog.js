import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl, FormattedMessage } from 'react-intl';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Checkbox from '@material-ui/core/Checkbox';
import Switch from '@material-ui/core/Switch';
//
import LiteInput from '../components/LiteInput';
import LiteText from '../components/LiteText';
import LiteSelect from '../components/LiteSelect';
import Icons from '../config/icons';


const styles = (theme) => ({
  root: {
    width: 768,
    height: 480,
    display: 'flex',
    padding: 0,
    '&:first-child': {
      padding: 0,
    },
  },
  sidebar: {
    width: 160,
    backgroundColor: 'rgb(245, 245, 245)',
    paddingTop: theme.spacing(4),
  },
  selected: {
    backgroundColor: '#fff !important',
  },
  content: {
    flex: 1,
    paddingTop: theme.spacing(5),
    paddingLeft: theme.spacing(8),
    boxSizeing: 'border-box',
    overflow: 'auto',
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
  liteSelect: {
    minWidth: 288,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  checkboxList: {
    display: 'flex',
    alignItems: 'center',
  },
  accountItem: {
    display: 'flex',
    alignItems: 'center',
  },
  itemButton: {
    marginLeft: theme.spacing(2),
    color: '#006eff',
  },
  displayName: {
    maxWidth: 352,
    marginTop: theme.spacing(1),
  },
  accountTitle: {
    marginTop: theme.spacing(3),
    fontSize: 14,
    color: '#aaa',
    '&:first-child': {
      marginTop: 0,
    },
  },
  changePasswordButton: {
    backgroundColor: theme.custom.background.dialogButtonBlack,
    color: theme.custom.color.dialogButtonBlack,
    borderRadius: 0,
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(5),
    '&:hover': {
      backgroundColor: theme.custom.background.dialogButtonBlackHover,
    },
  },
});

class SettingDialog extends React.Component {
  handler = {
    handleSidebarChange: (type) => {
      this.setState({
        type,
      });
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      type: 'account',
    };
  }

  renderAccount() {
    const { classes, user } = this.props;

    if (user === null) return <></>;

    return (
      <div>
        <LiteText className={classes.accountTitle}>
          <FormattedMessage id="settingLabelEmail" />
        </LiteText>
        {user && user.email && (
          <div className={classes.accountItem}>
            <LiteText fullWidth={false}>{user.email}</LiteText>
            <Button className={classes.itemButton}>
              <FormattedMessage id="settingButtonChangeEmail" />
            </Button>
          </div>
        )}
        <LiteText className={classes.accountTitle}>
          <FormattedMessage id="settingLabelNickname" />
        </LiteText>
        <LiteInput className={classes.displayName} value={user.displayName} />
        {user && user.mobile && (
          <>
            <LiteText className={classes.accountTitle}>
              <FormattedMessage id="settingLabelMobile" />
            </LiteText>
            <div className={classes.accountItem}>
              <LiteText fullWidth={false}>{user.mobile}</LiteText>
              <Button className={classes.itemButton}>
                <FormattedMessage id="settingButtonRemoveMobile" />
              </Button>
            </div>
          </>
        )}
        {user && user.wechat && (
          <>
            <LiteText className={classes.accountTitle}>
              <FormattedMessage id="settingLabelWechat" />
            </LiteText>
            <div className={classes.accountItem}>
              <LiteText fullWidth={false}>{user.wechat}</LiteText>
              <Button className={classes.itemButton}>
                <FormattedMessage id="settingButtonUnbindWechat" />
              </Button>
            </div>
          </>
        )}
        <Button className={classes.changePasswordButton}>
          <FormattedMessage id="settingButtonChangePassword" />
        </Button>
      </div>
    );
  }

  renderTheme() {
    const { classes } = this.props;
    //
    const themeOptions = [
      { title: 'default', value: '' },
      { title: 'theme1', value: '1' },
      { title: 'theme2', value: '2' },
    ];

    return (
      <div>
        <div>
          <LiteText>light mode</LiteText>
          <LiteSelect
            // className={classes.liteSelect}
            options={themeOptions}
          />
        </div>
      </div>
    );
  }

  renderEdit() {
    const { classes } = this.props;
    //
    const fontFamilyOptions = [
      { title: 'source hen CN', value: '' },
    ];
    const fontSizeOptions = [
      { title: '16px', value: '16' },
    ];
    const lineHeightOptions = [
      { title: '1.8', value: '1.8' },
    ];
    const paragraphOptions = [
      { title: '46', value: '46' },
    ];

    return (
      <div>
        <LiteText disableUserSelect>font family</LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={fontFamilyOptions}
        />
        <LiteText disableUserSelect>font size</LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={fontSizeOptions}
        />
        <LiteText disableUserSelect>line height</LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={lineHeightOptions}
        />
        <LiteText disableUserSelect>paragraph</LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={paragraphOptions}
        />
        <LiteText disableUserSelect>edit mode</LiteText>
        <div className={classes.checkboxList}>
          <LiteText disableUserSelect fullWidth={false}>open focus mode</LiteText>
          <Switch />
        </div>
      </div>
    );
  }

  renderCommon() {
    const { classes } = this.props;
    //
    const showOptions = [
      {
        title: 'Note list and note',
        value: '',
      },
      {
        title: 'Note list',
        value: '1',
      },
    ];
    const sortOptions = [
      { title: 'created', value: '' },
    ];
    const countdownOptions = [
      { title: '25 min', value: '25' },
    ];

    return (
      <div>
        <LiteText disableUserSelect>show at starup</LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={showOptions}
        />
        <LiteText disableUserSelect>note list sort</LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={sortOptions}
        />
        <LiteText disableUserSelect>focus count down</LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={countdownOptions}
        />
        <div className={classes.checkboxList}>
          <Checkbox />
          <LiteText disableUserSelect>open deep focus mode</LiteText>
        </div>
      </div>
    );
  }

  render() {
    const { classes, onClose, open } = this.props;
    const { type } = this.state;
    //
    const sidebar = [
      { type: 'account', title: 'settingSidebarAccount' },
      { type: 'theme', title: 'settingSidebarTheme' },
      { type: 'edit', title: 'settingSidebarEdit' },
      { type: 'common', title: 'settingSidebarCommon' },
    ];

    return (
      <Dialog
        maxWidth={false}
        open={open}
        onEscapeKeyDown={onClose}
      >
        <DialogContent className={classes.root}>
          <List className={classes.sidebar}>
            {sidebar.map((item) => (
              <ListItem
                key={item.type}
                button
                selected={item.type === type}
                onClick={() => this.handler.handleSidebarChange(item.type)}
                classes={{ selected: classes.selected }}
              >
                <FormattedMessage id={item.title} />
              </ListItem>
            ))}
          </List>
          <div className={classes.content}>
            {type === 'account' && this.renderAccount()}
            {type === 'theme' && this.renderTheme()}
            {type === 'edit' && this.renderEdit()}
            {type === 'common' && this.renderCommon()}
          </div>
        </DialogContent>
        <div className={classes.close}>
          <IconButton color="inherit" onClick={onClose}>
            <Icons.ClearIcon />
          </IconButton>
        </div>
      </Dialog>
    );
  }
}

SettingDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
  user: PropTypes.object.isRequired,
};

SettingDialog.defaultProps = {
  open: false,
};

export default withStyles(styles)(injectIntl(SettingDialog));
