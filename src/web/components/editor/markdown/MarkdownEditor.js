import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { MarkdownEditor } from 'wiz-react-markdown-editor';
import debounce from 'lodash/debounce';
import { filter } from 'fuzzaldrin';
import { getTagSpanFromRange } from '../libs/dom_utils';
import { getLocale } from '../../../utils/lang';
import './lite.scss';

const lang = getLocale().toLowerCase();

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
      render(filter(this.state.titlesList, content, { key: 'title' }));
    },


    handleNoteLink: async (item) => {
      const id = item?.href.trim();
      if (id) {
        const note = await window.wizApi.userManager.getNote(this.props.kbGuid, id);
        if (note) {
          if (this.props.onSelectNote) {
            this.props.onSelectNote(note);
          }
        } else {
          const notes = await window.wizApi.userManager.queryNotes(this.props.kbGuid, 0, 1, {
            // searchTitle: id,
            searchText: id,
          });
          if (notes && notes.length && this.props.onSelectNote) {
            this.props.onSelectNote(notes[0]);
          } else if (this.props.onCreateNote) {
            this.props.onCreateNote('lite/markdown', `# ${item.href}`);
          }
        }
      }
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
      titlesList: [],
    };
    this.oldMarkdown = '';
    this.editor = React.createRef();
    this._onThemeChange = null;
  }

  //
  async componentDidMount() {
    window.wizApi.userManager.on('tagsChanged', this.handler.handleTagsChanged);
    window.wizApi.userManager.on('tagRenamed', this.handler.handleTagRenamed);
    window.wizApi.userManager.on('focusEdit', this.handler.handleFocusModeChange);
    window.wizApi.userManager.on('typewriterEdit', this.handler.handleTypewriterModeChange);
    this.getAllTags();
    await this.loadNote();
    if (this.editor.current) {
      const editor = this.editor.current.editor;
      editor.addEventListener('click', this.handler.handleClickEditor);
    }
    this.setState({
      focusMode: await window.wizApi.userManager.getSettings('focusMode', false),
    });
    this.setState({
      typewriterMode: await window.wizApi.userManager.getSettings('typewriterMode', false),
    });
    this.editor.current.on('muya-note-link-change', this.handler.handleOnNoteLinksContentChange);
    this.editor.current.on('muya-note-link', this.handler.handleNoteLink);
  }

  componentDidUpdate(prevProps) {
    const { note: currentNote } = this.state;
    const { note: propsNote } = this.props;
    if (propsNote?.guid !== currentNote?.guid) {
      // note changed
      this.saveAndLoadNote();
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

  async refreshTitlesList() {
    const titlesList = await window.wizApi.userManager.getAllTitles(this.props.kbGuid);
    this.setState({
      titlesList: titlesList?.map((item) => ({
        id: item.guid,
        title: item.title,
      })),
    });
  }

  async saveAndLoadNote() {
    await this.saveNote();
    await this.loadNote();
    await this.refreshTitlesList();
  }

  render() {
    //
    const {
      note,
      wordList,
      markdown,
      focusMode,
      typewriterMode,
      titlesList,
    } = this.state;
    const { classes, scrollbar } = this.props;
    const scrollingElement = scrollbar?.container?.children[0];
    //
    return (
      <div className={classNames(classes.root, !note && classes.invisible)}>
        <MarkdownEditor
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
          noteLinks={titlesList}
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
  scrollbar: PropTypes.object,
  theme: PropTypes.object.isRequired,
  onSelectNote: PropTypes.func,
  onCreateNote: PropTypes.func,
};

MarkdownEditorComponent.defaultProps = {
  note: null,
  kbGuid: null,
  onUpdateContentsList: null,
  scrollbar: null,
  onSelectNote: null,
  onCreateNote: null,
};

export default withTheme(withStyles(styles)(MarkdownEditorComponent));
