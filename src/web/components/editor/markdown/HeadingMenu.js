import React from 'react';
import PropTypes from 'prop-types';
import LiteMenu from './LiteMenu';
import { getFontBtnStatus, getPositionForWin } from '../libs/dom_utils';

class HeadingMenu extends React.Component {
  handler = {
    handleDocumentClick: (e) => {
      if (this._isHTagClick(e)) {
        const position = getPositionForWin(e.target);
        this.setState({
          open: true,
          menuList: this.producedHMenu(e.target.tagName),
          position: {
            left: position.left - 35,
            top: position.top,
          },
        });
        e.stopPropagation();
      } else {
        this.setState({ open: false });
      }
    },

    handleMenuClick: (name) => {
      if (this.props.onClick) {
        this.props.onClick(name);
      }
      this.setState({ open: false });
    },
  }

  constructor(props) {
    super(props);
    this.editor = null;
    this.state = {
      open: false,
      position: undefined,
      menuList: [],
    };
  }

  componentDidUpdate() {
    this._bind();
    if (this.props.editor && !this.editor) {
      this.editor = this.props.editor;
    }
  }

  componentWillUnmount() {
    this._unbind();
  }

  _isHTagClick(e) {
    return /^h\d$/.test(e.target.tagName.toLowerCase()) && e.offsetX < 0;
  }

  _bind() {
    this._unbind();
    window.document.addEventListener('click', this.handler.handleDocumentClick);
  }

  _unbind() {
    window.document.removeEventListener('click', this.handler.handleDocumentClick);
  }

  producedHMenu(tagName) {
    const menuList = [
      {
        label: 'Headline',
        type: 'head',
      },
      {
        active: false,
        label: 'H1',
        onClick: () => this.handler.handleMenuClick('h1'),
      },
      {
        active: false,
        label: 'H2',
        onClick: () => this.handler.handleMenuClick('h2'),
      },
      {
        active: false,
        label: 'H3',
        onClick: () => this.handler.handleMenuClick('h3'),
      },
      {
        active: false,
        label: 'H4',
        onClick: () => this.handler.handleMenuClick('h4'),
      },
      {
        active: false,
        label: 'H5',
        onClick: () => this.handler.handleMenuClick('h5'),
      },
      // {
      //   active: false,
      //   label: 'H6',
      //   onClick: () => this.handler.handleMenuClick('h6'),
      // },
      {
        label: 'Turn into',
        type: 'head',
      },
      {
        label: 'Text',
        onClick: () => this.handler.handleMenuClick('text'),
      },
      {
        label: 'Quote',
        active: this.props.editor && getFontBtnStatus(this.props.editor.vditor.element, 'quote'),
        onClick: () => this.handler.handleMenuClick('quote'),
      },
      // {
      //   active:
      //     this.props.editor && getFontBtnStatus(this.props.editor.vditor.element, 'toggle'),
      //   label: 'Toggle',
      //   onClick: this.handler.handleMenuClick('toggle'),
      // },
    ];
    const selectMenuItem = menuList.find(
      (item) => item.label.toLowerCase() === tagName.toLowerCase(),
    );
    if (selectMenuItem) {
      selectMenuItem.active = true;
    }
    return menuList;
  }

  render() {
    let editorRoot = null;
    if (this.editor && this.editor.vditor) {
      editorRoot = this.editor.vditor.element;
    }
    return (
      <LiteMenu
        editorRoot={editorRoot}
        show={this.state.open}
        position={this.state.position}
        menuList={this.state.menuList}
        positionName="left"
        type="checkbox"
      />
    );
  }
}

HeadingMenu.propTypes = {
  editor: PropTypes.object,
  onClick: PropTypes.func,
};

HeadingMenu.defaultProps = {
  editor: null,
  onClick: null,
};

export default HeadingMenu;
