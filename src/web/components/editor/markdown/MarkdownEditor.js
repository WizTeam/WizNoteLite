import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles, withTheme } from '@material-ui/core/styles';
import {
  createEditorPromise,
  genId,
} from 'live-editor/client';
import { MarkdownEditor } from 'wiz-react-markdown-editor';
import debounce from 'lodash/debounce';
import { filter } from 'fuzzaldrin';
import { getTagSpanFromRange } from '../libs/dom_utils';
import { getLocale } from '../../../utils/lang';
import './live-editor.scss';

// const lang = getLocale().toLowerCase();
const AppId = '_LC1xOdRp';

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
      const tagSpan = getTagSpanFromRange(this.editor.current.editor, target);
      if (tagSpan) {
        this.props.onClickTag(tagSpan.textContent);
      }
    },
    handleGetToc: (blocks) => {
      const toc = [];
      blocks.forEach((block) => {
        if (block.heading) {
          const item = block;
          item.lvl = block.heading;
          item.slug = block.id;
          item.content = block.text.reduce((c, text) => c + text.insert, '');

          toc.push(item);
        }
      });
      return toc;
    },
    handleLiveEditorChange: (editor) => {
      const { note } = this.state;
      const markdown = editor.toMarkdown();
      const toc = this.handler.handleGetToc(editor.doc._data.blocks);
      this.handler.handleOnChange({ toc });
      this.saveNote(note.guid, markdown, []);
    },
    handleNoteModified: ({ contentId, markdown, noteLinks }) => {
      this.saveNote(contentId, markdown, noteLinks);
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
    // handleInsertImages: async (successCb) => {
    //   if (!this.editor) {
    //     return;
    //   }
    //   const { kbGuid, note } = this.props;
    //   const files = await this.props.onSelectImages(kbGuid, note.guid);
    //   if (files.length && successCb) {
    //     successCb();
    //   }
    //   files.forEach((src) => {
    //     this.editor.insertValue(`![image](${src})`);
    //   });
    // },
    handleInsertImagesFromData: async (file) => {
      if (!this.editor.current) {
        return null;
      }
      const { kbGuid, note } = this.props;
      const f = file;
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
    handleScreenCaptureManual: () => {
      window.wizApi.userManager.screenCaptureManual();
    },
    handleImageAction: async (path) => {
      if (typeof path !== 'string') {
        const result = await this.handler.handleInsertImagesFromData(path);
        return result.path;
      }
      return path;
    },
    handleFocusModeChange: (focusMode) => {
      this.setState({
        focusMode,
      });
    },
    handleTypewriterModeChange: (typewriterMode) => {
      this.setState({
        typewriterMode,
      });
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

    handleOnNoteLinksContentChange: ({ content, render }) => {
      render(filter(this.titlesList, content, { key: 'title' }));
    },
    handleClickLink: ({ href: title, event }) => {
      this.props.onClickNoteLink(title, {
        left: event.clientX,
        top: event.clientY + 20,
      });
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      note: null,
      wordList: [],
      markdown: '',
      focusMode: false,
      typewriterMode: false,
    };
    this.titlesList = [];
    this.oldMarkdown = '';
    this.editor = null;
    this._onThemeChange = null;
    this.editorContainer = React.createRef();
  }

  //
  async componentDidMount() {
    window.wizApi.userManager.on('tagsChanged', this.handler.handleTagsChanged);
    window.wizApi.userManager.on('tagRenamed', this.handler.handleTagRenamed);
    window.wizApi.userManager.on('focusEdit', this.handler.handleFocusModeChange);
    window.wizApi.userManager.on('typewriterEdit', this.handler.handleTypewriterModeChange);
    this.getAllTags();
    this.editor = await this.renderEditor();
    await this.loadNote();
    if (this.editor.current) {
      const editor = this.editor.current.editor;
      editor.addEventListener('click', this.handler.handleClickEditor);
      this.editor.current.on('muya-note-link-change', this.handler.handleOnNoteLinksContentChange);
      this.editor.current.on('muya-note-link', this.handler.handleClickLink);
    }
    this.setState({
      focusMode: await window.wizApi.userManager.getSettings('focusMode', false),
      typewriterMode: await window.wizApi.userManager.getSettings('typewriterMode', false),
    });
  }

  componentDidUpdate(prevProps) {
    const { note: currentNote } = this.state;
    const { note: propsNote } = this.props;
    if (propsNote?.guid !== currentNote?.guid) {
      // note changed
      this.saveAndLoadNote();
      setTimeout(() => {
        const linkList = this.editor?.current?.getNoteLinks();
        if (this.props.onUpdateLinkList) {
          this.props.onUpdateLinkList(linkList);
        }
      }, 500);
    }
    if (prevProps.titlesList !== this.props.titlesList) {
      this.titlesList = [
        ...new Set(this.props.titlesList.filter((item) => !!item.trim())),
      ].map((item) => ({
        id: item,
        title: item,
      }));
    }
    if (prevProps.theme.palette.type !== this.props.theme.palette.type) {
      if (this._onThemeChange) {
        this._onThemeChange({
          matches: this.props.theme.palette.type === 'dark',
        });
      }
    }
  }

  componentWillUnmount() {
    window.wizApi.userManager.off('tagsChanged', this.handler.handleTagsChanged);
    window.wizApi.userManager.off('tagRenamed', this.handler.handleTagRenamed);
    window.wizApi.userManager.off('focusEdit', this.handler.handleFocusModeChange);
    window.wizApi.userManager.off('typewriterEdit', this.handler.handleTypewriterModeChange);
    this.editor.current.off('muya-note-link-change', this.handler.handleOnNoteLinksContentChange);
    this.editor.current.off('muya-note-link', this.handler.handleClickLink);
    if (this.editor.current) {
      const editor = this.editor.current.editor;
      editor.removeEventListener('click', this.handler.handleClickEditor);
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
    const { kbGuid } = this.props;
    const tagList = await window.wizApi.userManager.getAllTags(kbGuid);
    const wordList = [];
    this.convertToTreeData(wordList, tagList);
    this.setState({ wordList });
  }

  convertToTreeData(list, data, path) {
    try {
      for (const tag in data) {
        if (tag === 'wizName' || tag === 'wizFull') continue;
        if (data[tag]) {
          const name = path ? `${path}/${data[tag].wizName}` : data[tag].wizName;
          list.push(name);
          this.convertToTreeData(list, data[tag], name);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  async saveNote(contentId, markdown, noteLinks) {
    const { note } = this.state;
    if (!this.editor || !note || contentId !== note.guid) {
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
      if (this.props.onUpdateLinkList) {
        this.props.onUpdateLinkList(noteLinks);
      }
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
          const rootBlockId = this.editor.doc._data.blocks[0]?.id;
          if (rootBlockId) {
            const block = this.editor.getBlockById(rootBlockId);
            this.editor.insertMarkdown(markdown, {
              block,
              offset: 0,
            });
          }
          this.setState({ note, markdown: this.oldMarkdown });
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

  async renderEditor() {
    const user = {
      avatarUrl: '',
      userId: 'test',
      displayName: 'test',
    };
    const docId = genId();
    const auth = {
      appId: AppId,
      userId: user.userId,
      permission: 'w',
      docId,
      token: '',
    };

    const options = {
      local: true,
      // serverUrl: WsServerUrl,
      user,
      // template,
      // templateValues,
      placeholder: 'Please enter document title',
      markdownOnly: true,
      lineNumber: false,
      titleInEditor: true,
      hideComments: true,
      callbacks: {
        onChange: this.handler.handleLiveEditorChange,
      },
    };
    const editor = await createEditorPromise(this.editorContainer.current, options, auth);
    return editor;
  }

  render() {
    //
    const {
      note,
      wordList,
      markdown,
      focusMode,
      typewriterMode,
    } = this.state;
    const { classes, scrollbar } = this.props;
    // const scrollingElement = scrollbar?.container?.children[0];
    //
    return (
      <div
        ref={this.editorContainer}
        className={classNames(classes.root, !note && classes.invisible)}
      >
        {/* <MarkdownEditor
          ref={this.editor}
          wordList={wordList}
          markdown={markdown}
          resourceUrl={this.resourceUrl}
          scrollingElement={scrollingElement}
          contentId={note ? note.guid : 'empty'}
          onChange={this.handler.handleOnChange}
          onSave={this.handler.handleNoteModified}
          onSelectImages={this.handler.handleSelectImages}
          onThemeChange={(fn) => {
            this._onThemeChange = fn;
          }}
          onScreenCaptureManual={this.handler.handleScreenCaptureManual}
          onImageAction={this.handler.handleImageAction}
          lang={lang}
          focusMode={focusMode}
          typewriterMode={typewriterMode}
        /> */}
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
  scrollbar: PropTypes.object,
  onUpdateLinkList: PropTypes.func,
  onClickNoteLink: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired,
  titlesList: PropTypes.array,
};

MarkdownEditorComponent.defaultProps = {
  note: null,
  kbGuid: null,
  onUpdateContentsList: null,
  onUpdateLinkList: null,
  scrollbar: null,
  titlesList: [],
};

export default withTheme(withStyles(styles)(MarkdownEditorComponent));
