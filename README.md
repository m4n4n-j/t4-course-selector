# IIM Bangalore Term 6 Course Selector

**Live GitHub Pages site: https://m4n4n-j.github.io/t4-course-selector/**

The existing Term 4 selector now uses the 9 October 2026, 16:00 consolidated timetable for December 2026–March 2027. The repository and Pages URL are unchanged. Term 4 source and deployments remain in Git history.

## Student features

- My programme selector blocks explicit exclusions (BGS for PGP/PGPBA, DBWAI for PGPBA, PBM for PGPEM). Other eligibility remains subject to confirmation.
- Calendar and course-list views, search, teaching-area and anchoring-programme filters.
- Drag an offering into My plan or a scheduled calendar cell. Tap controls also work on phones. Fixed class times cannot be moved.
- Clashes are blocked across every actual teaching day and session. Choose one offering per timetable acronym. Swapping groups checks against the other selected courses.
- ZMT has two Wed/Thu groups: 10:00–11:30 and 11:45–13:15.
- Thursday double sessions, including Investment Banking, reserve both afternoon slots on Thursday only.
- December workshop dates, overlap rules, travel exclusions and BPIM restrictions.
- Device-local saving, reject/restore controls, text download and selected-schedule image export. Term 6 uses separate storage keys from Term 4.
- Mapping review with source cells, unresolved questions and downloadable JSON.

## Data and evidence

`src/data/term6.json` contains 46 regular-course acronyms, 51 offerings, 102 source cells and 10 workshop entries. All 46 acronyms are matched to the supplied outlines and the 18 September 2026 master sheet. Seven regular outlines are historical; their old evaluation schemes are omitted. RMD professor-to-slot allocation is unresolved and the Mayank Nagpal outline is missing. Consult [the mapping review](docs/TERM6_REVIEW.md) for the complete questions and workshop discrepancies.

RegularCourses uses **font colours** to indicate anchors: PGP green, EPGP red, PGPEM blue. The labels at I3/I4/I5 are a legend, not row-based assignments. PGPBA is not separately identified. Anchor does not establish cross-programme eligibility.

The workbook has no regular-course faculty list, formal catalogue codes, credit limits or definitions for the parenthetical numbers. Those numbers are preserved in `sources[].parentheticalValue`, never treated as seats, demand or bid prices. Unknown fields remain null. Term 4 bidding results and reviews are not Term 6 evidence.

Each regular course retains the earlier course/section shape (`id`, `name`, `shortName`, `faculty`, `area`, `credits`, `gradingBreakdown`, `sections`). Sections now contain actual-day `meetings` and `sources`, replacing a paired-day slot assumption that would wrongly put Thursday-only double sessions on Wednesday.

`src/data/outline-metadata.json` contains reviewed metadata and brief summaries from the uploaded PDFs. Full PDFs and private documents are not included in the public site.

## Update the timetable

1. Review `src/data/outline-mappings.json`, then run `python scripts/enrich-outlines.py /path/to/mastersheet.xlsx /path/to/extracted-outlines` to generate metadata. Keep uncertainty in `issues`; do not silently borrow old faculty or formal codes.
2. Parse an updated workbook (Python with openpyxl):

   ```sh
   python scripts/parse-term6.py /path/to/Consolidated.xlsx
   ```

3. Review generated `src/data/term6.json` and `docs/TERM6_REVIEW.md`, especially new colours, group splits, phase boundaries and duplicate acronyms.
4. Run `npm ci`, `npm run test`, then `npm run build`.
5. Commit source to `main`. Deploy the contents of `dist/` to the existing `gh-pages` branch (`npm run deploy` with Git credentials). Keep Vite's `/t4-course-selector/` base path.

No arbitrary six-course cap is carried over: Term 6 limits were not supplied. Confirmed credits are summed; courses with unknown credits are clearly counted separately. PRE/POST offerings conservatively clash until their date boundaries are known.

## Validation

Scheduling tests cover ZMT group alternatives, section swaps, exact-day conflicts, Thursday double sessions, damaged/stale saved choices, campus workshop dates, travel exclusions and BPIM exclusions. The parsing audit reconciles all 102 regular source cells exactly once and verifies current evaluation totals (100%, except IMC which uses a 50-mark scale) and explicit programme exclusions. Production Vite build must pass before deployment.

Browser visual/drag-and-drop QA was unavailable in the development environment; build and scheduling/data checks do not establish browser rendering or image-export behaviour.
