import moment from 'moment';

function formatDateString(date, intl) {
  const aYearAgo = moment(new Date()).add(-1, 'y');
  const dateText = moment(date).isBefore(aYearAgo)
    ? moment(date).format(intl.formatMessage({ id: 'dateOverAYear' }))
    : moment(date).fromNow();
  return dateText;
}

export default {
  formatDateString,
};
