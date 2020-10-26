import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { MarkdownEditor } from 'wiz-react-markdown-editor/dist';
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

const OverwriteTableStyle = React.lazy(() => import('../components/OverwriteTableStyle'));

class NoteViewer extends React.Component {
  handler = {
  }

  constructor(props) {
    super(props);
    this.state = {
      markdown: '',
      resourceUrl: '',
      loading: true,
    };
    this._scrollBarRef = React.createRef();
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
    const markdown = await window.wizApi.userManager.getNoteMarkdown(kbGuid, noteGuid);
    this.setState({
      markdown,
      loading: false,
      resourceUrl,
    });
    //
    this._loadTimer = setInterval(() => {
      this.waitForLoad();
    }, 1000 * 3);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.darkMode !== this.props.darkMode) {
      this.checkTheme();
    }
  }

  componentWillUnmount() {
    clearInterval(this._loadTimer);
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
    const elem = this._rootElem;
    const height = elem.scrollHeight;
    window.wizApi.userManager.sendMessage('onNoteLoaded', kbGuid, noteGuid, {
      height,
      ...params,
    });
  }

  async checkTheme() {
    const { params } = this.props;
    //
    if (params.theme) {
      const id = 'wiz-note-content-root';
      const css = await window.wizApi.userManager.getThemeCssString(params.theme);
      injectionCssFormId(id, css);
    }

    if (this.props.darkMode !== undefined) {
      const id = 'wiz-note-content-root';
      const theme = this.props.darkMode ? 'dark' : 'lite';
      const css = await window.wizApi.userManager.getThemeCssString(theme);
      injectionCssFormId(id, css);
    }
  }

  render() {
    const {
      classes, theme,
      noteGuid, showTableInline,
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

    const { loading, markdown, resourceUrl } = this.state;
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
        id="wiz-note-content-root"
        ref={(node) => {
          this._rootElem = node;
        }}
        style={style}
        // className={classNames(resetBackground && backgroundClass)}
      >
        <MarkdownEditor
          readOnly
          markdown={markdown}
          contentId={loading ? 'empty' : noteGuid}
          resourceUrl={resourceUrl}
        />
        {params.showFooter === '1' && (
          <div className={classNames(classes.footer, footerClass)}>
            <Icons.LiteMarkerIcon />
          </div>
        )}
      </div>
    );

    const contentEditorWithScrollBar = (
      <Scrollbar
        ref={this._scrollBarRef}
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
        <Suspense fallback={<></>}>
          {showTableInline && <OverwriteTableStyle />}
        </Suspense>
      </div>
    );
  }
}

NoteViewer.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  kbGuid: PropTypes.string.isRequired,
  noteGuid: PropTypes.string.isRequired,
  params: PropTypes.object,
  darkMode: PropTypes.bool,
  showTableInline: PropTypes.bool,
};

NoteViewer.defaultProps = {
  params: {},
  darkMode: undefined,
  showTableInline: false,
};

export default withTheme(withStyles(styles)(injectIntl(NoteViewer)));
