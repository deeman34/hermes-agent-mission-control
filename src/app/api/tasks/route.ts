import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapHermesStatusToUiStatus(hermesStatus: string): string {
  switch (hermesStatus) {
    case 'triage':
    case 'todo':
    case 'ready':
      return 'Not started';
    case 'running':
      return 'In progress';
    case 'done':
      return 'Done';
    case 'blocked':
      return 'Blocked';
    default:
      return 'Not started';
  }
}

function mapUiStatusToHermesStatus(uiStatus: string): string {
  switch (uiStatus) {
    case 'Not started':
      return 'todo';
    case 'Blocked':
      return 'blocked';
    case 'In progress':
      return 'running';
    case 'Done':
      return 'done';
    default:
      return 'todo';
  }
}

function mapPriorityToString(priority: number | null): string {
  if (priority === null) return '';
  switch (priority) {
    case 1: return 'High';
    case 2: return 'Medium';
    case 3: return 'Low';
    default: return '';
  }
}

export async function GET() {
  try {
    const hermesTasks = await prisma.hermesTask.findMany({
      where: {
        status: {
          not: 'archived',
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        assignee: true,
        result: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const tasks = hermesTasks.map((task) => ({
      id: task.id,
      name: task.title,
      status: mapHermesStatusToUiStatus(task.status),
      priority: mapPriorityToString(task.priority),
      category: task.assignee ?? '',
      result: task.result ?? '',
      dueDate: task.updatedAt ? task.updatedAt.toISOString().split('T')[0] : undefined,
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: "Task name is required" }, { status: 400 });
    }

    // Create HermesTask
    const hermesTask = await prisma.hermesTask.create({
      data: {
    id: `t_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
        title: name,
        status: 'todo', // Initial status for new tasks from UI
        priority: null,
        assignee: null,
        result: null,
        updatedAt: new Date(),
        syncedAt: new Date(),
      },
    });

    // Create AgentRequest for logging/tracking (marked as done so bridge doesn't process)
    await prisma.agentRequest.create({
      data: {
        origin: 'web',
        kind: 'kanban',
        title: name,
        hermesTaskId: hermesTask.id,
        status: 'done',
        result: 'Task created via Hermy HQ',
        decidedAt: new Date(),
        finishedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Return the created task in the expected format
    const task = {
      id: hermesTask.id,
      name: hermesTask.title,
      status: mapHermesStatusToUiStatus(hermesTask.status),
      priority: mapPriorityToString(hermesTask.priority),
      category: hermesTask.assignee ?? '',
      result: hermesTask.result ?? '',
      dueDate: hermesTask.updatedAt ? hermesTask.updatedAt.toISOString().split('T')[0] : undefined,
    };

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status: uiStatus } = await req.json();

    if (!id || !uiStatus) {
      return NextResponse.json({ error: "Task ID and status are required" }, { status: 400 });
    }

    const hermesStatus = mapUiStatusToHermesStatus(uiStatus);

    // Update HermesTask
    const hermesTask = await prisma.hermesTask.update({
      where: { id },
      data: {
        status: hermesStatus,
        updatedAt: new Date(),
      },
    });

    // Update corresponding AgentRequest if it exists
    await prisma.agentRequest.updateMany({
      where: {
        hermesTaskId: id,
        kind: 'kanban',
      },
      data: {
        status: 'done',
        result: `Task status updated to ${uiStatus}`,
        updatedAt: new Date(),
      },
    });

    // Return the updated task
    const task = {
      id: hermesTask.id,
      name: hermesTask.title,
      status: mapHermesStatusToUiStatus(hermesTask.status),
      priority: mapPriorityToString(hermesTask.priority),
      category: hermesTask.assignee ?? '',
      result: hermesTask.result ?? '',
      dueDate: hermesTask.updatedAt ? hermesTask.updatedAt.toISOString().split('T')[0] : undefined,
    };

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
