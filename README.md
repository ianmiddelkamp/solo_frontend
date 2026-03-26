# Invoice App — React Frontend

A React 19 single-page application for managing clients, projects, time tracking, task boards, invoices, and file attachments. Built as the frontend for the Invoice App Rails API.

## Tech Stack

- **React** 19
- **React Router** 7 — client-side routing
- **Tailwind CSS** 3 — utility-first styling
- **@dnd-kit** — drag-to-reorder for task groups and tasks
- **Create React App** — build tooling

## Getting Started

### Prerequisites

- Node.js 18+
- The [Rails API backend](../invoice_app) running on `http://localhost:3000`

### Install and Run

```bash
npm install
npm start
```

The app runs at `http://localhost:8080` by default.

### API Configuration

The frontend connects to the Rails API at `http://localhost:3000` by default. To point to a different backend:

```bash
REACT_APP_API_URL=http://your-api-host npm start
```

## Pages and Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | — | Redirects to `/clients` |
| `/clients` | ClientList | View all clients |
| `/clients/new` | ClientForm | Create a new client |
| `/clients/:id/edit` | ClientForm | Edit an existing client |
| `/projects` | ProjectList | View all projects |
| `/projects/new` | ProjectForm | Create a new project |
| `/projects/:id/edit` | ProjectForm | Edit project, manage task board (with SOW import), manage attachments |
| `/timesheets` | TimesheetList | View all time entries with invoice status and linked task |
| `/timesheets/new` | TimesheetForm | Log a new time entry |
| `/timesheets/:id/edit` | TimesheetForm | Edit a time entry |
| `/timer` | TimerPage | Start/stop timer, select project and task, manage task board |
| `/invoices` | InvoiceList | View all invoices with status badges |
| `/invoices/new` | InvoiceForm | Generate an invoice from time entries |
| `/invoices/:id` | InvoiceDetail | View line items, send, download, or regenerate PDF |
| `/settings` | SettingsPage | Configure business profile |

## Project Structure

```
src/
  api/              # API client modules (one per resource)
  components/       # Shared components (Layout, TaskBoard, Timer, dialogs, etc.)
  context/          # TimerContext — shared timer state across pages
  pages/
    clients/
    projects/
    timesheets/
    timer/
    invoices/
    settings/
  services/
    dialog.js       # Promise-based confirm/alert dialog service
  index.js
  App.js
```

## API Modules

| Module | Covers |
|--------|--------|
| `clients.js` | CRUD for clients |
| `projects.js` | CRUD for projects |
| `taskGroups.js` | CRUD and reorder for task groups |
| `tasks.js` | CRUD and reorder for tasks (including cross-group moves) |
| `timeEntries.js` | CRUD for time entries (nested under projects) |
| `timer.js` | Start, stop, cancel, get session |
| `rates.js` | Get/set rates for clients and projects |
| `invoices.js` | CRUD, PDF download, regenerate, send invoice |
| `attachments.js` | Upload, list, download, delete project attachments |
| `sowImport.js` | Parse a SOW file via backend AI |
| `businessProfile.js` | Get/update business profile |

## Key Features

### Task Board

Projects have a task board available on both the project edit page and the timer page. Task groups can be reordered with ↑/↓ buttons and merged into the group above. Tasks can be dragged to reorder within a group or moved to a different group via drag-and-drop. Each task has a status selector (To do / In progress / Done).

### SOW Import

Upload a `.md`, `.txt`, or `.docx` Statement of Work (or paste text directly) from the task board. The backend AI parses it into a single task group with a flat task list — the AI picks the group title based on the document scope. Preview and edit before importing. Available on both the project page and the timer page. Powered by a local Ollama model — no data leaves your machine.

### Timer Integration

The timer page lets you select a project and a task before starting. Starting the timer automatically marks the selected task as In Progress. When the timer stops, you're prompted to mark the task as Done. The active task name is displayed in the timer widget.

### Project Attachments

Files (PDF, Word, images, text) can be attached to a project via drag-and-drop. Files are downloaded through authenticated streaming — no pre-signed URLs.

### Timesheets

Time entries show the linked task name. The form lets you assign a task from a grouped dropdown (organised by task group). Hours are rounded to 2 decimal places.

### Invoice Generation

Select a client and date range to generate an invoice from all unbilled time entries. Line item descriptions include the time entry description and linked task name.

### Dialog Service

`src/services/dialog.js` provides `confirm()` and `alert()` as Promises, rendering through `DialogProvider`. Used instead of `window.confirm` throughout the app.

## Building for Production

```bash
npm run build
```

Output goes to `build/`. Since this is a single-page app, your web server must serve `index.html` for all routes:

```nginx
location / {
  try_files $uri /index.html;
}
```
