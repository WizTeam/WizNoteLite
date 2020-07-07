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
    height: '100%',
  },
  invisible: {
    display: 'none',
  },
  tabPanel: {
    height: '100%',
  },
});

class NoteEditor extends React.Component {
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
    // handleChangeWordsCount: (count) => {
    //   this.setState({
    //     worldsCount: count,
    //   });
    // },
  }

  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     worldsCount: 0,
  //   };
  // }

  render() {
    const {
      classes, theme,
      note, kbGuid, onClickTag,
    } = this.props;
    //
    const type = note?.type;
    const isMarkdown = type === 'lite' || type === 'lite/note' || type === 'lite/markdown';
    const hasEditor = isMarkdown;
    //
    return (
      <div className={classNames(classes.root, !note && classes.invisible)}>
        <TabPanel tabKey="lite/markdown" className={classes.tabPanel} visible={isMarkdown}>
          <MarkdownEditor
            darkMode={theme.palette.type === 'dark'}
            onLoadNote={this.handler.handleLoadNote}
            onSaveNote={this.handler.handleSaveNote}
            onSelectImages={this.handler.handleSelectImages}
            note={note}
            kbGuid={kbGuid}
            onClickTag={onClickTag}
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
