import React from 'react';
import PropTypes from 'prop-types';
// import classNames from 'classnames';
import { withStyles, withTheme } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import NoteViewer from '../pages/NoteViewer';
//
const styles = (theme) => ({
  previewBox: {
    width: '100%',
    height: '100%',
    display: 'flex',
  },
  previewSidebar: {
    width: 72,
  },
  previewNoteList: {
    width: 96,
  },
  viewerBox: {
    flex: 1,
  },
});

class PreviewNoteLite extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const {
      classes, theme, color,
      darkMode,
    } = this.props;

    const wizColor = theme.custom.getColorTheme(darkMode);

    const sidebarProps = {
      backgroundColor: wizColor[color].sideDrawer,
    };

    const noteListProps = {
      backgroundColor: wizColor[color].noteList,
    };

    return (
      <div className={classes.previewBox}>
        <div className={classes.previewSidebar} style={sidebarProps} />
        <div className={classes.previewNoteList} style={noteListProps} />
        <div className={classes.viewerBox}>
          <NoteViewer color={color} darkMode={darkMode} padding={0} />
        </div>
      </div>
    );
  }
}

PreviewNoteLite.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  color: PropTypes.string,
  darkMode: PropTypes.bool,
};

PreviewNoteLite.defaultProps = {
  color: 'default',
  darkMode: undefined,
};

export default withTheme(withStyles(styles)(injectIntl(PreviewNoteLite)));
