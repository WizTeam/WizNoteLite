import React from 'react';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import moment from 'moment';
import Icons from '../config/icons';

const useStyles = makeStyles(({ palette }) => ({
  linkMenu: {
    height: 250,
  },
  menuRoot: {
    color: palette.type === 'dark' ? '#fff' : '#333',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    height: '32px',
    width: 150,
  },
  menuItemContent: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    flex: 1,
  },
  linkItemIcon: {
    paddingTop: 5,
  },
}));

function LinkMenu(Props) {
  const classes = useStyles();
  return (
    <Menu
      keepMounted
      open={!!Props.position}
      onClose={Props.onClose}
      anchorReference="anchorPosition"
      anchorPosition={Props.position}
      classes={{
        list: classes.menuRoot,
      }}
      className={classes.linkMenu}
    >
      {Props.list.map((item) => (
        <MenuItem onClick={() => Props.onClickLink(item)} key={item.guid}>
          <Tooltip title={(
            <div>
              <Typography variant="subtitle2" color="inherit">{moment(item.modified).format('YYYY-MM-DD HH:mm')}</Typography>
              {item.tags.length ? (<Typography variant="subtitle2" color="inherit">{item.tags.map((tag) => `#${tag}`).join('  ')}</Typography>) : null}

            </div>
          )}
          >
            <div className={classes.menuItem}>
              <Icons.NoteIcon className={classes.menuItemIcon} />
              <span className={classes.menuItemContent}>
                {item.title}
              </span>
            </div>
          </Tooltip>
        </MenuItem>
      ))}
    </Menu>
  );
}

export default LinkMenu;
