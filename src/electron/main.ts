import { app, BrowserWindow, Menu, ipcMain, Tray, nativeImage } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, '../../public/favicon.ico'),
        show: false // Don't show window initially
    });

    const startUrl = isDev
        ? 'http://localhost:4200'
        : `file://${path.join(__dirname, '../../dist/sentry-bot/browser/index.html')}`;

    mainWindow.loadURL(startUrl);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.on('minimize', () => {
        mainWindow?.hide();
    });

    mainWindow.on('close', (event: any) => {
        if (mainWindow?.isVisible()) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });

    createTray();
};

const createTray = () => {
    // Use a simple icon for tray
    const trayIcon = nativeImage.createFromPath(
        path.join(__dirname, '../../public/favicon.ico')
    );

    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Hide',
            click: () => {
                if (mainWindow) {
                    mainWindow.hide();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Exit',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);

    // Show window when tray icon is clicked
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
};

// Setup auto-launch on Windows startup
const setupAutoLaunch = () => {
    if (process.platform === 'win32') {
        const exePath = app.getPath('exe');
        const AutoLaunch = require('auto-launch');

        const autoLauncher = new AutoLaunch({
            name: 'Sentry Bot',
            path: exePath
        });

        // Check and enable auto-launch
        autoLauncher.isEnabled().then((isEnabled: boolean) => {
            if (!isEnabled) {
                autoLauncher.enable();
            }
        });
    }
};

app.on('ready', () => {
    createWindow();
    setupAutoLaunch();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC Handlers
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('minimize-window', () => {
    mainWindow?.minimize();
});

ipcMain.handle('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow?.restore();
    } else {
        mainWindow?.maximize();
    }
});

ipcMain.handle('close-window', () => {
    mainWindow?.close();
});
