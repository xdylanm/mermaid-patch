# Nearley grammar for patch diagrams (Mermaid patch diagram plugin)
#
# Diagram blocks start with the keyword "patch" on the first line.
# All subsequent statements follow the same syntax as the original patchDiagram.

@{% 
function id(d) { return d[0]; }
%}

main -> "patch" ws statementList ws {% d => d[2] %}
      | "patch" ws {% d => [] %}

statementList -> statement (newline statement):* {% 
  d => [d[0], ...(d[1].map(x => x[1]))] 
%}

statement -> moduleDef {% id %}
           | nodeDef {% id %}
           | labeledConnection {% id %}
           | connection {% id %}
           | danglingToConnection {% id %}
           | danglingConnection {% id %}

moduleDef -> "module" _ identifier _ "{" ws portListOpt ws "}" {% 
  d => ({
    type: 'module',
    name: d[2],
    ports: d[6] || []
  })
%}

# portListOpt allows for an empty port list
portListOpt -> portList {% id %}
             | null {% d => [] %}

portList -> portDef (newline portDef):* {% 
  d => [d[0], ...(d[1].map(x => x[1]))] 
%}

portDef -> "+" signalType _ portLabel {% 
  d => ({ type: d[1], label: d[3] }) 
%}

signalType -> [a-z]:+ {% d => d[0].join('') %}

portLabel -> [^ \t\n\r{}\[\]]:+ {% d => d[0].join('') %}

newline -> _ [\n]:+ _ {% d => null %}

nodeDef -> identifier _ identifier labelOpt {% 
  d => ({
    type: 'node', 
    function: d[0],
    name: d[2],
    label: d[3] || null
  })
%}

labelOpt -> "[\"" string "\"]" {% d => d[1] %}
          | null {% d => null %}

connection -> identifier portSpec _ "-->" _ identifier portSpec {% 
  d => ({
    type: 'connection',
    from: d[0],
    fromPort: d[1],
    to: d[5],
    toPort: d[6]
  })
%}

labeledConnection -> identifier portSpec _ "-->" _ "|" pipeLabel "|" _ identifier portSpec {%
  d => ({
    type: 'connection',
    from: d[0],
    fromPort: d[1],
    label: d[6],
    to: d[9],
    toPort: d[10]
  })
%}

danglingConnection -> identifier portSpec _ "-->" _ "|" pipeLabel "|" {%
  d => ({
    type: 'dangling',
    direction: 'from',
    from: d[0],
    fromPort: d[1],
    label: d[6]
  })
%}

danglingToConnection -> "-->" _ "|" pipeLabel "|" _ identifier portSpec {%
  d => ({
    type: 'dangling',
    direction: 'to',
    label: d[3],
    to: d[6],
    toPort: d[7]
  })
%}

portSpec -> ":" portLabel {% d => d[1] %}
          | null {% d => null %}

pipeLabel -> [^|]:+ {% d => d[0].join('') %}

identifier -> [A-Za-z_] [A-Za-z0-9_]:* {% d => d[0] + d[1].join('') %}

string -> [^"\]]:+ {% d => d[0].join('') %}

_ -> [ \t]:* {% d => null %}
ws -> [ \t\n\r]:* {% d => null %}
