import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import {
  createEditorPromise,
  markdown2Doc,
} from 'live-editor/client';
import Scrollbar from '../components/Scrollbar';
import { injectionCssFormId } from '../utils/utils';
import Icons from '../config/icons';
//

const styles = (theme) => ({
  root: {
    margin: 0,
    height: '100%',
    backgroundColor: theme.custom.background.content,
  },
  root_dark: {
    minHeight: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#333333',
    color: '#f0f0f0',
  },
  root_lite: {
    minHeight: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    color: '#333333',
  },
  footer: {
    borderTop: 'solid 1px',
    lineHeight: '80px',
    textAlign: 'center',
    '& .MuiSvgIcon-root': {
      width: '100%',
      height: 16,
    },
  },
  footer_lite: {
    borderColor: '#d8d8d8',
    color: '#aaaaaa',
  },
  footer_dark: {
    borderColor: '#404040',
    color: '#969696',
  },
});

class NoteViewer extends React.Component {
  handler = {
    handleBuildResourceUrl: (editor, resourceName) => {
      const { resourceUrl } = this.state;
      if (resourceName.startsWith('index_files/')) {
        return `${resourceUrl}/${resourceName}`;
      }
      return resourceName;
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      // markdown: '',
      resourceUrl: '',
      // loading: true,
    };
    this.key = new Date().getTime();
  }

  async componentDidMount() {
    const {
      kbGuid,
      noteGuid,
    } = this.props;
    //
    const userGuid = window.wizApi?.userManager?.userGuid || '';
    const resourceUrl = `wiz://${userGuid}/${kbGuid}/${noteGuid}`;

    await this.checkTheme();
    let markdown = '';
    if (!kbGuid || !noteGuid) {
      markdown = await window.wizApi.userManager.getDefaultMarkdown();
    } else {
      markdown = await window.wizApi.userManager.getNoteMarkdown(kbGuid, noteGuid);
    }
    //
    this.setState({
      resourceUrl,
    }, async () => {
      const doc = markdown2Doc(markdown);
      await this.loadDocument(doc);
    });
    //
    this._loadTimer = setInterval(() => {
      this.waitForLoad();
    }, 1000 * 3);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.darkMode !== this.props.darkMode || prevProps.color !== this.props.color) {
      this.checkTheme();
    }
  }

  componentWillUnmount() {
    clearInterval(this._loadTimer);
  }

  async loadDocument(initLocalData) {
    const user = {
      avatarUrl: 'avatarUrl',
      userId: 'wiz-note-viewer',
      displayName: 'wiz-note-viewer',
    };
    const auth = {
      appId: '',
      userId: '',
      permission: 'r',
      docId: '',
      token: '',
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
    const options = {
      local: true,
      initLocalData,
      user,
      placeholder: 'Please enter document title',
      markdownOnly: true,
      lineNumber: false,
      titleInEditor: true,
      hideComments: true,
      callbacks: {
        onBuildResourceUrl: this.handler.handleBuildResourceUrl,
      },
    };
    const editor = await createEditorPromise(this._rootElem, options, auth);
    return editor;
  }

  async waitForLoad() {
    const images = Array.from(document.images) || [];
    const loadingImages = images.filter((image) => !image.complete);
    if (loadingImages.length > 0) {
      return;
    }
    clearInterval(this._loadTimer);
    //
    const {
      kbGuid,
      noteGuid,
      params,
    } = this.props;
    //
    const elem = document.getElementById(`wiz-note-content-root-${this.key}`);
    const height = elem.scrollHeight;
    window.wizApi.userManager.sendMessage('onNoteLoaded', kbGuid, noteGuid, {
      height,
      ...params,
    });
  }

  async checkTheme() {
    const { params, color } = this.props;
    const id = 'wiz-note-content-root';
    const reg = new RegExp(id, 'g');
    //
    if (params.theme && params.color) {
      const themeName = `${params.color}.${params.theme}`;
      let css = await window.wizApi.userManager.getThemeCssString(themeName);
      css = css.replace(reg, this._rootElem.id);
      injectionCssFormId(this._rootElem.id, css);
      return;
    }

    if (this.props.darkMode !== undefined) {
      const theme = [];
      //
      if (color) {
        theme.push(color);
      }
      if (this.props.darkMode) {
        theme.push('dark');
      } else {
        theme.push('lite');
      }
      //
      let css = await window.wizApi.userManager.getThemeCssString(theme.join('.'));
      css = css.replace(reg, this._rootElem.id);
      injectionCssFormId(this._rootElem.id, css);
    }
  }

  render() {
    const {
      classes, theme,
      params,
    } = this.props;
    //
    let darkMode = this.props.darkMode;
    if (darkMode === undefined) {
      darkMode = theme.palette.type === 'dark';
    }
    //
    // const resetBackground = darkMode !== undefined;
    // const backgroundClass = darkMode ? classes.root_dark : classes.root_lite;
    const footerClass = darkMode ? classes.footer_dark : classes.footer_lite;

    //
    const style = {
      paddingTop: Number.parseInt(params.paddingTop || params.padding, 10) || 32,
      paddingBottom: Number.parseInt(params.paddingBottom || params.padding, 10) || 32,
      paddingLeft: Number.parseInt(params.paddingLeft || params.padding, 10) || 32,
      paddingRight: Number.parseInt(params.paddingRight || params.padding, 10) || 32,
    };
    //
    const contentEditor = (
      <div
        id={`wiz-note-content-root-${this.key}`}
        ref={(node) => {
          this._rootElem = node;
        }}
        style={style}
        // className={classNames(resetBackground && backgroundClass)}
      >
        <div ref={(node) => { this._rootElem = node; }} />
        {params.showFooter === '1' && (
          <div className={classNames(classes.footer, footerClass)}>
            <Icons.LiteMarkerIcon />
          </div>
        )}
      </div>
    );

    const contentEditorWithScrollBar = (
      <Scrollbar
        hideThumb={params.hideThumb === '1'}
        theme={theme}
      >
        {contentEditor}
      </Scrollbar>
    );
    //
    const contentMain = params.standardScrollBar
      ? contentEditor
      : contentEditorWithScrollBar;

    return (
      <div
        className={classNames(
          classes.root,
        )}
      >
        {contentMain}
      </div>
    );
  }
}

NoteViewer.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  kbGuid: PropTypes.string,
  noteGuid: PropTypes.string,
  params: PropTypes.object,
  darkMode: PropTypes.bool,
  // showTableInline: PropTypes.bool,
  color: PropTypes.string,
};

NoteViewer.defaultProps = {
  params: {},
  darkMode: undefined,
  // showTableInline: false,
  noteGuid: null,
  kbGuid: null,
  color: 'default',
};

export default withTheme(withStyles(styles)(injectIntl(NoteViewer)));
