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
exports.HistoryBuild = void 0;
const vscode = require("vscode");
const jack_1 = require("./jack");
const historyBuildTree_1 = require("./historyBuildTree");
const extensionVariables_1 = require("./extensionVariables");
class HistoryBuild extends jack_1.JackBase {
    constructor() {
        super("HistoryBuild", "extension.jenkins-jack.historyBuild");
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.historyBuild.delete", (item, items) => __awaiter(this, void 0, void 0, function* () {
            if (item instanceof historyBuildTree_1.HistoryBuildTreeItem) {
                let jobs = !items
                    ? [item.job]
                    : items
                        .filter((item) => historyBuildTree_1.HistoryBuildTreeItemType.History === item.type).map(j => j.job);
                this.delete(jobs);
            }
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.historyBuild.open", (item, items) => __awaiter(this, void 0, void 0, function* () {
            let jobs = [];
            if (item instanceof historyBuildTree_1.HistoryBuildTreeItem) {
                jobs = items
                    ? items
                        .filter((item) => historyBuildTree_1.HistoryBuildTreeItemType.History === item.type)
                        .map((i) => i.job)
                    : [item.job];
            }
            else {
                jobs = yield extensionVariables_1.ext.connectionsManager.host.jobSelectionFlow(undefined, true);
                if (undefined === jobs) {
                    return false;
                }
            }
            for (let job of jobs) {
                extensionVariables_1.ext.connectionsManager.host.openBrowserAt(job.url);
            }
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.historyBuild.moveup", (item, items) => __awaiter(this, void 0, void 0, function* () {
            if (item instanceof historyBuildTree_1.HistoryBuildTreeItem) {
                let job = item.job.fullName;
                this.moveProject(job, "up");
            }
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.historyBuild.movedown", (item, items) => __awaiter(this, void 0, void 0, function* () {
            if (item instanceof historyBuildTree_1.HistoryBuildTreeItem) {
                let job = item.job.fullName;
                this.moveProject(job, "down");
            }
        })));
        // 不需要 应该在分支上构建
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.historyBuild.build", (item, items) => __awaiter(this, void 0, void 0, function* () {
            let result = false;
            if (item instanceof historyBuildTree_1.HistoryBuildTreeItem) {
                let jobs = !items
                    ? [item.job]
                    : items
                        .filter((item) => historyBuildTree_1.HistoryBuildTreeItemType.History === item.type)
                        .map((item) => item.job);
                result = yield extensionVariables_1.ext.buildJack.build(jobs);
            }
            else {
                result = yield extensionVariables_1.ext.buildJack.build(item);
            }
            if (result) {
                extensionVariables_1.ext.historyTree.refresh();
            }
        })));
    }
    get commands() {
        return [
            {
                label: "$(circle-slash)  HistoryBuild: Delete",
                description: "删除最近构建项目",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.historyBuild.delete"),
            },
            // {
            //   label: "$(browser)  HistoryBuild: Build",
            //   description: "构建默认分支",
            //   target: () =>
            //     vscode.commands.executeCommand("extension.jenkins-jack.historyBuild.build"),
            // },
            {
                label: "$(browser)  HistoryBuild: Open",
                description: "浏览器打开Jenkins 项目",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.historyBuild.open"),
            },
        ];
    }
    delete(jobs) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let r = yield this.showInformationModal(`你确定要删除以下项目吗?\n\n${(_a = jobs === null || jobs === void 0 ? void 0 : jobs.map((p) => p.fullName)) === null || _a === void 0 ? void 0 : _a.join("\n")}`, {
                title: "确认",
            });
            if (undefined === r) {
                return;
            }
            let project = vscode.workspace.getConfiguration("jenkins-jack.historyProject");
            const projectList = project.get("list") || [];
            const filterProject = projectList.filter((item) => (jobs === null || jobs === void 0 ? void 0 : jobs.findIndex((j) => j.fullName === item.name && j.branch === item.branch)) === -1);
            vscode.workspace
                .getConfiguration()
                .update("jenkins-jack.historyProject.list", filterProject, vscode.ConfigurationTarget.Global);
            vscode.commands.executeCommand("extension.jenkins-jack.tree.historyBuild.refresh");
            vscode.window.showInformationMessage(`项目${(_b = jobs === null || jobs === void 0 ? void 0 : jobs.map((p) => p.fullName)) === null || _b === void 0 ? void 0 : _b.join("\n")} 删除成功`);
            // 更新
            extensionVariables_1.ext.historyBuildTree.refresh();
        });
    }
    /**
     * 获取一个jenkins 项目名称
     * @param string
     * @returns
     */
    moveProject(job, move) {
        if (!job || !move)
            return;
        let projectConfig = vscode.workspace.getConfiguration("jenkins-jack.historyProject");
        const projectList = (projectConfig.get("list") || []);
        const targetIndex = projectList === null || projectList === void 0 ? void 0 : projectList.findIndex((item) => item.name === job);
        const targetItem = projectList[targetIndex];
        let tempItem;
        if (move === "up" && targetIndex > 0) {
            tempItem = Object.assign(projectList[targetIndex - 1]);
            projectList[targetIndex - 1] = targetItem;
            projectList[targetIndex] = tempItem;
        }
        if (move === "down" && projectList.length > targetIndex + 1) {
            tempItem = Object.assign(projectList[targetIndex + 1]);
            projectList[targetIndex + 1] = targetItem;
            projectList[targetIndex] = tempItem;
        }
        // 更新
        extensionVariables_1.ext.historyTree.refresh();
    }
}
exports.HistoryBuild = HistoryBuild;
//# sourceMappingURL=historyBuild.js.map