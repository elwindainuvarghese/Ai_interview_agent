import os
import json
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# Optional Gemini SDK import
try:
    from google import genai
    from google.genai import types
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
        client = genai.Client(api_key=GEMINI_API_KEY)
    else:
        client = None
except Exception:
    client = None

MODEL_NAME = "gemini-2.5-flash"

app = FastAPI(title="AI Interview Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Session Storage
# Format: { session_id: { "candidate": dict, "history": list, "question_count": int, "days_covered": set } }
sessions: Dict[str, Dict[str, Any]] = {}

# Load static resources
try:
    with open("curriculum.json", "r") as f:
        CURRICULUM_DATA = json.load(f)
except Exception:
    CURRICULUM_DATA = {}


# ---------------------------------------------------------
# Schemas
# ---------------------------------------------------------

class FeedbackSchema(BaseModel):
    summary: str = Field(description="Comprehensive summary of candidate performance")
    strengths: List[str] = Field(description="Actionable strengths demonstrated during the interview")
    gaps: List[str] = Field(description="Identified knowledge gaps or areas of improvement")
    next: List[str] = Field(description="Recommended next steps for candidate growth")


class InterviewRequest(BaseModel):
    sessionId: str
    candidate: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


class InterviewResponse(BaseModel):
    reply: str
    done: bool
    feedback: Optional[FeedbackSchema] = None


# ---------------------------------------------------------
# API Route
# ---------------------------------------------------------

@app.get("/")
async def root():
    return {"status": "ok", "service": "AI Interview Agent"}


@app.post("/api/interview", response_model=InterviewResponse)
async def interview_endpoint(req: InterviewRequest):
    session_id = req.sessionId

    # Phase 1: Initialize New Session
    if req.candidate is not None:
        candidate_info = req.candidate
        candidate_name = candidate_info.get("member", {}).get("name", candidate_info.get("name", "Candidate"))
        initial_reply = f"Hello {candidate_name}, welcome to your AI Cohort technical interview. Let's begin!"
        
        sessions[session_id] = {
            "candidate": candidate_info,
            "history": [{"role": "model", "parts": [initial_reply]}],
            "question_count": 0,
            "days_covered": set(),
        }
        
        return InterviewResponse(reply=initial_reply, done=False)

    # Validate active session
    if session_id not in sessions:
        raise HTTPException(status_code=400, detail="Session not initialized. Provide candidate object first.")

    session = sessions[session_id]

    # Append user response to transcript
    if req.message:
        session["history"].append({"role": "user", "parts": [req.message]})

    session["question_count"] += 1

    # Phase 3: Completion Check (>= 8 questions AND >= 4 curriculum days)
    if session["question_count"] >= 8 and len(session["days_covered"]) >= 4:
        feedback = generate_final_feedback(session)
        return InterviewResponse(
            reply="Interview completed. Thank you for your time!",
            done=True,
            feedback=feedback
        )

    # Phase 2: Generate Next Follow-Up Question
    next_question, day_used = generate_next_question(session)
    if day_used:
        session["days_covered"].add(day_used)

    session["history"].append({"role": "model", "parts": [next_question]})

    return InterviewResponse(
        reply=next_question,
        done=False
    )


# ---------------------------------------------------------
# LLM Logic
# ---------------------------------------------------------

def generate_next_question(session: Dict[str, Any]) -> tuple[str, Optional[int]]:
    candidate = session["candidate"]
    completed_missions = candidate.get("missions", [])
    passed_days = [m["day"] for m in completed_missions if m.get("passed")]
    
    if not passed_days:
        passed_days = [1, 3, 7, 8, 12, 16, 22, 28, 31]

    system_instruction = f"""
    You are an expert technical interviewer evaluating an AI Cohort student.
    
    Candidate Profile:
    - Name: {candidate.get('member', {}).get('name', candidate.get('name', 'Candidate'))}
    - Role: {candidate.get('member', {}).get('jobRole', 'Engineer')}
    - Passed Curriculum Days: {passed_days}
    
    Current State:
    - Total Questions Asked So Far: {session['question_count']}
    - Curriculum Days Addressed So Far: {list(session['days_covered'])}
    
    Instructions:
    1. Conduct a natural, adaptive technical interview.
    2. Ask targeted follow-up questions on their previous response, or transition to a topic from a new passed day.
    3. Ensure you cover at least 4 distinct days across the interview session.
    4. Keep questions clear and concise.
    5. Always append a hidden day tag at the end of your question in this exact format: `[DAY:X]` (e.g., `[DAY:7]`).
    """

    if not client:
        # Fallback question logic when GEMINI_API_KEY is not set or placeholder
        day_pool = passed_days or [1, 3, 7, 8, 12, 16, 22, 28, 31]
        day_idx = (session['question_count'] - 1) % len(day_pool)
        day_used = day_pool[day_idx]
        topic_info = CURRICULUM_DATA.get(str(day_used), {}).get("topic", f"Day {day_used} Concepts")
        question_text = f"Can you detail your implementation approach for {topic_info}?"
        return question_text, day_used

    contents = []
    for turn in session["history"]:
        contents.append(types.Content(role=turn["role"], parts=[types.Part.from_text(text=turn["parts"][0])]))

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            )
        )
        text_response = response.text
    except Exception as e:
        day_pool = passed_days or [1, 3, 7, 8, 12, 16, 22, 28, 31]
        day_idx = (session['question_count'] - 1) % len(day_pool)
        day_used = day_pool[day_idx]
        topic_info = CURRICULUM_DATA.get(str(day_used), {}).get("topic", f"Day {day_used} Concepts")
        return f"Can you detail your implementation approach for {topic_info}?", day_used

    day_used = None

    if "[DAY:" in text_response:
        try:
            parts = text_response.split("[DAY:")
            clean_question = parts[0].strip()
            day_str = parts[1].split("]")[0].strip()
            day_used = int(day_str)
            text_response = clean_question
        except Exception:
            pass

    return text_response, day_used


def generate_final_feedback(session: Dict[str, Any]) -> FeedbackSchema:
    candidate = session["candidate"]
    cand_name = candidate.get('member', {}).get('name', candidate.get('name', 'Candidate'))
    
    if not client:
        return FeedbackSchema(
            summary=f"Candidate {cand_name} completed all 8 questions across multiple curriculum days.",
            strengths=["Solid technical understanding across evaluated modules", "Clear explanations of core concepts"],
            gaps=["Needs deeper knowledge of model optimization and system design trade-offs"],
            next=["Review advanced curriculum days on LLM quantization, RAG, and PEFT fine-tuning."]
        )

    prompt = f"""
    Evaluate the following technical interview for {cand_name}.
    
    Interview History:
    {json.dumps(session['history'], indent=2)}
    
    Generate structured feedback containing:
    - summary: Overview of overall candidate technical grasp.
    - strengths: Clear technical accomplishments shown in answers.
    - gaps: Concepts misunderstood or missed during the interview.
    - next: Actionable learning recommendations.
    """

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FeedbackSchema,
                temperature=0.2,
            )
        )
        return FeedbackSchema.model_validate_json(response.text)
    except Exception:
        return FeedbackSchema(
            summary=f"Candidate {cand_name} completed the evaluation.",
            strengths=["Demonstrated strong analytical problem solving."],
            gaps=["Need further practice with distributed inference."],
            next=["Study vLLM and Triton inference deployment."]
        )
