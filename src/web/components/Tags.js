import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import isEqual from 'lodash/isEqual';
import TreeView from './TreeView';

const styles = (theme) => ({
  root: {
    overflow: 'auto',
    flex: 1,
    marginTop: theme.spacing(4),
  },
  itemText: {
    fontSize: 14,
  },
  listItem: {
    color: theme.custom.color.drawerText,
    maxHeight: 32,
    '&:hover': {
      'background-color': theme.custom.background.sidebarItemHover,
    },
    paddingLeft: 0,
  },
  itemSelected: {
    'background-color': `${theme.custom.background.sidebarItemHover} !important`,
    '&:hover': {
      'background-color': theme.custom.background.sidebarItemHover,
    },
  },
});

class Tags extends React.Component {
  handler = {
    handleTreeChange: (node) => {
      this.treeDataMap[node.key] = node.open;
    },
    handleTreeNodeClick: (node) => {
      if (this.props.onSelected) {
        this.props.onSelected(node);
      }
    },
  };

  treeDataMap = {};

  tagMounted = false;

  constructor(props) {
    super(props);
    this.state = {
      treeData: [],
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(this.props.data, prevProps.data)) {
      this.resetData();
    }
  }

  resetData() {
    const { data, selectedTag } = this.props;
    const treeData = this.convertToTreeData(data);
    if (!this.tagMounted) {
      this.tagMounted = true;
      if (selectedTag) {
        this.openNodeOnPath(treeData);
      }
    }
    this.setState({ treeData });
  }

  openNodeOnPath(data) {
    const { selectedTag } = this.props;
    for (let i = 0; i < data.length; i += 1) {
      const item = data[i];
      if (item.key === selectedTag.key) return true;
      if (item.children && item.children.length > 0) {
        if (this.openNodeOnPath(item.children)) {
          item.open = true;
          return true;
        }
      }
    }
    return false;
  }

  convertToTreeData(data) {
    try {
      const res = [];
      for (const tag in data) {
        if (tag === 'wizName' || tag === 'wizFull') continue;
        if (data[tag]) {
          const item = {
            title: data[tag].wizName,
            key: data[tag].wizFull,
          };
          if (this.treeDataMap[item.key]) {
            item.open = true;
          }
          item.children = this.convertToTreeData(data[tag]);
          res.push(item);
        }
      }
      return res;
    } catch (e) {
      console.log(e);
    }
    return [];
  }

  render() {
    const { treeData } = this.state;
    const { classes, selectedTag } = this.props;
    //
    if (treeData.length === 0) return <div className={classes.root} />;
    //
    return (
      <TreeView
        className={classes.root}
        itemClassName={classes.listItem}
        textClassName={classes.itemText}
        itemSelectedClassName={classes.itemSelected}
        onNodeClick={this.handler.handleTreeNodeClick}
        onChange={this.handler.handleTreeChange}
        selected={selectedTag}
        data={treeData}
        deep={0}
      />
    );
  }
}

Tags.propTypes = {
  classes: PropTypes.object.isRequired,
  data: PropTypes.object,
  onSelected: PropTypes.func,
  selectedTag: PropTypes.object,
};

Tags.defaultProps = {
  data: {},
  onSelected: null,
  selectedTag: null,
};

export default withStyles(styles)(Tags);
