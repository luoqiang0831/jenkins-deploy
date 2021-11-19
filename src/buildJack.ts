import * as vscode from "vscode";
import { JackBase } from "./jack";
import { JobTreeItem, JobTreeItemType } from "./jobTree";
import { ext } from "./extensionVariables";
import { withProgressOutputParallel } from "./utils";
import { JobType } from "./jobType";
import { HistoryTreeItem, HistoryTreeItemType } from "./historyTree";

export class BuildJack extends JackBase {
  static JobBuild = class {
    public build: any;
    public job: any;
  };

  public remoteList: JobTreeItem[];

  constructor() {
    super("Build Jack", "extension.jenkins-jack.build");

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.build.abort",
        async (item?: any[] | JobTreeItem, items?: JobTreeItem[]) => {
          if (item instanceof JobTreeItem) {
            items = !items
              ? [item]
              : items.filter(
                  (item: JobTreeItem) => JobTreeItemType.Build === item.type
                );
          } else {
            let job = await ext.connectionsManager.host.jobSelectionFlow(
              undefined,
              false,
              "Select a job to grab builds from"
            );
            if (undefined === job) {
              return;
            }

            let builds = await ext.connectionsManager.host.buildSelectionFlow(
              job,
              (build: any) => build.building,
              true
            );
            if (undefined === builds) {
              return;
            }

            items = builds.map((b: any) => {
              return { job: job, build: b };
            });
          }

          if (undefined === items) {
            return;
          }

          let buildNames = items.map(
            (i: any) => `${i.job.fullName}: #${i.build.number}`
          );
          let r = await this.showInformationModal(
            `Are you sure you want to abort these builds?\n\n${buildNames.join(
              "\n"
            )}`,
            { title: "确认" }
          );
          if (undefined === r) {
            return undefined;
          }

          let output = await withProgressOutputParallel(
            "Build Jack Output(s)",
            items,
            async item => {
              await ext.connectionsManager.host.client.build.stop(
                item.job.fullName,
                item.build.number
              );
              return `Abort signal sent to ${item.job.fullName}: #${item.build.number}`;
            }
          );
          this.outputChannel.clear();
          this.outputChannel.show();
          this.outputChannel.appendLine(output);
          ext.jobTree.refresh();
        }
      )
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.build.delete",
        async (item?: any | JobTreeItem, items?: JobTreeItem[]) => {
          if (item instanceof JobTreeItem) {
            items = !items
              ? [item]
              : items.filter(
                  (item: JobTreeItem) => JobTreeItemType.Build === item.type
                );
          } else {
            let job = await ext.connectionsManager.host.jobSelectionFlow();
            if (undefined === job) {
              return;
            }

            let builds = await ext.connectionsManager.host.buildSelectionFlow(
              job,
              undefined,
              true,
              "Select a build"
            );
            if (undefined === builds) {
              return;
            }

            items = builds.map((b: any) => {
              return { job: job, build: b };
            });
          }

          if (undefined === items) {
            return;
          }

          let buildNames = items.map(
            (i: any) => `${i.job.fullName}: #${i.build.number}`
          );
          let r = await this.showInformationModal(
            `Are you sure you want to delete these builds?\n\n${buildNames.join(
              "\n"
            )}`,
            { title: "确认" }
          );
          if (undefined === r) {
            return undefined;
          }

          let output = await withProgressOutputParallel(
            "Build Jack Output(s)",
            items,
            async item => {
              await ext.connectionsManager.host.deleteBuild(
                item.job,
                item.build.number
              );
              return `Deleted build ${item.job.fullName}: #${item.build.number}`;
            }
          );
          this.outputChannel.clear();
          this.outputChannel.show();
          this.outputChannel.appendLine(output);
          ext.jobTree.refresh();
        }
      )
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.build.downloadLog",
        async (content?: any | JobTreeItem) => {
          if (content instanceof JobTreeItem) {
            await this.downloadLog(content.job, content.build);
          } else {
            await this.downloadLog();
          }
        }
      )
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.build.downloadReplayScript",
        async (content?: any | JobTreeItem) => {
          if (content instanceof JobTreeItem) {
            await this.downloadReplayScript(content.job, content.build);
          } else {
            await this.downloadReplayScript();
          }
        }
      )
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.build.quickBuild",
        async (content?: any | JobTreeItem) => {
          this.quickBuild();
        }
      )
    );

    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.build.open",
        async (item?: any | JobTreeItem, items?: JobTreeItem[]) => {
          let builds = [];
          if (item instanceof JobTreeItem) {
            builds = items
              ? items
                  .filter(
                    (item: JobTreeItem) => JobTreeItemType.Build === item.type
                  )
                  .map((i: any) => i.build)
              : [item.build];
          } else {
            let job = await ext.connectionsManager.host.jobSelectionFlow();
            if (undefined === job) {
              return;
            }

            builds = await ext.connectionsManager.host.buildSelectionFlow(
              job,
              undefined,
              true
            );
            if (undefined === builds) {
              return;
            }
          }
          for (let build of builds) {
            ext.connectionsManager.host.openBrowserAt(build.url);
          }
        }
      )
    );

    // 构建git分支
    ext.context.subscriptions.push(
      vscode.commands.registerCommand(
        "extension.jenkins-jack.build.branch",
        async (item?: any | HistoryTreeItem, items?: HistoryTreeItem[]) => {
          if (item instanceof HistoryTreeItem) {
            let result: boolean | undefined = false;
            if (item instanceof HistoryTreeItem) {
              let jobs = !items
                ? [{ ...item.job, branch: item?.build?.value }]
                : items
                    .filter(
                      (item: HistoryTreeItem) =>
                        HistoryTreeItemType.History === item.type
                    )
                    .map((item: any) => ({
                      ...item.job,
                      branch: item?.build?.value,
                    }));
              result = await this.build(jobs);
            } else {
              result = await this.build(item);
            }
            if (result) {
              ext.jobTree.refresh();
            }
          }
        }
      )
    );

    this.remoteList = [];
    this._config = this._config =
      vscode.workspace.getConfiguration("jenkins-jack.tree");
  }

  public get commands(): any[] {
    return [
      {
        label: "$(stop)  Build: Abort",
        description: "Select a job and builds to abort.",
        target: () =>
          vscode.commands.executeCommand("extension.jenkins-jack.build.abort"),
      },
      {
        label: "$(circle-slash)  Build: Delete",
        description: "Select a job and builds to delete.",
        target: () =>
          vscode.commands.executeCommand("extension.jenkins-jack.build.delete"),
      },
      {
        label: "$(cloud-download)  Build: Download Log",
        description: "Select a job and build to download the log.",
        target: () =>
          vscode.commands.executeCommand(
            "extension.jenkins-jack.build.downloadLog"
          ),
      },
      {
        label: "$(cloud-download)  Build: Download Replay Script",
        description:
          "Pulls a pipeline replay script of a previous build into the editor.",
        target: () =>
          vscode.commands.executeCommand(
            "extension.jenkins-jack.build.downloadReplayScript"
          ),
      },
      {
        label: "$(browser)  Build: Open",
        description: "Opens the targeted builds in the user's browser.",
        target: () =>
          vscode.commands.executeCommand("extension.jenkins-jack.build.open"),
      },
      {
        label: "$(browser)  Build: Build",
        description: "构建当前分支",
        target: () =>
          vscode.commands.executeCommand("extension.jenkins-jack.build.branch"),
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
  public async delete(job?: any, builds?: any[]) {
    job = job ? job : await ext.connectionsManager.host.jobSelectionFlow();
    if (undefined === job) {
      return;
    }

    builds = builds
      ? builds
      : await ext.connectionsManager.host.buildSelectionFlow(
          job,
          undefined,
          true
        );
    if (undefined === builds) {
      return;
    }

    let items = builds.map((b: any) => {
      return { job: job, build: b };
    });

    let output = await withProgressOutputParallel(
      "Build Jack Output(s)",
      items,
      async item => {
        await ext.connectionsManager.host.deleteBuild(
          item.job.fullName,
          item.build.number
        );
        return `Deleted build ${item.job.fullName}: #${item.build.number}`;
      }
    );
    this.outputChannel.clear();
    this.outputChannel.show();
    this.outputChannel.appendLine(output);
  }

  /**
   * Downloads a build log for the user by first presenting a list
   * of jobs to select from, and then a list of build numbers for
   * the selected job.
   * @param job Optional job to target. If none, job selection will be presented.
   * @param build Optional build to target. If none, build selection will be presented.
   */
  public async downloadLog(job?: any, build?: any) {
    job = job
      ? job
      : await ext.connectionsManager.host.jobSelectionFlow(
          undefined,
          false,
          "Select a job to grab builds from"
        );
    if (undefined === job) {
      return;
    }

    build = build
      ? build
      : await ext.connectionsManager.host.buildSelectionFlow(
          job,
          undefined,
          false,
          "Select a build"
        );
    if (undefined === build) {
      return;
    }
    // Stream it. Stream it until the editor crashes.
    await ext.connectionsManager.host.streamBuildOutput(
      job.fullName,
      build.number,
      this.outputChannel
    );
  }

  /**
   * Downloads a pipeline replay scripts for the user by first presenting a list
   * of jobs to select from, and then a list of build numbers for
   * the selected job.
   * @param job Optional job to target. If none, job selection will be presented.
   * @param build Optional build to target. If none, build selection will be presented.
   */
  public async downloadReplayScript(job?: any, build?: any) {
    // Grab only pipeline jobs
    job = job
      ? job
      : await ext.connectionsManager.host.jobSelectionFlow(
          (job: any) => job.buildable && job.type !== JobType.Default,
          false,
          "Select a job to grab builds from"
        );

    if (undefined === job) {
      return;
    }

    build = build
      ? build
      : await ext.connectionsManager.host.buildSelectionFlow(
          job,
          undefined,
          false,
          "Select a build"
        );
    if (undefined === build) {
      return;
    }

    // Pull script and display as an Untitled document
    let script = await ext.connectionsManager.host.getReplayScript(job, build);
    if (undefined === script) {
      return;
    }
    let doc = await vscode.workspace.openTextDocument({
      content: script,
      language: "groovy",
    });
    await vscode.window.showTextDocument(doc);
  }
  /**
   * 获取远程Jenkins 任务列表
   * @returns
   */
  public getRemoteJobs(): Promise<JobTreeItem[]> {
    return new Promise(async (reslove, reject) => {
      let list = [];
      let jobs = await ext.connectionsManager.host.getJobs(null, {});
      jobs = jobs.filter((job: any) => job.type !== JobType.Folder);

      for (let job of jobs) {
        let label = job.fullName.replace(
          /\//g,
          this._config.directorySeparator
        );
        let jobTreeItem = new JobTreeItem(
          label,
          JobTreeItemType.Job,
          vscode.TreeItemCollapsibleState.Collapsed,
          job
        );
        list.push(jobTreeItem);
      }

      reslove(list);
    });
  }
  /**
   * 快速构建
   */
  public async quickBuild() {
    // const projectName = vscode.workspace.name;
    let remoteList = this.remoteList;
    if (!remoteList.length) {
      remoteList = await this.getRemoteJobs();
      this.remoteList = remoteList;
    }
    // 获取 vscode.TextDocument对象
    vscode.workspace
      .openTextDocument(`${vscode.workspace.rootPath}/.jenkins`)
      .then(
        async doc => {
          const branch = ext.barBuild.getCurrentBranch();
          // 判断构建分支
          if (!branch) {
            this.showWarningMessage("构建失败：未获取到git分支");
            return;
          }

          const jobs = doc.getText().split("\n");

          const selectJobName = await vscode.window.showQuickPick(jobs);

          if (!selectJobName) return;

          const jobTree = remoteList?.filter(
            (item: any) => item?.job?.fullName.indexOf(selectJobName) !== -1
          );

          if (Array.isArray(jobTree) && jobTree.length !== 0) {
            const job = jobTree[0]?.job;
            this.build([{ ...job, branch }]);
          } else {
            this.showWarningMessage(
              `${selectJobName} 未在Jenkins远程构建任务中未查找到,请检查！`
            );
          }
        },
        err => {
          this.showWarningMessage(
            "如果要使用快速构建请在项目根目录创建 .jenkins 文件,并添加对应环境任务名：\r\n fore-test1-project \r\n fore-test2-project"
          );
          // console.log(err);
        }
      );
  }
  /**
   * 构建分支
   * @param jobs
   * @returns
   */
  public async build(jobs?: any[]) {
    jobs = jobs
      ? jobs
      : await ext.connectionsManager.host.jobSelectionFlow(
          (j: any) => j.type !== JobType.Folder,
          true
        );
    if (undefined === jobs) {
      return;
    }

    let jobNames = jobs.map((j: any) => j.fullName);
    let r = await this.showInformationModal(
      `你确定要构建以下项目吗?\n\n${jobNames.join("\n")}`,
      { title: "确认" }
    );
    if (undefined === r) {
      return;
    }

    return await this.actionOnJobs(jobs, async (job: any) => {
      const lastBuildInfo = await ext.connectionsManager.host.checkTaskBuilding(
        job
      );

      if (lastBuildInfo === false) {
        // 选择不构建
        return "构建取消";
      }

      if (typeof lastBuildInfo === "object" && lastBuildInfo.building) {
        const { number } = lastBuildInfo;
        await ext.connectionsManager.host.stopBuild(job, number);
      }

      await ext.connectionsManager.host.runBuildTask(job);
      // 获取构建项目状态 进行通知
      ext.connectionsManager.host.listenTaskStatus(job, jobs?.length === 1);

      return `"${job.fullName}" 正在构建中...`;
    });
  }

  /**
   * Handles the flow for executing an action a list of jenkins job JSON objects.
   * @param jobs A list of jenkins job JSON objects.
   * label and returns output.
   * @param onJobAction The action to perform on the jobs.
   */
  private async actionOnJobs(
    jobs: any[],
    onJobAction: (job: string) => Promise<string>
  ) {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Job Jack Output(s)`,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {
          this.showWarningMessage("User canceled job command.");
        });

        let tasks = [];
        progress.report({
          increment: 50,
          message: "Running command against Jenkins host...",
        });
        for (let j of jobs) {
          let promise = new Promise(async resolve => {
            try {
              let output = await onJobAction(j);
              return resolve({ label: j.fullName, output: output });
            } catch (err) {
              return resolve({ label: j.fullName, output: err });
            }
          });
          tasks.push(promise);
        }
        let results = await Promise.all(tasks);

        this.outputChannel.clear();
        // this.outputChannel.show();
        for (let r of results as any[]) {
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
      }
    );
  }
}
