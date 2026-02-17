export type Priority = "Light" | "Medium" | "High" | "Urgent";

export type Task = {
  assignee_id: string | number;
  id: string | number;
  title: string;
  priority: string;
  description: string;
  due_date: string;
  is_finished: boolean;
  assignee: string;
};
