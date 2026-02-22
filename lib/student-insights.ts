export function getMotivationLine(input: {
  upcomingExams: number;
  pendingAssignments: number;
  overdueAssignments: number;
  plannerTodo: number;
}) {
  const { upcomingExams, pendingAssignments, overdueAssignments, plannerTodo } = input;

  if (overdueAssignments > 0) {
    return `You have ${overdueAssignments} overdue assignment${overdueAssignments > 1 ? "s" : ""}. Clear them first for immediate momentum.`;
  }

  if (upcomingExams >= 3) {
    return `Exam-heavy period ahead (${upcomingExams} upcoming). Focus on short revision blocks and daily recap notes.`;
  }

  if (pendingAssignments >= 5 || plannerTodo >= 8) {
    return "Your workload is building. Use planner priorities to finish high-impact tasks first.";
  }

  return "Good pace. Keep your notes updated daily to stay ahead of deadlines.";
}

export function getPlannerPrompt(todoCount: number, inProgressCount: number, doneCount: number) {
  if (todoCount > doneCount + inProgressCount) {
    return "Tip: Convert one large task into 3 smaller tasks and complete the first one today.";
  }
  if (inProgressCount > todoCount) {
    return "You have strong momentum. Finish in-progress items before adding new tasks.";
  }
  if (doneCount >= 5) {
    return "Great execution streak. Keep this cadence and review upcoming exam topics.";
  }
  return "Start with a 25-minute focused session on your highest-priority planner task.";
}

export function getSmartSuggestions(input: {
  overdueAssignments: number;
  pendingAssignments: number;
  plannerTodo: number;
  recentNoteCount: number;
  upcomingExams: number;
  daysToNextExam: number | null;
}) {
  const { overdueAssignments, pendingAssignments, plannerTodo, recentNoteCount, upcomingExams, daysToNextExam } = input;
  const suggestions: string[] = [];

  if (overdueAssignments > 0) {
    suggestions.push(`Close ${Math.min(overdueAssignments, 2)} overdue task${overdueAssignments > 1 ? "s" : ""} today before adding new work.`);
  }

  if (pendingAssignments >= 4) {
    suggestions.push("Group assignments by due date and complete the nearest one in the next focused session.");
  }

  if (plannerTodo >= 8) {
    suggestions.push("Your planner queue is heavy. Convert one TODO into IN_PROGRESS now to reduce backlog pressure.");
  }

  if (recentNoteCount < 3) {
    suggestions.push("Increase note momentum: publish at least one concise revision note per day this week.");
  } else {
    suggestions.push("Strong capture habit detected. Keep summarizing each study session into short notes.");
  }

  if (upcomingExams > 0) {
    if (daysToNextExam !== null && daysToNextExam <= 7) {
      suggestions.push("Exam is near: switch to timed revision blocks and quick self-testing.");
    } else {
      suggestions.push("Allocate 20-30 minutes daily to exam prep to avoid last-minute spikes.");
    }
  }

  return suggestions.slice(0, 3);
}

export function getFocusSuggestion(input: {
  focusHealth: number;
  workloadScore: number;
  productivityScore: number;
  upcomingDeadlineCount: number;
}) {
  const { focusHealth, workloadScore, productivityScore, upcomingDeadlineCount } = input;

  if (focusHealth < 45) {
    return "Critical load detected. Pause low-priority items and finish one overdue task plus one high-impact assignment today.";
  }

  if (workloadScore < 55 && upcomingDeadlineCount > 3) {
    return "Deadline pressure is rising. Prioritize nearest due dates and avoid starting new optional work.";
  }

  if (productivityScore >= 75) {
    return "Execution quality is high. Use this momentum to finish pending items and prep next exam topics.";
  }

  return "Balanced state. Keep a steady routine: one assignment block, one revision block, one note update each day.";
}

export function getWeeklyTargets(input: {
  pendingAssignments: number;
  overdueAssignments: number;
  recentNoteCount: number;
  plannerTodo: number;
}) {
  const { pendingAssignments, overdueAssignments, recentNoteCount, plannerTodo } = input;

  const notesTarget = Math.max(3, Math.min(8, 5 + Math.max(0, 3 - recentNoteCount)));
  const closeTarget = Math.max(2, Math.min(10, pendingAssignments + overdueAssignments));
  const plannerTarget = Math.max(2, Math.min(8, Math.ceil(plannerTodo / 2)));

  return [
    { label: "New notes target", value: String(notesTarget) },
    { label: "Assignments to close", value: String(closeTarget) },
    { label: "Planner items to finish", value: String(plannerTarget) },
  ];
}
