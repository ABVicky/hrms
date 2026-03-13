export async function appsScriptFetch(endpoint: string, params: object = {}, retries = 3) {
    // IMPORTANT: You will need to replace this URL after deploying your Google Apps Script Web App
    const GOOGLE_APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
    if (!GOOGLE_APPS_SCRIPT_URL) {
        console.error("CRITICAL: NEXT_PUBLIC_APPS_SCRIPT_URL is not defined in .env.local");
        throw new Error("API configuration missing. Please check .env.local");
    }

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ 
                    endpoint, 
                    params: { ...params, _cb: Date.now() } 
                }),
                // Adding text/plain prevents Google Apps Script from pre-flighting with CORS OPTIONS which can fail
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                }
            });

            // Handle opaque responses or CORS errors
            if (!response.ok && response.type !== 'opaque') {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && !data.success) {
                throw new Error(data.error || "Unknown API error");
            }

            return data.data;

        } catch (error: any) {
            const isLastAttempt = i === retries - 1;
            if (isLastAttempt) {
                console.error("API Fetch Error:", error);
                throw new Error(error.message || "Network Error while contacting Apps Script after multiple attempts");
            }

            // Exponential backoff for retries
            await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
        }
    }
}

// Work Management Module Helpers
export async function getProjects(department?: string) {
    return appsScriptFetch("/get-projects", { department });
}

export async function createProject(params: { department: string; project_group: string; name: string; description?: string; created_by?: string }) {
    return appsScriptFetch("/create-project", params);
}

export async function getTasks(project_id: string) {
    return appsScriptFetch("/get-tasks", { project_id });
}

export async function createTask(params: { project_id: string; title: string; description?: string; assignee?: string; due_date?: string; priority?: string; created_by?: string }) {
    return appsScriptFetch("/create-task", params);
}

export async function updateTask(task_id: string, updates: object) {
    return appsScriptFetch("/update-task", { task_id, ...updates });
}

// Personal To-Do Helpers
export async function getPersonalTodos(employee_id: string) {
    return appsScriptFetch("/get-personal-todos", { employee_id });
}

export async function createPersonalTodo(params: { employee_id: string; title: string; description?: string; due_date?: string }) {
    return appsScriptFetch("/create-personal-todo", params);
}

export async function updatePersonalTodo(todo_id: string, updates: object) {
    return appsScriptFetch("/update-personal-todo", { todo_id, updates });
}

export async function deletePersonalTodo(todo_id: string) {
    return appsScriptFetch("/delete-personal-todo", { todo_id });
}
