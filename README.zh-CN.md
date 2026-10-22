# Magpie for Paseo

[English](README.md) · [简体中文](README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/magpie-agent-paseo.svg?style=flat-square)](https://www.npmjs.com/package/magpie-agent-paseo)
[![license](https://img.shields.io/github/license/anyaoqi/magpie-agent-paseo.svg?style=flat-square)](https://github.com/anyaoqi/magpie-agent-paseo/blob/main/LICENSE)

这是一个 Magpie Agent 插件，为 Paseo 添加 **Magpie** 提供商支持。Paseo 继续使用 OpenCode 作为其编码 Agent 运行时；OpenCode 会将所有模型请求转发至本地 Magpie 网关。

## 环境要求

- 本地已启动 Magpie 及其本地网关
- 运行 Paseo 的设备上已安装 Paseo 及 OpenCode CLI
- Paseo 守护进程（daemon）与 Magpie 运行在同一个操作系统用户下
- `paseo` 命令已添加到 Magpie 所能识别的 `PATH` 环境变量中

## 安装到 Magpie

从 npm 安装：

```sh
magpie plugin add magpie-agent-paseo
```

或直接从 GitHub 安装：

```sh
magpie plugin add anyaoqi/magpie-agent-paseo
```

或从本地开发目录安装：

```sh
magpie plugin add .
```

在 Magpie 的 **Agents**（智能体）页面开启 **Paseo**。该插件作为服务开关，负责将 Magpie 当前可用的模型列表发布到 Paseo 中，以便你在 Paseo 启动 Agent 时直接选用。

开启或关闭后，在终端中重新加载 Paseo 的提供商配置：

```sh
paseo reload
```

然后在 Paseo 中选择 **Magpie** 作为提供商。模型列表将展示 Magpie 当前提供的所有模型，并替换继承的 OpenCode 列表，避免与本地无关的 OpenCode 模型混杂。Paseo 会原样展示每个模型的 Magpie 显示名称。内部模型 ID 会自动带有 OpenCode 路由所需的 `magpie-gateway/` 命名空间。

可用的第一个 Magpie 模型会被自动设为提供商默认项。每个模型的推理档位（Thinking options）也会自动声明为 OpenCode 的变体，Paseo 仅会提供该模型原生支持的思考强度。

## 插件改动说明

该插件会自动管理 `~/.paseo/config.json`，添加或更新 `agents.providers.magpie-opencode` 配置项。Paseo 启动现有的 OpenCode 提供商时，会注入 `OPENCODE_CONFIG_CONTENT` 覆盖项，该覆盖项注册了 Magpie 的 OpenAI 兼容网关地址及当前模型列表，并停用 OpenRouter。Magpie 为 Paseo 分配了专属的网关通信 Key。Paseo 的其他配置均完整保留；当在 Magpie 中关闭该 Agent 时，Magpie 会自动恢复原有的配置项。

如需使用非默认的 Paseo 配置路径，可修改 `paseo.agent.js` 中的 `config` 字段。Magpie 会自动展开路径中的 `~` 和环境变量；例如在 Magpie 环境中已设置 `PASEO_HOME` 时，可填写 `"$PASEO_HOME/config.json"`。

网关通信 Key 保存在 Paseo 本地配置的 OpenCode 运行时配置中。所有的推理请求均从 OpenCode 发往本地 Magpie 网关（默认 `127.0.0.1:3425`），再由 Magpie 路由至所选的上游提供商。
