import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const useStyles = makeStyles(() => ({
  editorContents: {
    display: 'none',
    width: '30%',
    '&.active': {
      display: 'block',
    },
  },
}));

function EditorContents(props) {
  const classes = useStyles();

  const [isShow] = useState(true);

  return (
    <div className={classNames(classes.editorContents, {
      active: isShow,
    })}
    >
      {props.intl.formatMessage({ id: 'editorContents' })}
    </div>
  );
}

EditorContents.propTypes = {
  intl: PropTypes.object.isRequired,
};

EditorContents.defaultProps = {
};

export default injectIntl(EditorContents);
