"use client";

import { useState, useEffect } from "react";
import { Plus, Folder, Calendar as CalendarIcon, CheckCircle2, ListChecks, MoreVertical, Briefcase, ChevronRight, Hash, User, AlertCircle, Clock, Trash, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, getTasks, createProject, createTask, updateTask, appsScriptFetch, getPersonalTodos, createPersonalTodo, updatePersonalTodo, deletePersonalTodo } from "@/lib/api";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { getImageUrl } from "@/lib/utils";

// Types
interface Project {
    project_id: string;
    department: string;
    project_group: string;
    name: string;
    description: string;
    status: string;
    created_at: string;
}

interface Task {
    task_id: string;
    project_id: string;
    title: string;
    description: string;
    assignee: string;
    status: string;
    due_date: string;
    priority: string;
    subtasks: string; // JSON Array
    comments: string; // JSON Array
}

interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

interface User {
    employee_id: string;
    name: string;
    profile_picture: string;
}

interface PersonalTodo {
    todo_id: string;
    employee_id: string;
    title: string;
    description: string;
    status: string;
    due_date: string;
    created_at: string;
}

export default function WorkManagement() {
    const { user, loading } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [allEmployees, setAllEmployees] = useState<User[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isFetching, setIsFetching] = useState(true);

    // Modals state
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
    
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [newCommentText, setNewCommentText] = useState("");
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState<string>(user?.department || 'All');
    const [viewMode, setViewMode] = useState<'projects' | 'my-tasks'>('projects');
    const [personalTodos, setPersonalTodos] = useState<PersonalTodo[]>([]);
    const [isPersonalTodoModalOpen, setIsPersonalTodoModalOpen] = useState(false);
    const [newPersonalTodo, setNewPersonalTodo] = useState({
        title: '',
        description: '',
        due_date: ''
    });

    const departments = ['All', 'HR', 'Marketing', 'Sales', 'Development', 'Finance', 'Operations', 'Design'];

    useEffect(() => {
        if (!loading && user) {
            fetchInitialData();
        }
    }, [user, loading]);

    const fetchInitialData = async () => {
        setIsFetching(true);
        try {
            // Load employees for assignment
            const empData = await appsScriptFetch("/employee");
            if (empData) {
                setAllEmployees(empData);
            }

            // Load projects based on access level
            const spaceToFetch = user?.role === 'Super Admin' ? selectedSpace : user?.department;
            const projs = await getProjects(spaceToFetch);
            setProjects(projs);

            // Load personal todos
            if (user?.employee_id) {
                const todos = await getPersonalTodos(user.employee_id);
                setPersonalTodos(todos);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };

    const loadTasks = async (project_id: string) => {
        setIsFetching(true);
        try {
            const t = await getTasks(project_id);
            setTasks(t);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleProjectClick = (p: Project) => {
        setSelectedProject(p);
        loadTasks(p.project_id);
    };

    const fetchInitialProjects = async (space: string) => {
        setIsFetching(true);
        try {
            const projs = await getProjects(space);
            setProjects(projs);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSpaceChange = (space: string) => {
        setSelectedSpace(space);
        fetchInitialProjects(space);
    };

    // Project Form State
    const [newProject, setNewProject] = useState({
        department: user?.role === 'Super Admin' ? '' : user?.department || '',
        project_group: '',
        name: '',
        description: ''
    });

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await createProject({
                ...newProject,
                created_by: user?.employee_id
            });
            setProjects([res.project, ...projects]);
            setIsProjectModalOpen(false);
            setNewProject({ ...newProject, project_group: '', name: '', description: '' });
        } catch (error) {
            alert("Error creating project");
        }
    };

    // Task Form State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignee: '',
        due_date: '',
        priority: 'Medium'
    });

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;
        try {
            const res = await createTask({
                ...newTask,
                project_id: selectedProject.project_id,
                created_by: user?.employee_id
            });
            setTasks([...tasks, res.task]);
            setIsTaskModalOpen(false);
            setNewTask({ title: '', description: '', assignee: '', due_date: '', priority: 'Medium' });
        } catch (error) {
            alert("Error creating task");
        }
    };

    const handleCreatePersonalTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await createPersonalTodo({
                ...newPersonalTodo,
                employee_id: user?.employee_id as string
            });
            setPersonalTodos([res.todo, ...personalTodos]);
            setIsPersonalTodoModalOpen(false);
            setNewPersonalTodo({ title: '', description: '', due_date: '' });
        } catch (error) {
            alert("Error creating to-do");
        }
    };

    const handleTogglePersonalTodo = async (todo: PersonalTodo) => {
        const newStatus = todo.status === 'done' ? 'pending' : 'done';
        try {
            await updatePersonalTodo(todo.todo_id, { status: newStatus });
            setPersonalTodos(personalTodos.map(t => t.todo_id === todo.todo_id ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeletePersonalTodo = async (todo_id: string) => {
        try {
            await deletePersonalTodo(todo_id);
            setPersonalTodos(personalTodos.filter(t => t.todo_id !== todo_id));
        } catch (error) {
            console.error(error);
        }
    };

    // Grouping
    const groupedProjects = projects.reduce((acc, proj) => {
        const group = proj.project_group || 'Uncategorized';
        if (!acc[group]) acc[group] = [];
        acc[group].push(proj);
        return acc;
    }, {} as Record<string, Project[]>);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'todo': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'done': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'text-rose-500 bg-rose-50 border-rose-100';
            case 'Medium': return 'text-amber-500 bg-amber-50 border-amber-100';
            case 'Low': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    const handleUpdateTaskStatus = async (task_id: string, newStatus: string) => {
        try {
            await updateTask(task_id, { status: newStatus });
            setTasks(tasks.map(t => t.task_id === task_id ? { ...t, status: newStatus } : t));
            if (activeTask && activeTask.task_id === task_id) {
                setActiveTask({ ...activeTask, status: newStatus });
            }
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleAddSubtask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
            const title = e.currentTarget.value.trim();
            if (!activeTask) return;
            
            const currentSubtasks: Subtask[] = JSON.parse(activeTask.subtasks || '[]');
            const newSubtask: Subtask = {
                id: Math.random().toString(36).substr(2, 9),
                title,
                completed: false
            };
            const newSubtasks = [...currentSubtasks, newSubtask];
            
            try {
                await updateTask(activeTask.task_id, { subtasks: JSON.stringify(newSubtasks) });
                const updatedTask = { ...activeTask, subtasks: JSON.stringify(newSubtasks) };
                setActiveTask(updatedTask);
                setTasks(tasks.map(t => t.task_id === activeTask.task_id ? updatedTask : t));
                e.currentTarget.value = '';
            } catch (error) {
                alert("Failed to add subtask");
            }
        }
    };

    const handleToggleSubtask = async (subtaskId: string) => {
        if (!activeTask) return;
        const currentSubtasks: Subtask[] = JSON.parse(activeTask.subtasks || '[]');
        const newSubtasks = currentSubtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        
        try {
            await updateTask(activeTask.task_id, { subtasks: JSON.stringify(newSubtasks) });
            const updatedTask = { ...activeTask, subtasks: JSON.stringify(newSubtasks) };
            setActiveTask(updatedTask);
            setTasks(tasks.map(t => t.task_id === activeTask.task_id ? updatedTask : t));
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTask || !newCommentText.trim() || isAddingComment) return;

        setIsAddingComment(true);
        try {
            await appsScriptFetch("/add-task-comment", {
                task_id: activeTask.task_id,
                text: newCommentText,
                user_name: user?.name
            });
            
            const newComment = {
                text: newCommentText,
                user_name: user?.name,
                date: new Date().toISOString()
            };
            
            const updatedComments = [...JSON.parse(activeTask.comments || '[]'), newComment];
            const updatedTask = { ...activeTask, comments: JSON.stringify(updatedComments) };
            
            setActiveTask(updatedTask);
            setTasks(tasks.map(t => t.task_id === activeTask.task_id ? updatedTask : t));
            setNewCommentText("");
        } catch (error) {
            alert("Failed to add comment");
        } finally {
            setIsAddingComment(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    const renderTaskCard = (task: Task) => {
        const assignedUser = allEmployees.find(e => e.employee_id === String(task.assignee));
        const st = JSON.parse(task.subtasks || '[]');
        const completedSt = st.filter((s: any) => s.completed).length;

        return (
            <div 
                key={task.task_id}
                onClick={() => { setActiveTask(task); setIsTaskDetailOpen(true); }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                    <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded-lg">
                        <MoreVertical size={16} />
                    </button>
                </div>
                
                <h4 className="font-bold text-slate-800 mb-2 leading-tight">{task.title}</h4>
                
                {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{task.description}</p>
                )}

                {st.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 mt-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${(completedSt / st.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                            {completedSt}/{st.length}
                        </span>
                    </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2 text-slate-400">
                        {task.due_date && (
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                <CalendarIcon size={12} className={new Date(task.due_date) < new Date() ? 'text-rose-500' : ''} />
                                <span className={`text-[11px] font-medium ${new Date(task.due_date) < new Date() ? 'text-rose-600' : ''}`}>
                                    {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {assignedUser ? (
                        <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100 shrink-0">
                            {assignedUser.profile_picture ? (
                                <img src={getImageUrl(assignedUser.profile_picture)} alt={assignedUser.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                    {assignedUser.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-slate-50 flex items-center justify-center text-slate-300">
                            <User size={14} />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6">
            
            {/* Sidebar / Projects List */}
            <div className={`w-full lg:w-80 bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0 ${selectedProject ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <Briefcase className="text-indigo-500" size={24} />
                            Spaces
                        </h2>
                        {user?.role === 'Super Admin' && (
                            <select 
                                value={selectedSpace}
                                onChange={(e) => handleSpaceChange(e.target.value)}
                                className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {departments.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    
                    {!selectedProject && (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 border-dashed mb-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Space</div>
                            <div className="text-sm font-bold text-slate-700">{user?.role === 'Super Admin' ? selectedSpace : (user?.department || 'My Department')}</div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mb-6">
                        <button 
                            onClick={() => { setViewMode('projects'); setSelectedProject(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${viewMode === 'projects' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Briefcase size={18} />
                            All Projects
                        </button>
                        <button 
                            onClick={() => { setViewMode('my-tasks'); setSelectedProject(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${viewMode === 'my-tasks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <ListChecks size={18} />
                            My To-Do List
                        </button>
                    </div>

                    <button 
                        onClick={() => setIsProjectModalOpen(true)}
                        className="w-full bg-slate-900 hover:bg-black text-white px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        New Project
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {Object.entries(groupedProjects).map(([group, projs]) => (
                        <div key={group}>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 px-2 flex items-center gap-2">
                                <Folder size={14} />
                                {group}
                            </h3>
                            <div className="space-y-1.5">
                                {projs.map(p => (
                                    <button
                                        key={p.project_id}
                                        onClick={() => handleProjectClick(p)}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm flex items-center justify-between group
                                            ${selectedProject?.project_id === p.project_id 
                                                ? 'bg-indigo-50 text-indigo-700' 
                                                : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <Hash size={16} className={selectedProject?.project_id === p.project_id ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'} />
                                            <span className="truncate">{p.name}</span>
                                        </div>
                                        {selectedProject?.project_id === p.project_id && (
                                            <ChevronRight size={16} className="text-indigo-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && !isFetching && viewMode === 'projects' && (
                        <div className="text-center p-6 text-slate-500 text-sm font-medium">
                            No projects found for {user?.department}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white lg:bg-transparent lg:rounded-none rounded-[2rem] overflow-hidden">
                {viewMode === 'projects' ? (
                    selectedProject ? (
                        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 rounded-[2rem] overflow-hidden">
                            {/* Header */}
                            <div className="bg-white px-6 py-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setSelectedProject(null)}
                                        className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        <ChevronRight className="rotate-180" size={24} />
                                    </button>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">
                                            {selectedProject.project_group}
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedProject.name}</h2>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsTaskModalOpen(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-[0_4px_14px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] active:scale-95"
                                >
                                    <Plus size={18} />
                                    Add Task
                                </button>
                            </div>

                            {/* Board */}
                            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                                <div className="flex gap-6 h-full items-start min-w-max">
                                    {/* Column: To Do */}
                                    <div className="w-[320px] bg-white rounded-3xl p-4 flex flex-col max-h-full border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                To Do
                                            </h3>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {tasks.filter(t => t.status === 'todo').length}
                                            </span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2">
                                            {tasks.filter(t => t.status === 'todo').map(renderTaskCard)}
                                        </div>
                                    </div>
                                    
                                    {/* Column: In Progress */}
                                    <div className="w-[320px] bg-white rounded-3xl p-4 flex flex-col max-h-full border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                In Progress
                                            </h3>
                                            <span className="text-xs font-bold text-blue-400 bg-blue-100 px-2 py-0.5 rounded-full">
                                                {tasks.filter(t => t.status === 'in_progress').length}
                                            </span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2">
                                            {tasks.filter(t => t.status === 'in_progress').map(renderTaskCard)}
                                        </div>
                                    </div>

                                    {/* Column: Done */}
                                    <div className="w-[320px] bg-white rounded-3xl p-4 flex flex-col max-h-full border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                Done
                                            </h3>
                                            <span className="text-xs font-bold text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                {tasks.filter(t => t.status === 'done').length}
                                            </span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2">
                                            {tasks.filter(t => t.status === 'done').map(renderTaskCard)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-white rounded-[2rem] border border-slate-200 shadow-sm">
                            <div className="text-center max-w-sm">
                                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Briefcase className="text-indigo-500" size={48} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Select a Project</h3>
                                <p className="text-slate-500 text-sm">Choose a project from the sidebar to view its board, tasks, and team progress.</p>
                            </div>
                        </div>
                    )
                ) : (
                    /* My To-Do List View */
                    <div className="flex-1 flex flex-col bg-slate-50/50 rounded-[2rem] overflow-hidden">
                        <div className="bg-white px-8 py-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">My To-Do List</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Individual Progress & Tasks</p>
                            </div>
                            <button 
                                onClick={() => setIsPersonalTodoModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-lg shadow-indigo-100"
                            >
                                <Plus size={18} />
                                Quick Add
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-3xl mx-auto space-y-4">
                                {personalTodos.length > 0 ? (
                                    personalTodos.map(todo => (
                                        <div 
                                            key={todo.todo_id}
                                            className="group bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5"
                                        >
                                            <button 
                                                onClick={() => handleTogglePersonalTodo(todo)}
                                                className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${todo.status === 'done' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white group-hover:border-indigo-300'}`}
                                            >
                                                {todo.status === 'done' && <CheckCircle2 size={18} strokeWidth={3} />}
                                            </button>
                                            
                                            <div className="flex-1">
                                                <h4 className={`font-black text-slate-800 ${todo.status === 'done' ? 'line-through text-slate-400 opacity-50' : ''}`}>{todo.title}</h4>
                                                <div className="flex items-center gap-4 mt-2">
                                                    {todo.due_date && (
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <CalendarIcon size={12} />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(todo.due_date).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleDeletePersonalTodo(todo.todo_id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 border-dashed">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ListChecks className="text-slate-300" size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">No personal tasks</h3>
                                        <p className="text-slate-500 text-sm mt-1">Keep track of your private tasks and reminders here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CREATE PROJECT MODAL */}
            <Transition appear show={isProjectModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsProjectModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95 translate-y-4"
                                enterTo="opacity-100 scale-100 translate-y-0"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100 translate-y-0"
                                leaveTo="opacity-0 scale-95 translate-y-4"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl transition-all border border-slate-100">
                                    <Dialog.Title as="h3" className="text-xl font-black text-slate-900 mb-6">
                                        Create New Project
                                    </Dialog.Title>
                                    
                                    <form onSubmit={handleCreateProject} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Project Group / Folder</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={newProject.project_group}
                                                onChange={e => setNewProject({...newProject, project_group: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                                placeholder="e.g. Employee Onboarding"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Project Name</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={newProject.name}
                                                onChange={e => setNewProject({...newProject, name: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                                placeholder="e.g. Backend Dev Hiring Q3"
                                            />
                                        </div>
                                        
                                        {user?.role === 'Super Admin' && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Department</label>
                                                <input 
                                                    type="text" 
                                                    value={newProject.department}
                                                    onChange={e => setNewProject({...newProject, department: e.target.value})}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                                    placeholder="HR, Finance, etc."
                                                />
                                            </div>
                                        )}

                                        <div className="pt-4 flex gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsProjectModalOpen(false)}
                                                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                            >
                                                Create Project
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* CREATE TASK MODAL */}
            <Transition appear show={isTaskModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsTaskModalOpen(false)}>
                    {/* Standard Modal boilerplate */}
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4">
                                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl transition-all border border-slate-100">
                                    <Dialog.Title as="h3" className="text-xl font-black text-slate-900 mb-6">
                                        Add New Task
                                    </Dialog.Title>
                                    
                                    <form onSubmit={handleCreateTask} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Task Title</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={newTask.title}
                                                onChange={e => setNewTask({...newTask, title: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
                                            <textarea 
                                                value={newTask.description}
                                                onChange={e => setNewTask({...newTask, description: e.target.value})}
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Assignee</label>
                                                <select 
                                                    value={newTask.assignee}
                                                    onChange={e => setNewTask({...newTask, assignee: e.target.value})}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {allEmployees.map(e => (
                                                        <option key={e.employee_id} value={e.employee_id}>{e.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Due Date</label>
                                                <input 
                                                    type="date" 
                                                    value={newTask.due_date}
                                                    onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Priority</label>
                                            <select 
                                                value={newTask.priority}
                                                onChange={e => setNewTask({...newTask, priority: e.target.value})}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                                Cancel
                                            </button>
                                            <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                                Add Task
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* TASK DETAIL MODAL */}
            <Transition appear show={isTaskDetailOpen && !!activeTask} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsTaskDetailOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-y-0 right-0 flex max-w-full">
                        <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-300" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                            <Dialog.Panel className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-100 flex flex-col h-full">
                                {activeTask && (
                                    <>
                                        {/* Header */}
                                        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <select 
                                                        value={activeTask.status}
                                                        onChange={(e) => handleUpdateTaskStatus(activeTask.task_id, e.target.value)}
                                                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border outline-none cursor-pointer appearance-none ${getStatusColor(activeTask.status)}`}
                                                    >
                                                        <option value="todo">To Do</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="done">Done</option>
                                                    </select>
                                                </div>
                                                <Dialog.Title className="text-2xl font-black text-slate-800 leading-tight">
                                                    {activeTask.title}
                                                </Dialog.Title>
                                            </div>
                                            <button onClick={() => setIsTaskDetailOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors shrink-0 bg-slate-100">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                            
                                            {/* Attributes Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Assignee</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                            {allEmployees.find(e => e.employee_id === String(activeTask.assignee))?.profile_picture ? (
                                                                <img src={getImageUrl(allEmployees.find(e => e.employee_id === String(activeTask.assignee))!.profile_picture)} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-full h-full p-2 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <select 
                                                            value={activeTask.assignee}
                                                            onChange={async (e) => {
                                                                await updateTask(activeTask.task_id, { assignee: e.target.value });
                                                                const updated = {...activeTask, assignee: e.target.value};
                                                                setActiveTask(updated);
                                                                setTasks(tasks.map(t => t.task_id === activeTask.task_id ? updated : t));
                                                            }}
                                                            className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer w-full text-ellipsis"
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {allEmployees.map(emp => (
                                                                <option key={emp.employee_id} value={emp.employee_id}>{emp.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Due Date</span>
                                                    <div className="flex items-center gap-2 group relative">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                            <CalendarIcon size={14} />
                                                        </div>
                                                        <input 
                                                            type="date"
                                                            value={activeTask.due_date}
                                                            onChange={async (e) => {
                                                                await updateTask(activeTask.task_id, { due_date: e.target.value });
                                                                const updated = {...activeTask, due_date: e.target.value};
                                                                setActiveTask(updated);
                                                                setTasks(tasks.map(t => t.task_id === activeTask.task_id ? updated : t));
                                                            }}
                                                            className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <span className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3">
                                                    <AlertCircle size={16} className="text-slate-400" />
                                                    Description
                                                </span>
                                                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                                                    {activeTask.description || <span className="text-slate-400 italic">No description provided.</span>}
                                                </p>
                                            </div>

                                            {/* Subtasks */}
                                            <div>
                                                <span className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3">
                                                    <ListChecks size={16} className="text-slate-400" />
                                                    Subtasks
                                                </span>
                                                <div className="space-y-2 mb-3">
                                                    {JSON.parse(activeTask.subtasks || '[]').map((st: Subtask) => (
                                                        <div key={st.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 group">
                                                            <button 
                                                                onClick={() => handleToggleSubtask(st.id)}
                                                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${st.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}
                                                            >
                                                                {st.completed && <CheckCircle2 size={12} strokeWidth={3} />}
                                                            </button>
                                                            <span className={`text-sm font-medium ${st.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                                {st.title}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <input 
                                                    type="text"
                                                    placeholder="Add a subtask and press Enter..."
                                                    onKeyDown={handleAddSubtask}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                                                />
                                            </div>

                                            {/* Activity Log / Comments */}
                                            <div>
                                                <span className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3">
                                                    <MessageSquare size={16} className="text-slate-400" />
                                                    Activity Log
                                                </span>
                                                <div className="space-y-4">
                                                    {JSON.parse(activeTask.comments || '[]').length > 0 ? (
                                                        JSON.parse(activeTask.comments || '[]').map((c: any, idx: number) => (
                                                            <div key={idx} className="flex gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                                    <User size={14} className="text-slate-400" />
                                                                </div>
                                                                <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-[11px] font-black text-slate-800">{c.user_name || 'System'}</span>
                                                                        <span className="text-[10px] text-slate-400 font-bold">{new Date(c.date).toLocaleString()}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{c.text}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic px-2">No activity recorded yet.</p>
                                                    )}
                                                </div>

                                                <form onSubmit={handleAddComment} className="mt-6 flex flex-col gap-2">
                                                    <textarea 
                                                        value={newCommentText}
                                                        onChange={(e) => setNewCommentText(e.target.value)}
                                                        placeholder="Write a comment..."
                                                        rows={2}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium resize-none placeholder:text-slate-400"
                                                    />
                                                    <button 
                                                        type="submit"
                                                        disabled={!newCommentText.trim() || isAddingComment}
                                                        className="self-end bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                                    >
                                                        {isAddingComment ? "Posting..." : "Post Comment"}
                                                    </button>
                                                </form>
                                            </div>

                                        </div>
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>

            {/* CREATE PERSONAL TODO MODAL */}
            <Transition appear show={isPersonalTodoModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsPersonalTodoModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-white p-10 text-left align-middle shadow-2xl transition-all border border-slate-100">
                                    <Dialog.Title as="h3" className="text-2xl font-black text-slate-900 mb-2">
                                        Quick Add To-Do
                                    </Dialog.Title>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Personal Task or Reminder</p>
                                    
                                    <form onSubmit={handleCreatePersonalTodo} className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 px-1">What needs to be done?</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={newPersonalTodo.title}
                                                onChange={e => setNewPersonalTodo({...newPersonalTodo, title: e.target.value})}
                                                className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 bg-slate-50/50"
                                                placeholder="e.g. Follow up on payroll"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 px-1">Due Date (Optional)</label>
                                            <input 
                                                type="date" 
                                                value={newPersonalTodo.due_date}
                                                onChange={e => setNewPersonalTodo({...newPersonalTodo, due_date: e.target.value})}
                                                className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 bg-slate-50/50"
                                            />
                                        </div>

                                        <div className="pt-4 flex gap-4">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsPersonalTodoModalOpen(false)}
                                                className="flex-1 px-6 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="flex-1 px-6 py-4 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs"
                                            >
                                                Add Task
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}

