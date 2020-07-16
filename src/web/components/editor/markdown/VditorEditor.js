import React from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import WizVditor from 'wiz-vditor';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import InsertMenu from './InsertMenu';
import HeadingMenu from './HeadingMenu';
import 'wiz-vditor/dist/index.css';
import './style.scss';
import { REGEXP_TAG } from '../../../../share/note_analysis';
import InsertTagMenu from './InsertTagMenu';
import {
  isCtrl, filterParentElement, hasClass, getDomIndexForParent,
} from '../libs/dom_utils';
import { getRange, getSelection } from '../libs/range_utils';

const styles = (/* theme */) => ({
  hideBlockType: {
    '& h1:before, & h2:before, & h3:before, & h4:before, & h5:before, & h6:before': {
      display: 'none',
    },
  },
});
class VditorEditor extends React.Component {
  resourceUrl = '';

  waitSetValue = null;

  isShowTagMenu = false;

  timeStamp = new Date().getTime();

  handler = {
    handleChangeTagMenuShowState: (isShowMenu) => {
      this.isShowTagMenu = isShowMenu;
    },
    handleInsert: (name) => {
      if (name === 'image') {
        if (this.props.onInsertImage) {
          this.props.onInsertImage();
        }
      } else {
        this.emitVditorTooltipEvent(name);
      }
    },
    handleHeadingMenuClick: (type) => {
      this.emitVditorTooltipEvent('headings');
      if (type === 'quote') {
        this.emitVditorTooltipEvent('quote');
      } else {
        const dom = this.editor.vditor.element.querySelector(`.vditor-toolbar [data-tag=${type}]`);
        this.emitClickEvent(dom);
      }
    },
    handleEditorKeyDown: (e) => {
      const { isMac } = this.props;
      if (isMac && e.ctrlKey && e.shiftKey && e.keyCode === 90) {
        // Mac  Ctrl + Shift + z
        this.editor.vditor.irUndo.redo(this.editor.vditor);
      }
      if (e.keyCode === 13) {
        // Enter
        // Vditor 在行首 输入回车时，不会重新渲染 改行，导致 如果行首为 Tag ，会遗留 Tag 标签样式
        setTimeout(() => {
          const range = getRange();
          const block = filterParentElement(range.startContainer,
            this.editor.vditor.element,
            (dom) => dom.nodeType === 1 && dom.getAttribute('data-block') === '0',
            true);
          if (!block) {
            return;
          }
          const prev = block.previousElementSibling;
          if (!prev || !/^p$/i.test(prev.tagName)) {
            return;
          }
          // 只可能是第一个 span 的时候有问题
          const tag = prev.querySelector('span.tag-span');
          if (tag && !tag.textContent) {
            tag.parentElement.removeChild(tag);
          }
        }, 50);

        return;
      }

      if (e.key.toLowerCase() === 's' && isCtrl(e) && this.props.onSave) {
        this.props.onSave();
        return;
      }

      if (e.keyCode === 9) {
        // Tab
        if (!this.isFocusList()) {
          e.preventDefault();
        }
        return;
      }

      if (this.isShowTagMenu && (e.keyCode === 38 || e.keyCode === 40)) {
        e.preventDefault();
      }

      if (e.keyCode === 40 && !e.shiftKey) {
        this.patchDownKeyForChrome(e);
      }
    },
    handleSelectionChange: () => {
      if (this.state.isFocus) {
        const range = getRange();
        if (range) {
          const container = range.startContainer;
          const targetDom = filterParentElement(container,
            this.editor.vditor.element,
            (dom) => this.isEditorBody(dom.parentElement));
          if (targetDom) {
            this.setState({
              focusIndex: getDomIndexForParent(targetDom) ?? -1,
            });
          } else {
            this.setState({
              focusIndex: -1,
            });
          }
        }
      } else if (this.state.focusIndex !== -1) {
        this.setState({
          focusIndex: -1,
        });
      }
    },
    handleFocusChange: (isFocus) => {
      this.setState((value) => ({
        focusIndex: isFocus ? value.focusIndex : -1,
        isFocus,
      }));
    },
  }
  // 统计词数
  // setWordsNumber = debounce(() => {
  //   if (this.editorRef && this.editorRef.current && this.props.onWordsCountChange) {
  //     this.props.onWordsCountChange(
  //      +this.editorRef.current.querySelector('.vditor-counter')?.innerText ?? 0
  //     );
  //   }
  // }, 800);

  constructor(props) {
    super(props);
    this.state = {
      isFocus: false,
      isInitedEditor: false,
      focusIndex: -1,
    };
    this.tags = [];
  }

  componentDidMount() {
    const { resourceUrl } = this.props;
    this.resourceUrl = resourceUrl;
    this.setTags(this.props.tagList);
    this.initEditor();
  }

  shouldComponentUpdate(nextProps, nextState) {
    let updated = false;
    if (!isEqual(this.props.tagList, nextProps.tagList)) {
      updated = true;
      this.setTags(nextProps.tagList);
    }
    if (nextProps.darkMode !== this.props.darkMode && this.isEditorReady()) {
      if (nextProps.darkMode) {
        this.editor.setTheme('dark', 'dark', 'native');
      } else {
        this.editor.setTheme('classic', 'light', 'pygments');
      }
    }
    if (nextProps.disabled !== this.props.disabled && this.isEditorReady()) {
      // TODO 临时处理 disabled 状态，用于导出图片
      if (nextProps.disabled) {
        this.setEditorDisabled();
      } else if (nextProps.disabled === false) {
        this.setEditorEnable();
      }
    }
    //
    if (nextProps.contentId !== this.props.contentId) {
      // content changed
      // console.log('setValue: ' + nextProps.value);
      this.resourceUrl = nextProps.resourceUrl;
      this.resetValue(nextProps.value);
    }
    if (nextState.isInitedEditor && !this.state.isInitedEditor) {
      updated = true;
    }

    //
    if (updated) {
      return true;
    }
    //
    return false;
  }

  componentWillUnmount() {
    this.unbind();
  }

  setEditorEnable() {
    if (!this.isEditorReady()) {
      return;
    }
    this.editor.enable();
    const pre = this.editor.vditor.element.querySelector('.vditor-ir pre.vditor-reset');
    pre.style.opacity = null;
    pre.style.pointerEvents = null;
  }

  setEditorDisabled() {
    if (!this.isEditorReady()) {
      return;
    }
    this.editor.disabled();
    const pre = this.editor.vditor.element.querySelector('.vditor-ir pre.vditor-reset');
    pre.style.opacity = 1;
    pre.style.pointerEvents = 'none';
  }

  setTags(tagList) {
    const tags = [];
    this.convertToTreeData(tags, tagList);
    this.tags = tags;
  }

  async initEditor() {
    const { darkMode, placeholder } = this.props;
    const cdn = /^https?:\/\//i.test(window.location.origin) ? `${window.location.origin}/libs/wiz-vditor` : `${(window.location.origin + window.location.pathname).replace('/index.html', '')}/libs/wiz-vditor`;
    this.editor = new WizVditor(`editor_${this.timeStamp}`, {
      ...this.props,
      height: this.props.height,
      cache: {
        id: `editor_${this.timeStamp}`,
        enable: false,
      },
      // 未知原因，CDN 必须设置 完整的 http 地址，否则会导致 代码高亮的内容闪烁
      // cdn: `${window.wizConfig.homepage}/libs/wiz-vditor`,
      // cdn: 'https://cdn.jsdelivr.net/npm/vditor@3.3.3',
      cdn,
      after: () => {
        const { onInit, disabled } = this.props;
        if (onInit) {
          onInit(this.editor);
          if (this.waitSetValue) {
            this.resetValue(this.waitSetValue);
            this.waitSetValue = null;
          }
        }
        if (disabled) {
          this.setEditorDisabled();
        }
        // this._removePanelNode();
      },
      input: (text, html) => {
        const { onInput } = this.props;
        // this.setWordsNumber();
        if (onInput) onInput(text, html ?? this.editor.getHTML());
      },
      preview: {
        transform: (html) => {
          // console.log('------------ transform before -----------' + this.resourceUrl);
          // console.log(html);

          const imgReg = /(<img\s+([^>]*\s+)?(data-src|src)=")index_files(\/[^"]*")/ig;
          let newHtml = html.replace(imgReg, (str, m1, m2, m3, m4) => m1 + this.resourceUrl + m4);
          // console.log('------------ transform after -----------');
          // console.log(newHtml);
          newHtml = this.highLightTag(newHtml);

          return newHtml;
        },
        hljs: {
          style: darkMode ? 'native' : 'pygments',
        },
      },
      select: (value) => {
        const { onSelect } = this.props;
        if (onSelect) onSelect(value, this.editor.getValue());
      },
      upload: {
        accept: 'image/*',
        url: '不设置 url 就无法触发 file 回调',
        // linkToImgUrl: '/api/upload/fetch',
        file: async (fileList) => {
          const { onInsertImageFromData } = this.props;
          onInsertImageFromData(fileList);
          return [];
        },
      },
      theme: darkMode ? 'dark' : 'classic',
      placeholder,
      mode: 'ir',
      toolbar: [
        'emoji',
        'headings',
        'bold',
        'italic',
        {
          hotkey: undefined,
          name: 'strike',
        },
        'link',
        '|',
        'list',
        'ordered-list',
        'check',
        'outdent',
        'indent',
        '|',
        'quote',
        'line',
        'code',
        'inline-code',
        'insert-before',
        'insert-after',
        '|',
        'upload',
        'record',
        'table',
        '|',
        'undo',
        'redo',
        '|',
        'fullscreen',
        'edit-mode',
        {
          name: 'more',
          toolbar: [
            'both',
            'code-theme',
            'content-theme',
            'export',
            'outline',
            'preview',
            'format',
            'devtools',
            'info',
            'help',
          ],
        }],
      counter: {
        enable: true,
        type: 'text',
      },
    });
    this.setState({
      isInitedEditor: true,
      isFocus: await window.wizApi.userManager.getSettings('focusMode', false),
    });
    this.bind();
  }

  isEditorReady() {
    return !!this.editor && !!this.editor.vditor && !!this.editor.vditor.lute;
  }

  isEditorBody(dom) {
    return hasClass(dom, 'vditor-reset');
  }

  highLightTag(h) {
    // 需要处理 Vditor 记录光标位置的 <wbr>
    const WBR = '{{wiz-vditor-wbr}}';
    let html = h.replace('<wbr>', WBR);
    html = html.replace(/>([^<>]+)</gm, (value, match1, index) => {
      let wbrIndex = match1.indexOf(WBR);
      let hasRestoreWbr = false;
      let tagCount = 0;
      let canReplaceTag = true;

      const preStr = html.substr(0, index);
      const preDom = preStr.substr(preStr.lastIndexOf('<'));

      // 排除 行内 Code & link & img 标记
      if (/<code( |$)|vditor-ir__link|vditor-ir__marker/ig.test(preDom)) {
        canReplaceTag = false;
      }
      let tagHtml = match1;
      if (canReplaceTag) {
        const match = wbrIndex > -1 ? match1.replace(WBR, '') : match1;
        tagHtml = match.replace(REGEXP_TAG, (...args) => {
          const str = args[0];
          // 修改 REGEXP_TAG 后，需要校对 args[7]
          const tagIndex = args[7];
          const startSpace = str.replace(/^(\s*)\S.*$/g, '$1');
          const endSpace = str.replace(/^.*\S(\s*)$/g, '$1');
          let tag = str.trim();
          const canHighlight = tag !== '#';
          if (wbrIndex > tagIndex && tagIndex + str.length >= wbrIndex) {
            const i = wbrIndex - tagIndex - startSpace.length;
            tag = tag.substring(0, i) + WBR + tag.substr(i);
            hasRestoreWbr = true;
          } else if (wbrIndex > tagIndex) {
            tagCount++;
          }
          if (canHighlight) {
            tag = `<span class="tag-span">${tag}</span>`;
          }
          return `${startSpace}${tag}${endSpace}`;
        });
        if (!hasRestoreWbr && wbrIndex > -1) {
          wbrIndex += tagCount * ('<span class="tag-span"></span>').length;
          tagHtml = tagHtml.substr(0, wbrIndex) + WBR + tagHtml.substr(wbrIndex);
        }
      }

      return `>${tagHtml}<`;
    });

    html = html.replace(/\{\{wiz-vditor-wbr\}\}/g, '<wbr>');
    return html;
  }

  // 触发Vditor隐藏菜单点击事件
  emitVditorTooltipEvent(type) {
    if (this.editor?.vditor.element) {
      const dom = this.editor.vditor.element.querySelector(`.vditor-toolbar .vditor-tooltipped[data-type=${type}]`);
      this.emitClickEvent(dom);
    }
  }

  bind() {
    window.document.addEventListener('selectionchange', this.handler.handleSelectionChange);
    window.wizApi.userManager.on('focusEdit', this.handler.handleFocusChange);
  }

  unbind() {
    window.document.removeEventListener('selectionchange', this.handler.handleSelectionChange);
    window.wizApi.userManager.off('focusEdit', this.handler.handleFocusChange);
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

  resetValue(value) {
    if (!this.isEditorReady()) {
      this.waitSetValue = value;
      return;
    }
    this.editor.setValue(value, true);
    setTimeout(() => {
      // this.setWordsNumber();
      this.focusEnd();
    }, 100);
  }

  emitClickEvent(dom) {
    if (dom) {
      dom.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      }));
    }
  }

  isFocusList() {
    const range = getRange();
    return range
      && range.startContainer.parentElement.tagName.toLowerCase() === 'li'
      && range.startOffset === 0;
  }

  focusEnd() {
    if (this.editor?.vditor.element) {
      const dom = this.editor.vditor.element.querySelector('.vditor-ir .vditor-reset');
      dom.focus();
      const selection = getSelection();
      if (dom.childElementCount > 0 && dom.children[0].tagName.toLowerCase() === 'h1' && this.props.autoSelectTitle) {
        const range = window.document.createRange();
        range.selectNodeContents(dom.children[0].lastChild);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        selection.selectAllChildren(dom);
        selection.collapseToEnd();
      }
    }
  }

  patchDownKeyForChrome(event) {
    // Down (Chrome Patch: 文字 后面跟着 img，img 被自动换行，这时候从该行前面的问题使用 下方向键，无法将光标移动到后面的段落)
    const sel = getSelection();
    let range = getRange();
    try {
      sel.modify('move', 'forward', 'line');
      const rangeNew = getRange;
      if (range.startContainer === rangeNew.startContainer
        && range.startOffset === rangeNew.startOffset) {
        let target = rangeNew.startContainer;
        while (!target.nextSibling) {
          target = target.parentElement;
          if (this.isEditorBody(target)) {
            return;
          }
        }
        if (target.nextSibling) {
          target = target.nextSibling;
          sel.removeAllRanges();
          range = window.document.createRange();
          range.selectNode(target);
          sel.addRange(range);
          sel.collapseToEnd();
        }
      }
    } catch (err) {
      console.error(err);
    }
    event.preventDefault();
  }

  styleRender() {
    return this.state.isFocus && this.state.focusIndex !== -1 ? (
      <style>
        {
          `.editor-container.focus-mode #editor pre.vditor-reset > :nth-child(${this.state.focusIndex}),`
          + `.editor-container.focus-mode #editor pre.vditor-reset > :nth-child(${this.state.focusIndex + 2})`
          + '{ opacity: 0.5; }'
          + `.editor-container.focus-mode #editor pre.vditor-reset > :nth-child(${this.state.focusIndex + 1})`
          + '{ opacity: 1; }'
        }
      </style>
    ) : '';
  }

  render() {
    const { classes, hideBlockType } = this.props;
    return (
      <div
        className={classNames('editor-container', hideBlockType && classes.hideBlockType, {
          'focus-mode': this.state.isFocus,
        })}
      >
        {this.styleRender()}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          id={`editor_${this.timeStamp}`}
          onKeyDown={this.handler.handleEditorKeyDown}
        />
        <HeadingMenu
          editor={this.editor}
          onClick={this.handler.handleHeadingMenuClick}
        />
        <InsertMenu
          editor={this.editor}
          onInsert={this.handler.handleInsert}
        />
        <InsertTagMenu
          editor={this.editor}
          wordList={this.tags}
          onChangeShowState={this.handler.handleChangeTagMenuShowState}
        />
      </div>
    );
  }
}

VditorEditor.propTypes = {
  classes: PropTypes.object.isRequired,
  isMac: PropTypes.bool,
  onInit: PropTypes.func,
  onInput: PropTypes.func,
  onSave: PropTypes.func,
  onSelect: PropTypes.func,
  // onWordsCountChange: PropTypes.func,
  onInsertImage: PropTypes.func,
  onInsertImageFromData: PropTypes.func,
  // onFocusChange: PropTypes.func,
  disabled: PropTypes.bool,
  darkMode: PropTypes.bool,
  // eslint-disable-next-line react/no-unused-prop-types
  value: PropTypes.string,
  contentId: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  resourceUrl: PropTypes.string,
  height: PropTypes.number,
  tagList: PropTypes.object,
  autoSelectTitle: PropTypes.bool,
  hideBlockType: PropTypes.bool,
};

VditorEditor.defaultProps = {
  isMac: false,
  onInit: null,
  onInput: null,
  onSelect: null,
  onSave: null,
  onInsertImage: null,
  onInsertImageFromData: null,
  // onWordsCountChange: null,
  // onFocusChange: null,
  disabled: false,
  darkMode: false,
  value: '',
  placeholder: '',
  resourceUrl: 'wiz://',
  height: undefined,
  tagList: {},
  autoSelectTitle: false,
  hideBlockType: false,
};

export default withStyles(styles)(VditorEditor);
