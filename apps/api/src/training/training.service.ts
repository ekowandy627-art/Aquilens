import { Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { processDemoStore } from "../processes/process-demo.store";
import { trainingDemoStore } from "./training-demo.store";

export class TrainingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "TrainingError";
  }
}

@Injectable()
export class TrainingService {
  listMy(user: AuthUser) {
    return trainingDemoStore.listMyAssignments(user.tenantId, user.id).map((assignment) => {
      const module = trainingDemoStore.getModule(user.tenantId, assignment.moduleId);
      const process = module?.processId
        ? processDemoStore.getProcess(user.tenantId, module.processId)
        : null;
      return {
        id: assignment.id,
        moduleId: assignment.moduleId,
        title: module?.title ?? "Training",
        mode: module?.mode ?? "acknowledge_only",
        status: assignment.status,
        dueDate: assignment.dueDate,
        processName: process?.name,
        score: assignment.score,
        attempts: assignment.attempts,
      };
    });
  }

  getAssignmentQuiz(user: AuthUser, assignmentId: string) {
    const assignment = trainingDemoStore.getAssignment(user.tenantId, assignmentId);
    if (!assignment || assignment.userId !== user.id) {
      return null;
    }
    const module = trainingDemoStore.getModule(user.tenantId, assignment.moduleId);
    if (!module || module.mode !== "assessed") {
      return null;
    }
    const drawn = module.questionBank
      .toSorted(() => Math.random() - 0.5)
      .slice(0, module.drawCount)
      .map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options,
      }));
    return { assignmentId, moduleId: module.id, questions: drawn, passThreshold: module.passThreshold };
  }

  acknowledge(user: AuthUser, assignmentId: string) {
    const assignment = trainingDemoStore.getAssignment(user.tenantId, assignmentId);
    if (!assignment || assignment.userId !== user.id) {
      return null;
    }
    const module = trainingDemoStore.getModule(user.tenantId, assignment.moduleId);
    if (!module || module.mode !== "acknowledge_only") {
      throw new TrainingError("INVALID_MODE", "This assignment requires an assessment.");
    }
    return trainingDemoStore.completeAssignment(assignmentId, {
      status: "completed",
      completedAt: new Date().toISOString(),
      score: 1,
    });
  }

  submitAssessment(
    user: AuthUser,
    assignmentId: string,
    answers: Array<{ questionId: string; selectedIndex: number }>,
  ) {
    const assignment = trainingDemoStore.getAssignment(user.tenantId, assignmentId);
    if (!assignment || assignment.userId !== user.id) {
      return null;
    }
    const module = trainingDemoStore.getModule(user.tenantId, assignment.moduleId);
    if (!module || module.mode !== "assessed") {
      throw new TrainingError("INVALID_MODE", "This assignment is acknowledge-only.");
    }

    const drawnIds = new Set(answers.map((answer) => answer.questionId));
    const relevant = module.questionBank.filter((question) => drawnIds.has(question.id));
    const correct = relevant.filter((question) => {
      const answer = answers.find((row) => row.questionId === question.id);
      return answer?.selectedIndex === question.answerIndex;
    }).length;
    const score = relevant.length === 0 ? 0 : correct / relevant.length;
    const attempts = assignment.attempts + 1;
    const passed = score >= module.passThreshold;

    if (passed) {
      return {
        assignment: trainingDemoStore.completeAssignment(assignmentId, {
          status: "completed",
          score,
          attempts,
          completedAt: new Date().toISOString(),
        }),
        passed: true,
        score,
        notifyManager: false,
      };
    }

    const failed = trainingDemoStore.completeAssignment(assignmentId, {
      status: attempts >= 3 ? "failed" : "pending",
      score,
      attempts,
    });

    return {
      assignment: failed,
      passed: false,
      score,
      notifyManager: attempts >= 3,
    };
  }
}
