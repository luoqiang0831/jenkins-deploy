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
exports.ConnectionsManager = void 0;
const vscode = require("vscode");
const jenkinsService_1 = require("./jenkinsService");
const extensionVariables_1 = require("./extensionVariables");
const jenkinsConnection_1 = require("./jenkinsConnection");
class ConnectionsManager {
    constructor() {
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.connections.select", (item) => __awaiter(this, void 0, void 0, function* () {
            yield this.selectConnection(item === null || item === void 0 ? void 0 : item.connection);
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.connections.add", () => __awaiter(this, void 0, void 0, function* () {
            yield this.addConnection();
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.connections.edit", (item) => __awaiter(this, void 0, void 0, function* () {
            yield this.editConnection(item === null || item === void 0 ? void 0 : item.connection);
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.connections.delete", (item) => __awaiter(this, void 0, void 0, function* () {
            yield this.deleteConnection(item === null || item === void 0 ? void 0 : item.connection);
        })));
        this.updateSettings();
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration("jenkins-jack.jenkins.connections")) {
                this.updateSettings();
            }
        });
    }
    get commands() {
        return [
            {
                label: "$(settings)  Connections: Select",
                description: "Select a jenkins host connection to connect to.",
                target: () => __awaiter(this, void 0, void 0, function* () {
                    return vscode.commands.executeCommand("extension.jenkins-jack.connections.select");
                }),
            },
            {
                label: "$(add)  Connections: Add",
                description: "Add a jenkins host connection via input prompts.",
                target: () => __awaiter(this, void 0, void 0, function* () {
                    return vscode.commands.executeCommand("extension.jenkins-jack.connections.add");
                }),
            },
            {
                label: "$(edit)  Connections: Edit",
                description: "Edit a jenkins host's connection info.",
                target: () => __awaiter(this, void 0, void 0, function* () {
                    return vscode.commands.executeCommand("extension.jenkins-jack.connections.edit");
                }),
            },
            {
                label: "$(circle-slash)  Connections: Delete",
                description: "Delete a jenkins host connection from settings.",
                target: () => __awaiter(this, void 0, void 0, function* () {
                    return vscode.commands.executeCommand("extension.jenkins-jack.connections.delete");
                }),
            },
        ];
    }
    get host() {
        return this._host;
    }
    display() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield vscode.window.showQuickPick(this.commands, {
                placeHolder: "Jenkins Jack",
                ignoreFocusOut: true,
            });
            if (undefined === result) {
                return;
            }
            return result.target();
        });
    }
    updateSettings() {
        let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
        let conn;
        for (let c of config.connections) {
            if (c.active) {
                conn = c;
                break;
            }
        }
        if (undefined === conn) {
            throw new Error("You must select a host connection to use the plugin's features");
        }
        if (undefined !== this.host) {
            this.host.dispose();
        }
        this._host = new jenkinsService_1.JenkinsService(jenkinsConnection_1.JenkinsConnection.fromJSON(conn));
    }
    get activeConnection() {
        let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
        for (let c of config.connections) {
            if (c.active) {
                return c;
            }
        }
        return undefined;
    }
    /**
     * Provides an input flow for adding in a host to the user's settings.
     */
    addConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
            let conn = yield this.getConnectionInput();
            if (undefined === conn) {
                return;
            }
            this._host = new jenkinsService_1.JenkinsService(jenkinsConnection_1.JenkinsConnection.fromJSON(conn));
            // Add the connection to the list and make it the active one
            config.connections.forEach((c) => (c.active = false));
            config.connections.push({
                name: conn.name,
                uri: conn.uri,
                username: conn.username,
                password: conn.password,
                folderFilter: conn.folderFilter,
                active: true,
            });
            vscode.workspace
                .getConfiguration()
                .update("jenkins-jack.jenkins.connections", config.connections, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Jenkins Jack: Host updated to ${conn.name}: ${conn.uri}`);
            // Refresh the connection tree and it's dependent tree views
            vscode.commands.executeCommand("extension.jenkins-jack.tree.connections.refresh");
        });
    }
    /**
     * Provides an input flow for a user to edit a host's connection info.
     * @param conn Optional connection object edit.
     */
    editConnection(conn) {
        return __awaiter(this, void 0, void 0, function* () {
            let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
            if (!conn) {
                let hosts = [];
                for (let c of config.connections) {
                    hosts.push({
                        label: c.name,
                        description: `${c.uri} (${c.username})`,
                        target: c,
                    });
                }
                // Select a connection to edit
                let result = yield vscode.window.showQuickPick(hosts, {
                    ignoreFocusOut: true,
                });
                if (undefined === result) {
                    return;
                }
                conn = result.target;
            }
            // Prompt user to edit the connection fields
            let editedConnection = yield this.getConnectionInput(conn);
            if (undefined === editedConnection) {
                return;
            }
            // If the name of a connection was changed, ensure we update
            // references of pipeline tree items to use the new name
            if (editedConnection.name !== conn.name) {
                let pipelineConfig = yield vscode.workspace.getConfiguration("jenkins-jack.pipeline.tree");
                let pipelineTreeItems = [];
                for (let c of pipelineConfig.items) {
                    if (conn.name === c.hostId) {
                        c.hostId = editedConnection.name;
                    }
                    pipelineTreeItems.push(c);
                }
                yield vscode.workspace
                    .getConfiguration()
                    .update("jenkins-jack.pipeline.tree.items", pipelineTreeItems, vscode.ConfigurationTarget.Global);
            }
            // Update connection and the global config.
            config.connections.forEach((c) => {
                if (c.name === conn.name && undefined !== editedConnection) {
                    // TODO: there has to be a better way as ref assignment doesn't work
                    c.name = editedConnection.name;
                    c.uri = editedConnection.uri;
                    c.username = editedConnection.username;
                    c.password = editedConnection.password;
                    c.folderFilter = editedConnection.folderFilter;
                }
            });
            yield vscode.workspace
                .getConfiguration()
                .update("jenkins-jack.jenkins.connections", config.connections, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand("extension.jenkins-jack.tree.connections.refresh");
        });
    }
    /**
     * User flow for deleting a Jenkins host connection.
     * @param conn Optional connection object to delete.
     */
    deleteConnection(conn) {
        return __awaiter(this, void 0, void 0, function* () {
            let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
            if (!conn) {
                let hosts = [];
                for (let c of config.connections) {
                    hosts.push({
                        label: c.name,
                        description: `${c.uri} (${c.username})`,
                        target: c,
                    });
                }
                let result = yield vscode.window.showQuickPick(hosts, {
                    ignoreFocusOut: true,
                });
                if (undefined === result) {
                    return undefined;
                }
                conn = result.target;
            }
            // Remove connection and update global config.
            let modifiedConnections = config.connections.filter((c) => {
                return c.name !== conn.name;
            });
            yield vscode.workspace
                .getConfiguration()
                .update("jenkins-jack.jenkins.connections", modifiedConnections, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Host "${conn.name} ${conn.uri}" removed`);
            // If this host was active, make the first host in the list active.
            if (conn.active) {
                return yield this.selectConnection(modifiedConnections[0]);
            }
            // Refresh the connection tree and it's dependent tree views
            vscode.commands.executeCommand("extension.jenkins-jack.tree.connections.refresh");
        });
    }
    /**
     * Displays the quicpick host/connection selection list for the user.
     * Active connection is updated in the global config upon selection.
     * If connection already provided, config is just updated and associated
     * treeViews are refreshed.
     */
    selectConnection(conn) {
        return __awaiter(this, void 0, void 0, function* () {
            let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
            if (!conn) {
                let hosts = [];
                for (let c of config.connections) {
                    let activeIcon = c.active ? "$(primitive-dot)" : "$(dash)";
                    hosts.push({
                        label: `${activeIcon} ${c.name}`,
                        description: `${c.uri} (${c.username})`,
                        target: c,
                    });
                }
                let result = yield vscode.window.showQuickPick(hosts, {
                    ignoreFocusOut: true,
                });
                if (undefined === result) {
                    return;
                }
                conn = result.target;
            }
            this._host.dispose();
            this._host = new jenkinsService_1.JenkinsService(jenkinsConnection_1.JenkinsConnection.fromJSON(conn));
            // Update settings with active host.
            for (let c of config.connections) {
                c.active =
                    conn.name === c.name &&
                        conn.uri === c.uri &&
                        conn.username === c.username &&
                        conn.password === c.password;
            }
            vscode.workspace
                .getConfiguration()
                .update("jenkins-jack.jenkins.connections", config.connections, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Jenkins Jack: Host updated to ${conn.name}: ${conn.uri}`);
            // Refresh the connection tree and it's dependent tree views
            vscode.commands.executeCommand("extension.jenkins-jack.tree.connections.refresh");
        });
    }
    getConnectionInput(jenkinsConnection) {
        return __awaiter(this, void 0, void 0, function* () {
            let config = vscode.workspace.getConfiguration("jenkins-jack.jenkins");
            // Have user enter a unique name for the host. If host name already exists, try again.
            let hostName = undefined;
            while (true) {
                hostName = yield vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    prompt: "为你的jenkins连接输入一个唯一的名称(例如:东福)",
                    value: jenkinsConnection === null || jenkinsConnection === void 0 ? void 0 : jenkinsConnection.name,
                });
                if (undefined === hostName) {
                    return undefined;
                }
                if (!config.connections.some((c) => c.name === hostName) ||
                    (jenkinsConnection === null || jenkinsConnection === void 0 ? void 0 : jenkinsConnection.name) === hostName) {
                    break;
                }
                vscode.window.showWarningMessage(`${hostName} 连接已经存在。请重新输入。`);
            }
            let hostUri = yield vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: "请输入Jenkins 的链接地址 (例如http://127.0.0.1:8080)",
                value: jenkinsConnection
                    ? jenkinsConnection.uri
                    : "http://127.0.0.1:8080",
            });
            if (undefined === hostUri) {
                return undefined;
            }
            let username = yield vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: "请输入 Jenkins 的用户名",
                value: jenkinsConnection === null || jenkinsConnection === void 0 ? void 0 : jenkinsConnection.username,
            });
            if (undefined === username) {
                return undefined;
            }
            let password = yield vscode.window.showInputBox({
                ignoreFocusOut: true,
                password: true,
                prompt: `请输入${username} 的 Jenkins 登录密码`,
                value: jenkinsConnection === null || jenkinsConnection === void 0 ? void 0 : jenkinsConnection.password,
            });
            if (undefined === password) {
                return undefined;
            }
            let folderFilter = yield vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: "(可选)只过滤指定文件夹路径下的构建项目(例如:“myfolder”、“myfolder/mysubfolder”)",
                value: jenkinsConnection === null || jenkinsConnection === void 0 ? void 0 : jenkinsConnection.folderFilter,
            });
            if (undefined === folderFilter) {
                return undefined;
            }
            folderFilter = "" !== (folderFilter === null || folderFilter === void 0 ? void 0 : folderFilter.trim()) ? folderFilter : undefined;
            return new jenkinsConnection_1.JenkinsConnection(hostName, hostUri, username, password, true, folderFilter);
        });
    }
}
exports.ConnectionsManager = ConnectionsManager;
//# sourceMappingURL=connectionsManager.js.map