import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";

const AREA_COLORS = {
  Strat: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca", dot: "#ef4444", light: "#fff5f5" },
  Econ: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", dot: "#22c55e", light: "#f7fef9" },
  PP: { bg: "#ecfeff", text: "#0e7490", border: "#a5f3fc", dot: "#06b6d4", light: "#f0fdff" },
  Interdis: { bg: "#fefce8", text: "#a16207", border: "#fef08a", dot: "#eab308", light: "#fefef0" },
  "F&A": { bg: "#f0fdf4", text: "#166534", border: "#86efac", dot: "#16a34a", light: "#f0fdf8" },
  DS: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6", light: "#f5f9ff" },
  Mktg: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", dot: "#f97316", light: "#fffaf5" },
  POM: { bg: "#faf5ff", text: "#7e22ce", border: "#d8b4fe", dot: "#a855f7", light: "#fdf8ff" },
  IS: { bg: "#eef2ff", text: "#4338ca", border: "#c7d2fe", dot: "#6366f1", light: "#f5f7ff" },
  Lang: { bg: "#fdf2f8", text: "#be185d", border: "#fbcfe8", dot: "#ec4899", light: "#fef6fa" },
  Mcomm: { bg: "#f8fafc", text: "#334155", border: "#cbd5e1", dot: "#64748b", light: "#f9fafb" },
  OBHRM: { bg: "#fffbeb", text: "#b45309", border: "#fde68a", dot: "#f59e0b", light: "#fffdf5" },
  Entre: { bg: "#f7fee7", text: "#4d7c0f", border: "#d9f99d", dot: "#84cc16", light: "#fbfff0" },
};

const SENTIMENT_CONFIG = {
  recommended: { emoji: "✅", label: "Recommended", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  caution: { emoji: "⚠️", label: "Mixed Reviews", color: "#ca8a04", bg: "#fefce8", border: "#fef08a" },
  not_recommended: { emoji: "🚫", label: "Not Recommended", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const TIMESLOTS = [
  { index: 1, label: "8:00 – 9:30", short: "8:00" },
  { index: 2, label: "10:00 – 11:30", short: "10:00" },
  { index: 3, label: "11:45 – 13:15", short: "11:45" },
  { index: 4, label: "14:30 – 16:00", short: "14:30" },
  { index: 5, label: "16:15 – 17:45", short: "16:15" },
  { index: 6, label: "18:00 – 19:30", short: "18:00" },
];

const DAY_BLOCKS = [
  { id: "MonTue", label: "Mon / Tue", short: "MT" },
  { id: "WedThu", label: "Wed / Thu", short: "WT" },
  { id: "FriSat", label: "Fri / Sat", short: "FS" },
];

// Courses dataset heavily updated with your new reviews
const COURSES = [
  { "id": "CS", "officialCode": "CS757", "name": "Corporate Strategy", "shortName": "CS", "faculty": "Deepak Chandrashekar", "area": "Strat", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 150, "totalSelected": 252, "demandRatio": 1.68, "sentiment": "recommended", "reviewText": "One of the best courses. Concept heavy. Excellent professor. Very useful for placements. Requires quiz preparation. High bidding. Seedhi baat no bakwas. Good teachings, good break from C&S. Prof is funny and to the point.", "outline": ["Analytical approaches and frameworks in corporate strategy", "How multi-business firms create and appropriate value", "Firm growth, diversification, and vertical integration", "Strategic alliances, joint ventures, and managing outsourcing", "M&A, internationalization, and divestitures"], "gradingBreakdown": { "Class participation": "10%", "3 quizzes": "30%", "Group project & presentation": "25%", "End-term exam": "35%" }, "sections": [{ "id": "CS_GR1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 155, "isDoubleSlot": false }, { "id": "CS_GR2", "label": "GR2", "dayBlock": "MonTue", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 97, "isDoubleSlot": false }] },
  { "id": "AIS", "officialCode": "CS772", "name": "AI Strategy", "shortName": "AIS", "faculty": "Vijay Venkataraman", "area": "Strat", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 152, "demandRatio": 2.03, "sentiment": "caution", "reviewText": "Very chill subject — quizzes test more VARC skills than actual AIS content. Key takeaways: 'Human and AI have to work together'. CAUTION: It's a low standard deviation subject — if you don't want to leave grades to luck, this isn't recommended. Minimal effort and easy CP.", "outline": ["Economics of AI and implications for future of work", "Predictive and generative power of AI, job redesign strategies", "Risks, biases, and governance challenges of AI", "How incumbents adapt to AI and execute AI strategies"], "gradingBreakdown": { "Quiz 1": "10%", "Quiz 2": "10%", "Class Participation": "15%", "Case Analysis": "15%", "Project": "25%", "Final Exam": "25%" }, "sections": [{ "id": "AIS_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 152, "isDoubleSlot": false }] },
  { "id": "STDM", "officialCode": "CS726", "name": "Strategic Thinking and Decision Making", "shortName": "STDM", "faculty": "V.N. Bhattacharya", "area": "Strat", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 150, "totalSelected": 179, "demandRatio": 1.19, "sentiment": "not_recommended", "reviewText": "Not great for scoring. Professor's evaluation style is very different. For a 15-mark question, marks are extreme — either very high or very low. Grading can feel unpredictable.", "outline": ["Rational thinking, Game Theory, simultaneous games", "Prisoners' Dilemma, strategic moves, Added Value", "The Value Net, perception, cognition, two systems of thinking", "Heuristics, cognitive biases, ethical decision-making", "Decision-making under high risk, intuition, insight"], "gradingBreakdown": { "Surprise quizzes (3)": "15%", "Pre-announced Quiz (1)": "20%", "Mid-term examination": "30%", "End term examination": "35%" }, "sections": [{ "id": "STDM_A", "label": "PGP", "dayBlock": "FriSat", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 89, "isDoubleSlot": false }, { "id": "STDM_B", "label": "PGPEM", "dayBlock": "FriSat", "timeslot": "14:30-16:00", "slotIndex": 4, "seats": 75, "selected": 90, "isDoubleSlot": false }] },
  { "id": "BFIE", "officialCode": "EC747", "name": "Business, Finance and Intl Economy", "shortName": "BFIE", "faculty": "Anubha Dhasmana", "area": "Econ", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 122, "demandRatio": 1.63, "sentiment": "recommended", "reviewText": "Practical case study based economics course. Course content is quite nice from a learning perspective. 2 quizzes of ~25% each which are pretty easy — so even 1 mark gone can ruin your grade. Low stress overall, chill professor. WARNING: If you got cooked in Macroeconomics, better skip this.", "outline": ["Basics of international finance, financial architecture, open-economy macroeconomics", "Historical evolution of the international financial and regulatory system", "Role of regulatory structures in preventing economic crises", "Emerging challenges facing the global financial system"], "gradingBreakdown": { "2 Quizzes (25% each)": "50%", "End Term Exam": "45%", "Final group project presentation": "5%" }, "sections": [{ "id": "BFIE_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "14:30-16:00", "slotIndex": 4, "seats": 75, "selected": 122, "isDoubleSlot": false }] },
  { "id": "BE", "officialCode": "EC745", "name": "Behavioral Economics", "shortName": "BE", "faculty": "Ritwik Banerjee", "area": "Econ", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 150, "totalSelected": 138, "demandRatio": 0.92, "sentiment": "not_recommended", "reviewText": "NEVER take if you want peace. Worst course experience. For a 40% weightage project the professor offered no guidance. Unless you have done actual work in survey research or can give 2-3 weeks to your project, DO NOT TAKE.", "outline": ["How decisions are made: Econs vs Humans", "Heuristics, biases, exponential growth bias, overconfidence", "Loss Aversion, Value Function, Probability weighting, Mental Accounting", "Strategic thinking, fairness, and discrimination", "Economics of Gender and Nudges/Public Policy"], "gradingBreakdown": { "Midterm Exam": "30%", "EndTerm Exam": "30%", "Group Project": "40%" }, "sections": [{ "id": "BE_GR1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "16:15-17:45", "slotIndex": 5, "seats": 75, "selected": 80, "isDoubleSlot": false }, { "id": "BE_GR2", "label": "GR2", "dayBlock": "MonTue", "timeslot": "14:30-16:00", "slotIndex": 4, "seats": 75, "selected": 58, "isDoubleSlot": false }] },
  { "id": "EDMN", "officialCode": "EC753", "name": "Economics of Decision-Making and Negotiation", "shortName": "EDMN", "faculty": "Sarvesh Bandhu", "area": "Econ", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 60, "demandRatio": 0.8, "sentiment": "not_recommended", "reviewText": "A BIG NO NO. It was the most unorganised, unstructured, time wasting course of my life. Zero learning, unnecessary headache. ~40% of the evaluation components were not even assessed till the end term and then he changed those components and graded us on the basis of two games. Worst course in my academic journey.", "outline": ["Making more informed decisions, navigating risk and uncertainty", "Identifying and mitigating cognitive biases", "Decision-making frameworks at individual and organizational levels", "Enhancing bargaining and negotiation skills", "Strategies for collaboration and conflict resolution"], "gradingBreakdown": { "Exercises (Quizzes/Simulations)": "40%", "Group Project": "35%", "Assignments": "15%", "Class Participation": "10%" }, "sections": [{ "id": "EDMN_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "16:15-17:45", "slotIndex": 5, "seats": 75, "selected": 60, "isDoubleSlot": false }] },
  { "id": "SBIO", "officialCode": "EC726", "name": "Strategic Behaviour and Industrial Organization", "shortName": "SBIO", "faculty": "Subhashish Gupta", "area": "Econ", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 32, "demandRatio": 0.43, "sentiment": "recommended", "reviewText": "Very chill course. 1/3 or more of it is game theory. Prof doesn't give a damn about what you do in class.", "outline": ["Game theory: Static and dynamic games", "Cooperation, repeated games, bargaining, signalling", "Cournot and Bertrand oligopoly models", "Entry costs, price discrimination, versioning, bundling", "Vertical relations, product differentiation, network economics"], "gradingBreakdown": { "Case Presentations (Group)": "30%", "Mid-Term": "35%", "Final": "35%" }, "sections": [{ "id": "SBIO_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "16:15-17:45", "slotIndex": 5, "seats": 75, "selected": 32, "isDoubleSlot": false }] },
  { "id": "BSLC", "officialCode": "PP741", "name": "Building Sustainable and Livable Cities", "shortName": "BSLC", "faculty": "Arpit Shah", "area": "PP", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 83, "demandRatio": 1.11, "sentiment": "recommended", "reviewText": "Best Course. Highly recommended. If 50% individual assignment component is there, prof will expect a video submission at the level of Ravish Kumar.", "outline": ["Challenges in urban infrastructure and competing resource demands", "Complex management of basic urban services: water, sanitation, health", "Urban mobility: metro systems, bus transport, sharing economy", "Strategies for managing temporary urbanization and rapid population shifts"], "gradingBreakdown": { "Class presentations (group)": "20%", "End-term project (group)": "30%", "Individual video assignment": "50%" }, "sections": [{ "id": "BSLC_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 83, "isDoubleSlot": false }] },
  { "id": "HETP", "officialCode": "PP722", "name": "Healthcare Economics: Theory and Practice", "shortName": "HETP", "faculty": "Arnab Mukherji & Allen Ugargol", "area": "PP", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 150, "totalSelected": 74, "demandRatio": 0.49, "sentiment": "caution", "reviewText": "Depends on your interest. Not really economics — more public policy overview of Indian health sector. Surprise quizzes based on pre-reads. Miss one component and you're in trouble.", "outline": ["Growth Prospects and Challenges for Healthcare in India", "Core Health Economics Concepts", "Healthcare system design (Bismarck, Beveridge)", "Public Private Partnerships", "Entrepreneurship in Healthcare", "Health Policy Debates in India"], "gradingBreakdown": { "Class Participation": "10%", "Four Reflection Notes (Individual)": "45%", "State of Health Report (Group)": "45%" }, "sections": [{ "id": "HETP_GR1", "label": "GR1", "dayBlock": "WedThu", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 62, "isDoubleSlot": false }, { "id": "HETP_GR2", "label": "GR2", "dayBlock": "WedThu", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 12, "isDoubleSlot": false }] },
  { "id": "IBH", "officialCode": "PP754", "name": "Indian Business History", "shortName": "IBH", "faculty": "Rajalaxmi Kamath", "area": "PP", "anchor": "PGPEM", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 46, "demandRatio": 0.61, "sentiment": null, "reviewText": null, "outline": ["Trade in Pre-Mughal and Mughal times", "East India Company and Indian Business Communities", "Managing Agencies and Industrial Capitalism", "Swadeshi Movement and World Wars", "Independence, License Raj, and Economic Reforms"], "gradingBreakdown": { "Primary Source Analysis (Individual)": "50%", "Final Capstone (Group)": "50%" }, "sections": [{ "id": "IBH_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "14:30-16:00", "slotIndex": 4, "seats": 75, "selected": 46, "isDoubleSlot": false }] },
  { "id": "ZMT", "officialCode": "DN714", "name": "Zen and Mind Training", "shortName": "ZMT", "faculty": "Dinesh Kumar & Nitesh Batra", "area": "Interdis", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 159, "demandRatio": 2.12, "sentiment": "recommended", "reviewText": "Focused on meditation and reflection. No mid-term or end-term. Very easy to score. Just attend and stay alert. Great for a low-stress term.", "outline": null, "gradingBreakdown": {}, "sections": [{ "id": "ZMT_1", "label": "GR1", "dayBlock": "WedThu", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 159, "isDoubleSlot": false }] },
  { "id": "GCK", "officialCode": "AC702", "name": "General Commercial Knowledge", "shortName": "GCK", "faculty": "Shanker Subramoney", "area": "Interdis", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 150, "totalSelected": 180, "demandRatio": 1.2, "sentiment": "recommended", "reviewText": "Super chill course. Funny prof. Easy MCQ exams. Easy to score if you prepare. Note: Also offered in Term 5/6.", "outline": ["Commerce and trade in Indian and International context", "Contractual risk perception and mitigation", "Sale of Goods, HSN & Classification", "INCOTERMS 2010 & 2020, Combiterms", "Tenders, Contracts, Consumer Protection, GST"], "gradingBreakdown": { "Class Participation": "10%", "Group Activity": "25%", "Mid Term": "25%", "End Term": "40%" }, "sections": [{ "id": "GCK_GR1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "08:00-09:30", "slotIndex": 1, "seats": 75, "selected": 161, "isDoubleSlot": false }, { "id": "GCK_GR2", "label": "GR2", "dayBlock": "FriSat", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 19, "isDoubleSlot": false }] },
  { "id": "FM", "officialCode": "FI793", "name": "Financial Modelling", "shortName": "FM", "faculty": "Aishwarya Krishna", "area": "F&A", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 66, "demandRatio": 0.88, "sentiment": "caution", "reviewText": "Heavy on math. ~40% stats, ~55% R coding, very little finance. ARCH, GARCH models. Prof is chill and course is decent.", "outline": ["Data analysis using R and Excel", "Econometric models, estimation, interpretation", "Simulation (Monte Carlo) and bootstrapping", "CAPM, Fama French, technical analysis", "Volatility modeling (ARCH, GARCH), Portfolio Optimization", "High-Frequency Data and Algorithmic Trading"], "gradingBreakdown": { "End term Exam": "35%", "Quizzes/Tests": "25%", "Project/presentations": "20%", "Assignments": "20%" }, "sections": [{ "id": "FM_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 66, "isDoubleSlot": false }] },
  { "id": "CFS", "officialCode": "FI795", "name": "Corporate Financial Strategy", "shortName": "CFS", "faculty": "M Jayadev & Samir Chawla", "area": "F&A", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 39, "demandRatio": 0.52, "sentiment": null, "reviewText": null, "outline": null, "gradingBreakdown": {}, "sections": [{ "id": "CFS_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 39, "isDoubleSlot": false }] },
  { "id": "VAL", "officialCode": "FI734", "name": "Valuation", "shortName": "VAL", "faculty": "Narahari Hansoge", "area": "F&A", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 59, "demandRatio": 0.79, "sentiment": "not_recommended", "reviewText": "Very heavy course. Brutal exams. 25-30% can be normal. Prof is good but exams test whether you paid attention in class.", "outline": ["Valuation mental models, forecasting financial performance", "DCF modeling, cost of capital, growth, uncertainty", "Relative Valuation principles and applications", "Startup valuation, financial services, sum of the parts"], "gradingBreakdown": { "Mid-term (Individual)": "25%", "End-term (Individual)": "35%", "Valuation project (Group)": "40%" }, "sections": [{ "id": "VAL_1", "label": "GR1", "dayBlock": "WedThu", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 59, "isDoubleSlot": false }] },
  { "id": "GSM", "officialCode": "FI756", "name": "Global Securities Markets", "shortName": "GSM", "faculty": "Sankarshan Basu", "area": "F&A", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 58, "demandRatio": 0.77, "sentiment": null, "reviewText": null, "outline": ["Stocks, bonds, forex, derivatives overview", "Mutual funds, ETFs, brokerage houses", "Market structures, electronic auctions", "Bond markets, yields, pricing, risks, mortgages", "Futures, options, Black-Scholes model"], "gradingBreakdown": { "Mid Term": "50%", "End Term": "50%" }, "sections": [{ "id": "GSM_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 58, "isDoubleSlot": false }] },
  { "id": "IF", "officialCode": "FI703", "name": "International Finance", "shortName": "IF", "faculty": "Sankarshan Basu & HR Badrinath", "area": "F&A", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 39, "demandRatio": 0.52, "sentiment": null, "reviewText": null, "outline": ["Balance of payments and international monetary system", "Exchange rate determination and forex market", "Financial risk and currency exposure management", "Currency futures, options, FRAs, interest rate swaps", "International financing and short-term management"], "gradingBreakdown": { "Final": "50%", "Quiz 1": "25%", "Quiz 2": "25%" }, "sections": [{ "id": "IF_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "08:00-09:30", "slotIndex": 1, "seats": 75, "selected": 39, "isDoubleSlot": false }] },
  { "id": "INV", "officialCode": "FI701", "name": "Investments", "shortName": "INV", "faculty": "Srijith Mohanan", "area": "F&A", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 75, "demandRatio": 1.0, "sentiment": "recommended", "reviewText": "Very useful. Especially helpful for CFA Level 1 prep. Practical and relevant.", "outline": ["Financial markets, asset classes, security issuance", "Portfolio theory, CAPM, multifactor models", "Fixed-income: bond pricing, duration, convexity", "EMH, market anomalies, behavioral finance", "Derivatives: futures, forwards, options pricing"], "gradingBreakdown": { "Mid-Term": "40%", "End-Term": "40%", "Quizzes (best 5/8)": "20%" }, "sections": [{ "id": "INV_1", "label": "GR1", "dayBlock": "WedThu", "timeslot": "14:30-17:45", "slotIndex": 4, "seats": 75, "selected": 75, "isDoubleSlot": true, "endSlotIndex": 5 }] },
  { "id": "WAGWS", "officialCode": "FI777", "name": "What's Accounting got to do with Strategy?", "shortName": "WAGWS", "faculty": "M.S. Sriram & Narahari Hansoge", "area": "F&A", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 33, "demandRatio": 0.44, "sentiment": null, "reviewText": null, "outline": ["Accounting policy formulation and global standards", "Business model and accounting policy links", "Interpreting financial reporting: substance over form", "Accounting responsiveness to new business lines", "Accounting as a competitive tool"], "gradingBreakdown": { "Case Presentation": "10%", "Class Participation": "20%", "Midterm Assignment": "30%", "Endterm Exam": "40%" }, "sections": [{ "id": "WAGWS_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 33, "isDoubleSlot": false }] },
  { "id": "QRM", "officialCode": "DS720", "name": "Quantitative Risk Management", "shortName": "QRM", "faculty": "Anand Deo", "area": "DS", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 48, "demandRatio": 0.64, "sentiment": "caution", "reviewText": "Prof is lite and very enthusiastic. You can sleep or use laptop in class. Good slides, well organized PPTs.", "outline": null, "gradingBreakdown": {}, "sections": [{ "id": "QRM_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "16:15-17:45", "slotIndex": 5, "seats": 75, "selected": 48, "isDoubleSlot": false }] },
  { "id": "AERO", "officialCode": "DS704", "name": "Analytics for E-commerce and Retail Ops", "shortName": "AERO", "faculty": "Ananth Krishnamurthy", "area": "DS", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 95, "demandRatio": 1.27, "sentiment": "caution", "reviewText": "Very strong course. Prof is excellent. Deep DS concepts. Hard to score because DS toppers take it. High stress but high learning.", "outline": ["Analytics for retail financial health", "Assortment optimization and product lifecycle", "Omni-channel optimization and consumer behavior analytics", "Recommender systems and customer lifetime value"], "gradingBreakdown": { "Team Assignments": "25%", "Midterm": "30%", "Endterm": "45%" }, "sections": [{ "id": "AERO_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "14:30-16:00", "slotIndex": 4, "seats": 75, "selected": 95, "isDoubleSlot": false }] },
  { "id": "PGAI", "officialCode": "DS718", "name": "Predictive and Generative AI", "shortName": "P&GAI", "faculty": "Naveen Kumar Bhansali", "area": "DS", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 124, "demandRatio": 1.65, "sentiment": "caution", "reviewText": "Good course if you genuinely want to learn. Professor teaches very well. Note: Also offered in Term 5/6.", "outline": ["LLMs, LRMs, GPT-4o fundamentals", "Transformers, MoE, fine-tuning (LoRA, QLoRA)", "Generative AI: RAG, GANs, Diffusion, CLIP", "Recommendation systems, synthetic data, anomaly detection", "Agentic AI (LangGraph, AutoGen), responsible AI governance"], "gradingBreakdown": { "End-Term": "35%", "Assignment & presentation": "35%", "In-class quizzes": "30%" }, "sections": [{ "id": "PGAI_A", "label": "Sec A", "dayBlock": "WedThu", "timeslot": "18:00-19:30", "slotIndex": 6, "seats": 75, "selected": 124, "isDoubleSlot": false }, { "id": "PGAI_B", "label": "Sec B", "dayBlock": "FriSat", "timeslot": "18:00-19:30", "slotIndex": 6, "seats": 75, "selected": 124, "isDoubleSlot": false }] },
  { "id": "SA", "officialCode": "DS715", "name": "Sports Analytics", "shortName": "SA", "faculty": "Soudeep Deb", "area": "DS", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 49, "demandRatio": 0.65, "sentiment": "caution", "reviewText": "Fun if you like DS. Higher workload. Kaggle contests — grading depends on rank. Worth it if genuinely interested.", "outline": ["Sports data visualization and spatial data", "Statistical models for sports performance", "ML algorithms (Decision trees, XGBoost) for talent ID", "Forecasting match outcomes and game strategies", "Fantasy sports, sports betting, media, AI startups"], "gradingBreakdown": {}, "sections": [{ "id": "SA_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "14:30-16:00", "slotIndex": 4, "seats": 75, "selected": 49, "isDoubleSlot": false }] },
  { "id": "SMM", "officialCode": "MK768", "name": "Strategies for Mobile Marketing", "shortName": "SMM", "faculty": "Arpita Pandey", "area": "Mktg", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 43, "demandRatio": 0.57, "sentiment": null, "reviewText": null, "outline": ["Mobile marketplaces, app ecosystems, consumer behavior", "Mobile ads, lift and reach", "M-Commerce, M-Payments, location-based marketing", "ML, AI, and AR in campaigns", "Social media and mobile platform synergy"], "gradingBreakdown": { "Class Presentation": "20%", "Project": "30%", "End Term": "50%" }, "sections": [{ "id": "SMM_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 43, "isDoubleSlot": false }] },
  { "id": "OCRS", "officialCode": "MK772", "name": "Omnichannel Retail Strategy", "shortName": "OCRS", "faculty": "Ashis Mishra", "area": "Mktg", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 70, "demandRatio": 0.93, "sentiment": "caution", "reviewText": "Low effort overall. Grading random. Not ideal if pointer-sensitive.", "outline": ["Omnichannel vs uni/multichannel strategies", "Merchandising, pricing, category management", "C2C, quick commerce, livestreaming", "Store image, visual merchandising"], "gradingBreakdown": { "Store visit": "30%", "Project": "30%", "End Term": "30%", "CP": "10%" }, "sections": [{ "id": "OCRS_1", "label": "GR1", "dayBlock": "WedThu", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 70, "isDoubleSlot": false }] },
  { "id": "RMD", "officialCode": "MK715", "name": "Research for Marketing Decisions", "shortName": "RMD", "faculty": "Gopal Das", "area": "Mktg", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 48, "demandRatio": 0.64, "sentiment": "caution", "reviewText": "Very low effort. Easy content. Grading very random. Note: Also offered in Term 5/6.", "outline": ["Problem definition and Research Design", "Measurement, Scaling, Questionnaire design", "ANOVA, Regression, Factor/Discriminant/Cluster Analysis", "Perceptual mapping, Conjoint analysis", "Experiments and simulated test marketing"], "gradingBreakdown": { "CP": "5%", "Presentations": "15%", "Mid Term": "25%", "End Term": "25%", "Project": "30%" }, "sections": [{ "id": "RMD_A", "label": "Sec A", "dayBlock": "FriSat", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 48, "isDoubleSlot": false }, { "id": "RMD_B", "label": "Sec B", "dayBlock": "FriSat", "timeslot": "16:15-17:45", "slotIndex": 5, "seats": 75, "selected": 48, "isDoubleSlot": false }, { "id": "RMD_C", "label": "Sec C", "dayBlock": "FriSat", "timeslot": "18:00-19:30", "slotIndex": 6, "seats": 75, "selected": 48, "isDoubleSlot": false }] },
  { "id": "CB", "officialCode": "MK701", "name": "Consumer Behaviour", "shortName": "CB", "faculty": "Gopal Das", "area": "Mktg", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 150, "totalSelected": 87, "demandRatio": 0.58, "sentiment": null, "reviewText": "Note: Also offered in Term 5/6.", "outline": ["Consumer decision-making process", "Internal: psychological processes, perception, attitude, motivation", "External: social influence, situational influence, social media", "Brand relationships, diffusion of innovation, STP", "Applying consumer behaviour to strategy"], "gradingBreakdown": { "CP": "5%", "Presentations": "15%", "Mid Term": "25%", "End Term": "25%", "Project": "30%" }, "sections": [{ "id": "CB_GR1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "16:15-17:45", "slotIndex": 5, "seats": 75, "selected": 68, "isDoubleSlot": false }, { "id": "CB_GR2", "label": "GR2", "dayBlock": "MonTue", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 19, "isDoubleSlot": false }] },
  { "id": "MA", "officialCode": "MK765", "name": "Marketing Analytics", "shortName": "MA", "faculty": "Nalini Guhesh", "area": "Mktg", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 56, "demandRatio": 0.75, "sentiment": "not_recommended", "reviewText": "Tough course. Strict professor. Each class felt like an Orange tutorial but never understood why. She randomly checks progress at your desk. High pressure.", "outline": ["Data mining and analytics for marketing", "No-code tools (Orange Data Mining)", "Customer segmentation, behavior prediction, KNN", "Text mining, digital analytics, CLV"], "gradingBreakdown": { "Mid-term": "40%", "Group Project": "30%", "Quiz": "20%", "In-class": "10%" }, "sections": [{ "id": "MA_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 56, "isDoubleSlot": false }] },
  { "id": "AM", "officialCode": "MK721", "name": "Analytical Marketing", "shortName": "AM", "faculty": "Srinivas Prakhya", "area": "Mktg", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 10, "demandRatio": 0.13, "sentiment": null, "reviewText": null, "outline": ["Consumer choice, segmentation, targeting, positioning, pricing", "Qualitative: observation, ethnography, semiotics", "Quantitative: clustering, discriminant analysis, MDS, regression", "AI: decision trees, random forests, neural nets for marketing"], "gradingBreakdown": { "CP": "10%", "Case Analysis": "10%", "Mid Term": "20%", "End Term": "30%", "Group Project": "30%" }, "sections": [{ "id": "AM_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 10, "isDoubleSlot": false }] },
  { "id": "SCM", "officialCode": "PO705", "name": "Supply Chain Management", "shortName": "SCM", "faculty": "Jishnu Hazra", "area": "POM", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 150, "totalSelected": 95, "demandRatio": 0.63, "sentiment": "recommended", "reviewText": "Very good course. Professor teaches clearly. Fair grading. Effort clearly reflects in marks. Safe and solid option.", "outline": ["Supply chain trade-offs: sourcing, capacity, inventory, logistics, pricing", "Buyer-supplier contracts, information sharing", "Inventory allocation, lead time pooling, distribution networks", "Strategic sourcing, vertical integration, risk management", "Revenue management: fashion, auto, platforms"], "gradingBreakdown": { "CP": "10%", "SC Game": "10%", "Assignments": "15%", "Project": "15%", "Tests": "50%" }, "sections": [{ "id": "SCM_GR1", "label": "GR1", "dayBlock": "WedThu", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 42, "isDoubleSlot": false }, { "id": "SCM_GR2", "label": "GR2", "dayBlock": "WedThu", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 53, "isDoubleSlot": false }] },
  { "id": "CCBE", "officialCode": "PO729", "name": "Competition & Cooperation in Ecosystems", "shortName": "CCBE", "faculty": "Rajeev Tripathi", "area": "POM", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 150, "totalSelected": 45, "demandRatio": 0.3, "sentiment": "not_recommended", "reviewText": "Heavy coursework. Significant pressure on the project. Demanding throughout the term. Note: Also offered in Term 5/6.", "outline": ["Business ecosystems and ecosystem strategy", "Competition and cooperation dynamics", "Game-theoretic techniques for analysis"], "gradingBreakdown": { "Term project": "30%", "Case analysis": "10%", "Quizzes": "20%", "End-term": "40%" }, "sections": [{ "id": "CCBE_GR1", "label": "GR1", "dayBlock": "WedThu", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 30, "isDoubleSlot": false }, { "id": "CCBE_GR2", "label": "GR2", "dayBlock": "WedThu", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 15, "isDoubleSlot": false }] },
  { "id": "RBO", "officialCode": "PO735", "name": "Responsible Business Operations", "shortName": "RBO", "faculty": "Rajeev Tripathi", "area": "POM", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 9, "demandRatio": 0.12, "sentiment": null, "reviewText": null, "outline": ["SDGs, ESG rating methodologies", "Carbon credit markets, footprint analysis", "Carbon neutrality, circular supply chains", "Human rights, unfair trade, social responsibility"], "gradingBreakdown": { "Case analysis": "10%", "Quizzes": "20%", "Term project": "30%", "End-term": "40%" }, "sections": [{ "id": "RBO_A", "label": "Sec A", "dayBlock": "FriSat", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 9, "isDoubleSlot": false }, { "id": "RBO_B", "label": "Sec B", "dayBlock": "FriSat", "timeslot": "14:30-16:00", "slotIndex": 4, "seats": 75, "selected": 9, "isDoubleSlot": false }] },
  { "id": "RA", "officialCode": "PO731", "name": "Revenue Analytics", "shortName": "RA", "faculty": "Tarun Jain", "area": "POM", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 82, "demandRatio": 1.09, "sentiment": "caution", "reviewText": "Amazing professor. Strong analytics learning. Tough to score due to competitive cohort. Pointer may drop, but learning is worth it.", "outline": ["Pricing optimization and response functions", "Demand estimation (parametric and non-parametric)", "Dynamic pricing, surge pricing, demand uncertainty", "Markdown management, customized pricing, overbooking", "Auction pricing across industries"], "gradingBreakdown": { "Case Write-up": "10%", "CP": "15%", "Game Evaluations": "25%", "End-Term": "50%" }, "sections": [{ "id": "RA_A", "label": "Sec A", "dayBlock": "MonTue", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 82, "isDoubleSlot": false }, { "id": "RA_B", "label": "Sec B", "dayBlock": "MonTue", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 82, "isDoubleSlot": false }] },
  { "id": "DTE", "officialCode": "IS738", "name": "Demystifying Token Economy", "shortName": "DTE", "faculty": "Mayank Kumar", "area": "IS", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 30, "demandRatio": 0.4, "sentiment": null, "reviewText": null, "outline": ["Token economy: decentralized, transparent, secure", "Designing crypto tokens, NFTs with no-code tools", "Token-driven business models, decentralized governance", "Regulatory challenges and ethical dilemmas"], "gradingBreakdown": { "CP": "15%", "Quiz": "15%", "Project": "30%", "Exam": "40%" }, "sections": [{ "id": "DTE_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 30, "isDoubleSlot": false }] },
  { "id": "DBAI", "officialCode": "IS740", "name": "Doing Business with AI", "shortName": "DBAI", "faculty": "Shankar Venkatagiri", "area": "IS", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 63, "demandRatio": 0.84, "sentiment": "not_recommended", "reviewText": "DBAI mat lo if you value your peace of mind. Not recommended. No clear structure. Prof digresses frequently. Heavy self-study required. Regret taking it.", "outline": ["AI business applications via bestseller cases", "Deep learning and neural networks", "Recognizing AI potential, assessing consequences", "Generative AI impact across business"], "gradingBreakdown": { "Final": "40%", "Quizzes": "30%", "CP": "10%", "Project": "20%" }, "sections": [{ "id": "DBAI_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "11:45-13:15", "slotIndex": 3, "seats": 75, "selected": 63, "isDoubleSlot": false }] },
  { "id": "French", "officialCode": "CM705", "name": "French A1", "shortName": "French", "faculty": "French Language", "area": "Lang", "anchor": "PGP", "credits": 3, "grading": "Qualitative", "totalSeats": 100, "totalSelected": 88, "demandRatio": 0.88, "sentiment": "caution", "reviewText": "Easy and fun to learn. Qualitatively graded. Good option for exchange. Low stress.", "outline": ["Phonetics, alphabets, accents", "Salutations, days, months, colors, numbers", "Grammar: key verbs, articles, adjectives", "Vocabulary: professions, restaurants, descriptions", "Socio-culture: Francophonie, French cuisine"], "gradingBreakdown": {}, "sections": [{ "id": "French_GR1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "18:00-19:30", "slotIndex": 6, "seats": 50, "selected": 80, "isDoubleSlot": false }, { "id": "French_GR2", "label": "GR2", "dayBlock": "WedThu", "timeslot": "18:00-19:30", "slotIndex": 6, "seats": 50, "selected": 8, "isDoubleSlot": false }] },
  { "id": "German", "officialCode": "CM703", "name": "German A1", "shortName": "German", "faculty": "German Language", "area": "Lang", "anchor": "PGP", "credits": 3, "grading": "Qualitative", "totalSeats": 50, "totalSelected": 44, "demandRatio": 0.88, "sentiment": "caution", "reviewText": "Provides sample papers, repeats many questions. Easy and fun. Qualitatively graded.", "outline": ["Phonetics, alphabets, accents", "Salutations, numbers, nationality, articles", "Grammar: cases, modal verbs", "Vocabulary: professions, food, hobbies", "Socio-cultural: German punctuality, films"], "gradingBreakdown": {}, "sections": [{ "id": "German_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "18:00-19:30", "slotIndex": 6, "seats": 50, "selected": 44, "isDoubleSlot": false }] },
  { "id": "Japanese", "officialCode": "CM706", "name": "Japanese N5", "shortName": "Japanese", "faculty": "Japanese Language", "area": "Lang", "anchor": "PGP", "credits": 3, "grading": "Qualitative", "totalSeats": 50, "totalSelected": 31, "demandRatio": 0.62, "sentiment": null, "reviewText": null, "outline": ["Hiragana and Katakana scripts", "Numbers, grammar particles", "Conversational skills", "Verb tenses, preferences, abilities", "Japanese culture and etiquette"], "gradingBreakdown": {}, "sections": [{ "id": "Japanese_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "18:00-19:30", "slotIndex": 6, "seats": 50, "selected": 31, "isDoubleSlot": false }] },
  { "id": "Spanish", "officialCode": "CM701", "name": "Spanish A1", "shortName": "Spanish", "faculty": "Spanish Language", "area": "Lang", "anchor": "PGP", "credits": 3, "grading": "Qualitative", "totalSeats": 50, "totalSelected": 86, "demandRatio": 1.72, "sentiment": null, "reviewText": null, "outline": ["Phonetics, accents, salutations, numbers", "Verb conjugations, pronouns, articles, adjectives", "Indicative present, irregular/reflexive verbs", "Nationalities, professions, family, food", "Hispanic world, festivals, real-world scenarios"], "gradingBreakdown": {}, "sections": [{ "id": "Spanish_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "18:00-19:30", "slotIndex": 6, "seats": 50, "selected": 86, "isDoubleSlot": false }] },
  { "id": "CFL", "officialCode": "CM702", "name": "Communication for Leaders", "shortName": "CFL", "faculty": "Rakesh Godhwani", "area": "Mcomm", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 70, "demandRatio": 0.93, "sentiment": "caution", "reviewText": "Easy if strong communicator. Case reading required. Need to speak in class.", "outline": ["Persuasive business presentations", "Job interviews and offer negotiation", "Shark Tank entrepreneurial pitch", "Crisis and conflict communication", "TED Talk format public speeches"], "gradingBreakdown": { "Group Project": "10%", "Video Resume": "25%", "Shark Tank Pitch": "25%", "TED talk": "40%" }, "sections": [{ "id": "CFL_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "14:30-16:00", "slotIndex": 4, "seats": 75, "selected": 70, "isDoubleSlot": false }] },
  { "id": "LWI", "officialCode": "CM716", "name": "Leading with Influence", "shortName": "LWI", "faculty": "Swati Bandi & Roma Sharma", "area": "Mcomm", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 19, "demandRatio": 0.25, "sentiment": null, "reviewText": null, "outline": ["Influence principles and emotional intelligence", "Pre-suasion, cognitive biases, rhetorical appeals", "Charismatic communication and ethical influence", "Strategic storytelling and instant influence"], "gradingBreakdown": { "Final Presentation": "50%", "Quiz": "30%", "Simulation": "20%" }, "sections": [{ "id": "LWI_1", "label": "GR1", "dayBlock": "MonTue", "timeslot": "14:30-16:00", "slotIndex": 4, "seats": 75, "selected": 19, "isDoubleSlot": false }] },
  { "id": "EL", "officialCode": "OB763", "name": "Extreme Leadership", "shortName": "EL", "faculty": "V.N. Bhattacharya", "area": "OBHRM", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 42, "demandRatio": 0.56, "sentiment": "not_recommended", "reviewText": "Very strict. No phone. Extremely strict grading. High risk for pointer.", "outline": ["Lessons from extreme conditions leaders", "Sensemaking, strategy, decision-making, execution", "Performance during transformation and crises", "Leadership theories, biases, ethics"], "gradingBreakdown": { "Attendance": "10%", "Surprise quizzes": "20%", "Mid-term": "35%", "Dissertation": "35%" }, "sections": [{ "id": "EL_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "10:00-11:30", "slotIndex": 2, "seats": 75, "selected": 42, "isDoubleSlot": false }] },
  { "id": "LDE", "officialCode": "OB757", "name": "Leadership in Digital Era", "shortName": "LDE", "faculty": "Gopal Mahapatra", "area": "OBHRM", "anchor": "PGPEM", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 48, "demandRatio": 0.64, "sentiment": "caution", "reviewText": "Extension of MPPO. Need to engage in class. Low effort overall.", "outline": ["Future of Work, Technology Disruptions", "Collaborative, Ambidextrous, Revolutionary Leadership", "AI impact, Talent Management, Leadership Agility", "Leader as Coach, Leading Start-ups", "Governance, Values, and ESG"], "gradingBreakdown": { "CP": "10%", "Quizzes": "20%", "Team Project": "30%", "End Term": "40%" }, "sections": [{ "id": "LDE_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "16:15-17:45", "slotIndex": 5, "seats": 75, "selected": 48, "isDoubleSlot": false }] },
  { "id": "LWJ", "officialCode": "OH707", "name": "Leading With Joy", "shortName": "LWJ", "faculty": "Ramya Ranganathan", "area": "OBHRM", "anchor": "PGPEM", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 65, "demandRatio": 0.87, "sentiment": null, "reviewText": null, "outline": ["Sensemaking, inner sovereignty, managing emotions", "Mindfulness, managing mindsets, stress", "Motivation, failure, flow, managing energy", "Success, inner critic, conflict management", "Purpose-driven leadership and mentoring"], "gradingBreakdown": { "CP": "10%", "Take-Home": "20%", "Group Presentation": "20%", "Mid-Term": "25%", "End-Term": "25%" }, "sections": [{ "id": "LWJ_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "18:00-19:30", "slotIndex": 6, "seats": 75, "selected": 65, "isDoubleSlot": false }] },
  { "id": "LLL", "officialCode": "EN720", "name": "Lean Launch Lab", "shortName": "LLL", "faculty": "Suresh Bhagavatula", "area": "Entre", "anchor": "PGP", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 31, "demandRatio": 0.41, "sentiment": "not_recommended", "reviewText": "Do a course less in T4 but don't take this. Only if genuinely interested in entrepreneurship and even then — check evaluation components before choosing.", "outline": ["Lean Startup methodology, hypothesis testing", "Problem-solution fit, product-market fit", "Lean Canvas, Business Model Canvas", "MVPs, outreach channels, innovation accounting", "Venture pitches"], "gradingBreakdown": { "Hypothesis testing": "30%", "Essay Part 2": "25%", "Pitch": "20%", "Peer feedback": "15%", "Essay Part 1": "10%" }, "sections": [{ "id": "LLL_1", "label": "GR1", "dayBlock": "WedThu", "timeslot": "14:30-17:45", "slotIndex": 4, "seats": 75, "selected": 31, "isDoubleSlot": true, "endSlotIndex": 5 }] },
  { "id": "BI", "officialCode": "FA703", "name": "Behavioral Investing", "shortName": "BI", "faculty": "Anirudh Dhawan", "area": "F&A", "anchor": "PGPEM", "credits": 3, "grading": "Standard", "totalSeats": 75, "totalSelected": 69, "demandRatio": 0.92, "sentiment": null, "reviewText": null, "outline": ["Investment biases and approaches to tackle them", "Disposition effect, overconfidence, prevention", "Diversification, gambling, inattention", "Algorithmic trading, gamification, social media impact"], "gradingBreakdown": { "CP": "10%", "Trading simulation": "25%", "Quizzes": "30%", "Group project": "35%" }, "sections": [{ "id": "BI_1", "label": "GR1", "dayBlock": "FriSat", "timeslot": "16:15-17:45", "slotIndex": 5, "seats": 75, "selected": 69, "isDoubleSlot": false }] }
];

const AREAS = [...new Set(COURSES.map(c => c.area))].sort();

function DemandBadge({ ratio, selected, seats }) {
  const color = ratio > 1.5 ? "#ef4444" : ratio > 0.8 ? "#d97706" : ratio > 0.4 ? "#64748b" : "#94a3b8";
  const bg = ratio > 1.5 ? "#fef2f2" : ratio > 0.8 ? "#fffbeb" : "#f8fafc";
  return (
    <span title={`${selected}/${seats} seats selected in mock bid`} style={{ fontSize: 10, color, background: bg, padding: "1px 5px", borderRadius: 4, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
      {ratio.toFixed(1)}x
    </span>
  );
}

function SentimentDot({ sentiment }) {
  if (!sentiment) return <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d1d5db", display: "inline-block", flexShrink: 0 }} />;
  const colors = { recommended: "#22c55e", caution: "#eab308", not_recommended: "#ef4444" };
  return <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors[sentiment], display: "inline-block", flexShrink: 0 }} />;
}

function AreaTag({ area, small }) {
  const c = AREA_COLORS[area] || { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
  return (
    <span style={{ fontSize: small ? 9 : 10, color: c.text, background: c.bg, border: `1px solid ${c.border}`, padding: "0px 5px", borderRadius: 4, fontWeight: 700, whiteSpace: "nowrap", lineHeight: "16px" }}>
      {area}
    </span>
  );
}

function SentimentBadge({ sentiment }) {
  if (!sentiment) return <span style={{ fontSize: 11, color: "#94a3b8" }}>No review</span>;
  const c = SENTIMENT_CONFIG[sentiment];
  return (
    <span style={{ fontSize: 11, color: c.color, background: c.bg, border: `1px solid ${c.border}`, padding: "1px 8px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" }}>
      {c.emoji} {c.label}
    </span>
  );
}

function HoverCard({ course, style }) {
  const ac = AREA_COLORS[course.area];
  return (
    <div style={{ position: "absolute", zIndex: 100, background: "#fff", borderRadius: 12, boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)", width: 320, overflow: "hidden", ...style }}>
      <div style={{ padding: "10px 14px", background: ac?.light || "#f8fafc", borderBottom: `2px solid ${ac?.border || "#e2e8f0"}` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{course.name}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{course.faculty} · {course.officialCode}</div>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
          <AreaTag area={course.area} />
          <SentimentBadge sentiment={course.sentiment} />
          <DemandBadge ratio={course.demandRatio} selected={course.totalSelected} seats={course.totalSeats} />
          {course.grading === "Qualitative" && <span style={{ fontSize: 10, color: "#db2777", fontWeight: 700 }}>Qualitative</span>}
        </div>
        {course.reviewText && (
          <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            "{course.reviewText}"
          </div>
        )}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {course.sections.map(s => (
            <span key={s.id} style={{ fontSize: 10, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569" }}>
              {s.label}: {DAY_BLOCKS.find(d => d.id === s.dayBlock)?.short} {s.timeslot} {s.isDoubleSlot ? "★3hr" : ""}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6, textAlign: "center" }}>Click ⓘ for full details</div>
      </div>
    </div>
  );
}

function CalendarCell({ course, section, isSelected, isConflict, isSameCourse, isFull, onToggle, onDetail }) {
  const [hovered, setHovered] = useState(false);
  const dimmed = isConflict || isSameCourse || isFull;
  const ac = AREA_COLORS[course.area];
  const ref = useRef(null);

  const maxNameLen = 22;
  const displayName = course.name.length > maxNameLen ? course.name.slice(0, maxNameLen) + "…" : course.name;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (!dimmed) onToggle(); }}
      style={{
        padding: "5px 7px",
        borderRadius: 6,
        border: isSelected ? `2px solid ${ac?.dot || "#2563eb"}` : `1px solid ${dimmed ? "#f1f5f9" : "#e2e8f0"}`,
        background: isSelected ? (ac?.light || "#eff6ff") : dimmed ? "#fafafa" : "#fff",
        opacity: dimmed ? 0.4 : 1,
        cursor: dimmed ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 3 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
            <SentimentDot sentiment={course.sentiment} />
            <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? (ac?.text || "#1d4ed8") : "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayName}
            </span>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <AreaTag area={course.area} small />
            <DemandBadge ratio={course.demandRatio} selected={course.totalSelected} seats={course.totalSeats} />
            {section.label !== "GR1" && <span style={{ fontSize: 9, color: "#94a3b8" }}>{section.label}</span>}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDetail(course); }}
          style={{ background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", padding: "0 0 0 4px", lineHeight: 1, flexShrink: 0 }}
          title="View full details"
        >ⓘ</button>
      </div>
      {isSameCourse && <div style={{ fontSize: 8, color: "#94a3b8", marginTop: 1 }}>other section selected</div>}
      {hovered && !dimmed && (
        <HoverCard course={course} style={{ top: "100%", left: 0, marginTop: 4 }} />
      )}
    </div>
  );
}

function DetailModal({ course, onClose }) {
  if (!course) return null;
  const ac = AREA_COLORS[course.area];

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, maxWidth: 580, width: "100%", maxHeight: "88vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `3px solid ${ac?.border || "#e2e8f0"}`, background: ac?.light || "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{course.name}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{course.faculty} · {course.anchor} · {course.officialCode}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                <AreaTag area={course.area} />
                <SentimentBadge sentiment={course.sentiment} />
                {course.grading === "Qualitative" && <span style={{ fontSize: 11, background: "#fdf2f8", color: "#db2777", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>Qualitative Grading</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
          </div>
        </div>

        <div style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 16px", flex: 1, minWidth: 130 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Mock Demand</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: course.demandRatio > 1.5 ? "#ef4444" : course.demandRatio > 0.8 ? "#d97706" : "#64748b", marginTop: 2 }}>
                {course.demandRatio.toFixed(2)}x
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{course.totalSelected} selected / {course.totalSeats} seats</div>
              {course.demandRatio > 1 && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2, fontWeight: 600 }}>⚡ Oversubscribed — may need strong bid</div>}
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 16px", flex: 1, minWidth: 130 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Sections</div>
              {course.sections.map(s => (
                <div key={s.id} style={{ fontSize: 12, color: "#334155", marginTop: 3, display: "flex", justifyContent: "space-between" }}>
                  <span><strong>{s.label}</strong> {DAY_BLOCKS.find(d => d.id === s.dayBlock)?.label} {s.timeslot} {s.isDoubleSlot ? "★3hr" : ""}</span>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{s.selected}/{s.seats}</span>
                </div>
              ))}
            </div>
          </div>

          {course.reviewText && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Senior Reviews</div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.65, background: SENTIMENT_CONFIG[course.sentiment]?.bg || "#f8fafc", padding: "12px 16px", borderRadius: 10, borderLeft: `3px solid ${SENTIMENT_CONFIG[course.sentiment]?.color || "#cbd5e1"}` }}>
                {course.reviewText}
              </div>
            </div>
          )}

          {course.outline && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>What You'll Learn</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {course.outline.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#475569", paddingLeft: 14, position: "relative", lineHeight: 1.5 }}>
                    <span style={{ position: "absolute", left: 0, color: ac?.dot || "#94a3b8", fontSize: 14 }}>•</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(course.gradingBreakdown).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Evaluation</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(course.gradingBreakdown).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 11, background: "#f1f5f9", padding: "4px 10px", borderRadius: 6, color: "#334155" }}>
                    <strong style={{ color: "#0f172a" }}>{v}</strong> {k}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: "8px 10px", background: "#fffbeb", borderRadius: 8, fontSize: 10, color: "#92400e", lineHeight: 1.4 }}>
            ⚠️ Demand data is from a mock bidding round — directionally useful but may not reflect actual final demand. Reviews are from seniors and reflect individual experiences.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [selections, setSelections] = useState({});
  const [detailCourse, setDetailCourse] = useState(null);
  const [filters, setFilters] = useState({ areas: [], sentiment: [], search: "" });
  const [view, setView] = useState("calendar");

  const selectedSections = useMemo(() => Object.values(selections), [selections]);
  const selectedCourseIds = useMemo(() => new Set(Object.keys(selections)), [selections]);
  const selectedCount = selectedCourseIds.size;

  const occupiedSlots = useMemo(() => {
    const slots = new Set();
    selectedSections.forEach(sec => {
      slots.add(`${sec.dayBlock}_${sec.slotIndex}`);
      if (sec.isDoubleSlot && sec.endSlotIndex) slots.add(`${sec.dayBlock}_${sec.endSlotIndex}`);
    });
    return slots;
  }, [selectedSections]);

  const toggleSection = useCallback((course, section) => {
    setSelections(prev => {
      if (prev[course.id]) {
        if (prev[course.id].id === section.id) {
          const next = { ...prev };
          delete next[course.id];
          return next;
        }
        return { ...prev, [course.id]: section };
      }
      if (Object.keys(prev).length >= 6) return prev;
      return { ...prev, [course.id]: section };
    });
  }, []);

  const isSlotConflict = useCallback((course, section) => {
    if (selectedCourseIds.has(course.id)) return false;
    if (occupiedSlots.has(`${section.dayBlock}_${section.slotIndex}`)) return true;
    if (section.isDoubleSlot && section.endSlotIndex && occupiedSlots.has(`${section.dayBlock}_${section.endSlotIndex}`)) return true;
    return false;
  }, [selectedCourseIds, occupiedSlots]);

  const filteredCourses = useMemo(() => {
    return COURSES.filter(c => {
      if (filters.areas.length && !filters.areas.includes(c.area)) return false;
      if (filters.sentiment.length) {
        const s = c.sentiment || "none";
        if (!filters.sentiment.includes(s)) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q) || c.faculty.toLowerCase().includes(q) || c.officialCode.toLowerCase().includes(q) || c.area.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filters]);

  const calendarData = useMemo(() => {
    const grid = {};
    DAY_BLOCKS.forEach(db => { TIMESLOTS.forEach(ts => { grid[`${db.id}_${ts.index}`] = []; }); });
    COURSES.forEach(course => {
      course.sections.forEach(sec => {
        const key = `${sec.dayBlock}_${sec.slotIndex}`;
        if (grid[key]) grid[key].push({ course, section: sec });
        if (sec.isDoubleSlot && sec.endSlotIndex) {
          const key2 = `${sec.dayBlock}_${sec.endSlotIndex}`;
          if (grid[key2]) grid[key2].push({ course, section: sec, isOverflow: true });
        }
      });
    });
    return grid;
  }, []);

  const toggleFilter = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: prev[type].includes(value) ? prev[type].filter(v => v !== value) : [...prev[type], value] }));
  };

  const areaDistribution = useMemo(() => {
    const dist = {};
    Object.keys(selections).forEach(id => {
      const c = COURSES.find(co => co.id === id);
      if (c) dist[c.area] = (dist[c.area] || 0) + 1;
    });
    return dist;
  }, [selections]);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#f1f5f9" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>T4 Course Selector</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>IIM Bangalore · Term 4 Elective Bidding · Choose your 6 courses</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: selectedCount === 6 ? "#16a34a" : "#334155", padding: "8px 16px", borderRadius: 20, fontSize: 15, fontWeight: 800, transition: "all 0.3s", boxShadow: selectedCount === 6 ? "0 0 12px rgba(22,163,106,0.4)" : "none" }}>
              {selectedCount} / 6 selected
            </div>
            {selectedCount > 0 && (
              <button onClick={() => setSelections({})} style={{ background: "#334155", border: "none", color: "#94a3b8", padding: "6px 14px", borderRadius: 8, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                Clear all
              </button>
            )}
          </div>
        </div>

        {selectedCount > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {Object.entries(selections).map(([courseId, sec]) => {
              const course = COURSES.find(c => c.id === courseId);
              const ac = AREA_COLORS[course.area];
              return (
                <div key={courseId} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1e293b", padding: "4px 12px", borderRadius: 8, borderLeft: `3px solid ${ac?.dot || "#64748b"}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{course.name.length > 20 ? course.name.slice(0, 20) + "…" : course.name}</span>
                  <span style={{ fontSize: 10, color: "#64748b" }}>{DAY_BLOCKS.find(d => d.id === sec.dayBlock)?.short} {sec.timeslot.split("-")[0]}</span>
                  <button onClick={() => toggleSection(course, sec)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, fontWeight: 700 }}>×</button>
                </div>
              );
            })}
            {selectedCount > 0 && (
              <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 8 }}>
                {Object.entries(areaDistribution).map(([area, count]) => (
                  <span key={area} style={{ fontSize: 9, background: AREA_COLORS[area]?.bg, color: AREA_COLORS[area]?.text, padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                    {area}×{count}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 20px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {["calendar", "list"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "#0f172a" : "transparent", color: view === v ? "#fff" : "#475569", border: view === v ? "none" : "1px solid #e2e8f0", padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
              {v === "calendar" ? "📅 Calendar" : "📋 List"}
            </button>
          ))}
        </div>
        <div style={{ height: 24, width: 1, background: "#e2e8f0" }} />
        <input
          placeholder="Search course, faculty, code..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "5px 12px", fontSize: 12, width: 200, outline: "none" }}
        />
        <div style={{ height: 24, width: 1, background: "#e2e8f0" }} />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {AREAS.map(a => {
            const ac = AREA_COLORS[a];
            const active = filters.areas.includes(a);
            return (
              <button key={a} onClick={() => toggleFilter("areas", a)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: `1.5px solid ${active ? ac?.dot : "#d1d5db"}`, background: active ? ac?.bg : "#fff", color: active ? ac?.text : "#94a3b8", cursor: "pointer", fontWeight: 700, transition: "all 0.15s" }}>
                {a}
              </button>
            );
          })}
        </div>
        <div style={{ height: 24, width: 1, background: "#e2e8f0" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {[{ key: "recommended", label: "✅ Good", color: "#16a34a" }, { key: "caution", label: "⚠️ Mixed", color: "#ca8a04" }, { key: "not_recommended", label: "🚫 Avoid", color: "#dc2626" }, { key: "none", label: "⚪ None", color: "#94a3b8" }].map(s => {
            const active = filters.sentiment.includes(s.key);
            return (
              <button key={s.key} onClick={() => toggleFilter("sentiment", s.key)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: `1.5px solid ${active ? s.color : "#d1d5db"}`, background: active ? "#f8fafc" : "#fff", color: active ? s.color : "#94a3b8", cursor: "pointer", fontWeight: 700, transition: "all 0.15s" }}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View */}
      <div style={{ padding: "12px 12px 80px" }}>
        {view === "calendar" ? (
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 1fr 1fr", gap: 0, minWidth: 900 }}>
              <div style={{ background: "#f1f5f9", borderRadius: "8px 0 0 0", padding: 8 }} />
              {DAY_BLOCKS.map(db => (
                <div key={db.id} style={{ textAlign: "center", padding: "10px 0", fontWeight: 800, fontSize: 14, color: "#0f172a", background: "#f1f5f9", borderRadius: db.id === "FriSat" ? "0 8px 0 0" : 0 }}>
                  {db.label}
                </div>
              ))}

              {TIMESLOTS.map(ts => (
                <React.Fragment key={ts.index}>
                  <div style={{ padding: "6px 4px", fontSize: 11, color: "#475569", fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 10, background: "#f8fafc" }}>
                    <span>{ts.short}</span>
                    <span style={{ fontSize: 9, color: "#94a3b8" }}>Slot {ts.index}</span>
                  </div>
                  {DAY_BLOCKS.map(db => {
                    const key = `${db.id}_${ts.index}`;
                    const items = calendarData[key] || [];
                    const mainItems = items.filter(i => !i.isOverflow);
                    const hasOverflow = items.some(i => i.isOverflow);
                    return (
                      <div key={key} style={{ margin: "1px", padding: 3, background: mainItems.length > 0 || hasOverflow ? "#fff" : "#fafafa", border: "1px solid #f1f5f9", minHeight: 50, display: "flex", flexDirection: "column", gap: 3, borderRadius: 2 }}>
                        {mainItems.map(({ course, section }) => {
                          const isSelected = selections[course.id]?.id === section.id;
                          const isSameCourse = selectedCourseIds.has(course.id) && !isSelected;
                          const isConflict = !isSelected && !isSameCourse && isSlotConflict(course, section);
                          const isFull = !isSelected && !isSameCourse && selectedCount >= 6;
                          return (
                            <CalendarCell
                              key={section.id}
                              course={course}
                              section={section}
                              isSelected={isSelected}
                              isConflict={isConflict}
                              isSameCourse={isSameCourse}
                              isFull={isFull}
                              onToggle={() => toggleSection(course, section)}
                              onDetail={setDetailCourse}
                            />
                          );
                        })}
                        {hasOverflow && (
                          <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", fontStyle: "italic", padding: 2 }}>↑ 3hr block continues</div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 10 }}>
            {filteredCourses.sort((a, b) => b.demandRatio - a.demandRatio).map(course => {
              const ac = AREA_COLORS[course.area];
              const isAnySelected = selectedCourseIds.has(course.id);
              return (
                <div key={course.id} style={{ background: "#fff", borderRadius: 12, border: isAnySelected ? `2px solid ${ac?.dot || "#2563eb"}` : "1px solid #e2e8f0", overflow: "hidden", transition: "all 0.15s" }}>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{course.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{course.faculty} · {course.officialCode}</div>
                        <div style={{ display: "flex", gap: 5, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <AreaTag area={course.area} />
                          <SentimentBadge sentiment={course.sentiment} />
                          <DemandBadge ratio={course.demandRatio} selected={course.totalSelected} seats={course.totalSeats} />
                          {course.grading === "Qualitative" && <span style={{ fontSize: 10, color: "#db2777", fontWeight: 700 }}>Qualitative</span>}
                        </div>
                      </div>
                      <button onClick={() => setDetailCourse(course)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, color: "#475569", flexShrink: 0, fontWeight: 600 }}>
                        Details →
                      </button>
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {course.sections.map(sec => {
                        const isSelected = selections[course.id]?.id === sec.id;
                        const isConflict = !isSelected && isSlotConflict(course, sec);
                        const isFull = !isSelected && !selectedCourseIds.has(course.id) && selectedCount >= 6;
                        const disabled = isConflict || isFull;
                        return (
                          <button
                            key={sec.id}
                            onClick={() => !disabled && toggleSection(course, sec)}
                            style={{
                              padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
                              border: isSelected ? `2px solid ${ac?.dot || "#2563eb"}` : `1px solid ${disabled ? "#e2e8f0" : "#d1d5db"}`,
                              background: isSelected ? (ac?.light || "#dbeafe") : disabled ? "#f8fafc" : "#fff",
                              color: isSelected ? (ac?.text || "#1d4ed8") : disabled ? "#94a3b8" : "#334155",
                              opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
                            }}
                          >
                            {sec.label} · {DAY_BLOCKS.find(d => d.id === sec.dayBlock)?.short} {sec.timeslot} {sec.isDoubleSlot ? "★3hr" : ""}
                          </button>
                        );
                      })}
                    </div>

                    {course.reviewText && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#64748b", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        "{course.reviewText}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DetailModal course={detailCourse} onClose={() => setDetailCourse(null)} />
    </div>
  );
}