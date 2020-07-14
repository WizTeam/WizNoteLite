import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';
import { withStyles, withTheme } from '@material-ui/core/styles';
// import { injectIntl } from 'react-intl';
import MarkdownEditor from './editor/markdown/MarkdownEditor';
import TabPanel from './TabPanel';
// import EditorFooter from './editor/EditorFooter';

const styles = (/* theme */) => ({
  root: {
    minHeight: '100%',
    boxSizing: 'border-box',
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 'max(52px, (100% - 600px) / 2)',
    paddingLeft: 'max(84px, (100% - 600px) / 2)',
  },
  invisible: {
    display: 'none',
  },
  tabPanel: {
    height: '100%',
  },
});

class NoteEditor extends React.Component {

  minEditorHeight = 0;

  handler = {
    handleSaveNote: async (kbGuid, noteGuid, markdown) => {
      await window.wizApi.userManager.setNoteMarkdown(kbGuid, noteGuid, markdown);
    },
    handleLoadNote: async (kbGuid, noteGuid) => {
      const markdown = await window.wizApi.userManager.getNoteMarkdown(kbGuid, noteGuid);
      return markdown;
    },
    handleSelectImages: async (kbGuid, noteGuid) => {
      const files = await window.wizApi.userManager.addImagesFromLocal(kbGuid, noteGuid);
      return files;
    },
    handleResize: () => {
      if (this.changeMinEditorHeight()) {
        this.setState({});
      }
    },
    // handleChangeWordsCount: (count) => {
    //   this.setState({
    //     worldsCount: count,
    //   });
    // },
  }

  constructor(props) {
    super(props);
    this.editorContainer = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('resize', this.handler.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handler.handleResize);
  }

  changeMinEditorHeight() {
    if (!this.editorContainer.current) {
      return false;
    }
    const height = this.editorContainer.current.parentNode.clientHeight;
    const style = window.getComputedStyle(this.editorContainer.current);
    const paddingTop = window.Number.parseInt(style.paddingTop);
    const paddingBottom = window.Number.parseInt(style.paddingBottom);
    const lastHeight = this.minEditorHeight;
    this.minEditorHeight = height - paddingTop - paddingBottom;
    return lastHeight !== this.minEditorHeight;
  }

  render() {
    const {
      classes, theme,
      note, kbGuid, onClickTag,
    } = this.props;
    //
    const type = note?.type;
    const isMarkdown = type === 'lite' || type === 'lite/note' || type === 'lite/markdown';
    const hasEditor = isMarkdown;

    if (!this.minEditorHeight) {
      this.changeMinEditorHeight();
    }
    //
    return (
      <div
        className={classNames(classes.root, !note && classes.invisible)}
        ref={this.editorContainer}
      >
        <TabPanel tabKey="lite/markdown" className={classes.tabPanel} visible={isMarkdown}>
          <MarkdownEditor
            darkMode={theme.palette.type === 'dark'}
            onLoadNote={this.handler.handleLoadNote}
            onSaveNote={this.handler.handleSaveNote}
            onSelectImages={this.handler.handleSelectImages}
            note={note}
            kbGuid={kbGuid}
            onClickTag={onClickTag}
            minHeight={this.minEditorHeight}
          />
        </TabPanel>
        <TabPanel tabKey="unknown" visible={!hasEditor}>
          <Typography>Unknown note type</Typography>
        </TabPanel>
        {/* <EditorFooter
          counterNum={this.state.worldsCount}
          updatedTimer={dateText}
          isLogin={this.props.isLogin}
        /> */}
      </div>
    );
  }
}

NoteEditor.propTypes = {
  classes: PropTypes.object.isRequired,
  note: PropTypes.object,
  kbGuid: PropTypes.string,
  theme: PropTypes.object.isRequired,
  onClickTag: PropTypes.func.isRequired,
};

NoteEditor.defaultProps = {
  note: null,
  kbGuid: null,
  // isLogin: true,
};

export default withTheme(withStyles(styles)(NoteEditor));
