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
exports.BuildJack = void 0;
const vscode = require("vscode");
const jack_1 = require("./jack");
const jobTree_1 = require("./jobTree");
const extensionVariables_1 = require("./extensionVariables");
const utils_1 = require("./utils");
const jobType_1 = require("./jobType");
const historyTree_1 = require("./historyTree");
class BuildJack extends jack_1.JackBase {
    constructor() {
        super("Build Jack", "extension.jenkins-jack.build");
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.build.abort", (item, items) => __awaiter(this, void 0, void 0, function* () {
            if (item instanceof jobTree_1.JobTreeItem) {
                items = !items
                    ? [item]
                    : items.filter((item) => jobTree_1.JobTreeItemType.Build === item.type);
            }
            else {
                let job = yield extensionVariables_1.ext.connectionsManager.host.jobSelectionFlow(undefined, false, "Select a job to grab builds from");
                if (undefined === job) {
                    return;
                }
                let builds = yield extensionVariables_1.ext.connectionsManager.host.buildSelectionFlow(job, (build) => build.building, true);
                if (undefined === builds) {
                    return;
                }
                items = builds.map((b) => {
                    return { job: job, build: b };
                });
            }
            if (undefined === items) {
                return;
            }
            let buildNames = items.map((i) => `${i.job.fullName}: #${i.build.number}`);
            let r = yield this.showInformationModal(`Are you sure you want to abort these builds?\n\n${buildNames.join("\n")}`, { title: "确认" });
            if (undefined === r) {
                return undefined;
            }
            let output = yield utils_1.withProgressOutputParallel("Build Jack Output(s)", items, (item) => __awaiter(this, void 0, void 0, function* () {
                yield extensionVariables_1.ext.connectionsManager.host.client.build.stop(item.job.fullName, item.build.number);
                return `Abort signal sent to ${item.job.fullName}: #${item.build.number}`;
            }));
            this.outputChannel.clear();
            this.outputChannel.show();
            this.outputChannel.appendLine(output);
            extensionVariables_1.ext.jobTree.refresh();
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.build.delete", (item, items) => __awaiter(this, void 0, void 0, function* () {
            if (item instanceof jobTree_1.JobTreeItem) {
                items = !items
                    ? [item]
                    : items.filter((item) => jobTree_1.JobTreeItemType.Build === item.type);
            }
            else {
                let job = yield extensionVariables_1.ext.connectionsManager.host.jobSelectionFlow();
                if (undefined === job) {
                    return;
                }
                let builds = yield extensionVariables_1.ext.connectionsManager.host.buildSelectionFlow(job, undefined, true, "Select a build");
                if (undefined === builds) {
                    return;
                }
                items = builds.map((b) => {
                    return { job: job, build: b };
                });
            }
            if (undefined === items) {
                return;
            }
            let buildNames = items.map((i) => `${i.job.fullName}: #${i.build.number}`);
            let r = yield this.showInformationModal(`Are you sure you want to delete these builds?\n\n${buildNames.join("\n")}`, { title: "确认" });
            if (undefined === r) {
                return undefined;
            }
            let output = yield utils_1.withProgressOutputParallel("Build Jack Output(s)", items, (item) => __awaiter(this, void 0, void 0, function* () {
                yield extensionVariables_1.ext.connectionsManager.host.deleteBuild(item.job, item.build.number);
                return `Deleted build ${item.job.fullName}: #${item.build.number}`;
            }));
            this.outputChannel.clear();
            this.outputChannel.show();
            this.outputChannel.appendLine(output);
            extensionVariables_1.ext.jobTree.refresh();
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.build.downloadLog", (content) => __awaiter(this, void 0, void 0, function* () {
            if (content instanceof jobTree_1.JobTreeItem) {
                yield this.downloadLog(content.job, content.build);
            }
            else {
                yield this.downloadLog();
            }
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.build.downloadReplayScript", (content) => __awaiter(this, void 0, void 0, function* () {
            if (content instanceof jobTree_1.JobTreeItem) {
                yield this.downloadReplayScript(content.job, content.build);
            }
            else {
                yield this.downloadReplayScript();
            }
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.build.quickBuild", (content) => __awaiter(this, void 0, void 0, function* () {
            this.quickBuild();
        })));
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.build.open", (item, items) => __awaiter(this, void 0, void 0, function* () {
            let builds = [];
            if (item instanceof jobTree_1.JobTreeItem) {
                builds = items
                    ? items
                        .filter((item) => jobTree_1.JobTreeItemType.Build === item.type)
                        .map((i) => i.build)
                    : [item.build];
            }
            else {
                let job = yield extensionVariables_1.ext.connectionsManager.host.jobSelectionFlow();
                if (undefined === job) {
                    return;
                }
                builds = yield extensionVariables_1.ext.connectionsManager.host.buildSelectionFlow(job, undefined, true);
                if (undefined === builds) {
                    return;
                }
            }
            for (let build of builds) {
                extensionVariables_1.ext.connectionsManager.host.openBrowserAt(build.url);
            }
        })));
        // 构建git分支
        extensionVariables_1.ext.context.subscriptions.push(vscode.commands.registerCommand("extension.jenkins-jack.build.branch", (item, items) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (item instanceof historyTree_1.HistoryTreeItem) {
                let result = false;
                if (item instanceof historyTree_1.HistoryTreeItem) {
                    let jobs = !items
                        ? [Object.assign(Object.assign({}, item.job), { branch: (_a = item === null || item === void 0 ? void 0 : item.build) === null || _a === void 0 ? void 0 : _a.value })]
                        : items
                            .filter((item) => historyTree_1.HistoryTreeItemType.History === item.type)
                            .map((item) => {
                            var _a;
                            return (Object.assign(Object.assign({}, item.job), { branch: (_a = item === null || item === void 0 ? void 0 : item.build) === null || _a === void 0 ? void 0 : _a.value }));
                        });
                    result = yield this.build(jobs);
                }
                else {
                    result = yield this.build(item);
                }
                if (result) {
                    extensionVariables_1.ext.jobTree.refresh();
                }
            }
        })));
        this.remoteList = [];
        this._config = this._config =
            vscode.workspace.getConfiguration("jenkins-jack.tree");
    }
    get commands() {
        return [
            {
                label: "$(stop)  Build: Abort",
                description: "Select a job and builds to abort.",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.build.abort"),
            },
            {
                label: "$(circle-slash)  Build: Delete",
                description: "Select a job and builds to delete.",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.build.delete"),
            },
            {
                label: "$(cloud-download)  Build: Download Log",
                description: "Select a job and build to download the log.",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.build.downloadLog"),
            },
            {
                label: "$(cloud-download)  Build: Download Replay Script",
                description: "Pulls a pipeline replay script of a previous build into the editor.",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.build.downloadReplayScript"),
            },
            {
                label: "$(browser)  Build: Open",
                description: "Opens the targeted builds in the user's browser.",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.build.open"),
            },
            {
                label: "$(browser)  Build: Build",
                description: "构建当前分支",
                target: () => vscode.commands.executeCommand("extension.jenkins-jack.build.branch"),
            },
        ];
    }
    /**
     * Downloads a build log for the user by first presenting a list
     * of jobs to select from, and then a list of build numbers for
     * the selected job.
     * @param job Optional job to target. If none, job selection will be presented.
     * @param builds Optional builds to target. If none, build selection will be presented.
     */
    delete(job, builds) {
        return __awaiter(this, void 0, void 0, function* () {
            job = job ? job : yield extensionVariables_1.ext.connectionsManager.host.jobSelectionFlow();
            if (undefined === job) {
                return;
            }
            builds = builds
                ? builds
                : yield extensionVariables_1.ext.connectionsManager.host.buildSelectionFlow(job, undefined, true);
            if (undefined === builds) {
                return;
            }
            let items = builds.map((b) => {
                return { job: job, build: b };
            });
            let output = yield utils_1.withProgressOutputParallel("Build Jack Output(s)", items, (item) => __awaiter(this, void 0, void 0, function* () {
                yield extensionVariables_1.ext.connectionsManager.host.deleteBuild(item.job.fullName, item.build.number);
                return `Deleted build ${item.job.fullName}: #${item.build.number}`;
            }));
            this.outputChannel.clear();
            this.outputChannel.show();
            this.outputChannel.appendLine(output);
        });
    }
    /**
     * Downloads a build log for the user by first presenting a list
     * of jobs to select from, and then a list of build numbers for
     * the selected job.
     * @param job Optional job to target. If none, job selection will be presented.
     * @param build Optional build to target. If none, build selection will be presented.
     */
    downloadLog(job, build) {
        return __awaiter(this, void 0, void 0, function* () {
            job = job
                ? job
                : yield extensionVariables_1.ext.connectionsManager.host.jobSelectionFlow(undefined, false, "Select a job to grab builds from");
            if (undefined === job) {
                return;
            }
            build = build
                ? build
                : yield extensionVariables_1.ext.connectionsManager.host.buildSelectionFlow(job, undefined, false, "Select a build");
            if (undefined === build) {
                return;
            }
            // Stream it. Stream it until the editor crashes.
            yield extensionVariables_1.ext.connectionsManager.host.streamBuildOutput(job.fullName, build.number, this.outputChannel);
        });
    }
    /**
     * Downloads a pipeline replay scripts for the user by first presenting a list
     * of jobs to select from, and then a list of build numbers for
     * the selected job.
     * @param job Optional job to target. If none, job selection will be presented.
     * @param build Optional build to target. If none, build selection will be presented.
     */
    downloadReplayScript(job, build) {
        return __awaiter(this, void 0, void 0, function* () {
            // Grab only pipeline jobs
            job = job
                ? job
                : yield extensionVariables_1.ext.connectionsManager.host.jobSelectionFlow((job) => job.buildable && job.type !== jobType_1.JobType.Default, false, "Select a job to grab builds from");
            if (undefined === job) {
                return;
            }
            build = build
                ? build
                : yield extensionVariables_1.ext.connectionsManager.host.buildSelectionFlow(job, undefined, false, "Select a build");
            if (undefined === build) {
                return;
            }
            // Pull script and display as an Untitled document
            let script = yield extensionVariables_1.ext.connectionsManager.host.getReplayScript(job, build);
            if (undefined === script) {
                return;
            }
            let doc = yield vscode.workspace.openTextDocument({
                content: script,
                language: "groovy",
            });
            yield vscode.window.showTextDocument(doc);
        });
    }
    /**
     * 获取远程Jenkins 任务列表
     * @returns
     */
    getRemoteJobs() {
        return new Promise((reslove, reject) => __awaiter(this, void 0, void 0, function* () {
            let list = [];
            let jobs = yield extensionVariables_1.ext.connectionsManager.host.getJobs(null, {});
            jobs = jobs.filter((job) => job.type !== jobType_1.JobType.Folder);
            for (let job of jobs) {
                let label = job.fullName.replace(/\//g, this._config.directorySeparator);
                let jobTreeItem = new jobTree_1.JobTreeItem(label, jobTree_1.JobTreeItemType.Job, vscode.TreeItemCollapsibleState.Collapsed, job);
                list.push(jobTreeItem);
            }
            reslove(list);
        }));
    }
    /**
     * 快速构建
     */
    quickBuild() {
        return __awaiter(this, void 0, void 0, function* () {
            // const projectName = vscode.workspace.name;
            let remoteList = this.remoteList;
            if (!remoteList.length) {
                remoteList = yield this.getRemoteJobs();
                this.remoteList = remoteList;
            }
            // 获取 vscode.TextDocument对象
            vscode.workspace
                .openTextDocument(`${vscode.workspace.rootPath}/.jenkins`)
                .then((doc) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const branch = extensionVariables_1.ext.barBuild.getCurrentBranch();
                // 判断构建分支
                if (!branch) {
                    this.showWarningMessage("构建失败：未获取到git分支");
                    return;
                }
                const jobs = doc.getText().split("\n");
                const selectJobName = yield vscode.window.showQuickPick(jobs);
                if (!selectJobName)
                    return;
                const jobTree = remoteList === null || remoteList === void 0 ? void 0 : remoteList.filter((item) => { var _a; return ((_a = item === null || item === void 0 ? void 0 : item.job) === null || _a === void 0 ? void 0 : _a.fullName.indexOf(selectJobName)) !== -1; });
                if (Array.isArray(jobTree) && jobTree.length !== 0) {
                    const job = (_a = jobTree[0]) === null || _a === void 0 ? void 0 : _a.job;
                    this.build([Object.assign(Object.assign({}, job), { branch })]);
                }
                else {
                    this.showWarningMessage(`${selectJobName} 未在Jenkins远程构建任务中未查找到,请检查！`);
                }
            }), err => {
                this.showWarningMessage("如果要使用快速构建请在项目根目录创建 .jenkins 文件,并添加对应环境任务名：\r\n fore-test1-project \r\n fore-test2-project");
                // console.log(err);
            });
        });
    }
    /**
     * 构建分支
     * @param jobs
     * @returns
     */
    build(jobs) {
        return __awaiter(this, void 0, void 0, function* () {
            jobs = jobs
                ? jobs
                : yield extensionVariables_1.ext.connectionsManager.host.jobSelectionFlow((j) => j.type !== jobType_1.JobType.Folder, true);
            if (undefined === jobs) {
                return;
            }
            let jobNames = jobs.map((j) => j.fullName);
            let r = yield this.showInformationModal(`你确定要构建以下项目吗?\n\n${jobNames.join("\n")}`, { title: "确认" });
            if (undefined === r) {
                return;
            }
            return yield this.actionOnJobs(jobs, (job) => __awaiter(this, void 0, void 0, function* () {
                const lastBuildInfo = yield extensionVariables_1.ext.connectionsManager.host.checkTaskBuilding(job);
                if (lastBuildInfo === false) {
                    // 选择不构建
                    return "构建取消";
                }
                if (typeof lastBuildInfo === "object" && lastBuildInfo.building) {
                    const { number } = lastBuildInfo;
                    yield extensionVariables_1.ext.connectionsManager.host.stopBuild(job, number);
                }
                yield extensionVariables_1.ext.connectionsManager.host.runBuildTask(job);
                // 获取构建项目状态 进行通知
                extensionVariables_1.ext.connectionsManager.host.listenTaskStatus(job, (jobs === null || jobs === void 0 ? void 0 : jobs.length) === 1);
                return `"${job.fullName}" 正在构建中...`;
            }));
        });
    }
    /**
     * Handles the flow for executing an action a list of jenkins job JSON objects.
     * @param jobs A list of jenkins job JSON objects.
     * label and returns output.
     * @param onJobAction The action to perform on the jobs.
     */
    actionOnJobs(jobs, onJobAction) {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Job Jack Output(s)`,
                cancellable: true,
            }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
                token.onCancellationRequested(() => {
                    this.showWarningMessage("User canceled job command.");
                });
                let tasks = [];
                progress.report({
                    increment: 50,
                    message: "Running command against Jenkins host...",
                });
                for (let j of jobs) {
                    let promise = new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            let output = yield onJobAction(j);
                            return resolve({ label: j.fullName, output: output });
                        }
                        catch (err) {
                            return resolve({ label: j.fullName, output: err });
                        }
                    }));
                    tasks.push(promise);
                }
                let results = yield Promise.all(tasks);
                this.outputChannel.clear();
                // this.outputChannel.show();
                for (let r of results) {
                    this.outputChannel.appendLine(this.barrierLine);
                    this.outputChannel.appendLine(r.label);
                    this.outputChannel.appendLine("");
                    this.outputChannel.appendLine(r.output);
                    this.outputChannel.appendLine(this.barrierLine);
                }
                progress.report({
                    increment: 50,
                    message: `Output retrieved. Displaying in OUTPUT channel...`,
                });
                return true;
            }));
        });
    }
}
exports.BuildJack = BuildJack;
BuildJack.JobBuild = class {
};
//# sourceMappingURL=buildJack.js.map