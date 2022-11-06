
var thinkjs = require('thinkjs');
var path = require('path');
const {Socketmanager} = require("../src/home/controller/socketmanager");

var rootPath = path.dirname(__dirname);

var instance = new thinkjs({
  APP_PATH: rootPath + path.sep + 'app',
  RUNTIME_PATH: rootPath + path.sep + 'runtime',
  ROOT_PATH: rootPath,
  RESOURCE_PATH: __dirname,
  env: 'development'
});

// Build code from src to app directory.
instance.compile({
	log: true,
	presets: [],
	plugins: []
});
const socketManager = new Socketmanager()
socketManager.startWebsocket()
instance.run();




