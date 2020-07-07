import queryString from 'query-string';

export function getLocale() {
  const params = queryString.parse(window.location.search);
  const lang = params.lang || window.navigator.language;
  return lang;
}

export default {
};
