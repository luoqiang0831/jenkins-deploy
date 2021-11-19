![logo](images/logo.png)

# Jenkins Deploy

Jack 进入您的 Jenkins，以简化您的管道开发和 Jenkins 管理。使用突出显示的实时语法远程执行管道脚本，访问管道步骤自动完成，拉出管道步骤文档，跨多个代理运行控制台 groovy 脚本，管理作业/构建/代理，等等!

## Auto-completions (faux snippets)

从选定的远程 Jenkins 中，扩展将提取、解析管道步骤，并从管道步骤定义(GDSL)中作为自动完成提供管道步骤。

编辑器中任何带有 Groovy 语言 id 集的文件都将具有这些补全功能(可以通过设置禁用)。

## Settings

<!-- settings-start -->

| Name                               | Description                         |
| ---------------------------------- | ----------------------------------- |
| `jenkins-jack.jenkins.connections` | jenkins 连接列表(uri，用户名和密码) |
| commands                           |
| `jenkins-jack.project.list`        | 本地项目列表                        |

<!-- settings-end -->

## Setup

See [TUTORIAL.md](TUTORIAL.md##setting-up-a-connection) for setup and basic usage.

## Quick-use

### `ctrl+shift+j`

Displays a list of all Jack commands provided by the extension (`extension.jenkins-jack.jacks`)

## Local Packaging and Installation

要创建一个独立的“vsix”以便在本地安装，运行以下命令
commands:

```bash
# From the root of the extension.
npm install -g vsce     # For packaging
npm install             # Install dependencies.
vsce package            # Bake some bread.
code --install-extension .\jenkins-deploy-0.0.1.vsix # ...or whatever version was built
```

## Support

如在使用过程中遇到什么 bug 或者想要有趣的功能可在这里提出 [issue tracker](https://github.com/luoqiang0831/jenkins-deploy/issues).
