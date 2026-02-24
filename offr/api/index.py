from __future__ import annotations

import json
import os
import re
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(
    title="offr API",
    version="0.5.0",
    docs_url="/api/py/docs",
    openapi_url="/api/py/openapi.json",
)

# CORS — allow the deployed Vercel domain and local dev
_allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
_allowed_origins: list[str] = (
    [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]
    if _allowed_origins_env
    else ["http://localhost:3000", "http://127.0.0.1:3000"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

DATA_DIR = Path(__file__).parent / "data"
_DF: Optional[pd.DataFrame] = None

UNIVERSITY_NAME_MAP = {
    "KCL": "King's College London",
    "UCL": "University College London",
    "LSE": "London School of Economics and Political Science",
    "OXF": "University of Oxford",
    "CAM": "University of Cambridge",
    "IMP": "Imperial College London",
    "WAR": "University of Warwick",
    "STA": "University of St Andrews",
    "BATH": "University of Bath",
    "MAN": "University of Manchester",
    "EDIN": "University of Edinburgh",
    "BRIS": "University of Bristol",
    "DUR": "Durham University",
}

# Universities where PS carries heavy weight (top tier / competitive)
PS_HEAVY_UNIS = {"OXF", "CAM", "LSE", "IMP", "UCL"}
# Universities where PS carries moderate weight
PS_MODERATE_UNIS = {"KCL", "WAR", "EDIN", "BRIS", "DUR", "MAN", "STA"}
# Universities where PS carries lighter weight
PS_LIGHT_UNIS = {"BATH", "QMUL", "QMARY"}

# PS score band -> adjustment to final chance_percent
# (university_tier, ps_band) -> score delta
PS_SCORE_IMPACT = {
    # Top tier: great PS can push you in, bad PS kills you
    ("heavy", "Exceptional"): +12,
    ("heavy", "Strong"):      +6,
    ("heavy", "OK"):          -8,
    ("heavy", "Weak"):        -20,
    # Moderate tier
    ("moderate", "Exceptional"): +8,
    ("moderate", "Strong"):      +4,
    ("moderate", "OK"):          -4,
    ("moderate", "Weak"):        -12,
    # Light tier
    ("light", "Exceptional"): +5,
    ("light", "Strong"):      +2,
    ("light", "OK"):          0,
    ("light", "Weak"):        -5,
}

def get_ps_tier(university_id: str) -> str:
    uid = (university_id or "").upper()
    if uid in PS_HEAVY_UNIS:
        return "heavy"
    if uid in PS_MODERATE_UNIS:
        return "moderate"
    return "light"

def apply_ps_score(base_score: int, ps_out: Optional[Dict[str, Any]], university_id: str) -> Tuple[int, Optional[str]]:
    """Adjust the base score based on PS quality and university tier."""
    if ps_out is None:
        return base_score, None
    ps_band = ps_out.get("scores", {}).get("band")
    if not ps_band:
        return base_score, None
    tier = get_ps_tier(university_id)
    delta = PS_SCORE_IMPACT.get((tier, ps_band), 0)
    new_score = max(0, min(100, base_score + delta))
    note = None
    if delta <= -12:
        note = f"Personal statement significantly weakens this application ({ps_band} band). At this university, admissions teams read every statement carefully."
    elif delta <= -4:
        note = f"Personal statement is below the standard expected here ({ps_band} band) — this will likely hurt your chances."
    elif delta >= 8:
        note = f"Strong personal statement gives you a real edge at this university ({ps_band} band)."
    elif delta >= 4:
        note = f"Your personal statement adds a positive signal ({ps_band} band)."
    return new_score, note



def _try_import_genai():
    try:
        import google.generativeai as genai  # type: ignore
        return genai
    except Exception:
        return None


def nan_to_none(x: Any) -> Any:
    try:
        if x is None:
            return None
        if isinstance(x, float) and math.isnan(x):
            return None
    except Exception:
        pass
    return x


def clean_str(x: Any) -> str:
    return ("" if x is None else str(x)).strip()


def pick_data_path() -> Path:
    env = os.getenv("OFFR_DATA_FILE", "").strip()
    if env:
        p = Path(env)
        if p.is_file():
            return p
        p2 = DATA_DIR / env
        if p2.is_file():
            return p2

    preferred = DATA_DIR / "master_courses.csv"
    if preferred.is_file():
        return preferred

    csvs = sorted(DATA_DIR.glob("*.csv"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not csvs:
        raise RuntimeError(f"No .csv file found in {DATA_DIR}")
    return csvs[0]


def ensure_university_id(df: pd.DataFrame) -> pd.DataFrame:
    if "university_id" in df.columns:
        return df
    if "course_id" not in df.columns:
        raise RuntimeError("Data must include course_id")
    df = df.copy()
    df["university_id"] = df["course_id"].astype(str).apply(lambda x: x.split("_", 1)[0] if "_" in x else x[:6])
    return df


def load_df() -> pd.DataFrame:
    global _DF
    if _DF is None:
        if not DATA_DIR.exists():
            raise RuntimeError(f"Data directory not found: {DATA_DIR}")
        path = pick_data_path()
        _DF = pd.read_csv(path, dtype=str, engine="python")
        _DF = ensure_university_id(_DF)
    return _DF


def to_int(v: Any) -> Optional[int]:
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    m = re.search(r"-?\d+", s.replace(",", ""))
    return int(m.group(0)) if m else None


def to_money(v: Any) -> Optional[int]:
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    m = re.search(r"(\d[\d,]{3,})", s)
    return int(m.group(1).replace(",", "")) if m else None


def get_row(course_id: str) -> Dict[str, Any]:
    df = load_df()
    row = df[df["course_id"] == course_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"course_id not found: {course_id}")
    rec = row.iloc[0].to_dict()

    if "min_points_home" in rec:
        rec["min_points_home"] = to_int(rec.get("min_points_home"))
    if "intl_buffer_points" in rec:
        rec["intl_buffer_points"] = to_int(rec.get("intl_buffer_points"))
    if "estimated_annual_cost_international" in rec:
        rec["estimated_annual_cost_international"] = to_money(rec.get("estimated_annual_cost_international"))

    return {k: nan_to_none(v) for k, v in rec.items()}


def split_signals(text: str) -> List[str]:
    t = clean_str(text)
    if not t:
        return []
    parts = re.split(r"[;\n\.]+", t)
    out = [p.strip(" -•\t").strip() for p in parts if p.strip()]
    seen = set()
    uniq = []
    for s in out:
        k = s.lower()
        if k not in seen:
            seen.add(k)
            uniq.append(s)
    return uniq


def extract_ib_min_points(texts: List[str]) -> Optional[int]:
    joined = " | ".join([t for t in texts if t])
    m = re.search(r"\bIB\s*[:=]\s*(\d{2})\b", joined, flags=re.IGNORECASE)
    if m:
        return int(m.group(1))
    m = re.search(r"\bIB\b[^\d]{0,30}(\d{2})\b", joined, flags=re.IGNORECASE)
    if m:
        return int(m.group(1))
    for m in re.finditer(r"\b(\d{2})\b", joined):
        v = int(m.group(1))
        if 24 <= v <= 45:
            return v
    return None


def extract_alevel_offer(texts: List[str]) -> Optional[str]:
    joined = " | ".join([t for t in texts if t])
    m = re.search(r"A-?Levels?\s*[:=]\s*([A-E\*]{3,4})", joined, flags=re.IGNORECASE)
    if m:
        return m.group(1).upper()
    return None


def normalize_subject(s: str) -> str:
    t = s.lower().replace("&", "and")
    t = re.sub(r"[^a-z0-9\s\+\-\*]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()

    if "analysis and approaches" in t or "math aa" in t or "aa hl" in t:
        return "math_hl" if "hl" in t or "higher level" in t else "math"
    if "math" in t or "maths" in t:
        return "math_hl" if "hl" in t or "higher level" in t else "math"
    if "further math" in t:
        return "further_maths"
    if "econom" in t or re.search(r"\becon\b", t):
        return "economics"
    if "english" in t:
        return "english"
    if "physics" in t:
        return "physics"
    if "chem" in t:
        return "chemistry"
    if "bio" in t:
        return "biology"
    if "psych" in t:
        return "psychology"
    if "computer" in t and "science" in t:
        return "computer_science"
    return t


def required_subject_gate_ib(required_text: str, hl_subjects: List[str]) -> Tuple[bool, List[str], List[str]]:
    req = required_text.lower()
    passed: List[str] = []
    failed: List[str] = []
    hl_norm = {normalize_subject(s) for s in hl_subjects}

    if any(tok in req for tok in ["math", "maths", "analysis and approaches", "aa hl", "math aa"]):
        if "math_hl" in hl_norm:
            passed.append("Meets subject requirement (HL Maths)")
        else:
            failed.append("Missing subject requirement (HL Maths)")
            return False, passed, failed

    tokens = ["biology", "chemistry", "physics", "psychology", "economics", "computer science"]
    present = [t for t in tokens if t in req]
    if present:
        ok_any = False
        for t in present:
            canon = normalize_subject(t)
            if canon in hl_norm:
                ok_any = True
                passed.append(f"Meets subject requirement ({t.title()})")
                break
        if not ok_any:
            failed.append(f"Missing subject requirement ({' / '.join(present)})")
            return False, passed, failed

    return True, passed, failed


def required_subject_gate_alevel(required_text: str, subjects: List[str]) -> Tuple[bool, List[str], List[str]]:
    req = required_text.lower()
    passed: List[str] = []
    failed: List[str] = []
    s_norm = {normalize_subject(s) for s in subjects}

    if "math" in req or "maths" in req:
        if "math" in s_norm or "further_maths" in s_norm:
            passed.append("Meets subject requirement (Maths)")
        else:
            failed.append("Missing subject requirement (Maths)")
            return False, passed, failed

    for key in ["physics", "chemistry", "biology", "computer science", "economics"]:
        if key in req:
            canon = normalize_subject(key)
            if canon in s_norm:
                passed.append(f"Meets subject requirement ({key.title()})")
            else:
                failed.append(f"Missing subject requirement ({key.title()})")
                return False, passed, failed

    return True, passed, failed


_GRADE_RANK = {"A*": 6, "A": 5, "B": 4, "C": 3, "D": 2, "E": 1}


def parse_offer_pattern(pat: str) -> List[str]:
    pat = pat.strip().upper()
    out: List[str] = []
    i = 0
    while i < len(pat):
        if i + 1 < len(pat) and pat[i] == "A" and pat[i + 1] == "*":
            out.append("A*")
            i += 2
        else:
            out.append(pat[i])
            i += 1
    out = [g for g in out if g in _GRADE_RANK]
    return out[:3]


def score_ib(P: int, home_min: int, intl_threshold: Optional[int], threshold_used: int, is_intl: bool) -> Tuple[int, List[Dict[str, Any]]]:
    breakdown: List[Dict[str, Any]] = []
    score = 55

    if P <= home_min - 3:
        return 0, []

    margin = P - threshold_used
    margin_pos = max(0, margin)
    margin_bonus = min(30, int(round(margin_pos * 7)))
    if margin_bonus:
        score += margin_bonus
        breakdown.append({"name": "Points vs threshold", "points": margin_bonus})

    if is_intl and intl_threshold is not None and P >= intl_threshold:
        score += 8
        breakdown.append({"name": "International competitiveness bump", "points": 8})

    if P == home_min - 1:
        score -= 18
        breakdown.append({"name": "Below minimum (−1) penalty", "points": -18})
    if P == home_min - 2:
        score -= 28
        breakdown.append({"name": "Below minimum (−2) penalty", "points": -28})

    if is_intl and intl_threshold is not None and P >= home_min and P < intl_threshold:
        score -= 12
        breakdown.append({"name": "International borderline penalty", "points": -12})

    return max(0, min(100, score)), breakdown


def score_alevel(predicted: List[str], req: Optional[str]) -> Tuple[int, List[Dict[str, Any]], List[str], Optional[int]]:
    breakdown: List[Dict[str, Any]] = []
    notes: List[str] = []
    score = 55
    margin_sum: Optional[int] = None

    ranks = sorted([_GRADE_RANK.get(g, 0) for g in predicted], reverse=True)[:3]
    if len(ranks) < 3:
        return 0, [], ["Need at least 3 A-level subjects."], None

    if req:
        req_grades = parse_offer_pattern(req)
        if len(req_grades) == 3:
            req_ranks = [_GRADE_RANK[g] for g in req_grades]
            deltas = [ranks[i] - req_ranks[i] for i in range(3)]
            margin_sum = sum(deltas)
            if margin_sum > 0:
                bonus = min(24, margin_sum * 6)
                score += bonus
                breakdown.append({"name": "Above typical offer", "points": bonus})
            elif margin_sum < 0:
                pen = max(-40, margin_sum * 10)
                score += pen
                breakdown.append({"name": "Below typical offer", "points": pen})
            else:
                breakdown.append({"name": "Matches typical offer", "points": 0})
        else:
            notes.append("Typical offer not parseable; treat result as approximate.")
    else:
        notes.append("Typical offer not found; treat result as approximate.")

    return max(0, min(100, score)), breakdown, notes, margin_sum


def band_from_score(score: int) -> str:
    if score <= 39:
        return "Reach"
    if score <= 69:
        return "Target"
    return "Safe"


class IBSubject(BaseModel):
    subject: str
    grade: int = Field(ge=1, le=7)


class IBPayload(BaseModel):
    core_points: int = Field(ge=0, le=3)
    hl: List[IBSubject] = Field(min_length=3, max_length=3)
    sl: List[IBSubject] = Field(min_length=3, max_length=3)
    total_points: Optional[int] = Field(default=None, ge=0, le=45)


class ALevelItem(BaseModel):
    subject: str
    grade: str


class ALevelPayload(BaseModel):
    predicted: List[ALevelItem] = Field(min_length=3)


class PsInput(BaseModel):
    format: str = Field(pattern="^(UCAS_3Q|LEGACY)$")
    q1: Optional[str] = None
    q2: Optional[str] = None
    q3: Optional[str] = None
    statement: Optional[str] = None
    rewrite_mode: bool = False


class OfferAssessRequest(BaseModel):
    course_id: str
    home_or_intl: str = Field(pattern="^(home|intl)$")
    curriculum: str = Field(pattern="^(IB|A_LEVELS)$")
    ib: Optional[IBPayload] = None
    a_levels: Optional[ALevelPayload] = None
    ps: Optional[PsInput] = None


class UCASChoiceInput(BaseModel):
    position: int
    course_id: str
    course_name: str
    university_id: str
    university_name: str
    label: Optional[str] = None


class BulkAssessRequest(BaseModel):
    choices: List[UCASChoiceInput]
    profile: Dict[str, Any]  # Profile data with curriculum, grades, ps, etc.


class RubricCell(BaseModel):
    score: int = Field(ge=0, le=10)
    why: List[str]
    evidence_snippets: List[str]


class PsSuggestedEdit(BaseModel):
    target: str = Field(pattern="^(Q1|Q2|Q3|GLOBAL)$")
    priority: str = Field(pattern="^(high|med|low)$")
    change: str
    example_rewrite_optional: Optional[str] = None


class PsAnalyzeResponse(BaseModel):
    meta: Dict[str, Any]
    constraints: Dict[str, Any]
    alignment: Dict[str, Any]
    rubric: Dict[str, RubricCell]
    scores: Dict[str, Any]
    strengths: List[str]
    risks: List[str]
    red_flags: List[str]
    what_to_do_next: List[str]
    suggested_edits: List[PsSuggestedEdit]


def gemini_model_name() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def gemini_client():
    genai = _try_import_genai()
    if genai is None:
        return None
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        genai.configure(api_key=api_key)
        return genai
    except Exception:
        return None


def safe_detail(msg: str, e: Exception) -> str:
    return f"{msg}: {type(e).__name__}"


def counsellor_rewrite_with_gemini(detail_level: str, payload_summary: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    genai = gemini_client()
    if genai is None:
        print("Warning: gemini_client() returned None - AI features disabled")
        return None

    model = gemini_model_name()
    style = "BRIEF" if detail_level == "brief" else "DETAILED"

    prompt = (
        "You are a calm, experienced UK admissions counsellor.\n"
        "Write practical feedback for an applicant.\n"
        "Rules:\n"
        "- Do NOT mention internal storage formats or the word 'CSV'.\n"
        "- Be subtle about international thresholds (e.g., 'international applicants often need a slightly higher score').\n"
        "- No guarantees. Avoid hype.\n"
        "- Output ONLY JSON with keys: strengths, risks, what_to_do_next, notes.\n"
        f"- Detail level: {style}.\n"
        "  If BRIEF: 2–4 bullets total across all sections.\n"
        "  If DETAILED: up to 5 bullets per section.\n\n"
        f"Context JSON: {payload_summary}"
    )

    try:
        model_obj = genai.GenerativeModel(model)
        resp = model_obj.generate_content(prompt)
        import json
        text = resp.text.strip()
        # Clean markdown if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text
            text = text.rsplit("```", 1)[0]
        if text.startswith("json"):
            text = text[4:].strip()
        return json.loads(text)
    except Exception as e:
        print(f"Warning: counsellor_rewrite_with_gemini failed: {e}")
        return None


def ps_constraints(format_: str, q1: str, q2: str, q3: str, statement: str) -> Dict[str, Any]:
    warnings = []
    if format_ == "UCAS_3Q":
        q1c, q2c, q3c = len(q1), len(q2), len(q3)
        total = q1c + q2c + q3c
        if q1c and q1c < 350: warnings.append("Q1 below 350 characters.")
        if q2c and q2c < 350: warnings.append("Q2 below 350 characters.")
        if q3c and q3c < 350: warnings.append("Q3 below 350 characters.")
        if total > 4000: warnings.append("Total above 4,000 characters.")
        return {"q1_chars": q1c, "q2_chars": q2c, "q3_chars": q3c, "total_chars": total, "warnings": warnings}
    total = len(statement)
    if total > 4000: warnings.append("Total above 4,000 characters.")
    return {"q1_chars": 0, "q2_chars": 0, "q3_chars": 0, "total_chars": total, "warnings": warnings}


def ps_heuristics(text: str) -> Dict[str, Any]:
    t = text.lower()
    evidence_count = 0
    for m in ["i learned","i realised","i realized","this led me","i investigated","i analysed","i analyzed","which showed","because"]:
        evidence_count += t.count(m)
    cliche_hits = [c for c in ["since i was young","from a young age","always been fascinated","i am passionate","i've always been passionate","dream to","ever since"] if c in t]
    properish = len(re.findall(r"\b[A-Z][a-z]{2,}\b", text))
    words = re.findall(r"[A-Za-z']+", t)
    ngrams = [" ".join(words[i:i+4]) for i in range(max(0, len(words)-3))]
    freq = {}
    for g in ngrams:
        freq[g] = freq.get(g, 0) + 1
    repeated = sum(1 for _, v in freq.items() if v >= 3)
    return {"evidence_markers_count": evidence_count, "cliche_flags": cliche_hits, "specificity_estimate": properish, "repetition_ngram_clusters": repeated}


def weighted_score_from_rubric(r: Dict[str, RubricCell]) -> int:
    weights = {"q1_motivation_course_fit": 18,"q2_academic_preparation": 18,"q3_supercurricular_value": 18,"specificity_evidence_density": 14,"reflection_intellectual_maturity": 14,"structure_coherence": 10,"writing_clarity_tone": 8}
    total = 0.0
    for k, w in weights.items():
        cell = r.get(k)
        if cell is None:
            continue
        total += (cell.score / 10.0) * w
    return int(round(total))


def ps_band(total: int) -> str:
    if total <= 39: return "Weak"
    if total <= 64: return "OK"
    if total <= 84: return "Strong"
    return "Exceptional"


def build_ps_prompt(course_row: Dict[str, Any], ps: PsInput, constraints: Dict[str, Any], heur: Dict[str, Any]) -> str:
    signals = split_signals(clean_str(course_row.get("ps_expected_signals")))
    course_name = clean_str(course_row.get("course_name"))
    faculty = clean_str(course_row.get("faculty"))
    course_url = clean_str(course_row.get("course_url"))

    if ps.format == "UCAS_3Q":
        ps_text = f"Q1: {ps.q1 or ''}\n\nQ2: {ps.q2 or ''}\n\nQ3: {ps.q3 or ''}"
    else:
        ps_text = ps.statement or ""

    return f"""You are an admissions-style UCAS personal statement reviewer.
Return ONLY JSON that matches the provided JSON schema.

Context:
- course_name: {course_name}
- faculty: {faculty}
- course_url: {course_url}
- expected_signals: {signals}

Constraints: {constraints}
Heuristics: {heur}

Statement:
{ps_text}

Rubric (score 0-10):
- q1_motivation_course_fit
- q2_academic_preparation
- q3_supercurricular_value
- specificity_evidence_density
- reflection_intellectual_maturity
- structure_coherence
- writing_clarity_tone

Rules:
- Evidence snippets must be direct short quotes (<= 12 words).
- Do not invent achievements.
- If rewrite_mode=false, do not provide any example rewrites (null).
- If rewrite_mode=true, at most 2 short paragraph rewrites.

Output must include:
- alignment: covered/missing expected_signals
- strengths, risks, red_flags, what_to_do_next
- suggested_edits with priorities

Now produce the JSON."""


def run_ps_analyzer(course_row: Dict[str, Any], ps: PsInput) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    client = gemini_client()
    if client is None:
        return None, "PS analysis unavailable (Gemini not configured)."

    model = gemini_model_name()

    q1 = ps.q1 or ""
    q2 = ps.q2 or ""
    q3 = ps.q3 or ""
    statement = ps.statement or ""

    constraints = ps_constraints(ps.format, q1, q2, q3, statement)
    full_text = (q1 + "\n" + q2 + "\n" + q3) if ps.format == "UCAS_3Q" else statement
    heur = ps_heuristics(full_text)

    prompt = build_ps_prompt(course_row, ps, constraints, heur)

    import json as _json, re as _re

    try:
        resp = client.models.generate_content(
            model=model,
            contents=prompt,
            config={"temperature": 0.3, "response_mime_type": "application/json"},
        )

        text = resp.text.strip()
        text = _re.sub(r"^```(?:json)?\s*", "", text)
        text = _re.sub(r"\s*```$", "", text)
        raw: Dict[str, Any] = _json.loads(text)

        rubric_keys = ["q1_motivation_course_fit","q2_academic_preparation","q3_supercurricular_value",
                       "specificity_evidence_density","reflection_intellectual_maturity",
                       "structure_coherence","writing_clarity_tone"]
        if not isinstance(raw.get("rubric"), dict):
            raw["rubric"] = {}
        for k in rubric_keys:
            cell = raw["rubric"].get(k)
            if not isinstance(cell, dict):
                raw["rubric"][k] = {"score": 5, "why": [], "evidence_snippets": []}
            else:
                try: cell["score"] = max(0, min(10, int(cell.get("score", 5))))
                except Exception: cell["score"] = 5
                if not isinstance(cell.get("why"), list): cell["why"] = []
                if not isinstance(cell.get("evidence_snippets"), list): cell["evidence_snippets"] = []

        for field in ("strengths", "risks", "red_flags", "what_to_do_next"):
            if not isinstance(raw.get(field), list): raw[field] = []

        clean_edits = []
        for edit in (raw.get("suggested_edits") or []):
            if not isinstance(edit, dict): continue
            t = str(edit.get("target", "GLOBAL")).upper()
            if t not in ("Q1","Q2","Q3","GLOBAL"): t = "GLOBAL"
            p = str(edit.get("priority", "med")).lower()
            if p not in ("high","med","low"): p = "med"
            clean_edits.append({"target": t, "priority": p, "change": str(edit.get("change","")), "example_rewrite_optional": edit.get("example_rewrite_optional")})
        raw["suggested_edits"] = clean_edits

        if not isinstance(raw.get("alignment"), dict): raw["alignment"] = {}
        raw["alignment"].setdefault("ps_expected_signals", [])
        raw["alignment"].setdefault("signals_covered", [])
        raw["alignment"].setdefault("signals_missing", [])
        raw["alignment"].setdefault("coverage_notes", [])

        raw["meta"] = {"course_id": course_row.get("course_id"),"course_name": course_row.get("course_name"),"faculty": course_row.get("faculty"),"format": ps.format,"generated_at": datetime.now(timezone.utc).isoformat(),"model": model}
        raw["constraints"] = constraints
        raw["alignment"]["ps_expected_signals"] = split_signals(clean_str(course_row.get("ps_expected_signals")))

        rubric_obj = {k: RubricCell(**v) for k, v in raw["rubric"].items()}
        wt = weighted_score_from_rubric(rubric_obj)
        raw["scores"] = {"weighted_total": wt, "band": ps_band(wt)}
        return raw, None
    except Exception as e:
        return None, safe_detail("PS analysis failed", e)


@app.get("/api/py/universities")
def universities():
    df = load_df()
    ids = sorted(set([clean_str(x) for x in df["university_id"].fillna("").tolist() if clean_str(x)]))
    out = []
    for uid in ids:
        out.append({"university_id": uid, "university_name": UNIVERSITY_NAME_MAP.get(uid, uid)})
    return out


@app.get("/api/py/courses")
def courses(university_id: Optional[str] = None):
    df = load_df()
    cols = ["university_id", "course_id", "course_name", "faculty", "degree_type", "estimated_annual_cost_international", "min_requirements"]
    out = df[cols].copy() if all(c in df.columns for c in cols) else df.copy()
    if university_id:
        out = out[out["university_id"].astype(str).str.upper() == university_id.upper()]
    out = out.where(pd.notna(out), None)
    if "estimated_annual_cost_international" in out.columns:
        out["estimated_annual_cost_international"] = out["estimated_annual_cost_international"].map(to_money)
    
    # Add university_name mapping
    records = out.to_dict(orient="records")
    for record in records:
        if record.get("university_id"):
            record["university"] = UNIVERSITY_NAME_MAP.get(record["university_id"], record["university_id"])
    
    return records


@app.get("/api/py/course/{course_id}")
def course(course_id: str):
    return get_row(course_id)


@app.get("/api/py/health")
def health():
    return {"status": "ok"}


@app.post("/api/py/assess_bulk")
def assess_bulk(payload: BulkAssessRequest):
    """
    Assess multiple UCAS choices at once.
    Returns a list of assessments, one for each choice.
    """
    results = []
    profile = payload.profile
    
    for choice in payload.choices:
        try:
            # Build the assessment request based on profile type
            curriculum = profile.get("curriculum", "IB")
            home_or_intl = profile.get("applicant_type", "home")
            
            # Build curriculum-specific payloads
            assess_payload = OfferAssessRequest(
                course_id=choice.course_id,
                home_or_intl=home_or_intl,
                curriculum=curriculum
            )
            
            # Parse grades from profile
            if curriculum == "IB":
                hl_list = profile.get("hl", [])
                sl_list = profile.get("sl", [])
                core_points = profile.get("core_points", 0)
                
                hl_subjects = [
                    IBSubject(subject=h.get("subject"), grade=int(h.get("grade", 0)))
                    for h in hl_list if h.get("subject") and h.get("grade")
                ]
                sl_subjects = [
                    IBSubject(subject=s.get("subject"), grade=int(s.get("grade", 0)))
                    for s in sl_list if s.get("subject") and s.get("grade")
                ]
                
                assess_payload.ib = IBPayload(
                    hl=hl_subjects,
                    sl=sl_subjects,
                    core_points=int(core_points) if core_points else 0
                )
            
            elif curriculum == "A_LEVELS":
                predicted_list = profile.get("subjects", [])
                predicted_subjects = [
                    ALevelItem(subject=p.get("subject"), grade=p.get("grade"))
                    for p in predicted_list if p.get("subject") and p.get("grade")
                ]
                
                assess_payload.a_levels = ALevelPayload(predicted=predicted_subjects)
            
            # Add personal statement if available
            if profile.get("personal_statement"):
                assess_payload.ps = PsInput(
                    format="UCAS_3Q",
                    q1=profile.get("personal_statement"),
                    q2=None,
                    q3=None,
                    statement=profile.get("personal_statement"),
                    rewrite_mode=False
                )
            
            # Run assessment
            result = assess(assess_payload)
            
            # Flatten the result for easier UI consumption
            flat_result = {
                "position": choice.position,
                "course_id": choice.course_id,
                "course_name": choice.course_name,
                "university_id": choice.university_id,
                "university_name": choice.university_name,
                "label": choice.label,
                "verdict": result.get("verdict"),
                "band": result.get("band"),
                "chance_percent": result.get("chance_percent"),
                "prediction": result.get("band", "Unknown"),
            }
            
            results.append(flat_result)
        
        except Exception as e:
            # If one choice fails, return error info for that choice
            results.append({
                "position": choice.position,
                "course_id": choice.course_id,
                "course_name": choice.course_name,
                "university_name": choice.university_name,
                "error": str(e),
                "band": "Error",
                "chance_percent": 0
            })
    
    return results


@app.post("/api/py/assess")
def assess(payload: OfferAssessRequest):
    row = get_row(payload.course_id)

    course = {
        "course_id": row.get("course_id"),
        "course_name": row.get("course_name"),
        "faculty": row.get("faculty"),
        "min_requirements": row.get("min_requirements"),
        "estimated_annual_cost_international": row.get("estimated_annual_cost_international"),
        "course_url": row.get("course_url"),
    }

    passed: List[str] = []
    failed: List[str] = []
    strengths: List[str] = []
    risks: List[str] = []
    notes: List[str] = []
    score_breakdown: List[Dict[str, Any]] = []

    home_min = extract_ib_min_points([clean_str(row.get("min_points_home")), clean_str(row.get("min_requirements")), clean_str(row.get("typical_offer"))])
    intl_buffer = to_int(row.get("intl_buffer_points")) or 0

    threshold_used: Optional[int] = None
    margin: Optional[int] = None
    score: int = 0

    if payload.curriculum == "IB":
        if not payload.ib:
            raise HTTPException(status_code=400, detail="Missing ib payload for curriculum=IB")
        P = int(sum(x.grade for x in payload.ib.hl) + sum(x.grade for x in payload.ib.sl) + payload.ib.core_points)

        if home_min is None:
            notes.append("Minimum score could not be parsed; treat threshold comparisons as approximate.")
        else:
            threshold_used = home_min + intl_buffer if payload.home_or_intl == "intl" else home_min
            margin = P - threshold_used
            if P <= home_min - 3:
                return _final("Not eligible (likely filtered)", "Reach", 0, course, [], [f"Points are 3+ below the stated minimum ({home_min})."], threshold_used, margin, [], [], ["This gap is usually an early screening filter."], ["Consider courses with lower entry requirements.", "Strengthen the academic profile if possible."], notes, None, payload.course_id, home_min)

            if P >= home_min: passed.append(f"Meets stated minimum ({home_min})")
            else: failed.append(f"Below stated minimum ({home_min})")

            if payload.home_or_intl == "intl":
                if P >= threshold_used: passed.append("Competitive for international threshold")
                elif P >= home_min: failed.append("Slightly below what international applicants often need.")

            req_text = clean_str(row.get("required_subjects"))
            if req_text:
                ok, p2, f2 = required_subject_gate_ib(req_text, [x.subject for x in payload.ib.hl])
                passed.extend(p2); failed.extend(f2)
                if not ok:
                    return _final("Not eligible (likely filtered)", "Reach", 0, course, passed, failed, threshold_used, margin, [], [], ["Missing a hard subject requirement (often filtered early)."], ["Pick an adjacent course without this requirement.", "Meet the required subject if possible."], notes, None, payload.course_id, home_min)

            intl_threshold = home_min + intl_buffer if payload.home_or_intl == "intl" else None
            score, breakdown = score_ib(P, home_min, intl_threshold, threshold_used, payload.home_or_intl == "intl")
            score_breakdown.extend(breakdown)

        strengths.append(f"Predicted total (subjects + core): {P}/45.")
        if margin is not None: strengths.append(f"Margin vs threshold: {margin}.")
        band = band_from_score(score)
        verdict = "Eligible and competitive" if band == "Safe" and len(failed) == 0 else "Eligible but risky"

    elif payload.curriculum == "A_LEVELS":
        if not payload.a_levels:
            raise HTTPException(status_code=400, detail="Missing a_levels payload for curriculum=A_LEVELS")
        req_offer = extract_alevel_offer([clean_str(row.get("typical_offer")), clean_str(row.get("min_requirements"))])
        predicted_grades = [x.grade.strip().upper() for x in payload.a_levels.predicted if x.grade]
        predicted_subjects = [x.subject for x in payload.a_levels.predicted if x.subject]
        req_text = clean_str(row.get("required_subjects"))
        if req_text:
            ok, p2, f2 = required_subject_gate_alevel(req_text, predicted_subjects)
            passed.extend(p2); failed.extend(f2)
            if not ok:
                return _final("Not eligible (likely filtered)", "Reach", 0, course, passed, failed, None, None, [], [], ["Missing a hard subject requirement (often filtered early)."], ["Pick an adjacent course without this requirement.", "Meet the required subject if possible."], notes, None, payload.course_id, home_min)

        score, breakdown, sc_notes, margin_sum = score_alevel(predicted_grades, req_offer)
        score_breakdown.extend(breakdown); notes.extend(sc_notes)
        if req_offer:
            if margin_sum is not None and margin_sum >= 0: passed.append(f"At/above typical offer ({req_offer})")
            else: failed.append(f"Below typical offer ({req_offer})")
        strengths.append("A-level profile evaluated against the typical offer where possible.")
        band = band_from_score(score)
        verdict = "Eligible and competitive" if band == "Safe" and len(failed) == 0 else "Eligible but risky"

    else:
        raise HTTPException(status_code=400, detail="Unsupported curriculum")

    ps_out: Optional[Dict[str, Any]] = None
    if payload.ps is not None:
        ps_out, ps_err = run_ps_analyzer(row, payload.ps)
        if ps_err: notes.append(ps_err)

    # Apply PS impact to score
    university_id_str = clean_str(row.get("university_id"))
    score, ps_note = apply_ps_score(score, ps_out, university_id_str)
    if ps_note:
        notes.append(ps_note)

    chance_percent = int(max(0, min(100, score)))
    detail_level = "brief" if chance_percent >= 75 else "detailed"
    what_next = ["Double-check the official course page and requirements.", "Strengthen subject-fit and evidence in your statement."]
    if payload.home_or_intl == "intl": what_next.insert(0, "International applicants often need a slightly higher score.")
    payload_summary = {"course_name": clean_str(row.get("course_name")),"faculty": clean_str(row.get("faculty")),"university_id": clean_str(row.get("university_id")),"applicant_type": payload.home_or_intl,"curriculum": payload.curriculum,"verdict": verdict,"band": band,"chance_percent": chance_percent,"threshold_used": threshold_used,"margin": margin,"passed": passed,"failed": failed,"ps_included": payload.ps is not None,"ps_band": (ps_out.get("scores", {}).get("band") if isinstance(ps_out, dict) else None)}
    polish = counsellor_rewrite_with_gemini(detail_level, payload_summary)
    if polish:
        strengths = polish.get("strengths", strengths)
        risks = polish.get("risks", risks)
        what_next = polish.get("what_to_do_next", what_next)
        notes = polish.get("notes", notes)

    return _final(verdict, band, chance_percent, course, passed, failed, threshold_used, margin, score_breakdown, strengths, risks, what_next, notes, ps_out, payload.course_id, home_min)


def _final(verdict, band, chance_percent, course, passed, failed, threshold_used, margin, breakdown, strengths, risks, what_next, notes, ps_out, course_id, home_min_target):
    alts = suggest_alternatives(course_id, home_min_target)
    return {"verdict": verdict,"band": band,"chance_percent": chance_percent,"course": course,"checks": {"passed": passed, "failed": failed},"competitiveness": {"threshold_used": threshold_used, "margin": margin, "score": chance_percent, "score_breakdown": breakdown},"counsellor": {"strengths": strengths, "risks": risks, "what_to_do_next": what_next, "notes": notes},"ps_analysis": ps_out,"alternatives": alts}


def suggest_alternatives(course_id: str, home_min_target: Optional[int]) -> Dict[str, Any]:
    df = load_df()
    row = df[df["course_id"] == course_id]
    if row.empty:
        return {"suggested_course_ids": [], "suggested_course_names": []}
    faculty = row.iloc[0].get("faculty")

    candidates = []
    for _, r in df.iterrows():
        if str(r.get("course_id")) == course_id:
            continue
        if faculty and r.get("faculty") != faculty:
            continue
        ib_min = extract_ib_min_points([clean_str(r.get("min_points_home")), clean_str(r.get("min_requirements")), clean_str(r.get("typical_offer"))])
        candidates.append((str(r.get("course_id")), str(r.get("course_name")), ib_min))

    if home_min_target is not None:
        candidates = [c for c in candidates if c[2] is not None and c[2] <= home_min_target]
        candidates.sort(key=lambda x: (x[2], x[1]))
    else:
        candidates.sort(key=lambda x: (999 if x[2] is None else x[2], x[1]))

    top = candidates[:3]
    return {"suggested_course_ids": [c[0] for c in top], "suggested_course_names": [c[1] for c in top]}


@app.post("/api/py/analyse_ps")
async def analyse_ps(request: Request):
    body = await request.json()
    statement = body.get("statement", "")
    lines = body.get("lines", [])
    ps_format = body.get("format", "UCAS_3Q")

    if not statement or not lines:
        return JSONResponse({"error": "Missing statement or lines"}, status_code=400)

    prompt = f"""You are a world-class UK university admissions consultant with 20 years of experience at Oxford, Cambridge, and Russell Group institutions.

Analyse this personal statement ({ps_format} format) and return ONLY a valid JSON object with NO markdown, no commentary, no code fences.

Personal statement:
\"\"\"
{statement}
\"\"\"

The statement has been split into {len(lines)} chunks. Analyse each one.

Chunks:
{json.dumps([{"index": i, "text": line} for i, line in enumerate(lines)], indent=2)}

Return this exact JSON structure:
{{
  "overallScore": <integer 0-100>,
  "band": <"Exceptional" | "Strong" | "Solid" | "Developing" | "Weak">,
  "summary": <2-3 sentence honest overall assessment>,
  "strengths": [<3 specific strengths as short strings>],
  "weaknesses": [<3 specific weaknesses as short strings>],
  "topPriority": <single most important thing to fix, 1 sentence>,
  "lineFeedback": [
    {{
      "lineNumber": <index starting at 0>,
      "line": <exact text of the chunk>,
      "score": <integer 1-10>,
      "verdict": <"strong" | "weak" | "improve" | "neutral">,
      "feedback": <honest 1-2 sentence critique of this specific passage>,
      "suggestion": <optional improved rewrite of just this passage, or null>
    }}
  ]
}}

Be specific, honest, and harsh where necessary. Do not pad with generic praise. Focus on what admissions tutors at selective universities actually look for: intellectual curiosity, subject passion, independent thinking, specific examples over vague claims, and authentic voice."""

    try:
        client = gemini_client()
        if client is None:
            return JSONResponse({"error": "GEMINI_API_KEY not set or Gemini unavailable"}, status_code=503)

        model_name = gemini_model_name()
        model = client.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Strip markdown fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text
            text = text.rsplit("```", 1)[0]
        if text.startswith("json"):
            text = text[4:].strip()

        data = json.loads(text)
        return JSONResponse(data)

    except json.JSONDecodeError as e:
        return JSONResponse({"error": f"Failed to parse AI response as JSON: {str(e)}"}, status_code=500)
    except ImportError as e:
        return JSONResponse({"error": f"Missing dependency: {str(e)}. Install google-generativeai."}, status_code=500)
    except Exception as e:
        import traceback
        return JSONResponse({"error": f"{str(e)}", "trace": traceback.format_exc()}, status_code=500)
