import { app, Menu } from 'electron';

import { DEBUG } from './constants';
import { translator } from './translate';

export function initMenu() {
    const template: any[] = [
        {
            label: translator.translate('MENU_EDIT'),
            submenu: [
                { role: 'undo' },
                { role: 'redo' }
            ]
        },
        {
            role: 'window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        }
    ];

    if (DEBUG) {
        template[1].submenu.push(
            { role: 'reload' }
        );
        template[1].submenu.push(
            { role: 'toggledevtools' }
        );
    }

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services', submenu: [] },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });

        template[3].submenu = [
            { role: 'close' },
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
        ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}