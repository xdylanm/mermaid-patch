# Patch Diagrams for Mermaid

A [Mermaid](https://mermaid.js.org) plugin that adds a **patch diagram** type for drawing modular synthesizer patch diagrams.

```
patch
module Oscillator {
    +voct V/oct
    +audio out
}
module Filter {
    +audio In
    +cv freq
    +audio LP
}

Oscillator osc1["VCO"]
Filter lpf1["Filter"]

osc1:out --> lpf1:In
```

Modules are rendered as blocks with typed ports (audio, CV, V/oct, gate). Connections are routed automatically using [ELK](https://eclipse.dev/elk/).

## Install

```bash
npm install mermaid-patch
```

Requires `mermaid ^11` as a peer dependency.

## Quick start

```js
import mermaid from 'mermaid';
import patch from 'mermaid-patch';

await mermaid.registerExternalDiagrams([patch]);
mermaid.initialize({ startOnLoad: true });
```

See [docs/usage.md](docs/usage.md) for HTML page and mkdocs-material integration examples.

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/schema.md](docs/schema.md) | Diagram syntax and examples |
| [docs/config.md](docs/config.md) | Theme and layout configuration |
| [docs/usage.md](docs/usage.md) | Integration guides |

## License

MIT — see [LICENSE](LICENSE).
