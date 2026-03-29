# Layout Adjustment for Bento Export Report

Improving the visual quality and information hierarchy of the exported reports to provide a "premium" dashboard experience.

## User Review Required

> [!IMPORTANT]
> The design focuses on the circled area in the header, splitting the District and Province for better readability. 

## Proposed Changes

### [Bento Export System]

#### [MODIFY] [ExportBentoReport.tsx](file:///d:/APP/prossnum/webapp/src/components/ExportBentoReport.tsx)
- **Header Refinement**: 
    - Separate the District and Province into two distinct text elements with different visual weights.
    - District: Large, Bold (e.g., 36px).
    - Province: Medium, semi-transparent or subtle color (e.g., 20px, #94A3B8).
- **Stat Cards**:
    - Add subtle borders and "glass" effect to the status boxes on the right.
    - Improve the typography of the percentages and labels.
- **Overall Spacing**:
    - Increase the gaps between the bento cards for a more "breathable" feel.
    - Add subtle inner shadows or refine the card borders for more depth.

#### [MODIFY] [ExportChartStatic.tsx](file:///d:/APP/prossnum/webapp/src/components/ExportChartStatic.tsx)
- **Colors**: Use a more cohesive, vibrant color palette (e.g., Indigo, Teal, Rose).
- **Styling**: Refine the axes and legend to match the new premium look.

## Verification Plan

### Automated Tests
- I'll use the JPEG export preview in the browser to verify the layout.
- Check for text wrapping and alignment in the header area.

### Manual Verification
- Ask the user to check the "Export Report" button and view the resulting layout.
