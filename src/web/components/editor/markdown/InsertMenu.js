import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import LiteMenu from './LiteMenu';
import Icons from '../../../config/icons';
import {
  isCtrl, getCodeFromRange, getTagSpanFromRange, getPositionForWin,
} from '../libs/dom_utils';
import { getRange } from '../libs/range_utils';

class InsertMenu extends React.Component {
  handler = {
    handleDocumentClick: () => {
      this.setState({ open: false });
    },

    handleEditorKeydown: (e) => {
      if (e.isComposing) {
        return;
      }
      const { open } = this.state;
      const isInTag = getTagSpanFromRange(this.editor.vditor.element);
      const isInCode = getCodeFromRange(this.editor.vditor.element);
      const showInsertMenu = !isInTag && !isInCode;
      const menuList = showInsertMenu ? this.filterMenuItems(e) : [];
      if ((menuList === null || menuList.length === 0) && open) {
        this.setState({ open: false });
      } else if (menuList && menuList.length > 0 && !open) {
        this.setState({
          open: true,
          menuList: [
            {
              label: this.props.intl.formatMessage({ id: 'editorMenuLabel' }),
              type: 'head',
            },
            ...menuList,
          ],
        });
      }
    },

    handleInsertObject: (name) => {
      const range = getRange();
      range.setStart(range.startContainer, range.startOffset - this._filterText.length - 1);
      range.deleteContents();
      if (this.props.onInsert) {
        this.props.onInsert(name);
      }
      this.setState({ open: false });
    },
  }

  constructor(props) {
    super(props);
    this.editor = null;
    this.state = {
      menuList: [],
    };
  }

  componentDidUpdate() {
    this.bind();
    if (this.props.editor && !this.editor) {
      this.editor = this.props.editor;
      this.editor.vditor.element.addEventListener('keydown', this.handler.handleEditorKeydown);
      //
      const { intl } = this.props;
      this._menuList = [
        // {
        //   key: 'connect',
        //   onClick: () => {},
        //   icon: <Icons.ConnectIcon />,
        //   label: intl.formatMessage({ id: 'editorMenuConnect' }),
        // },
        {
          key: 'link',
          onClick: () => this.handler.handleInsertObject('link'),
          icon: <Icons.ALinkIcon />,
          label: intl.formatMessage({ id: 'editorMenuLink' }),
        },
        {
          key: 'checkBox',
          onClick: () => this.handler.handleInsertObject('check'),
          icon: <Icons.TodoListIcon />,
          label: intl.formatMessage({ id: 'editorMenuTodoList' }),
        },
        {
          key: 'table',
          onClick: () => this.handler.handleInsertObject('table'),
          icon: <Icons.TableIcon />,
          label: intl.formatMessage({ id: 'editorMenuTable' }),
        },
        {
          key: 'image',
          onClick: () => this.handler.handleInsertObject('image'),
          icon: <Icons.ImageIcon />,
          label: intl.formatMessage({ id: 'editorMenuImage' }),
        },
        {
          key: 'codeInline',
          onClick: () => this.handler.handleInsertObject('inline-code'),
          icon: <Icons.InlineCodeIcon />,
          label: intl.formatMessage({ id: 'editorMenuInlineCode' }),
        },
        {
          key: 'codeBlock',
          onClick: () => this.handler.handleInsertObject('code'),
          icon: <Icons.BlockCodeIcon />,
          label: intl.formatMessage({ id: 'editorMenuBlockCode' }),
        },
      ];
      //
    }
    return false;
  }

  componentWillUnmount() {
    this.unbind();
    if (this.editor) {
      this.editor.vditor.element.removeEventListener('keydown', this.handler.handleEditorKeydown);
    }
  }

  getPosition() {
    if (this.state.open) {
      // 左侧栏宽度会变化，而且 还有全屏情况，所以 必须重新获取 editorPosition
      this._editorPosition = getPositionForWin(this.editor.vditor.element);
      const position = this.editor?.getCursorPosition() ?? {
        left: 0,
        top: 0,
      };
      return {
        left: position.left + this._editorPosition.left,
        top: position.top + this._editorPosition.top,
      };
    }
    return undefined;
  }

  filterMenuItems(e) {
    let key = e.key;
    // 兼容 Win10 的 中文输入法
    if (/^Process$/i.test(key)
      && (/^NumpadAdd$/i.test(e.code) || (/^Equal$/i.test(e.code) && e.shiftKey))) {
      key = '+';
    }
    // 输入 / 等同于 +；且 兼容 Win10 的 中文输入法
    if ((key === '/' && !e.altKey && !isCtrl(e))
      || (/^Process$/i.test(key) && (/^NumpadDivide$/i.test(e.code) || (/^Slash$/i.test(e.code) && !e.shiftKey && !e.altKey && !isCtrl(e))))) {
      key = '+';
    }
    //
    if (this.state.open) {
      if (key.toLowerCase() === 'backspace') {
        if (this._filterText.length > 0) {
          this._filterText = this._filterText.substr(0, this._filterText.length - 1);
        } else {
          return null;
        }
      } else {
        this._filterText += key;
      }
      //
      const filterMenu = (filterText = '') => {
        const filter = filterText.toLowerCase();
        if (!filter) {
          return this._menuList;
        }
        return this._menuList.filter((menu) => menu.key.toLowerCase().startsWith(filter));
      };
      //
      return filterMenu(this._filterText);
      //
    } else if (key === '+') {
      this._filterText = '';
      return this._menuList;
    }
    //
    return null;
  }

  bind() {
    this.unbind();
    window.document.addEventListener('click', this.handler.handleDocumentClick);
  }

  unbind() {
    window.document.removeEventListener('click', this.handler.handleDocumentClick);
  }

  render() {
    const { open, menuList } = this.state;
    let editorRoot = null;
    if (this.editor && this.editor.vditor) {
      editorRoot = this.editor.vditor.element;
    }
    return (
      <LiteMenu
        editorRoot={editorRoot}
        show={open}
        keyControl
        menuList={menuList}
        positionName="bottom"
        position={this.getPosition()}
      />
    );
  }
}

InsertMenu.propTypes = {
  editor: PropTypes.object,
  intl: PropTypes.object.isRequired,
  onInsert: PropTypes.func,
};

InsertMenu.defaultProps = {
  editor: null,
  onInsert: null,
};

export default injectIntl(InsertMenu);
