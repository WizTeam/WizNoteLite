const childProcess = require('child_process');
const path = require('path');
const os = require('os');

const electronVersion = process.versions.electron;
console.log(`electron version: ${electronVersion}`);
const spawn = childProcess.spawn;

const buildIA32 = process.argv.indexOf('--ia32') !== -1;

class OutputData {
  constructor() {
    this.data = '';
  }

  add(o) {
    this.data += o;
    for (;;) {
      const index = this.data.indexOf('\n');
      if (index === -1) {
        break;
      }
      const sub = this.data.substr(0, index);
      console.log(sub);
      this.data = this.data.substr(index + 1);
    }
  }

  end() {
    console.log(this.data);
  }
}

const output = new OutputData();
const errorOutput = new OutputData();

function exec(app, args, options, callback) {
  const command = spawn(app, args, options);

  command.stdout.on('data', (data) => {
    output.add(data);
  });

  command.stderr.on('data', (data) => {
    errorOutput.add(data);
  });

  command.on('close', (code) => {
    output.end();
    errorOutput.end();
    //
    console.log(`child process exited with code ${code}`);
    callback(code);
  });
}

const cwd = path.join(__dirname, '../src/main/sqlite3');
const env = Object.assign(process.env, {
  HOME: path.join(os.homedir(), '.electron-gyp'),
});

if (process.platform === 'win32') {
  const params = [
    `/C`,
    `node-gyp`,
    `--target=${electronVersion}`,
    `rebuild`,
    '--dist-url=https://electronjs.org/headers',
  ];
  if (buildIA32) {
    params.push('--arch=ia32');
    console.log('build for ia32');
  }
  exec(`cmd.exe`, params, {
    cwd,
    env,
  }, () => {
    process.exit(0);
  });
} else {
  exec(`node-gyp`, [
    `--target=${electronVersion}`,
    `rebuild`,
    '--dist-url=https://electronjs.org/headers',
  ], {
    cwd,
    env,
  }, () => {
    process.exit(0);
  });
}
