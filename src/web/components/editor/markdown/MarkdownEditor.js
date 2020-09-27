import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { MarkdownEditor } from 'wiz-react-markdown-editor';
import debounce from 'lodash/debounce';
// import VditorEditor from './VditorEditor';
import { getTagSpanFromRange } from '../libs/dom_utils';

const styles = (/* theme */) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  invisible: {
    display: 'none',
  },
});

class MarkdownEditorComponent extends React.PureComponent {
  handler = {
    handleClickEditor: (e) => {
      const target = e.target;
      const tagSpan = getTagSpanFromRange(this.editor.vditor.element, target);
      if (tagSpan) {
        this.props.onClickTag(tagSpan.textContent);
      }
    },
    handleNoteModified: ({ contentId, markdown }) => {
      this.saveNote(contentId, markdown);
    },
    handleSelectImages: async () => {
      if (!this.editor.current) {
        return null;
      }
      const { kbGuid, note } = this.props;
      const files = await this.props.onSelectImages(kbGuid, note.guid);
      //
      return files.pop();
    },
    handleInsertImages: async (successCb) => {
      if (!this.editor) {
        return;
      }
      const { kbGuid, note } = this.props;
      const files = await this.props.onSelectImages(kbGuid, note.guid);
      if (files.length && successCb) {
        successCb();
      }
      files.forEach((src) => {
        this.editor.insertValue(`![image](${src})`);
      });
    },
    handleInsertImagesFromData: async (file) => {
      if (!this.editor) {
        return null;
      }
      const { kbGuid, note } = this.props;
      const f = file;
      // fileList.forEach(async (file) => {
      //   const fileUrl = await window.wizApi.userManager.addImageFromData(kbGuid,
      //     note.guid, file);
      //   this.editor.insertValue(`![image](${fileUrl})`);
      // });
      const fileUrl = await window.wizApi.userManager.addImageFromData(kbGuid, note.guid, f);
      return {
        path: fileUrl,
        name: file.name,
      };
    },
    handleTagsChanged: async (kbGuid) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      //
      this.getAllTags();
    },
    handleTagRenamed: async (kbGuid) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      //
      this.getAllTags();
    },
    handleOnChange: debounce(({ toc }) => {
      const list = toc.map((item) => ({
        ...item,
        title: item.content,
        key: item.slug,
        children: [],
        open: true,
      }));

      const result = [];
      const parent = new Map();
      let last = null;

      parent.set(last, { lvl: 0, children: result });

      list.forEach((item) => {
        while (!last || item.lvl <= last.lvl) {
          last = parent.get(last);
        }
        last.children.push(item);
        parent.set(item, last);
        last = item;
      });

      if (this.props.onUpdateContentsList) {
        this.props.onUpdateContentsList(result);
      }
    }, 300),
  }

  constructor(props) {
    super(props);
    this.state = {
      note: null,
      // tagList: {},
    };
    this.oldMarkdown = '';
    this.editor = React.createRef();
  }

  //
  async componentDidMount() {
    window.wizApi.userManager.on('tagsChanged', this.handler.handleTagsChanged);
    window.wizApi.userManager.on('tagRenamed', this.handler.handleTagRenamed);
    this.getAllTags();
    await this.loadNote();
  }

  componentDidUpdate() {
    const { note: currentNote } = this.state;
    const { note: propsNote } = this.props;
    if (propsNote?.guid !== currentNote?.guid) {
      // note changed
      this.saveAndLoadNote();
    }
  }

  componentWillUnmount() {
    window.wizApi.userManager.off('tagsChanged', this.handler.handleTagsChanged);
    window.wizApi.userManager.off('tagRenamed', this.handler.handleTagRenamed);
    if (this.editor) {
      this.editor.vditor.element.removeEventListener('click', this.handler.handleClickEditor);
    }
  }

  get resourceUrl() {
    const { note } = this.state;
    const { kbGuid } = this.props;
    const userGuid = window.wizApi?.userManager?.userGuid || '';
    if (!note || !kbGuid || !userGuid) {
      return '';
    }
    //
    return `wiz://${userGuid}/${kbGuid}/${note.guid}`;
  }

  async getAllTags() {
    // const { kbGuid } = this.props;
    // const tagList = await window.wizApi.userManager.getAllTags(kbGuid);
    // console.log(tagList);
    // this.setState({ tagList });
  }

  async saveNote(contentId, markdown) {
    const { note } = this.state;
    if (!this.editor.current || !note || contentId !== note.guid) {
      return;
    }
    const { kbGuid } = this.props;
    //
    const wizPathReg = new RegExp(this.resourceUrl, 'ig');
    // eslint-disable-next-line no-param-reassign
    markdown = markdown.replace(wizPathReg, 'index_files');
    if (markdown !== this.oldMarkdown) {
      this.oldMarkdown = markdown;
      await this.props.onSaveNote(kbGuid, note.guid, markdown);
    }
  }

  async loadNote() {
    const { note, kbGuid } = this.props;
    if (note) {
      const noteGuid = note.guid;
      try {
        const markdown = await this.props.onLoadNote(kbGuid, noteGuid);
        // const markdown = await window.wizApi.userManager.getNoteMarkdown(kbGuid, note.guid);
        if (note.guid === this.props.note?.guid) {
          this.oldMarkdown = markdown;

          // console.log(`loadNode ---------------${note.title}`);
          // console.log(markdown);
          this.setState({ note });
        } else {
          // console.log('note changed');
        }
      } catch (err) {
        if (noteGuid === this.props.note?.guid) {
          alert(`failed to download note data`);
        } else {
          // note changed (下载笔记之后，笔记可能已经被删除，找不到原始笔记记录)。
          // ignore error
          console.error(err);
        }
      }
    }
  }

  async saveAndLoadNote() {
    await this.saveNote();
    await this.loadNote();
  }

  render() {
    //
    const {
      note,
      // tagList,
    } = this.state;
    const { classes } = this.props;
    //
    return (
      <div className={classNames(classes.root, !note && classes.invisible)}>
        {/* <WizReactMarkdownEditor
          disabled={!note}
          markdown={this.oldMarkdown}
          isMac={window.wizApi.platform.isMac}
          contentId={note ? note.guid : 'empty'}
          resourceUrl={this.resourceUrl}
          theme={theme.palette.type}
          onSave={this.handler.handleNoteModified}
          onInsertImage={this.handler.handleInsertImages}
          onInsertImageFromData={this.handler.handleInsertImagesFromData}
          tagList={tagList}
          autoSelectTitle={note && new Date().getTime() - note.created <= 10 * 1000}
          onUpdateContentsList={this.props.onUpdateContentsList}
        /> */}
        <MarkdownEditor
          ref={this.editor}
          onChange={this.handler.handleOnChange}
          onSelectImages={this.handler.handleSelectImages}
          onInsertImageFromData={this.handler.handleInsertImagesFromData}
          onSave={this.handler.handleNoteModified}
          markdown={this.oldMarkdown}
          resourceUrl={this.resourceUrl}
          contentId={note ? note.guid : 'empty'}
        />
      </div>
    );
  }
}

MarkdownEditorComponent.propTypes = {
  classes: PropTypes.object.isRequired,
  note: PropTypes.object,
  kbGuid: PropTypes.string,
  // theme: PropTypes.object.isRequired,
  onLoadNote: PropTypes.func.isRequired,
  onSaveNote: PropTypes.func.isRequired,
  onSelectImages: PropTypes.func.isRequired,
  onClickTag: PropTypes.func.isRequired,
  onUpdateContentsList: PropTypes.func,
};

MarkdownEditorComponent.defaultProps = {
  note: null,
  kbGuid: null,
  onUpdateContentsList: null,
};

export default withTheme(withStyles(styles)(MarkdownEditorComponent));
