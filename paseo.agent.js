const MAGPIE_PROVIDER = "magpie-gateway"
const PASEO_PROVIDER = "magpie-opencode"

function getModels(models) {
  const list = Array.isArray(models) ? models : Object.values(models || {})
  return list.filter((model) => model && typeof model.id === "string" && model.id.length > 0)
}

function asLimit(model) {
  const limit = {}
  if (Number.isFinite(model.context) && model.context > 0) limit.context = model.context
  if (Number.isFinite(model.output) && model.output > 0) limit.output = model.output
  return Object.keys(limit).length ? limit : undefined
}

function toOpenCodeVariants(efforts) {
  const variants = {}
  for (const effort of efforts) {
    if (typeof effort === "string" && effort.length > 0) {
      variants[effort] = { reasoningEffort: effort }
    }
  }
  return variants
}

function toOpenCodeModels(models) {
  const result = {}
  for (const model of models) {
    const efforts = Array.isArray(model.efforts) ? model.efforts : []
    const entry = {
      name: model.name || model.id,
      id: model.id,
      tool_call: true,
      modalities: {
        input: model.images ? ["text", "image"] : ["text"],
        output: ["text"],
      },
      variants: toOpenCodeVariants(efforts),
    }
    const limit = asLimit(model)
    if (limit) entry.limit = limit
    if (efforts.length) entry.reasoning = true
    result[model.id] = entry
  }
  return result
}

function toPaseoModels(models) {
  return models.map((model, index) => {
    const item = {
      id: `${MAGPIE_PROVIDER}/${model.id}`,
      label: model.name || model.id,
      description: `Magpie model: ${model.id}`,
      isDefault: index === 0,
    }
    if (Array.isArray(model.efforts) && model.efforts.length) {
      item.thinkingOptions = model.efforts.map((effort) => ({
        id: effort,
        label: effort.charAt(0).toUpperCase() + effort.slice(1),
      }))
      item.defaultThinkingOptionId = model.efforts.includes("medium") ? "medium" : model.efforts[0]
    }
    return item
  })
}

const PASEO_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA3MDAgNzAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjcwMCIgcng9IjE1NiIgZmlsbD0iYmxhY2siLz4KPHBhdGggdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzUwLDM1MCkgc2NhbGUoMS4wNSkgdHJhbnNsYXRlKC0zNTAsLTM1MCkiIGQ9Ik0yOTEuNDk1IDkxLjM5OUMzMzMuODk3IDEwNC44OTIgMzc5LjE1NSAxMzUuMDc1IDQxNi4yMjkgMTczLjE5MUM0NTMuMzg5IDIxMS4zOTQgNDg0LjQyOSAyNTkuNzI1IDQ5NS43MDggMzExLjI1MUM0OTcuNTU1IDMxOS42OTMgNDk4Ljg2NSAzMjguMjE2IDQ5OS41ODYgMzM2Ljc3NkM1MDkuNzU1IDMyNi41NTQgNTE5Ljg2NyAzMTcuODE1IDUyOS44OSAzMTEuNTQ3QzU0MC42NDcgMzA0LjgyMSA1NTMuODA4IDI5OS4yOTcgNTY4LjY0MSAyOTkuNzg1QzU4NC4yOSAzMDAuMjk5IDU5Ny4zOTUgMzA3LjMyNiA2MDcuNzQ3IDMxNy42MzJDNjMyLjE3MyAzNDEuOTQ3IDYyOS42MTIgMzcyLjg5OCA2MTkuODcyIDM5Ny45MzZDNjEwLjE4NSA0MjIuODMzIDU5MS41NTcgNDQ3LjgyNiA1NzIuNzMyIDQ2OS4xMjRDNTUzLjU5MSA0OTAuNzggNTMyLjcxMyA1MTAuMzA4IDUxNi43NzkgNTI0LjMxOEM1MDguNzc1IDUzMS4zNTUgNTAxLjkzNiA1MzcuMDczIDQ5Ny4wNyA1NDEuMDUyQzQ5NC42MzUgNTQzLjA0MyA0OTIuNjg5IDU0NC42MDMgNDkxLjMzNCA1NDUuNjc5QzQ5MC42NTcgNTQ2LjIxNyA0OTAuMTI2IDU0Ni42MzUgNDg5Ljc1NiA1NDYuOTI2QzQ4OS41NzEgNTQ3LjA3MSA0ODkuNDI1IDU0Ny4xODQgNDg5LjMyMSA1NDcuMjY1QzQ4OS4yNjkgNTQ3LjMwNSA0ODkuMjI3IDU0Ny4zMzggNDg5LjE5NiA1NDcuMzYyQzQ4OS4xODEgNTQ3LjM3NCA0ODkuMTY4IDU0Ny4zODUgNDg5LjE1NyA1NDcuMzkzQzQ4OS4xNTMgNTQ3LjM5NyA0ODkuMTQ3IDU0Ny40MDEgNDg5LjE0NCA1NDcuNDAzQzQ4OS4xMzQgNTQ3LjQgNDg4LjgzNyA1NDcuMDYgNDczLjAwMSA1MjguNDk5TDQ4OS4xMzUgNTQ3LjQxMUM0NzguMTU3IDU1NS45MTEgNDYyLjAzMyA1NTQuMzM0IDQ1My4xMjIgNTQzLjg5QzQ0NC4yMTMgNTMzLjQ0OCA0NDUuODg3IDUxOC4wOTQgNDU2Ljg2MSA1MDkuNTkyQzQ1Ni44NjMgNTA5LjU5MSA0NTYuODY1IDUwOS41ODggNDU2Ljg2OSA1MDkuNTg2QzQ1Ni44OCA1MDkuNTc3IDQ1Ni45MDIgNTA5LjU2MSA0NTYuOTMzIDUwOS41MzZDNDU2Ljk5NyA1MDkuNDg3IDQ1Ny4xMDEgNTA5LjQwNCA0NTcuMjQ1IDUwOS4yOTJDNDU3LjUzMyA1MDkuMDY2IDQ1Ny45NzkgNTA4LjcxNSA0NTguNTY5IDUwOC4yNDdDNDU5Ljc0OSA1MDcuMzEgNDYxLjUwNiA1MDUuOTAxIDQ2My43NDIgNTA0LjA3M0M0NjguMjE2IDUwMC40MTQgNDc0LjU4OSA0OTUuMDg4IDQ4Mi4wNzMgNDg4LjUwOEM0OTcuMTE0IDQ3NS4yODQgNTE2LjMxNSA0NTcuMjgyIDUzMy41NzggNDM3Ljc1QzU1MS4xNTcgNDE3Ljg2MiA1NjUuMjYgMzk4LjAxIDU3MS44NTkgMzgxLjA0OEM1NzguNDAzIDM2NC4yMjcgNTc1LjY4MSAzNTYuMzAyIDU3MC43MjQgMzUxLjM2N0M1NjguOTI4IDM0OS41NzkgNTY3Ljc0NCAzNDguOTAyIDU2Ny4yNjcgMzQ4LjY3NkM1NjYuODg4IDM0OC40OTYgNTY2LjgxMSAzNDguNTIgNTY2LjgwNCAzNDguNTJDNTY2LjYwNSAzNDguNTEzIDU2My45NzEgMzQ4LjUzNyA1NTcuOTUzIDM1Mi4zQzU0NS4xNjEgMzYwLjI5OSA1MjguODE1IDM3Ny40OTIgNTA2LjgwNyA0MDMuODY3QzQ5NC45MjcgNDE4LjEwNiA0ODEuODcxIDQzNC40MzUgNDY3LjU0NyA0NTEuOTU3QzQ2My43MDkgNDU3LjI4IDQ1OS41MDMgNDYyLjUzOCA0NTQuOTEgNDY3LjcxN0w0NTQuNzAyIDQ2Ny41NDlDNDIwLjgwOCA1MDguMzQ3IDM4MC4zNyA1NTMuODU2IDMzMi4zMzUgNTkzLjg0OEMzMDEuODUzIDYxOS4yMjYgMjYyLjY1NiA2MjIuNTk3IDIyOC42NDIgNjE0Ljc0M0MxOTQuODM0IDYwNi45MzYgMTYyLjY1OCA1ODcuNDQ4IDE0Mi4yMTcgNTYxLjY4NkMxMDguMDU0IDUxOC42MzEgMTAwLjU3IDQ2OS44MDEgMTA4LjIyMyA0MjcuODM2QzExNS41NiAzODcuNjA2IDEzNy4zOTEgMzUxLjAwNSAxNjYuNTAyIDMzMS41NTdDMTYxLjI0OCAzMTUuODEzIDE1Ni44MTMgMjk5LjQ5IDE1My41MTkgMjgzLjAxM0MxNDIuNTkzIDIyOC4zNjggMTQzLjIzOSAxNjcuMDMxIDE3NC4yOCAxMTkuNjE5QzE4Ni45MjIgMTAwLjMxIDIwNS44NDYgODkuMTUzNSAyMjcuMzg3IDg1LjI3NzNDMjQ4LjEgODEuNTUwNCAyNzAuMjc4IDg0LjY0OCAyOTEuNDk1IDkxLjM5OVpNMzc4LjY0MiAyMDYuMzU2QzM0NS43NzMgMTcyLjU2MyAzMDcuNDYzIDE0Ny45MTcgMjc1LjIwOCAxMzcuNjU0QzI1OS4wOTYgMTMyLjUyNyAyNDYuMTcxIDEzMS41MTQgMjM2LjgyOCAxMzMuMTk1QzIyOC4zMTQgMTM0LjcyNyAyMjIuMjI3IDEzOC40OTcgMjE3LjcyMSAxNDUuMzhDMTk2LjcxMiAxNzcuNDY4IDE5My44NTggMjI0LjAwNCAyMDMuODIgMjczLjgyN0MyMDYuNTMyIDI4Ny4zOTQgMjEwLjEyNyAzMDAuODM0IDIxNC4zNDUgMzEzLjgxN0MyMzYuNDUgMzEwLjI3NiAyNjAuMTU2IDMxMS40NjMgMjgxLjIyIDMxNy4xMUMzMTkuNjIxIDMyNy40MDMgMzU3LjUwMSAzNTUuNDE5IDM1Ny41MDEgNDA1LjY1NEMzNTcuNTAxIDQzNS4yNTUgMzM5LjExMSA0NjUuMTM2IDMwNy4yNzggNDczLjgxNUMyNzMuMjExIDQ4My4xMDMgMjM4Ljg1NCA0NjQuODIyIDIxMy4xMDUgNDI3LjU0MUMyMDMuNzE2IDQxMy45NDcgMTk0LjQ0MyAzOTcuNzY2IDE4NS45NDcgMzc5Ljg5QzE3NC4wMjggMzkyLjIyMyAxNjMuMDggNDExLjk1MyAxNTguNjczIDQzNi4xMThDMTUzLjEyOCA0NjYuNTE4IDE1OC41MTQgNTAxLjI4NiAxODMuMDg1IDUzMi4yNTNDMTk1Ljk5MyA1NDguNTIyIDIxNy43NDIgNTYyLjAzMSAyNDAuNzcxIDU2Ny4zNDlDMjYzLjU5NCA1NzIuNjE5IDI4NC4xNDcgNTY5LjI0IDI5OC42NjQgNTU3LjE1NEMzNDkuMzgzIDUxNC45MjcgMzkwLjcwOSA0NjYuNTQ3IDQyNi4zNjYgNDIyLjk1MkM0NDguODc5IDM5MC44NiA0NTMuMTk1IDM1Ni4wNiA0NDUuNTc4IDMyMS4yNjVDNDM2LjcwMyAyODAuNzE4IDQxMS40MjUgMjQwLjA2IDM3OC42NDIgMjA2LjM1NlpNMzA2LjI5NiA0MDUuNzIyQzMwNi4yOTYgMzg0Ljc2OSAyOTIuMjIzIDM3MC43MzYgMjY3LjI4NCAzNjQuMDUxQzI1Ni4wMTIgMzYxLjAzIDI0NC4xNTYgMzYwLjA4NyAyMzMuMDk1IDM2MC43NzFDMjQwLjM2MSAzNzUuOTM1IDI0OC4xNjggMzg5LjUxMyAyNTUuODk3IDQwMC43MDRDMjc1LjY0NyA0MjkuMjk4IDI4OS45ODkgNDI3LjgyMiAyOTMuMjQ3IDQyNi45MzRDMjk4LjczNyA0MjUuNDM3IDMwNi4yOTYgNDE4LjE2MSAzMDYuMjk2IDQwNS43MjJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K"

export const agent = {
  id: "paseo",
  name: "Paseo",
  icon: PASEO_ICON,
  bin: "paseo",
  config: "~/.paseo/config.json",
  format: "json",
  notice: "Magpie added the Magpie provider to Paseo. Run `paseo reload`, then choose Magpie when starting an agent.",
}

export function connect({ gateway, models = {} }) {
  const availableModels = getModels(models)
  const openCodeConfig = {
    $schema: "https://opencode.ai/config.json",
    disabled_providers: ["openrouter"],
    provider: {
      [MAGPIE_PROVIDER]: {
        name: "Magpie",
        npm: "@ai-sdk/openai-compatible",
        options: {
          baseURL: gateway.v1,
          apiKey: gateway.key,
        },
        models: toOpenCodeModels(availableModels),
      },
    },
  }

  return {
    [`agents.providers.${PASEO_PROVIDER}`]: {
      extends: "opencode",
      label: "Magpie",
      description: "Magpie models served by the Magpie gateway through OpenCode",
      env: {
        OPENCODE_CONFIG_CONTENT: JSON.stringify(openCodeConfig),
      },
      models: toPaseoModels(availableModels),
    },
  }
}
