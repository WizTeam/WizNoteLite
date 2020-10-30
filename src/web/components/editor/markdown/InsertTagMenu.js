import React from 'react';
import PropTypes from 'prop-types';
import LiteMenu from './LiteMenu';
import { filterParentElement, getPositionForWin, getTagSpanFromRange } from '../libs/dom_utils';
import { getRange, setRange } from '../libs/range_utils';

class InsertTagMenu extends React.Component {
  handler = {
    handleDocumentClick: () => {
      this.closeMenu();
    },
    handleCompositionstart: () => {
      this.isComposing = true;
    },
    handleCompositionend: () => {
      this.isComposing = false;
      this.showMenu();
    },
    handleEditorInput: (e) => {
      if (!e.data) {
        // 非字符输入时（删除 或 点击 checkbox 等） 不显示Menu
        this.closeMenu();
        return;
      }
      if (this.isComposing) {
        // 中文输入时， 不进行任何处理
        return;
      }
      this.showMenu();
    },
    handleSelectionChange: () => {
      if (!this.state.isShow) {
        // 菜单未显示时，不进行任何操作
        return;
      }
      const range = getRange();
      if (!range || !range.collapsed) {
        return;
      }
      const container = range.startContainer;
      const targetDom = filterParentElement(container,
        this.editor.vditor.element,
        (dom) => dom.parentElement === this.editor.vditor.element);
      if (!targetDom) {
        return;
      }
      this.showMenu();
    },
    insertWord: (word) => {
      const tagSpan = getTagSpanFromRange(this.editor.vditor.element);
      if (tagSpan) {
        tagSpan.innerText = `#${word}#`;
      }
    },
  }

  constructor(props) {
    super(props);
    this.isComposing = false;
    this.state = {
      isShow: false,
      menuList: [],
    };
  }

  componentDidUpdate() {
    if (this.props.editor && !this.editor) {
      this.editor = this.props.editor;
      this.bind();
    }
  }

  componentWillUnmount() {
    this.unbind();
  }

  getPosition() {
    if (this.state.isShow) {
      // 左侧栏宽度会变化，而且 还有全屏情况，所以 必须重新获取 editorPosition
      this.editorPosition = getPositionForWin(this.editor.vditor.element);
      const position = this.editor?.getCursorPosition() ?? {
        left: 0,
        top: 0,
      };
      return {
        left: position.left + this.editorPosition.left,
        top: position.top + this.editorPosition.top,
      };
    }
    return undefined;
  }

  closeMenu() {
    this.unbindForShow();
    this.setState({ isShow: false, menuList: [] });
    const { onChangeShowState } = this.props;
    onChangeShowState(false);
  }

  checkTagSpanAndCloseMenu() {
    const tagSpan = getTagSpanFromRange(this.editor.vditor.element);
    if (!tagSpan) {
      this.closeMenu();
      return false;
    }

    const range = getRange();
    const target = range.startContainer;
    const offset = range.startOffset;
    if (target.nodeType === 3 && target === tagSpan.lastChild
      && offset === target.nodeValue.length) {
      // 避免 在 Tag 结尾添加空格
      const tag = tagSpan.textContent;
      const newTag = tag.replace(/^(#[^#]*#?)(\s*)$/i, '$1');
      const space = tag.substr(newTag.length).replace(' ', '\u00A0');
      if (space) {
        const spaceDom = window.document.createTextNode(space);
        tagSpan.innerText = newTag;
        tagSpan.parentElement.insertBefore(spaceDom, tagSpan.nextSibiling);
        // 需要修正 range
        setRange(spaceDom, space.length);
        this.closeMenu();
        return false;
      }
    }
    return tagSpan;
  }

  showMenu() {
    const tagSpan = this.checkTagSpanAndCloseMenu();
    if (!tagSpan) {
      return;
    }
    const menuList = this.createdMenuList();
    const isShow = !!menuList.length;
    this.setState({
      isShow,
      menuList,
    });
    const { onChangeShowState } = this.props;
    onChangeShowState(isShow);
    this.bindForShow();
  }

  bind() {
    this.unbindForShow();
    this.unbind();
    if (this.editor) {
      const editorBody = this.editor.vditor.element;
      editorBody.addEventListener('input', this.handler.handleEditorInput);
      editorBody.addEventListener('compositionstart', this.handler.handleCompositionstart);
      editorBody.addEventListener('compositionend', this.handler.handleCompositionend);
    }
    window.document.addEventListener('click', this.handler.handleDocumentClick);
  }

  bindForShow() {
    this.unbindForShow();
    window.document.addEventListener('selectionchange', this.handler.handleSelectionChange);
  }

  unbind() {
    if (this.editor) {
      const editorBody = this.editor.vditor.element;
      editorBody.removeEventListener('input', this.handler.handleEditorInput);
      editorBody.removeEventListener('compositionstart', this.handler.handleCompositionstart);
      editorBody.removeEventListener('compositionend', this.handler.handleCompositionend);
    }
    window.document.removeEventListener('click', this.handler.handleDocumentClick);
  }

  unbindForShow() {
    window.document.removeEventListener('selectionchange', this.handler.handleSelectionChange);
  }

  createdMenuList() {
    let result = [];
    const range = getRange();
    const { wordList } = this.props;
    let target = range.startContainer;
    let offset = range.startOffset;
    if (target.nodeType === 1 && offset > 0) {
      target = target.childNodes[offset - 1];
      offset = target.nodeType === 3 ? target.nodeValue.length : target.childNodes.length;
    }
    const tagSpan = getTagSpanFromRange(this.editor.vditor.element, target);
    if (tagSpan) {
      let isAtLast = false;
      if (target === tagSpan && tagSpan.childNodes.length === offset) {
        isAtLast = true;
      } else if (target.nodeType === 3
        && target === tagSpan.lastChild) {
        if (target.nodeValue.length === offset) {
          isAtLast = true;
        } else if (offset > 0) {
          const endSpace = target.nodeValue.substr(offset).trim();
          isAtLast = !endSpace;
        }
      }

      const tag = tagSpan.textContent;
      let keyword = tag.replace(/#/g, '').trim();
      if (/#\s*$/.test(tag) && isAtLast) {
        // #tag# 的情况，如果光标在 # 后面，不弹菜单
        keyword = '';
      }
      if (keyword.length > 0) {
        result = wordList.filter(
          (item) => item.startsWith(keyword),
        ).map((item) => ({
          label: item,
          onClick: () => this.handler.insertWord(item),
        }));
      }
    }

    return result;
  }

  render() {
    const { menuList, isShow } = this.state;
    let editorRoot = null;
    if (this.editor && this.editor.vditor) {
      editorRoot = this.editor.vditor.element;
    }
    return (
      <LiteMenu
        keyControl
        editorRoot={editorRoot}
        menuList={menuList}
        positionName="bottom"
        show={isShow}
        position={this.getPosition()}
      />
    );
  }
}
InsertTagMenu.propTypes = {
  editor: PropTypes.object,
  wordList: PropTypes.array,
  onChangeShowState: PropTypes.func.isRequired,
};
InsertTagMenu.defaultProps = {
  editor: null,
  wordList: [],
};
export default InsertTagMenu;
