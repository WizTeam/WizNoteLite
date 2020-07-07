class LineReader {
  constructor(text) {
    this.lines = text.split('\n');
    this.index = 0;
  }

  //
  readLine() {
    if (this.index >= this.lines.length) {
      return null;
    }
    //
    const line = this.lines[this.index];
    this.index++;
    return line;
  }
}

module.exports = LineReader;
