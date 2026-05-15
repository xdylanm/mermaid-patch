# Patch diagram schema

Every patch diagram begins with the keyword `patch` on the first line.  
The remaining statements can appear in any order (modules first is conventional).

## Modules

A **module** is a template describing a type of synth component and its ports.

```
module <Name> {
    +<signalType> <portName>
    ...
}
```

**Signal types** determine the port colour and badge shape:

| Type | Colour (default) | Meaning |
|------|-----------------|---------|
| `audio` | orange | Audio signal |
| `cv` | blue | Control voltage |
| `voct` | green | V/oct pitch |
| `gate` | purple | Gate / trigger |
| `any` | grey | Untyped / wildcard |

```
module VCO {
    +voct V/oct
    +audio tri
    +audio saw
    +audio square
}
module VCA {
    +audio In
    +cv CV
    +audio Out
}
```

Port names can contain any characters except whitespace and `{}[]`.

## Node instances

A **node** places an instance of a module in the diagram.

```
<ModuleName> <instanceName>
<ModuleName> <instanceName>["Display label"]
```

```
VCO osc1
VCA vca1["Main VCA"]
```

- `instanceName` must be a valid identifier (`[A-Za-z_][A-Za-z0-9_]*`)
- The display label (optional) overrides the module name shown in the diagram header

## Connections

Connect an output port of one node to an input port of another.

```
<from>:<port> --> <to>:<port>
<from>:<port> --> |label| <to>:<port>
```

The port name after `:` must match a port defined in the module.  
The optional `|label|` annotation is rendered on the wire.

```
osc1:tri --> lpf1:In
env1:out -->|env mod| lpf1:freq
```

Omitting the port selects the first port in declaration order:

```
osc1 --> lpf1
```

## Dangling connections

A **dangling** connection has only one endpoint — it represents a signal entering or leaving the diagram boundary.

**Entering** (dangling-to — renders a stub on the left):

```
--> |label| <node>:<port>
```

**Leaving** (dangling-from — renders a stub on the right):

```
<node>:<port> --> |label|
```

```
--> |MIDI clock| seq1:sync
vca1:Out --> |Main out|
```

## Full example

```
patch
module Sequencer {
    +gate sync
    +voct pitch
    +gate gate
}
module VCO {
    +voct V/oct
    +audio tri
    +audio saw
}
module VCF {
    +audio In
    +cv freq
    +audio LP
}
module VCA {
    +audio In
    +cv CV
    +audio Out
}
module EG {
    +gate trig
    +cv out
}

Sequencer seq1["Seq"]
VCO osc1["VCO"]
VCF lpf1["Filter"]
VCA vca1
EG env1["Env"]

--> |MIDI| seq1:sync
seq1:pitch --> osc1:V/oct
seq1:gate --> env1:trig
osc1:tri --> lpf1:In
env1:out -->|freq mod| lpf1:freq
env1:out --> vca1:CV
lpf1:LP --> vca1:In
vca1:Out --> |Out|
```
