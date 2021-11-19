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
exports.HistoryBuildTreeItem = exports.HistoryBuildTreeItemType = exports.HistoryBuildTreeProvider = exports.HistoryBuildTree = void 0;
const vscode = require("vscode");
const extensionVariables_1 = require("./extensionVariables");
const jobType_1 = require("./jobType");
const utils_1 = require("./utils");
class HistoryBuildTree {
    constructor() {
        this._treeViewDataProvider = new HistoryBuildTreeProvider();
        this._treeView = vscode.window.createTreeView("historyBuildTree", {
            treeDataProvider: this._treeViewDataProvider,
            canSelectMany: true,
        });
        this._treeView.onDidChangeVisibility((e) => {
            if (e.visible) {
                this.refresh();
            }
        });
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.tree.historyBuild.refresh", (content) => {
            this.refresh();
        }));
    }
    refresh() {
        this._treeView.title = `最近构建列表 (${extensionVariables_1.ext.connectionsManager.host.connection.name})`;
        this._treeViewDataProvider.refresh();
    }
}
exports.HistoryBuildTree = HistoryBuildTree;
class HistoryBuildTreeProvider {
    // private _config: any;
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._cancelTokenSource = new vscode.CancellationTokenSource();
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration("jenkins-jack.historyProject")) {
                this.updateSettings();
            }
        });
        this.updateSettings();
    }
    updateSettings() {
        // this._config = vscode.workspace.getConfiguration("jenkins-jack.historyProject");
        this.refresh();
    }
    refresh() {
        this._cancelTokenSource.cancel();
        this._cancelTokenSource.dispose();
        this._cancelTokenSource = new vscode.CancellationTokenSource();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            let list = [];
            let projectList = vscode.workspace
                .getConfiguration("jenkins-jack.historyProject")
                .get("list");
            if (!projectList) {
                return false;
            }
            const connUri = (_a = extensionVariables_1.ext.connectionsManager.activeConnection) === null || _a === void 0 ? void 0 : _a.uri;
            for (let project of projectList) {
                let label = `${project.name}  (${project.branch.replace("origin/", "")})`;
                let historyBuildTreeItem = new HistoryBuildTreeItem(label, HistoryBuildTreeItemType.History, vscode.TreeItemCollapsibleState.None, Object.assign({ fullName: project.name, buildable: true, description: "", inQueue: false, type: "default", url: `${connUri}/job/${project.name}/`, branch: project.branch }, project));
                list.push(historyBuildTreeItem);
            }
            resolve(list);
        }));
    }
}
exports.HistoryBuildTreeProvider = HistoryBuildTreeProvider;
var HistoryBuildTreeItemType;
(function (HistoryBuildTreeItemType) {
    HistoryBuildTreeItemType["History"] = "HistoryBuild";
    HistoryBuildTreeItemType["Build"] = "Build";
})(HistoryBuildTreeItemType = exports.HistoryBuildTreeItemType || (exports.HistoryBuildTreeItemType = {}));
class HistoryBuildTreeItem extends vscode.TreeItem {
    constructor(label, type, treeItemState, job, build) {
        super(label, treeItemState);
        this.label = label;
        this.type = type;
        this.treeItemState = treeItemState;
        this.job = job;
        this.build = build;
        let iconPrefix = "history-job";
        if (HistoryBuildTreeItemType.History === type) {
            this.contextValue = "historyBuild";
            if (!job.buildable) {
                iconPrefix = this.contextValue = "job-disabled";
            }
        }
        else {
            iconPrefix = "connection-inactive";
            this.contextValue = [
                jobType_1.JobType.Multi,
                jobType_1.JobType.Org,
                jobType_1.JobType.Pipeline,
            ].includes(job.type)
                ? "build-pipeline"
                : "build";
        }
        this.iconPath = {
            light: utils_1.filepath("images", `${iconPrefix}-light.svg`),
            dark: utils_1.filepath("images", `${iconPrefix}-dark.svg`),
        };
    }
    // @ts-ignore
    get tooltip() {
        if (HistoryBuildTreeItemType.History === this.type) {
            if (undefined === this.job.description || "" === this.job.description) {
                return this.label;
            }
            else {
                return `${this.label} - ${this.job.description}`;
            }
        }
        else {
            return this.build.building
                ? `${this.label}: BUILDING`
                : `${this.label}: ${this.build.result}`;
        }
    }
    // @ts-ignore
    get description() {
        return HistoryBuildTreeItemType.History === this.type
            ? this.job.description
            : this.build.description;
    }
}
exports.HistoryBuildTreeItem = HistoryBuildTreeItem;
//# sourceMappingURL=historyBuildTree.js.map