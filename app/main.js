process.defaultApp = true;
const {app, BrowserWindow, Menu, dialog, shell} = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let packageJsonPath = path.join(__dirname, 'package.json');


let packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
app.setVersion(packageJson.version);
app.setName(packageJson.name);
app.setPath('userData', path.join(app.getPath('appData'), packageJson.name))
app.setPath('userCache', path.join(app.getPath('cache'), packageJson.name))
app.setAppPath(__dirname);
app.disableHardwareAcceleration();

app.on('window-all-closed', () => {
	app.quit();
});

app.on('ready', () => {
	const menu = Menu.buildFromTemplate([
		{
			label: 'File',
			submenu: [{role: 'quit'}]
		},
		{
			label: 'Edit',
			submenu: [{role: 'copy'},{role: 'selectall'}]
		},
		{
			label: 'View',
			submenu: [{role: 'toggledevtools'},{type: 'separator'},{role: 'resetzoom'},{role: 'zoomin'},{role: 'zoomout'},{type: 'separator'},{role: 'togglefullscreen'}]
		},
		{
			role: 'window',
			submenu: [{role: 'minimize'},{role: 'close'}]
		},
		{
			label: 'Help',
			submenu: [
				{
					label: 'About',
					click: function() {
						dialog.showMessageBox(mainWindow, {
							type: 'info',
							buttons : ['Selectel Storage Dashboard', 'Application Website', 'Close'],
							defaultId: 2,
							cancelId: 2,
							title: 'About',
							message: [
								'Selectel StorageLogs Parser',
								'Freeware',
								'Version: ' + packageJson.version
							].join("\n"),
							detail: [
								'Author: Valeriy Evstafev',
								'Email: nebel@creatic.pw'
							].join("\n"),
							icon: path.join(__dirname, 'about.png')
						}, function(index) {
							if(index === 0) shell.openExternal('https://my.selectel.ru/storage/containers');
							else if(index === 1) shell.openExternal('https://creatic.pw');
						});
					}
				}
			]
		},
	]);

	Menu.setApplicationMenu(menu);
	
	const options = {
		width: 800,
		height: 600,
		title: 'Selectel StorageLogs Parser',
		icon: path.join(__dirname, 'selectel.ico'),
		autoHideMenuBar: false,
		backgroundColor: '#FFFFFF',
		webPreferences: {
			nodeIntegrationInWorker: true,
			webSecurity: false,
			nodeIntegration: true,
			allowRunningInsecureContent: true
		},
		useContentSize: true
	}

	if(process.platform === 'linux') {
	  options.icon = path.join(__dirname, 'selectel.png')
	}

	mainWindow = new BrowserWindow(options);
	mainWindow.loadURL('file://' + path.join(__dirname, 'index.html'));
	mainWindow.focus();
});