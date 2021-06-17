import assert from 'assert';

import {
  boxUtils, blockUtils,
} from 'live-editor/client';

function getPrefixInfo(detail, prefix) {
  const block = detail.startBlock;
  if (!block || !prefix) {
    return {
      index: -1,
      keywords: '',
      count: 0,
      maxCount: 0,
    };
  }
  //
  assert(block);
  //
  const data = blockUtils.saveData(block).text;
  assert(data);
  assert(detail.startOffset !== undefined);
  const left = data.split(detail.startOffset)[0].toPlainText();
  if (left.endsWith('   ')) { // 3 spaces
    return {
      index: -1,
      keywords: '',
      count: 0,
      maxCount: 0,
    };
  }
  const index = left.lastIndexOf(prefix);
  if (index === -1) {
    return {
      index: -1,
      keywords: '',
      count: 0,
      maxCount: 0,
    };
  }
  const keywords = left.substr(index + 1);
  const count = detail.startOffset - index;
  const afterPrefix = data.split(index)[1];
  let endIndex = afterPrefix.toPlainText().indexOf(' ');
  if (endIndex === -1) {
    endIndex = afterPrefix.toPlainText().length;
  }
  //
  return {
    index,
    keywords,
    count,
    maxCount: endIndex,
  };
}

function insertImage(editor) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach((file) => {
        editor.insertImage(null, file, -2);
      });
      input.files = null;
      input.value = '';
    }
    input.remove();
  };
  input.click();
}

let insertMenuList = [];

// eslint-disable-next-line import/prefer-default-export
export function setInsertMenuList(list) {
  insertMenuList = list;
}

const quickInsertBlock = {
  createNode: (editor, data) => ({
    classes: ['box-quick-insert'],
    children: [
      {
        type: 'text',
        text: data.text,
      },
    ],
  }),
  getItems: async (editor, keywords) => {
    assert(editor);
    //
    if (!keywords) {
      return insertMenuList;
    }
    return insertMenuList.filter((menu) => menu.id.toLowerCase().indexOf(keywords.toLowerCase()) !== -1);
  },
  supportMarkdown: true,
  prefix: '+',
  handleBoxItemSelected(editor, item) {
    let detail = editor.getSelectionDetail();
    if (!detail.startBlock) {
      const lastSelectionState = editor.saveSelectionState();
      if (lastSelectionState) {
        editor.restoreSelectionState(lastSelectionState);
        detail = editor.getSelectionDetail();
      }
    }
    assert(detail.startBlock);
    assert(detail.startBlock === detail.endBlock);
    const { index, maxCount } = getPrefixInfo(detail, '+');
    if (index !== -1) {
      editor.deleteBlockText(detail.startBlock, index, index + maxCount);
      switch (item.id) {
        case 'link':
          editor.executeTextCommand('link');
          break;
        case 'checkBox':
          editor.executeBlockCommand('toCheckbox');
          break;
        case 'table':
          editor.insertTable(-2, 4, 4);
          break;
        case 'image':
          insertImage(editor);
          break;
        case 'codeBlock':
          editor.insertCode(-2);
          break;
        default:
          break;
      }
    }
  },
};

boxUtils.registerBoxType('quick-insert', quickInsertBlock);
