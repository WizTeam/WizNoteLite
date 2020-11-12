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

const EDITOR_DEFAULT_CONFIG = {
  fontFamily: 'Open Sans',
  fontSize: '16',
  lineHeight: '1.8',
  paragraphHeight: '20',
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
    handleEditorConfigChange: (select) => {
      const { editorConfig } = this.state;

      editorConfig[select.type] = select.value;
      //
      if (this.props.onEditorConfigChange) {
        this.props.onEditorConfigChange(editorConfig);
      }
      //
      this.setState({ editorConfig });
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
      window.wizApi.userManager.setUserSettings('focusWithTypewriter', event.target.checked);
    },
  };

  constructor(props) {
    super(props);
    const um = window.wizApi.userManager;
    this.state = {
      type: 'account',
      editorConfig: EDITOR_DEFAULT_CONFIG,
      showDrawer: um.getUserSettingsSync('showDrawer', false),
      orderBy: um.getUserSettingsSync('orderBy', 'modified'),
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
    ];
    const lineHeightOptions = [
      { title: '1.8', type: 'lineHeight', value: '1.8' },
      { title: '1.9', type: 'lineHeight', value: '1.9' },
    ];
    const paragraphOptions = [
      { title: '10px', type: 'paragraphHeight', value: '10' },
      { title: '15px', type: 'paragraphHeight', value: '15' },
      { title: '20px', type: 'paragraphHeight', value: '20' },
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
          <FormattedMessage id="settingLabelEditorMode" />
        </LiteText>
        <div className={classes.checkboxList}>
          <LiteText disableUserSelect fullWidth={false}>
            <FormattedMessage id="settingButtonRenderNow" />
          </LiteText>
          <Switch />
        </div>
      </div>
    );
  }

  renderCommon() {
    const { showDrawer, orderBy } = this.state;
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
        <LiteText disableUserSelect>
          <FormattedMessage id="settingLabelFocusModeTimeout" />
        </LiteText>
        <LiteSelect
          className={classes.liteSelect}
          options={countdownOptions}
        />
        <div className={classes.checkboxList}>
          <Checkbox onChange={this.handler.handleFocusMode} />
          <LiteText disableUserSelect>
            <FormattedMessage id="settingLabelFocusModeWithTypewriter" />
          </LiteText>
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
  intl: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
  user: PropTypes.object.isRequired,
  onEditorConfigChange: PropTypes.func.isRequired,
  onOrderByChange: PropTypes.func,
};

SettingDialog.defaultProps = {
  open: false,
  onOrderByChange: null,
};

export default withStyles(styles)(injectIntl(SettingDialog));
