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

  const [isSyncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [currentNote, setCurrentNote] = useState(props.note);

  async function handleClick() {
    try {
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
    function handleUploadNote(kbGuid, note) {
      if (note.guid === props.note.guid) {
        setCurrentNote(note);
      }
    }

    function handleModifyNote(kbGuid, note) {
      if (note.guid === props.note.guid) {
        setCurrentNote(note);
      }
    }

    setCurrentNote(props.note);
    window.wizApi.userManager.on('modifyNote', handleModifyNote);
    window.wizApi.userManager.on('uploadNote', handleUploadNote);
    window.wizApi.userManager.on('syncStart', handleSyncStart);
    window.wizApi.userManager.on('syncFinish', handleSyncFinish);

    return () => {
      window.wizApi.userManager.off('modifyNote', handleModifyNote);
      window.wizApi.userManager.off('uploadNote', handleUploadNote);
      window.wizApi.userManager.off('syncStart', handleSyncStart);
      window.wizApi.userManager.off('syncFinish', handleSyncFinish);
    };
  }, [props.note, props.intl]);

  const isLocalUser = window.wizApi.userManager.currentUser.isLocalUser;
  const isLoggedIn = !isLocalUser;
  //
  const isSynced = currentNote?.version >= 0;

  function infoRender() {
    //
    let message;
    if (isLoggedIn) {
      if (isSynced) {
        message = props.intl.formatMessage({ id: 'editorFooterSynced' });
      } else {
        const modifiedTime = dateUtils.formatDateString(currentNote.modified, props.intl);
        message = props.intl.formatMessage({ id: 'editorFooterLocalChanged' }, {
          modifiedTime,
        });
      }
    } else {
      message = props.intl.formatMessage({ id: 'editorFooterLocalUser' });
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

  let icon = null;
  if (err) {
    icon = <Icons.UploadErrorIcon className={props.iconClassName} />;
  } else {
    // eslint-disable-next-line no-lonely-if
    if (isSynced) {
      icon = (
        <Icons.SelectedIcon
          className={props.iconClassName}
        />
      );
    } else if (syncing) {
      icon = <SyncingIcon />;
    } else {
      icon = <Icons.UploadIcon className={props.iconClassName} />;
    }
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
            {icon}
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
