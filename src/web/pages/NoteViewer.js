import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import VditorEditor from '../components/editor/markdown/VditorEditor';
import Scrollbar from '../components/Scrollbar';
//

const styles = (theme) => ({
  root: {
    padding: 0,
    margin: 0,
    height: '100%',
    backgroundColor: theme.custom.background.content,
  },
  lightMode: {
    backgroundColor: theme.custom.background.previewLightMode,
  },
  darkMode: {
    backgroundColor: theme.custom.background.previewDarkMode,
  },
});

class NoteViewer extends React.Component {
  handler = {
    handleInitEditor: (editor) => {
      this._editor = editor;
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      markdown: '',
      resourceUrl: '',
      loading: true,
    };
  }

  async componentDidMount() {
    const {
      kbGuid,
      noteGuid,
    } = this.props;
    //
    const userGuid = window.wizApi?.userManager?.userGuid || '';
    const resourceUrl = `wiz://${userGuid}/${kbGuid}/${noteGuid}`;

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

  render() {
    const {
      classes, theme,
      noteGuid, darkMode = theme.palette.type === 'dark',
    } = this.props;

    const { loading, markdown, resourceUrl } = this.state;

    return (
      <div
        className={classNames(
          classes.root,
          darkMode && classes.darkMode,
          !darkMode && classes.lightMode,
        )}
      >
        <Scrollbar autoHideTimeout={100}>
          <div
            id="wiz-note-content-root"
            ref={(node) => {
              this._rootElem = node;
            }}
          >
            <VditorEditor
              value={markdown}
              isMac={window.wizApi.platform.isMac}
              contentId={loading ? '' : noteGuid}
              onInit={this.handler.handleInitEditor}
              onInput={() => {}}
              resourceUrl={resourceUrl}
              darkMode={darkMode}
              onSave={() => {}}
              onInsertImage={() => {}}
              onInsertImageFromData={() => {}}
              tagList={{}}
              autoSelectTitle={false}
            />
          </div>
        </Scrollbar>
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
};

NoteViewer.defaultProps = {
  params: {},
  darkMode: false,
};

export default withTheme(withStyles(styles)(injectIntl(NoteViewer)));
