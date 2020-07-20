import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import Icons from '../config/icons';
import dateUtils from '../utils/date';
import SyncingIcon from './SyncingIcon';

const useStyles = makeStyles(({ spacing, palette }) => ({
  syncInfo: {
    minWidth: 150,
    height: '30px',
    lineHeight: '30px',
    padding: spacing(0, 3),
    color: '#aaa',
    boxSizing: 'border-box',
  },
  tooltip: {
    backgroundColor: palette.type === 'dark' ? '#555' : '#fff',
    borderRadius: '4px',
    boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.31)',
  },
  value: {
    marginLeft: spacing(1),
    color: palette.type === 'dark' ? '#f0f0f0' : '#333',
  },
}));

function SyncBtn(props) {
  const classes = useStyles();

  const [updatedTime, setUpdatedTime] = useState('');
  const [isSyncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    try {
      if (isSyncing) {
        return;
      }
      //
      if (props.kbGuid) {
        await window.wizApi.userManager.syncKb(props.kbGuid, {
          manual: true,
        });
      }
    } catch (err) {
      if (err.code === 'WizErrorNoAccount') {
        if (props.onCreateAccount) {
          props.onCreateAccount();
        }
      }
    }
  }

  function handleSyncStart() {
    setSyncing(true);
  }

  function handleSyncFinish(kbGuid, result) {
    setSyncing(false);
    setError(result.error);
  }

  useEffect(() => {
    function handleUploadNote(note) {
      if (note.guid === props.note.guid && note.version >= 0) {
        setUpdatedTime(dateUtils.formatDateString(note.modified, props.intl));
      }
    }

    window.wizApi.userManager.on('uploadNote', handleUploadNote);
    window.wizApi.userManager.on('syncStart', handleSyncStart);
    window.wizApi.userManager.on('syncFinish', handleSyncFinish);

    setUpdatedTime(dateUtils.formatDateString(props.note.modified, props.intl));

    return () => {
      window.wizApi.userManager.off('uploadNote', handleUploadNote);
      window.wizApi.userManager.off('syncStart', handleSyncStart);
      window.wizApi.userManager.off('syncFinish', handleSyncFinish);
    };
  }, [props.note, props.intl]);

  const isLocalUser = window.wizApi.userManager.currentUser.isLocalUser;
  const isLoggedIn = !isLocalUser;

  function infoRender() {
    //
    let message;
    if (isLoggedIn && !error) {
      message = props.intl.formatMessage({ id: 'editorFooterSyncTime' }, {
        updatedTime,
      });
    } else {
      message = props.intl.formatMessage({ id: 'editorFooterLocal' }, {
        updatedTime,
      });
    }
    //
    return (
      <div className={classes.syncInfo}>
        <span className={classes.label}>
          {message}
        </span>
      </div>
    );
  }

  let err = false;
  let syncing = false;
  if (error || !isLoggedIn) {
    err = true;
  } else {
    syncing = isSyncing;
  }

  return (
    <>
      <Tooltip
        title={infoRender()}
        placement="left"
        classes={{
          tooltip: classes.tooltip,
        }}
      >
        <div>
          <IconButton
            className={props.className}
            onClick={handleClick}
          >
            {err && <Icons.UploadIcon className={props.iconClassName} />}
            {(!err && syncing) && <SyncingIcon />}
            {(!err && !syncing) && <Icons.RefreshIcon className={props.iconClassName} />}
          </IconButton>
        </div>
      </Tooltip>
    </>
  );
}

SyncBtn.propTypes = {
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  kbGuid: PropTypes.string,
  note: PropTypes.object,
  intl: PropTypes.object.isRequired,
  onCreateAccount: PropTypes.func,
};

SyncBtn.defaultProps = {
  className: '',
  iconClassName: '',
  kbGuid: '',
  note: null,
  onCreateAccount: null,
};

export default injectIntl(SyncBtn);
