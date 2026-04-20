export interface Client {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  client_id: number;
  client?: Client;
}

export interface Task {
  id: number;
  title: string;
  status: string;
  position: number;
  estimated_hours: number | null;
  actual_hours: number;
  last_entry_date: string | null;
}

export interface TaskGroup {
  id: number;
  title: string;
  position: number;
  tasks: Task[];
  estimated_hours_total: number;
  actual_hours_total: number;
}

export interface ChargeCode {
  id: number;
  code: string;
  description: string | null;
}

export interface Invoice {
  id: number;
  number: string;
}

export interface InvoiceLineItem {
  id: number;
  invoice?: Invoice;
}

export interface TimeEntry {
  id: number;
  date: string;
  hours: number;
  description: string | null;
  started_at: string | null;
  stopped_at: string | null;
  project_id: number | null;
  task_id: number | null;
  charge_code_id: number | null;
  client_id: number | null;
  project?: Project & { client?: Client };
  task?: Pick<Task, 'id' | 'title'>;
  charge_code?: ChargeCode;
  client?: Client;
  invoice_line_item?: InvoiceLineItem;
}

export interface TimerSession {
  id: number;
  project_id: number;
  task_id: number | null;
  started_at: string;
  stopped_at: string | null;
  description: string | null;
  hours: number;
  project?: Project & { client?: Client };
  task?: Pick<Task, 'id' | 'title' | 'status'>;
}

export interface Rate {
  id: number;
  rate: number;
}

export interface BusinessProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
}

export interface Estimate {
  id: number;
  project_id: number;
  title: string;
  status: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  filename: string;
  url: string;
}
