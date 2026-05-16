# Spec: MkDocs Responsive Diagrams

## Purpose

Defines how patch diagrams are scaled to fit the Material MkDocs content column and how readers can interactively expand them to full size via a lightbox.

## Requirements

### Requirement: Patch diagrams scale to fit the content column

Patch diagram SVGs rendered on a Material MkDocs page SHALL be constrained to the available content column width. The diagram SHALL never scale wider than its natural rendered size, and SHALL maintain its aspect ratio when scaled down.

A minimum display width of 480px SHALL be enforced: if the content column is narrower than 480px (e.g. on mobile), the diagram scales to 100% of the available width rather than being held at the minimum.

#### Scenario: Wide diagram fits content column

- **WHEN** a patch diagram's natural rendered width exceeds the Material MkDocs content column width
- **THEN** the diagram SHALL scale down to fill the available column width
- **AND** the diagram height SHALL scale proportionally to preserve the aspect ratio

#### Scenario: Narrow diagram is not stretched

- **WHEN** a patch diagram's natural rendered width is less than the content column width
- **THEN** the diagram SHALL render at its natural size without being stretched to fill the column

#### Scenario: Diagram on a very narrow viewport

- **WHEN** the viewport is narrower than 480px (e.g. a mobile browser)
- **THEN** the diagram SHALL scale to 100% of the available content width
- **AND** SHALL NOT be constrained to the 480px minimum floor

---

### Requirement: Every patch diagram shows an expand button

Every patch diagram rendered on a Material MkDocs page SHALL display a small, unobtrusive expand button positioned at the top-right corner of the diagram. The button SHALL be visible at all times (not only on hover), but SHALL use low opacity to avoid distracting from the diagram content.

#### Scenario: Expand button is present

- **WHEN** a patch diagram is rendered on a Material MkDocs page
- **THEN** an expand button SHALL be visible at the top-right of the diagram at all times

#### Scenario: Expand button does not obscure diagram content

- **WHEN** the expand button is shown
- **THEN** the button SHALL overlay the SVG padding area at the top-right corner
- **AND** SHALL NOT overlap any diagram nodes, wires, or labels

---

### Requirement: Expand button opens a lightbox at natural size

Clicking the expand button SHALL open a full-screen lightbox overlay displaying the patch diagram at its natural rendered pixel size (the `width` and `height` set by the renderer). The lightbox inner container SHALL scroll horizontally and vertically if the diagram exceeds the viewport dimensions.

#### Scenario: Lightbox opens on button click

- **WHEN** the reader clicks the expand button on a patch diagram
- **THEN** a full-screen overlay SHALL appear over the page
- **AND** the overlay SHALL display the diagram at its natural pixel size (no CSS scaling applied)

#### Scenario: Large diagram is scrollable in the lightbox

- **WHEN** a diagram's natural width or height exceeds the viewport dimensions
- **THEN** the lightbox inner container SHALL provide scrollbars
- **AND** the reader SHALL be able to scroll to inspect any part of the diagram

---

### Requirement: Lightbox closes on standard interactions

The lightbox SHALL close when the reader clicks the backdrop (outside the diagram area) or presses the Escape key.

#### Scenario: Close on backdrop click

- **WHEN** the lightbox is open
- **AND** the reader clicks anywhere on the dark backdrop outside the diagram
- **THEN** the lightbox SHALL close and the page SHALL return to its normal state

#### Scenario: Close on Escape key

- **WHEN** the lightbox is open
- **AND** the reader presses the Escape key
- **THEN** the lightbox SHALL close and the page SHALL return to its normal state
