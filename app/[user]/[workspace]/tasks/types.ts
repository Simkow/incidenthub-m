export type Priority = "Light" | "Medium" | "High" | "Urgent";

export type Task = {
  assignee_id: string | number;
  id: string | number;
  title: string;
  priority: string;
  status_id?: number | null;
  status_name?: string | null;
  description: string;
  due_date: string;
  is_finished: boolean;
  assignee: string;
  workspace_id?: string | number | null;
  workspace_name?: string | null;
};
