## ADDED Requirements

### Requirement: Diagram block start keyword
A patch diagram document SHALL begin with the keyword `patch` as the first non-whitespace token on the first line. The parser SHALL reject any document whose first token is not `patch`.

#### Scenario: Valid diagram block starts with `patch`
- **WHEN** the diagram text begins with `patch` (optionally preceded by whitespace)
- **THEN** the parser SHALL accept the document and parse the subsequent statements
