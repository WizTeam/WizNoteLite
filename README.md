# WizNote Lite

```bash
git clone https://github.com/WizTeam/WizNoteLite.git
cd WizNoteLite
```

**注意**：windows下面cmd或者power shell，需要使用管理员身份运行

## 安装依赖

```bash
npm install -g foreman
npm install -g node-gyp
```

## windows 依赖

1. 安装 Python [https://www.python.org/]，并且把 Python.exe 的目录设置在系统的 Path 内
2. [https://github.com/nodejs/node-gyp#on-windows] 按照操作安装组件(Cmd or PowerShell `run as Administrator`)
  
  > npm install --global --production windows-build-tools
  > 注意，该过程时间比较长，等待即可

## 初始化

```bash
npm install
```

### 编译sqlite

### 每次运行"npm install"后，也运行这条命令

参考: [使用 Node 原生模块](https://www.electronjs.org/docs/tutorial/using-native-node-modules)

```bash
./node_modules/.bin/electron ./tools/build_sqlite3
```

windows:

```bash
.\node_modules\.bin\electron ./tools/build_sqlite3
```

## 运行

npm start

## debug

1. 在命令行执行`npm run react-start`
2. 点击VScode调试 (Debug Main Process)，可以调试main process
3. 调试renderer process，直接用浏览器即可

## package

```bash
npm run pack
```

## License

[MIT or commercial.](./LICENSE.txt)

## TODO
