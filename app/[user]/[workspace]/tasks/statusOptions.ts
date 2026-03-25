export type TaskStatusOption = {
  id: number;
  name: string;
};

export const TODO_STATUS_ID = 1;
export const DONE_STATUS_ID = 4;

export const DEFAULT_TASK_STATUS_OPTIONS: TaskStatusOption[] = [
  { id: 1, name: "todo" },
  { id: 2, name: "in_progress" },
  { id: 3, name: "blocked" },
  { id: 4, name: "done" },
];

export function statusNameToDone(name: string) {
  return name === "done";
}

export function formatTaskStatusName(name: string) {
  return name.replace(/_/g, " ");
}
