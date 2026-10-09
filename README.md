# IIM Bangalore Term 6 Course Selector

**Live GitHub Pages site: https://m4n4n-j.github.io/t4-course-selector/**

The existing Term 4 selector now uses the 9 October 2026, 16:00 consolidated timetable for December 2026–March 2027. The site is labelled **Term 6 Course Selector**. The current Pages URL stays available until the repository is renamed; the build uses relative asset paths to support either repository name. Term 4 source and deployments remain in Git history.

## Student features

- Every course can be added to the planner, regardless of programme anchor. Programme restrictions from the supplied documents remain visible in Details for enrolment checks; the planner does not enforce them.
- **Calendar is the starting view**, with all 46 courses and all programme anchors shown. Select **Browse all courses** in the top navigation for the alphabetical list with full names. Search by title, acronym, faculty or area; reset filters with **Show all courses**.
- Calendar cards use prominent course codes with smaller full names underneath; long names fit within two lines. Tap the title/info control for the complete name and details. The grid starts at 842px wide with sticky day and time labels, so larger screens show the week with less scrolling. My plan and schedule exports retain full names. **Details** opens course information; **Add to plan** selects an offering.
- Drag an offering into My plan or a scheduled calendar cell. Tap controls also work on phones. Fixed class times cannot be moved.
- Clashes are blocked across every actual teaching day and session. Choose one offering per timetable acronym. Swapping groups checks against the other selected courses.
- ZMT has two Wed/Thu groups: 10:00–11:30 and 11:45–13:15.
- Thursday double sessions, including Investment Banking, reserve both afternoon slots on Thursday only.
- **Workshops are opt-in:** they stay hidden until **Include workshops** is checked. Turning it off removes selected workshops and their credits from the plan; regular choices remain. Each selected workshop also has a Remove control. The preference saves on the device.
- When enabled, workshops show December dates, overlap rules, travel exclusions and BPIM restrictions.
- **Share / download plan** is available in the top bar, My plan and Selected schedule. Choose a timetable PNG or a course-summary PNG (full names, faculty, credits, times, available assessments and flagged outline gaps). The complete week is rendered at a fixed width so phone exports include every day. Native **Share image** appears when file sharing is supported; otherwise download the PNG and attach it in a messaging app. Text download remains available. Images are prepared before the Share click to preserve browser user activation. Cancelling sharing leaves the plan intact.
- Device-local saving and reject/restore controls. Term 6 uses separate storage keys from Term 4.
- Mapping review with source cells, unresolved questions and downloadable JSON.

## What outlines are missing?

No regular course is missing its full-name mapping. These seven only have historical outlines, so current assessments and course content need current-year PDFs:

| Acronym | Full course name |
| --- | --- |
| ZMT | Zen and Mind Training |
| IHP | Introduction to Hindu Philosophy |
| IWR | Introduction to World Religions |
| GM | Global Marketing |
| DM | Decision Making |
| LCF | Learning from Corporate Failures |
| PBM | Platform Business Models |

**Research for Marketing Decisions (RMD):** Gopal Das's outline is supplied; Mayank Nagpal's outline is missing. The timetable and master sheet disagree on programme anchoring, so professor-to-slot allocation also needs confirmation.

If workshops are included, **Leading with Creativity** and **Business Storytelling for Managers** need current versions too. Other workshop outlines are matched, with date and programme discrepancies recorded in [the mapping review](docs/TERM6_REVIEW.md).

The site's **Missing outlines & review** tab lists the full names and outstanding questions. Confirm programme access, PRE/POST boundaries and Term 6 credit limits separately.

## Rename the GitHub Pages URL

Proposed name: **`t6-course-selector`**, giving **https://m4n4n-j.github.io/t6-course-selector/** after the rename and deployment. This URL is not live yet.

1. An owner opens [Repository Settings](https://github.com/m4n4n-j/t4-course-selector/settings), enters `t6-course-selector` under Repository name and selects Rename.
2. Update this README's live link and any clone's remote to the renamed repository. Keep Pages publishing from `gh-pages` at `/ (root)`.
3. Confirm the Pages deployment completes and the new URL serves the selector. If needed, redeploy `dist/` to `gh-pages` to trigger publication.

GitHub redirects repository links after a rename, but **does not automatically redirect project Pages URLs** ([GitHub documentation](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)). Share the new student link after verifying it.

The build already uses `base: './'`, with no hard-coded old repository path or package homepage. The connected GitHub tools can publish source and deployments but cannot rename repositories.

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
5. Commit source to `main`. Deploy the contents of `dist/` to the existing `gh-pages` branch (`npm run deploy` with Git credentials). Keep Vite's relative `./` base path so the same build works before and after a repository rename.

No arbitrary six-course cap is carried over: Term 6 limits were not supplied. Confirmed credits are summed; courses with unknown credits are clearly counted separately. PRE/POST offerings conservatively clash until their date boundaries are known.

## Validation

Scheduling tests cover ZMT group alternatives, section swaps, exact-day conflicts, Thursday double sessions, damaged/stale saved choices, campus workshop dates, travel exclusions and BPIM exclusions. The parsing audit reconciles all 102 regular source cells exactly once and verifies current evaluation totals (100%, except IMC which uses a 50-mark scale) and the programme exclusions recorded in source data. The interface allows all courses for planning while retaining those notes for enrolment checks. Opt-in checks ensure saved workshops do not reappear when disabled or under BPIM restrictions. Production Vite build must pass before deployment.

Browser visual/drag-and-drop QA was unavailable in the development environment; build and scheduling/data checks do not establish browser rendering or image-export behaviour.
