import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles, withTheme } from '@material-ui/core/styles';
import {
  createEditorPromise,
  markdown2Doc,
} from 'live-editor/client';
import { filter } from 'fuzzaldrin';
// import { getTagSpanFromRange } from '../libs/dom_utils';
// import { getLocale } from '../../../utils/lang';
import './live-editor.scss';

const {
  extractLinksFromMarkdown,
} = require('wiznote-sdk-js-share').noteAnalysis;

// const lang = getLocale().toLowerCase();

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
    handleMdLink: (md) => {
      const lists = extractLinksFromMarkdown(md);
      if (this.props.onUpdateLinkList) {
        this.props.onUpdateLinkList(lists);
      }
    },
    // handleClickEditor: (e) => {
    //   const target = e.target;
    //   const tagSpan = getTagSpanFromRange(this.editor.current.editor, target);
    //   if (tagSpan) {
    //     this.props.onClickTag(tagSpan.textContent);
    //   }
    // },
    handleTagClicked: (editor, tag) => {
      this.props.onClickTag(tag);
    },
    handleLiveEditorChange: (editor) => {
      const { note } = this.state;
      const markdown = editor.toMarkdown();
      this.handler.handleMdLink(markdown);
      this.saveNote(note.guid, markdown, []);
    },
    // handleNoteModified: ({ contentId, markdown, noteLinks }) => {
    //   this.saveNote(contentId, markdown, noteLinks);
    // },
    // handleSelectImages: async () => {
    //   if (!this.editor.current) {
    //     return null;
    //   }
    //   const { kbGuid, note } = this.props;
    //   const files = await this.props.onSelectImages(kbGuid, note.guid);
    //   //
    //   return files.pop();
    // },
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
    handleUploadResource: async (editor, file) => {
      const { kbGuid, note } = this.props;
      const fileUrl = await window.wizApi.userManager.addImageFromData(kbGuid, note.guid, file);
      return fileUrl;
    },
    handleBuildResourceUrl: (editor, resourceName) => {
      if (resourceName.startsWith('index_files/')) {
        return `${this.resourceUrl}/${resourceName}`;
      }
      return resourceName;
    },
    // handleInsertImagesFromData: async (file) => {
    //   if (!this.editor.current) {
    //     return null;
    //   }
    //   const { kbGuid, note } = this.props;
    //   const f = file;
    //   const fileUrl = await window.wizApi.userManager.addImageFromData(kbGuid, note.guid, f);
    //   return {
    //     path: fileUrl,
    //     name: file.name,
    //   };
    // },
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
    // handleImageAction: async (path) => {
    //   if (typeof path !== 'string') {
    //     const result = await this.handler.handleInsertImagesFromData(path);
    //     return result.path;
    //   }
    //   return path;
    // },
    handleFocusModeChange: (focusMode) => {
      this.editor.setFocusMode(focusMode);
    },
    handleTypewriterModeChange: (typewriterMode) => {
      this.editor.setTypewriterMode(typewriterMode);
    },
    handleProcessToc: (toc) => {
      if (!Array.isArray(toc)) return [];
      //
      toc.forEach((item) => {
        const tocItem = item;
        tocItem.title = item.text;
        tocItem.key = item.blockId;
        tocItem.open = true;
        tocItem.children = this.handler.handleProcessToc(item.children);
      });
      return toc;
    },
    handleUpdateToc: (editor, toc) => {
      const result = this.handler.handleProcessToc(toc);
      //
      if (this.props.onUpdateContentsList) {
        this.props.onUpdateContentsList(result);
      }
    },
    handleGetTagItems: async (editor, keywords) => {
      const { wordList } = this.state;
      return filter(wordList, keywords);
    },
    handleOnNoteLinksContentChange: ({ content, render }) => {
      render(filter(this.titlesList, content, { key: 'title' }));
    },
    handleClickLink: ({ href: title, event }) => {
      this.props.onClickNoteLink(title, {
        left: event.clientX,
        top: event.clientY + 20,
      });
    },
    handleCheckMode: (editor) => {
      const { focusMode, typewriterMode } = this.state;
      if (!editor) return;
      //
      if (focusMode) {
        editor.setFocusMode(focusMode);
      }
      if (typewriterMode) {
        editor.setTypewriterMode(typewriterMode);
      }
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      note: null,
      wordList: [],
      // markdown: '',
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
    await this.loadNote();
    this.setState({
      focusMode: await window.wizApi.userManager.getSettings('focusMode', false),
      typewriterMode: await window.wizApi.userManager.getSettings('typewriterMode', false),
    }, this.handler.handleCheckMode);
  }

  componentDidUpdate(prevProps) {
    const { note: currentNote } = this.state;
    const { note: propsNote } = this.props;
    if (propsNote?.guid !== currentNote?.guid) {
      // note changed
      this.saveAndLoadNote();
      // setTimeout(() => {
      //   const linkList = this.editor?.current?.getNoteLinks();
      //   if (this.props.onUpdateLinkList) {
      //     this.props.onUpdateLinkList(linkList);
      //   }
      // }, 500);
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
    const wizPathReg = new RegExp(`${this.resourceUrl}/index_files`, 'ig');
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
          if (this.editor) {
            this.editor.destroy();
          }
          //
          this.setState({ note });
          const doc = markdown2Doc(markdown);
          await this.renderEditor(doc);
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

  async renderEditor(initLocalData) {
    const user = {
      avatarUrl: '',
      userId: '',
      displayName: '',
    };
    const auth = {
      appId: '',
      userId: '',
      permission: 'w',
      docId: '',
      token: '',
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
        onLoad: this.handler.handleCheckMode,
        onChange: this.handler.handleLiveEditorChange,
        onUploadResource: this.handler.handleUploadResource,
        onBuildResourceUrl: this.handler.handleBuildResourceUrl,
        onUpdateToc: this.handler.handleUpdateToc,
        onGetTagItems: this.handler.handleGetTagItems,
        onTagClicked: this.handler.handleTagClicked,
      },
    };
    const editor = await createEditorPromise(this.editorContainer.current, options, auth);
    this.editor = editor;
    return editor;
  }

  render() {
    //
    const {
      note,
    } = this.state;
    const { classes } = this.props;
    //
    return (
      <div
        ref={this.editorContainer}
        className={classNames(classes.root, !note && classes.invisible)}
      />
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
  // onSelectImages: PropTypes.func.isRequired,
  onClickTag: PropTypes.func.isRequired,
  onUpdateContentsList: PropTypes.func,
  // scrollbar: PropTypes.object,
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
  // scrollbar: null,
  titlesList: [],
};

export default withTheme(withStyles(styles)(MarkdownEditorComponent));
