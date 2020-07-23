import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Collapse from '@material-ui/core/Collapse';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
//
import LiteText from './LiteText';
import Icons from '../config/icons';

const useStyles = makeStyles((theme) => ({
  text: {
    color: 'inherit',
    width: 'auto',
  },
  icon: {
    color: 'inherit',
  },
  listItem: {
    color: theme.custom.color.drawerText,
  },
  overflow: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  block: {
    width: theme.spacing(3),
    height: theme.spacing(3),
  },
}));

function TreeView(props) {
  const theme = useTheme();
  const classes = useStyles();
  const {
    data, textClassName, deep, selected,
    itemClassName, className, itemSelectedClassName,
    openIcon, closeIcon,
  } = props;
  //
  const [newData, setNewData] = useState([]);
  const [_selected, setSelected] = useState(null);

  useEffect(() => {
    if (selected !== undefined) {
      setSelected(selected);
    }
  }, [selected]);

  useEffect(() => {
    setNewData(data);
  }, [data]);

  const handleOnChange = (node) => {
    if (props.onChange) {
      props.onChange(node, newData);
    }
  };

  const handleOnClick = (node) => {
    if (selected === undefined) {
      setSelected(node);
    }
    if (props.onNodeClick) {
      props.onNodeClick(node, newData);
    }
  };

  const toggleCollapse = (e, item) => {
    e.stopPropagation();
    const node = item;
    //
    if (item.children && item.children.length) {
      node.open = !node.open;
      setNewData([].concat(newData));
      handleOnChange(node);
    }
    //
    // handleOnClick(node);
  };

  const renderArrowIcon = (node) => {
    const style = {
      marginLeft: deep * theme.spacing(2),
      marginRight: theme.spacing(1),
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };
    if (!node.children || !node.children.length) {
      return <div style={style} className={classes.block} />;
    }
    //
    if (node.open) {
      return (
        <div
          aria-hidden
          style={style}
          onClick={(e) => toggleCollapse(e, node)}
          className={classes.icon}
          role="button"
        >
          {openIcon ?? <Icons.ArrowBottomIcon />}
        </div>
      );
    }
    //
    if (!node.open) {
      return (
        <div
          aria-hidden
          style={style}
          onClick={(e) => toggleCollapse(e, node)}
          className={classes.icon}
          role="button"
        >
          {closeIcon ?? <Icons.ArrowRightIcon />}
        </div>
      );
    }
    return <></>;
  };

  return (
    <div className={className}>
      {newData.map((item) => (
        <List key={item.key} disablePadding>
          {item.title && (
            <ListItem
              button
              selected={_selected?.key === item.key}
              onClick={() => handleOnClick(item)}
              className={classNames(classes.listItem, itemClassName)}
              classes={{
                selected: itemSelectedClassName,
              }}
            >
              {renderArrowIcon(item)}
              <LiteText
                disableTypography
                title={item.title}
                className={classNames(classes.text, classes.overflow, textClassName)}
              >
                {item.title}
              </LiteText>
            </ListItem>
          )}
          {item.children && item.children.length > 0 && (
            <Collapse in={!!item.open} timeout="auto" unmountOnExit>
              <TreeView
                selected={_selected}
                onNodeClick={handleOnClick}
                onChange={handleOnChange}
                data={item.children}
                textClassName={textClassName}
                itemClassName={itemClassName}
                itemSelectedClassName={itemSelectedClassName}
                deep={deep + 1}
                openIcon={openIcon}
                closeIcon={closeIcon}
              />
            </Collapse>
          )}
        </List>
      ))}
    </div>
  );
}

TreeView.propTypes = {
  data: PropTypes.array,
  onChange: PropTypes.func,
  onNodeClick: PropTypes.func,
  className: PropTypes.string,
  itemClassName: PropTypes.string,
  textClassName: PropTypes.string,
  itemSelectedClassName: PropTypes.string,
  deep: PropTypes.number,
  selected: PropTypes.object,
  openIcon: PropTypes.object,
  closeIcon: PropTypes.object,
};

TreeView.defaultProps = {
  data: [],
  onChange: null,
  onNodeClick: null,
  className: '',
  itemClassName: '',
  textClassName: '',
  itemSelectedClassName: '',
  deep: 0,
  selected: undefined,
  openIcon: undefined,
  closeIcon: undefined,
};

export default TreeView;
