import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import { injectIntl } from 'react-intl';
//
import CommonHeader from '../components/CommonHeader';

const styles = (theme) => ({
  root: {
    position: 'fixed',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    background: '#fff',
    overflow: 'hidden',
  },
});

class MoodBoard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { classes } = this.props;

    const tileData = [];

    return (
      <div className={classes.root}>
        <CommonHeader />
        <GridList cellHeight={160} className={classes.gridList} cols={4}>
          {tileData.map((tile) => (
            <GridListTile key={tile.img} cols={tile.cols || 1} rows={tile.rows || 1}>
              <img src={tile.img} alt={tile.title} />
            </GridListTile>
          ))}
        </GridList>
      </div>
    );
  }
}

MoodBoard.propTypes = {
  classes: PropTypes.object.isRequired,
};

MoodBoard.defaultProps = {};

export default withStyles(styles)(injectIntl(MoodBoard));
