class EventCenter {
  constructor() {
    this.listeners = {};
  }


  on(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].push(callback);
    } else {
      this.listeners[eventName] = [callback];
    }
  }

  off(eventName, callback) {
    if (this.listeners[eventName]) {
      const index = this.listeners[eventName].findIndex((item) => item === callback);
      if (index >= 0) {
        this.listeners[eventName].splice(index, 1);
      }
    }
  }

  dispatch(eventName, ...params) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((cb) => cb(...params));
    }
  }
}


export const eventCenter = new EventCenter();
export const eventMap = {
  SEARCH: 'search',
  STAR_NOTE: 'starNote',
  SYNC: 'sync',
  FOCUS_MODE: 'focusMode',
  TYPEWRITER_MODE: 'typewriterMode',
  WORDS_NUMBER: 'wordsNumber',
  OUTLINE: 'outline',
  WIKILINK: 'wikiline',
};
