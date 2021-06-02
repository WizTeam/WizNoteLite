import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
//
import { withStyles, withTheme } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import IconButton from '@material-ui/core/IconButton';
import Grow from '@material-ui/core/Grow';
//
// import SyncingIcon from './SyncingIcon';
import LiteText from './LiteText';
import Icons from '../config/icons';
import dateUtils from '../utils/date';

const styles = (theme) => ({
  selectedItem: {
    backgroundColor: `${theme.custom.background.noteListActive} !important`,
    '&:after': {
      display: 'none !important',
    },
  },
  selectedItem_green: {
    backgroundColor: `${theme.custom.background.contentGreen} !important`,
  },
  selectedItem_yellow: {
    backgroundColor: `${theme.custom.background.contentYellow} !important`,
  },
  toolIcon: {
    width: 24,
    height: 24,
    padding: 2,
    '& .MuiSvgIcon-root': {
      width: 20,
      height: 20,
    },
  },
  itemHeader: {
    display: 'flex',
    width: '100%',
  },
  itemToolBar: {
    display: 'none',
  },
  fixedItemToolBar: {
    display: 'flex',
  },
  listItem: {
    minHeight: 82,
    flexWrap: 'wrap',
    padding: theme.spacing(2, 3, 2, 3),
    '&:after': {
      display: 'block',
      content: '""',
      width: `calc(100% - 48px)`,
      height: 1,
      background: theme.custom.color.hr,
      position: 'absolute',
      left: '50%',
      bottom: -1,
      transform: 'translateX(-50%)',
    },
    '&:last-child:after': {
      display: 'none',
    },
    '&:hover $itemToolBar': {
      display: 'flex',
    },
    '&:hover $fixedItemToolBar': {
      display: 'none',
    },
  },
  noteTitle: {
    fontSize: 16,
    letterSpacing: 1,
    color: theme.custom.color.noteTitle,
    lineHeight: '1.5',
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': '2',
    overflow: 'hidden',
  },
  noteDate: {
    marginTop: theme.spacing(1),
    fontSize: 12,
    letterSpacing: 1,
    color: theme.custom.color.noteDate,
  },
  noteAbstract: {
    lineHeight: 1.5,
    color: theme.custom.color.noteAbstract,
    marginTop: theme.spacing(1),
    fontSize: 14,
  },
  activeStarIcon: {
    color: theme.custom.color.activeStarIcon,
  },
  defaultStarIcon: {
    stroke: theme.custom.color.defaultStarIcon,
    color: theme.custom.color.defaultStarIcon,
  },
});

class NoteListItem extends React.Component {
  handler = {
    handleStarNote: (e, note) => {
      e.stopPropagation();
      const { kbGuid } = this.props;
      window.wizApi.userManager.setNoteStarred(kbGuid, note.guid, true, note);
    },

    handleCancelStarNote: (e, note) => {
      e.stopPropagation();
      const { kbGuid } = this.props;
      window.wizApi.userManager.setNoteStarred(kbGuid, note.guid, false, note);
      this.props.onCancelStarNote(note);
    },
  };

  renderItem() {
    const {
      classes,
      selected,
      note,
      // onSync,
      intl,
      theme, backgroundType,
      onSelectNote,
      onShowContextMenu,
      dateType,
    } = this.props;
    //
    const isLite = theme.palette.type !== 'dark';
    const backgroundColorClassName = `selectedItem_${backgroundType}`;
    const selectedBackgroundClass = isLite ? (classes[backgroundColorClassName] ?? '') : '';

    const date = dateType === 'modified' ? note.modified : note.created;
    const dateText = dateUtils.formatDateString(date, intl);
    //
    return (
      <ListItem
        alignItems="flex-start"
        key={note.guid}
        button
        disableRipple
        selected={selected}
        className={classNames(
          classes.listItem,
          selected ? classes.selectedItem : '',
          selected ? selectedBackgroundClass : '',
        )}
        onClick={
          () => onSelectNote(note)
        }
        onContextMenu={
          (event) => {
            onSelectNote(note);
            onShowContextMenu(event, note);
          }
        }
      >
        <div className={classes.itemHeader}>
          <LiteText
            className={classes.noteTitle}
            highlightText={note.highlight ? note.highlight.title.join('') : ''}
          >
            {note.title}
          </LiteText>
          <div className={classes.itemToolBar}>
            {!!note.starred && (
              <IconButton
                title={intl.formatMessage({ id: 'buttonCancelStar' })}
                onClick={(e) => this.handler.handleCancelStarNote(e, note)}
                className={classes.toolIcon}
              >
                <Icons.ActiveStarIcon className={classes.activeStarIcon} />
              </IconButton>
            )}
            {!note.starred && (
              <IconButton
                title={intl.formatMessage({ id: 'buttonStar' })}
                onClick={(e) => this.handler.handleStarNote(e, note)}
                className={classes.toolIcon}
              >
                <Icons.DefaultStarIcon className={classes.defaultStarIcon} />
              </IconButton>
            )}
          </div>
          <div className={classes.fixedItemToolBar}>
            {!!note.starred && (
              <IconButton
                className={classes.toolIcon}
              >
                <Icons.ActiveStarIcon className={classes.activeStarIcon} />
              </IconButton>
            )}
          </div>
        </div>
        {note.highlight && (
          <LiteText
            className={classes.noteAbstract}
            highlightText={note.highlight ? note.highlight.text.join('') : ''}
          >
            {note.abstract}
          </LiteText>
        )}
        <LiteText className={classes.noteDate}>{dateText}</LiteText>
      </ListItem>
    );
  }

  render() {
    const { animation } = this.props;
    //
    const item = this.renderItem();
    //
    if (animation === 'enter') {
      return <Grow in>{item}</Grow>;
    }
    //
    return item;
  }
}

NoteListItem.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  backgroundType: PropTypes.string,
  kbGuid: PropTypes.string,
  note: PropTypes.object.isRequired,
  dateType: PropTypes.string,
  selected: PropTypes.bool,
  onSelectNote: PropTypes.func.isRequired,
  onShowContextMenu: PropTypes.func.isRequired,
  onCancelStarNote: PropTypes.func.isRequired,
  animation: PropTypes.string,
};

NoteListItem.defaultProps = {
  backgroundType: 'white',
  kbGuid: null,
  selected: false,
  dateType: 'modify',
  animation: '',
};

export default withTheme(withStyles(styles)(injectIntl(NoteListItem)));
