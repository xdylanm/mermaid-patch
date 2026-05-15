## MODIFIED Requirements

### Requirement: Dark theme node box uses a dark banded-frame palette

When the Mermaid `theme` is `'dark'`, the node box SHALL use the banded-frame dark palette. The node background fill (`nodeBgColor`) SHALL be `#2a2a2a` (near-black), with three band pairs in ascending luminance: inner band (`nodeBandLight`) `#3c3c3c`, middle band (`nodeBandMid`) `#555555`, outer band (`nodeBandDark`) `#6e6e6e`. Node name text (`nodeNameColor`) SHALL be `#eeeeee` and node label text (`nodeLabelColor`) SHALL be `#cccccc`. The previous two-tone header/body split (`nodeBodyFill`, `nodeHeaderFill`) is eliminated.

#### Scenario: Dark theme node background fill is near-black

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** the node background rectangle fill SHALL be `#2a2a2a`

#### Scenario: Dark theme band colours form a dark greyscale gradient

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** `nodeBandLight` SHALL be `#3c3c3c`, `nodeBandMid` SHALL be `#555555`, `nodeBandDark` SHALL be `#6e6e6e`

#### Scenario: Dark theme node name text is near-white

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** the node name text fill SHALL be `#eeeeee`

#### Scenario: Dark theme signal colours match the default palette

- **WHEN** `mermaid.initialize({ theme: 'dark' })` is called
- **THEN** `audioColor`, `cvColor`, `voctColor`, `gateColor`, `anyColor`, and `defaultColor` SHALL be identical to the `DEFAULT_CONFIG` values (dark theme does not change signal wire colours)
