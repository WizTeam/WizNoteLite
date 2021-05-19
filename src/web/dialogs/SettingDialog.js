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
import Slider from '@material-ui/core/Slider';
// import Switch from '@material-ui/core/Switch';
import ModifyEmailDialog from './ModifyEmailDialog';
import ModifyPasswordDialog from './ModifyPasswordDialog';
import Scrollbar from '../components/Scrollbar';
//
import PreviewNoteLite from '../components/PreviewNoteLite';
import LiteInput from '../components/LiteInput';
import LiteText from '../components/LiteText';
import LiteSelect from '../components/LiteSelect';
import Icons from '../config/icons';

const EDITOR_DEFAULT_CONFIG = {
  fontFamily: 'Open Sans',
  fontSize: '16',
  lineHeight: '1.8',
  paragraphHeight: '20',
  textWidth: 80,
};

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
    backgroundColor: theme.custom.background.noteList,
    paddingTop: theme.spacing(4),
  },
  selected: {
    backgroundColor: `${theme.custom.background.noteListActive} !important`,
  },
  content: {
    flex: 1,
    minHeight: '100%',
    paddingTop: theme.spacing(5),
    paddingLeft: theme.spacing(8),
    paddingRight: theme.spacing(8),
    boxSizing: 'border-box',
    overflow: 'hidden',
    backgroundColor: theme.custom.background.noteListActive,
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
    width: 300,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  checkboxList: {
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: theme.spacing(1),
    marginLeft: '-4px',
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
    minWidth: 112,
    backgroundColor: theme.custom.background.dialogButtonBlack,
    color: theme.custom.color.dialogButtonBlack,
    borderRadius: 0,
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(5),
    '&:hover': {
      backgroundColor: theme.custom.background.dialogButtonBlackHover,
    },
  },
  inlineBox: {
    display: 'flex',
    alignItems: 'center',
    paddingRight: theme.spacing(8),
    boxSizing: 'border-box',
  },
  flexRight: {
    marginLeft: 'auto',
  },
  themeSelect: {
    marginLeft: theme.spacing(2),
  },
  noteViewerBox: {
    width: 'auto',
    // marginRight: theme.spacing(8),
    boxSizing: 'border-box',
    marginTop: theme.spacing(2),
  },
  noteViewerInner: {
    border: '1px solid #d8d8d8',
    width: '100%',
    height: 300,
  },
  previewThemeText: {
    textAlign: 'center',
    margin: theme.spacing(1, 0, 4, 0),
  },
});

class SettingDialog extends React.Component {
  handler = {
    handleSidebarChange: (type) => {
      this.setState({
        type,
      });
    },
    handleEditorConfigChange: (select) => {
      const { editorConfig } = this.state;

      editorConfig[select.type] = select.value;
      //
      if (this.props.onEditorConfigChange) {
        this.props.onEditorConfigChange(editorConfig);
      }
      //
      this.setState({ editorConfig });
      window.wizApi.userManager.setUserSettings('editorConfig', editorConfig);
    },
    handleChangeStartLayout: (select) => {
      const showDrawer = select.value === '1';

      this.setState({ showDrawer });

      window.wizApi.userManager.setUserSettings('showDrawer', showDrawer);
    },
    handleChangeNoteListOrderBy: (select, value) => {
      this.setState({ orderBy: value });

      window.wizApi.userManager.setUserSettings('orderBy', value);

      if (this.props.onOrderByChange) {
        this.props.onOrderByChange(value);
      }
    },
    handleFocusMode: (event) => {
      this.setState({ focusWithTypewriter: event.target.checked });
      window.wizApi.userManager.setUserSettings('focusWithTypewriter', event.target.checked);
    },
    handleToggleFocusWithTypewriter: () => {
      const { focusWithTypewriter } = this.state;
      this.setState({
        focusWithTypewriter: !focusWithTypewriter,
      });
      window.wizApi.userManager.setUserSettings('focusWithTypewriter', !focusWithTypewriter);
    },
    handleOpenModifyEmailDialog: () => {
      this.setState({ openModifyEmailDialog: true });
    },
    handleCloseModifyEmailDialog: () => {
      this.setState({ openModifyEmailDialog: false });
    },
    handleOpenModifyPasswordDialog: () => {
      this.setState({ openModifyPasswordDialog: true });
    },
    handleCloseModifyPasswordDialog: () => {
      this.setState({ openModifyPasswordDialog: false });
    },
    handleDisplayNameChange: (event) => {
      this.setState({
        displayName: event.target.value,
        displayNameErrorText: '',
      });
    },
    handleUpdateDisplayName: async () => {
      const { displayName } = this.state;
      const { intl, user } = this.props;

      if (displayName.trim() === '') {
        this.setState({
          displayNameErrorText: intl.formatMessage({ id: 'errorUpdateUserNameNull' }),
        });
        return false;
      }

      try {
        await window.wizApi.userManager.updateUserDisplayName(displayName);
        await window.wizApi.userManager.refreshUserInfo();
        //
        if (this.props.onLoggedIn) {
          user.displayName = displayName;
          this.props.onLoggedIn(user);
        }
      } catch (err) {
        this.setState({ displayNameErrorText: intl.formatMessage({ id: 'errorUpdateUserName' }) });
        return false;
      }
      //
      return true;
    },
    handleRemoveMobile: async () => {
      const { user } = this.props;
      //
      try {
        await window.wizApi.userManager.removeMobile();
        await window.wizApi.userManager.refreshUserInfo();
      } catch (err) {
        return;
      }
      //
      if (this.props.onLoggedIn) {
        user.mobile = null;
        this.props.onLoggedIn(user);
      }
    },
    handleUnbindWeixin: async () => {
      try {
        await window.wizApi.userManager.unbindSns('weixin');
        this.setState({
          snsStatus: {},
        });
      } catch (err) {
        //
      }
    },
    handleColorThemeChange: (select, val) => {
      this.setState({
        colorTheme: val,
      });
      window.wizApi.userManager.setUserSettings('colorTheme', val);
      //
      if (this.props.onColorThemeChange) {
        this.props.onColorThemeChange(val);
      }
    },
    handlePurchase: async () => {
      if (window.wizApi.platform.isMac) {
        try {
          await window.wizApi.userManager.purchaseProduct(this.state.yearProduct);
        } catch (err) {
          if (err.externCode === 'WizErrorNowAllowMakePayments') {
            await window.wizApi.userManager.showUpgradeVipDialog();
          } else {
            alert(err.message);
          }
        }
      } else {
        await window.wizApi.userManager.showUpgradeVipDialog();
      }
    },
  };

  constructor(props) {
    super(props);
    const um = window.wizApi.userManager;
    this.state = {
      type: 'account',
      editorConfig: um.getUserSettingsSync('editorConfig', EDITOR_DEFAULT_CONFIG),
      showDrawer: um.getUserSettingsSync('showDrawer', false),
      orderBy: um.getUserSettingsSync('orderBy', 'modified'),
      focusWithTypewriter: um.getUserSettingsSync('focusWithTypewriter', false),
      colorTheme: um.getUserSettingsSync('colorTheme', 'default'),
      openModifyEmailDialog: false,
      openModifyPasswordDialog: false,
      displayName: '',
      displayNameErrorText: '',
      snsStatus: {},
    };
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.open || (this.props.open !== nextProps.open);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.open !== this.props.open && this.props.open) {
      this.reset();
    }
  }

  async reset() {
    const { user } = this.props;

    //
    this.setState({
      type: 'account',
      displayNameErrorText: '',
      displayName: user?.displayName ?? '',
    });
    //
    try {
      const result = await window.wizApi.userManager.getUserInfoFromServer();
      //
      if (result.sns_status) {
        this.setState({
          snsStatus: result.sns_status,
        });
      }
    } catch (err) {
      //
    }
  }

  renderAccount() {
    const { displayName, displayNameErrorText, snsStatus } = this.state;
    const { classes, user, intl } = this.props;

    let userVipMessage = '';
    if (user) {
      if (user.vipDate) {
        const date = new Date(user.vipDate).toLocaleDateString();
        userVipMessage = `${intl.formatMessage({ id: 'settingVIPExpiryTime' })} ${date} ${user.vip ? '' : intl.formatMessage({ id: 'settingExpired' })}`;
      } else {
        const probationDateValue = user.created + 100 * 60 * 60 * 24 * 1000;
        const now = new Date().valueOf();
        const probationDate = new Date(probationDateValue).toLocaleDateString();
        userVipMessage = `${intl.formatMessage({ id: 'settingVIPProbation' })} ${probationDate} ${now < probationDateValue ? '' : intl.formatMessage({ id: 'settingExpired' })}`;
      }
    }

    if (user === null) return <></>;

    return (
      <div>
        <LiteText className={classes.accountTitle}>
          <FormattedMessage id="settingLabelEmail" />
        </LiteText>
        {user && user.userId && (
          <div className={classes.accountItem}>
            <LiteText fullWidth={false}>{user.email}</LiteText>
            <Button
              className={classes.itemButton}
              onClick={this.handler.handleOpenModifyEmailDialog}
            >
              <FormattedMessage id="settingButtonChangeEmail" />
            </Button>
          </div>
        )}
        <LiteText className={classes.accountTitle}>
          <FormattedMessage id="settingLabelNickname" />
        </LiteText>
        <LiteInput
          error={Boolean(displayNameErrorText)}
          helperText={displayNameErrorText}
          button
          className={classes.displayName}
          value={displayName}
          onChange={this.handler.handleDisplayNameChange}
          onSubmit={this.handler.handleUpdateDisplayName}
        />
        {user && user.mobile && (
          <>
            <LiteText className={classes.accountTitle}>
              <FormattedMessage id="settingLabelMobile" />
            </LiteText>
            <div className={classes.accountItem}>
              <LiteText fullWidth={false}>{user.mobile}</LiteText>
              <Button className={classes.itemButton} onClick={this.handler.handleRemoveMobile}>
                <FormattedMessage id="settingButtonRemoveMobile" />
              </Button>
            </div>
          </>
        )}
        {snsStatus && snsStatus.openid_weixin_alias && (
          <>
            <LiteText className={classes.accountTitle}>
              <FormattedMessage id="settingLabelWechat" />
            </LiteText>
            <div className={classes.accountItem}>
              <LiteText fullWidth={false}>{snsStatus.openid_weixin_alias}</LiteText>
              <Button className={classes.itemButton} onClick={this.handler.handleUnbindWeixin}>
                <FormattedMessage id="settingButtonUnbindWechat" />
              </Button>
            </div>
          </>
        )}
        <LiteText className={classes.accountTitle}>
          VIP
        </LiteText>
        <div className={classes.accountItem}>
          <LiteText fullWidth={false}>{userVipMessage}</LiteText>
          <Button className={classes.itemButton} onClick={this.handler.handlePurchase}>
            <FormattedMessage id="userTypeUpgrade" />
          </Button>
        </div>
        <Button
          className={classes.changePasswordButton}
          onClick={this.handler.handleOpenModifyPasswordDialog}
        >
          <FormattedMessage id="settingButtonChangePassword" />
        </Button>
      </div>
    );
  }

  renderTheme() {
    const { type, colorTheme } = this.state;
    const { classes } = this.props;
    //
    const themeOptions = [
      { title: 'Default', value: 'default' },
      { title: 'Beiges', value: 'beiges' },
      { title: 'Mint Green', value: 'mintGreen' },
      { title: 'Coffee', value: 'coffee' },
    ];

    return (
      <div style={{ display: type === 'theme' ? 'block' : 'none' }}>
        <div className={classes.inlineBox}>
          <LiteText fullWidth={false}>
            <FormattedMessage id="settingLabelLightMode" />
          </LiteText>
          <LiteSelect
            className={classes.themeSelect}
            options={themeOptions}
            value={colorTheme}
            onChange={this.handler.handleColorThemeChange}
          />
          {/* <Button className={classNames(classes.itemButton, classes.flexRight)}>
            <FormattedMessage id="settingButtonCustomize" />
          </Button> */}
        </div>
        <div className={classes.noteViewerBox}>
          <div className={classes.noteViewerInner}>
            <PreviewNoteLite color={colorTheme} darkMode={false} />
          </div>
          <LiteText className={classes.previewThemeText}>
            <FormattedMessage id="settingLabelPreviewTheme" />
          </LiteText>
        </div>
        <div className={classes.inlineBox}>
          <LiteText fullWidth={false}>
            <FormattedMessage id="settingLabelDarkMode" />
          </LiteText>
          <LiteSelect
            className={classes.themeSelect}
            options={themeOptions}
            value={colorTheme}
            onChange={this.handler.handleColorThemeChange}
          />
          {/* <Button className={classNames(classes.itemButton, classes.flexRight)}>
            <FormattedMessage id="settingButtonCustomize" />
          </Button> */}
        </div>
        <div className={classes.noteViewerBox}>
          <div className={classes.noteViewerInner}>
            <PreviewNoteLite color={colorTheme} darkMode />
          </div>
          <LiteText className={classes.previewThemeText}>
            <FormattedMessage id="settingLabelPreviewTheme" />
          </LiteText>
        </div>
      </div>
    );
  }

  renderEdit() {
    const { editorConfig } = this.state;
    const { classes } = this.props;
    //
    const fontFamilyOptions = [
      { title: 'Open Sans', type: 'fontFamily', value: 'Open Sans' },
      { title: 'WenQuanYi Micro Hei', type: 'fontFamily', value: 'WenQuanYi Micro Hei' },
      { title: 'sans-serif', type: 'fontFamily', value: 'sans-serif' },
    ];
    const fontSizeOptions = [
      { title: '12px', type: 'fontSize', value: '12' },
      { title: '14px', type: 'fontSize', value: '14' },
      { title: '16px', type: 'fontSize', value: '16' },
      { title: '18px', type: 'fontSize', value: '18' },
      { title: '20px', type: 'fontSize', value: '20' },
    ];
    const lineHeightOptions = [
      { title: '1.3', type: 'lineHeight', value: '1.3' },
      { title: '1.4', type: 'lineHeight', value: '1.4' },
      { title: '1.5', type: 'lineHeight', value: '1.5' },
      { title: '1.6', type: 'lineHeight', value: '1.6' },
      { title: '1.7', type: 'lineHeight', value: '1.7' },
      { title: '1.8', type: 'lineHeight', value: '1.8' },
      { title: '1.9', type: 'lineHeight', value: '1.9' },
      { title: '2.0', type: 'lineHeight', value: '2.0' },
    ];
    const paragraphOptions = [
      { title: '5px', type: 'paragraphHeight', value: '5' },
      { title: '10px', type: 'paragraphHeight', value: '10' },
      { title: '15px', type: 'paragraphHeight', value: '15' },
      { title: '20px', type: 'paragraphHeight', value: '20' },
    ];

    const textWidthMark = [
      { value: 70, label: '70%' },
      { value: 80, label: '80%' },
      { value: 90, label: '90%' },
      { value: 100, label: '100%' },
    ];

    return (
      <div>
        <LiteText disableUserSelect>
          <FormattedMessage id="settingLabelFontFamily" />
        </LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={fontFamilyOptions}
          value={editorConfig.fontFamily}
          onChange={this.handler.handleEditorConfigChange}
        />
        <LiteText disableUserSelect>
          <FormattedMessage id="settingLabelFontSize" />
        </LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={fontSizeOptions}
          value={editorConfig.fontSize}
          onChange={this.handler.handleEditorConfigChange}
        />
        <LiteText disableUserSelect>
          <FormattedMessage id="settingLabelLineHeight" />
        </LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={lineHeightOptions}
          value={editorConfig.lineHeight}
          onChange={this.handler.handleEditorConfigChange}
        />
        <LiteText disableUserSelect>
          <FormattedMessage id="settingLabelParagraphHeight" />
        </LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={paragraphOptions}
          value={editorConfig.paragraphHeight}
          onChange={this.handler.handleEditorConfigChange}
        />
        <LiteText disableUserSelect>
          <FormattedMessage id="settingTextWidth" />
        </LiteText>
        <Slider
          min={70}
          defaultValue={editorConfig.textWidth}
          className={classes.liteSelect}
          marks={textWidthMark}
          valueLabelDisplay="on"
          onChangeCommitted={(e, value) => this.handler.handleEditorConfigChange({ type: 'textWidth', value })}
        />
        {/* <LiteText disableUserSelect>
          <FormattedMessage id="settingLabelEditorMode" />
        </LiteText>
        <div className={classes.checkboxList} style={{ margin: '8px 0 16px 0' }}>
          <LiteText disableUserSelect fullWidth={false}>
            <FormattedMessage id="settingButtonRenderNow" />
          </LiteText>
          <Switch
            size="small"
          />
        </div> */}
      </div>
    );
  }

  renderCommon() {
    const { showDrawer, orderBy, focusWithTypewriter } = this.state;
    const { classes, intl } = this.props;
    //
    const showOptions = [
      { title: intl.formatMessage({ id: 'settingLabelLayoutAll' }), value: '1' },
      { title: intl.formatMessage({ id: 'settingLabelLayoutNoteListAndNote' }), value: '2' },
    ];
    const sortOptions = [
      { title: intl.formatMessage({ id: 'settingLabelLayoutCreated' }), value: 'created' },
      { title: intl.formatMessage({ id: 'settingLabelLayoutModify' }), value: 'modified' },
    ];
    const countdownOptions = [
      { title: '25 min', value: '25' },
    ];
    //
    const startValue = showDrawer ? '1' : '2';

    return (
      <div>
        <LiteText disableUserSelect>
          <FormattedMessage id="settingLabelStartLayout" />
        </LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={showOptions}
          value={startValue}
          onChange={this.handler.handleChangeStartLayout}
        />
        <LiteText disableUserSelect>
          <FormattedMessage id="settingLabelNoteListSort" />
        </LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={sortOptions}
          value={orderBy}
          onChange={this.handler.handleChangeNoteListOrderBy}
        />
        {/* <LiteText disableUserSelect>
          <FormattedMessage id="settingLabelFocusModeTimeout" />
        </LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={countdownOptions}
        /> */}
        <div className={classes.checkboxList}>
          <Checkbox
            checked={focusWithTypewriter}
            className={classes.checkbox}
            size="small"
            onChange={this.handler.handleFocusMode}
          />
          <LiteText onClick={this.handler.handleToggleFocusWithTypewriter} style={{ cursor: 'pointer' }}>
            <FormattedMessage id="settingLabelFocusModeWithTypewriter" />
          </LiteText>
        </div>
      </div>
    );
  }

  render() {
    const {
      classes, onClose, open,
      user,
    } = this.props;
    const { type, openModifyEmailDialog, openModifyPasswordDialog } = this.state;
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
          <Scrollbar>
            <div className={classes.content}>
              {type === 'account' && this.renderAccount()}
              {this.renderTheme()}
              {type === 'edit' && this.renderEdit()}
              {type === 'common' && this.renderCommon()}
            </div>
          </Scrollbar>
        </DialogContent>
        <div className={classes.close}>
          <IconButton color="inherit" onClick={onClose}>
            <Icons.ClearIcon />
          </IconButton>
        </div>
        <ModifyEmailDialog
          open={openModifyEmailDialog}
          user={user}
          onClose={this.handler.handleCloseModifyEmailDialog}
        />
        <ModifyPasswordDialog
          open={openModifyPasswordDialog}
          onClose={this.handler.handleCloseModifyPasswordDialog}
        />
      </Dialog>
    );
  }
}

SettingDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
  user: PropTypes.object.isRequired,
  onEditorConfigChange: PropTypes.func.isRequired,
  onOrderByChange: PropTypes.func,
  onLoggedIn: PropTypes.func,
  onColorThemeChange: PropTypes.func,
};

SettingDialog.defaultProps = {
  open: false,
  onOrderByChange: null,
  onLoggedIn: null,
  onColorThemeChange: null,
};

export default withStyles(styles)(injectIntl(SettingDialog));
