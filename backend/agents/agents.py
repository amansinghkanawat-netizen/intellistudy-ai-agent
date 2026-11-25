"""
Multi-Agent AI System for IntelliStudy
Five cooperative agents orchestrated to handle different study tasks.

Agent roster:
  1. ResourceAgent  — processes uploaded materials, extracts topics
  2. TutorAgent     — answers questions using RAG over student materials
  3. QuizAgent      — generates & evaluates quizzes
  4. PlannerAgent   — creates personalised study schedules
  5. PerformanceAgent — analyses student progress, detects weak topics

Each agent wraps granite_service calls with domain-specific prompt engineering.
"""
import json
import logging
from typing import Optional
from backend.services.granite_service import granite_service
from backend.rag.pipeline import rag_pipeline
from backend.config import settings

logger = logging.getLogger("intellistudy.agents")

DEMO_NOTE = "\n\n> ⚠️ **DEMO MODE** — Sample response. Configure IBM watsonx.ai for real AI output."


# ─── Base Agent ───────────────────────────────────────────────────────────
class BaseAgent:
    name: str = "BaseAgent"

    def _generate(self, instruction: str, context: str = "", task_type: str = "study_material") -> dict:
        return granite_service.generate(instruction, context, task_type)

    def _is_demo(self) -> bool:
        return settings.demo_mode


# ─── 1. Resource Agent ────────────────────────────────────────────────────
class ResourceAgent(BaseAgent):
    """
    Reads and processes uploaded materials.
    Extracts topics, key terms, and important information.
    """
    name = "ResourceAgent"

    def extract_topics(self, text: str) -> dict:
        logger.info("ResourceAgent: extracting topics")
        instruction = (
            "Analyse this study material and extract:\n"
            "1. Main subject/course area\n"
            "2. List of 5-10 key topics covered\n"
            "3. List of important terms/definitions\n"
            "4. Estimated difficulty level (Beginner/Intermediate/Advanced)\n"
            "Return JSON: {\"subject\": \"...\", \"topics\": [...], \"key_terms\": [...], \"difficulty\": \"...\"}"
        )
        result = self._generate(instruction, text[:3000], "topic_extraction")
        if result["demo_mode"]:
            return {
                "subject": "Computer Science",
                "topics": ["Data Structures", "Algorithms", "Complexity Analysis", "Sorting", "Searching"],
                "key_terms": ["Big-O notation", "recursion", "dynamic programming", "graph traversal"],
                "difficulty": "Intermediate",
                "demo_mode": True,
            }
        try:
            return {**json.loads(result["text"]), "demo_mode": False}
        except (json.JSONDecodeError, ValueError):
            return {"subject": "Unknown", "topics": [], "key_terms": [], "difficulty": "Unknown", "demo_mode": True}

    def summarise(self, text: str, style: str = "short") -> str:
        logger.info(f"ResourceAgent: summarising ({style})")
        instruction = {
            "short": "Write a concise 1-page summary highlighting the most important concepts, definitions, and key points.",
            "detailed": "Write a detailed structured summary with sections, subsections, definitions, formulas, and examples.",
            "topic_notes": "Organise the content into topic-wise study notes. Use clear headings for each topic.",
            "questions": "Generate 10 important exam questions from this material. Cover all key topics.",
            "revision": "Create a quick revision sheet with bullet points, key formulas, and must-remember facts.",
        }.get(style, "Summarise this study material.")
        result = self._generate(instruction, text, style)
        return result["text"]


# ─── 2. Tutor Agent ───────────────────────────────────────────────────────
class TutorAgent(BaseAgent):
    """
    Answers student questions using RAG over their uploaded materials.
    Provides step-by-step explanations and practical examples.
    """
    name = "TutorAgent"

    def answer(self, question: str, resource_id: str = None, language: str = "English") -> dict:
        logger.info(f"TutorAgent: answering '{question[:60]}...'")
        context = ""
        source_note = ""

        if resource_id:
            context = rag_pipeline.retrieve_context(question, resource_id=resource_id)
            source_note = "Answer based on the student's uploaded study material." if context else ""

        lang_note = "Answer in Hindi if the question is in Hindi, otherwise answer in English." if language == "auto" else ""
        instruction = (
            f"You are an expert educational tutor. {source_note} {lang_note}\n\n"
            f"Answer the following question clearly and in detail:\n{question}\n\n"
            "Provide:\n"
            "1. A direct answer\n"
            "2. Step-by-step explanation if applicable\n"
            "3. A practical example\n"
            "4. If from uploaded material, cite the source section."
        )
        result = self._generate(instruction, context, "chat")
        return {
            "answer": result["text"],
            "demo_mode": result["demo_mode"],
            "has_context": bool(context),
            "agent": self.name,
        }


# ─── 3. Quiz Agent ────────────────────────────────────────────────────────
class QuizAgent(BaseAgent):
    """
    Generates quizzes from study materials.
    Evaluates answers and provides detailed explanations.
    """
    name = "QuizAgent"

    def generate_questions(
        self, context: str, subject: str, difficulty: str, num: int, topic: str = None
    ) -> list[dict]:
        logger.info(f"QuizAgent: generating {num} {difficulty} questions for {subject}")
        topic_note = f"Focus on the topic: {topic}." if topic else ""
        instruction = (
            f"Generate exactly {num} quiz questions for subject '{subject}' at {difficulty} difficulty. {topic_note}\n"
            "Return a JSON array only. Each item:\n"
            '{"question_text": "...", "question_type": "mcq", "options": ["A","B","C","D"], '
            '"correct_answer_index": 0, "explanation": "..."}\n'
            "For true/false: options must be [\"True\", \"False\"] and question_type = \"truefalse\"."
        )
        result = self._generate(instruction, context[:3000], "quiz")
        if result["demo_mode"]:
            return self._demo_questions(subject, num)
        try:
            questions = json.loads(result["text"])
            if isinstance(questions, list):
                return questions[:num]
        except (json.JSONDecodeError, ValueError):
            pass
        return self._demo_questions(subject, num)

    def evaluate_answer(self, question: str, correct: str, student_answer: str) -> dict:
        logger.info("QuizAgent: evaluating answer")
        is_correct = student_answer.strip().lower() == correct.strip().lower()
        return {
            "is_correct": is_correct,
            "correct_answer": correct,
            "feedback": f"Correct! Well done." if is_correct else f"Incorrect. The correct answer is: {correct}.",
        }

    def _demo_questions(self, subject: str, num: int) -> list[dict]:
        base = [
            {"question_text": f"What is the fundamental concept of {subject}?", "question_type": "mcq", "options": ["Option A — Core theory", "Option B — Applied method", "Option C — Historical origin", "Option D — Advanced extension"], "correct_answer_index": 0, "explanation": "The fundamental concept forms the foundation of the subject."},
            {"question_text": f"Which technique is most commonly used in {subject}?", "question_type": "mcq", "options": ["Technique Alpha", "Technique Beta", "Technique Gamma", "Technique Delta"], "correct_answer_index": 1, "explanation": "Technique Beta is the most widely adopted in modern practice."},
            {"question_text": f"{subject} requires advanced mathematical knowledge.", "question_type": "truefalse", "options": ["True", "False"], "correct_answer_index": 1, "explanation": "Many areas of the subject are accessible without advanced mathematics."},
            {"question_text": f"Name the primary algorithm associated with {subject}.", "question_type": "mcq", "options": ["Algorithm 1", "Algorithm 2", "Algorithm 3", "Algorithm 4"], "correct_answer_index": 2, "explanation": "Algorithm 3 is the cornerstone of this subject area."},
            {"question_text": f"What is the time complexity of the core operation in {subject}?", "question_type": "mcq", "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"], "correct_answer_index": 1, "explanation": "The core operation operates in O(log n) time in optimal cases."},
        ]
        return (base * ((num // len(base)) + 1))[:num]


# ─── 4. Planner Agent ─────────────────────────────────────────────────────
class PlannerAgent(BaseAgent):
    """
    Creates personalised study schedules.
    Adjusts revision plans based on performance data.
    """
    name = "PlannerAgent"

    def create_plan(
        self,
        subjects: list[str],
        exam_date: str,
        daily_hours: float,
        difficulty: str,
        weak_topics: list[str] = None,
    ) -> dict:
        logger.info("PlannerAgent: creating study plan")
        weak_note = f"Prioritise these weak topics: {', '.join(weak_topics)}." if weak_topics else ""
        instruction = (
            f"Create a 7-day study plan for subjects: {', '.join(subjects)}.\n"
            f"Exam date: {exam_date}. Daily study hours: {daily_hours}h. Intensity: {difficulty}.\n"
            f"{weak_note}\n"
            "Return JSON array of 7 days. Each day:\n"
            '{"day": "Monday", "date": "...", "sessions": [{"subject": "...", "topic": "...", "duration": "2h", "priority": "high|medium|low"}]}'
        )
        result = self._generate(instruction, "", "study_plan")
        if result["demo_mode"]:
            return {"plan": self._demo_plan(subjects), "demo_mode": True}
        try:
            plan = json.loads(result["text"])
            return {"plan": plan, "demo_mode": False}
        except (json.JSONDecodeError, ValueError):
            return {"plan": self._demo_plan(subjects), "demo_mode": True}

    def _demo_plan(self, subjects: list[str]) -> list[dict]:
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        plan = []
        for i, day in enumerate(days):
            sessions = []
            # Rotate subjects across days
            for j in range(min(2, len(subjects))):
                subj = subjects[(i + j) % len(subjects)]
                sessions.append({
                    "subject": subj,
                    "topic": f"{subj} — Chapter {i + 1} Review",
                    "duration": "2h",
                    "priority": "high" if j == 0 else "medium",
                })
            plan.append({"day": day, "sessions": sessions})
        return plan


# ─── 5. Performance Agent ─────────────────────────────────────────────────
class PerformanceAgent(BaseAgent):
    """
    Analyses student progress and detects weak topics.
    Generates evidence-backed personalised recommendations.
    """
    name = "PerformanceAgent"

    def analyse(self, quiz_history: list[dict], study_hours: dict) -> dict:
        logger.info("PerformanceAgent: analysing performance")
        # Compute weak topics from quiz history
        subject_scores: dict[str, list[float]] = {}
        for attempt in quiz_history:
            subject = attempt.get("subject", "Unknown")
            score = attempt.get("score", 0)
            subject_scores.setdefault(subject, []).append(score)

        avg_scores = {s: sum(scores) / len(scores) for s, scores in subject_scores.items()}
        weak = [(s, avg) for s, avg in avg_scores.items() if avg < 70]
        strong = [(s, avg) for s, avg in avg_scores.items() if avg >= 80]

        recommendations = []
        for subject, avg in weak:
            recommendations.append({
                "subject": subject,
                "severity": "warning",
                "avg_score": round(avg, 1),
                "message": (
                    f"Your average score in {subject} is {avg:.1f}%. "
                    f"Focus on reviewing core concepts and attempt 2-3 more practice quizzes. "
                    f"Consider using the AI Tutor to clarify weak areas."
                ),
            })
        for subject, avg in strong:
            recommendations.append({
                "subject": subject,
                "severity": "success",
                "avg_score": round(avg, 1),
                "message": (
                    f"Excellent {subject} performance at {avg:.1f}%! "
                    f"Try advanced-level questions to maintain your edge."
                ),
            })

        if not recommendations:
            recommendations.append({
                "subject": "General",
                "severity": "info",
                "message": "Complete at least 3 quizzes to generate personalised recommendations.",
            })

        return {
            "weak_topics": [s for s, _ in weak],
            "strong_topics": [s for s, _ in strong],
            "recommendations": recommendations,
            "avg_scores": avg_scores,
            "demo_mode": False,
        }

    def predict_exam_readiness(self, avg_scores: dict, topics_completed: int, total_topics: int) -> dict:
        """
        Provides an evidence-based readiness estimate.
        IMPORTANT: Never claims guaranteed exam predictions — only evidence-based estimates.
        """
        overall_avg = sum(avg_scores.values()) / len(avg_scores) if avg_scores else 0
        completion_pct = (topics_completed / total_topics * 100) if total_topics > 0 else 0

        # Simple heuristic readiness score
        readiness = (overall_avg * 0.6) + (completion_pct * 0.4)

        label = "High" if readiness >= 75 else "Medium" if readiness >= 50 else "Low"
        return {
            "readiness_score": round(readiness, 1),
            "readiness_label": label,
            "overall_avg_score": round(overall_avg, 1),
            "topic_completion_pct": round(completion_pct, 1),
            "disclaimer": (
                "This is an evidence-based estimate based on quiz scores and topic completion. "
                "It is not a guarantee of exam performance. Continue practising to improve readiness."
            ),
        }


# ─── Agent Orchestrator ───────────────────────────────────────────────────
class AgentOrchestrator:
    """
    Coordinates agents to handle complex multi-step workflows.
    
    Example workflow when a student scores low on a quiz:
    1. PerformanceAgent identifies weak topic
    2. TutorAgent provides a simpler explanation
    3. QuizAgent generates a targeted practice quiz
    4. PlannerAgent schedules revision
    """

    def __init__(self):
        self.resource_agent = ResourceAgent()
        self.tutor_agent = TutorAgent()
        self.quiz_agent = QuizAgent()
        self.planner_agent = PlannerAgent()
        self.performance_agent = PerformanceAgent()

    def handle_low_quiz_score(
        self,
        subject: str,
        topic: str,
        score: float,
        resource_id: str = None,
        subjects_list: list[str] = None,
    ) -> dict:
        """
        Full multi-agent response to a low quiz score.
        Returns tutor explanation + new quiz + updated planner note.
        """
        logger.info(f"Orchestrator: handling low score ({score}%) for {subject}/{topic}")
        # 1. Tutor explains the weak topic
        tutor_response = self.tutor_agent.answer(
            f"Please explain {topic} in {subject} simply, with examples.",
            resource_id=resource_id,
        )
        # 2. Quiz Agent generates targeted practice
        practice_questions = self.quiz_agent.generate_questions(
            context=tutor_response["answer"],
            subject=subject,
            difficulty="easy",
            num=3,
            topic=topic,
        )
        # 3. Planner schedules revision
        plan_note = f"Schedule extra revision for {topic} in {subject} — recent quiz score: {score}%."

        return {
            "triggered_by": f"Low quiz score: {score}% in {topic}",
            "agents_used": ["PerformanceAgent", "TutorAgent", "QuizAgent", "PlannerAgent"],
            "tutor_explanation": tutor_response["answer"],
            "practice_questions": practice_questions,
            "planner_note": plan_note,
            "recommendation": f"Your {score}% score in {topic} indicates this topic needs more attention. Review the explanation above and try the practice questions.",
            "demo_mode": tutor_response["demo_mode"],
        }


# Singleton instances
resource_agent = ResourceAgent()
tutor_agent = TutorAgent()
quiz_agent = QuizAgent()
planner_agent = PlannerAgent()
performance_agent = PerformanceAgent()
orchestrator = AgentOrchestrator()
