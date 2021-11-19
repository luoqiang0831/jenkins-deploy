"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionsTreeItem = exports.ConnectionsTreeProvider = exports.ConnectionsTree = void 0;
const vscode = require("vscode");
const extensionVariables_1 = require("./extensionVariables");
const utils_1 = require("./utils");
class ConnectionsTree {
    constructor() {
        this._treeViewDataProvider = new ConnectionsTreeProvider();
        this._treeView = vscode.window.createTreeView('connectionsTree', { treeDataProvider: this._treeViewDataProvider, canSelectMany: true });
        this._treeView.onDidChangeVisibility((e) => {
            if (e.visible) {
                this.refresh();
            }
        });
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand('extension.jenkins-jack.tree.connections.settings', () => __awaiter(this, void 0, void 0, function* () {
            yield vscode.commands.executeCommand('workbench.action.openSettingsJson');
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand('extension.jenkins-jack.tree.connections.refresh', () => {
            this.refresh();
            // ext.pipelineTree.refresh();
            extensionVariables_1.ext.jobTree.refresh();
            extensionVariables_1.ext.nodeTree.refresh();
        }));
    }
    refresh() {
        this._treeViewDataProvider.refresh();
    }
}
exports.ConnectionsTree = ConnectionsTree;
class ConnectionsTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.updateSettings();
    }
    updateSettings() {
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let config = vscode.workspace.getConfiguration('jenkins-jack.jenkins');
            let list = [];
            for (let c of config.connections) {
                list.push(new ConnectionsTreeItem(c.name, c));
            }
            resolve(list);
        }));
    }
}
exports.ConnectionsTreeProvider = ConnectionsTreeProvider;
class ConnectionsTreeItem extends vscode.TreeItem {
    constructor(label, connection) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.connection = connection;
        this.contextValue = connection.active ? 'connectionsTreeItemActive' : 'connectionsTreeItemInactive';
        let iconPrefix = connection.active ? 'connection-active' : 'connection-inactive';
        this.iconPath = {
            light: utils_1.filepath('images', `${iconPrefix}-light.svg`),
            dark: utils_1.filepath('images', `${iconPrefix}-dark.svg`),
        };
    }
    // @ts-ignore
    get tooltip() {
        return '';
    }
    // @ts-ignore
    get description() {
        return `${this.connection.uri} (${this.connection.username})`;
    }
}
exports.ConnectionsTreeItem = ConnectionsTreeItem;
//# sourceMappingURL=connectionsTree.js.map