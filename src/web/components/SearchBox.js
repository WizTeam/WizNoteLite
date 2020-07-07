import React from 'react';
import classNames from 'classnames';
import { injectIntl } from 'react-intl';
import { fade, withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import InputBase from '@material-ui/core/InputBase';
import Icons from '../config/icons';

const styles = (theme) => ({
  search: {
    display: 'flex',
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    // marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    alignItems: 'center',
    padding: '0 4px 0 8px',
    [theme.breakpoints.up('sm')]: {
      // marginLeft: theme.spacing(3),
      // width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 1),
    height: '100%',
  },
  clearIconButton: {
    padding: 4,
    width: 24,
    height: 24,
  },
  clearIcon: {
    width: 16,
    height: 16,
  },
  inputRoot: {
    color: 'inherit',
    flexGrow: 1,
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    // paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      // width: '20ch',
    },
    height: 16,
  },
});

class SearchBox extends React.Component {
  handler = {
    onCompositionStart: () => {
      this.compositing = true;
    },
    onCompositionEnd: () => {
      setTimeout(() => {
        this.compositing = false;
      }, 100);
    },
    handleSearchKeyDown: async (event) => {
      if (event.keyCode !== 13) {
        return;
      }
      //
      if (this.compositing) {
        return;
      }
      //
      if (this.props.onSearch) {
        this.setState({ isSearching: true });
        try {
          await this.props.onSearch(this.state.searchText);
        } finally {
          this.setState({ isSearching: false });
        }
      }
    },
    handleChangeText: (event) => {
      const searchText = event.target.value;
      this.setState({
        searchText,
      });
    },
    handleClear: () => {
      this.setState({ searchText: '' }, () => {
        if (this.inputRef && this.inputRef.current) {
          this.inputRef.current.focus();
        }
      });
      if (this.props.onClear) {
        this.props.onClear();
      }
    },
    handleInputBlur: () => {
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      isSearching: false,
    };
    this.inputNode = null;
    this.inputRef = React.createRef();
    this.compositing = false;
  }

  componentDidMount() {
    if (this.inputNode) {
      this.inputNode.addEventListener('compositionstart', this.handler.onCompositionStart);
      this.inputNode.addEventListener('compositionend', this.handler.onCompositionEnd);
    }
  }

  //
  componentWillUnmount() {
    if (this.inputNode) {
      this.inputNode.removeEventListener('compositionstart', this.handler.onCompositionStart);
      this.inputNode.removeEventListener('compositionend', this.handler.onCompositionEnd);
    }
  }

  render() {
    const { classes, className, intl } = this.props;
    const { searchText, isSearching } = this.state;
    return (
      <div className={classNames(classes.search, className)}>
        <InputBase
          placeholder={intl.formatMessage({ id: 'placeholderSearch' })}
          classes={{
            root: classes.inputRoot,
            input: classes.inputInput,
          }}
          ref={(node) => {
            this.inputNode = node;
          }}
          inputRef={this.inputRef}
          autoFocus
          inputProps={{ 'aria-label': 'search' }}
          onBlur={this.handler.handleInputBlur}
          onChange={this.handler.handleChangeText}
          onKeyDown={this.handler.handleSearchKeyDown}
          value={searchText}
        />
        <div className={classes.searchIcon}>
          {isSearching && <CircularProgress size={16} />}
        </div>
        {!isSearching && (
          <IconButton className={classes.clearIconButton} onClick={this.handler.handleClear}>
            <Icons.ClearIcon className={classes.clearIcon} />
          </IconButton>
        )}
      </div>
    );
  }
}


SearchBox.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  className: PropTypes.string,
  onSearch: PropTypes.func,
  onClear: PropTypes.func,
};

SearchBox.defaultProps = {
  className: null,
  onSearch: null,
  onClear: null,
};


export default withStyles(styles)(injectIntl(SearchBox));
