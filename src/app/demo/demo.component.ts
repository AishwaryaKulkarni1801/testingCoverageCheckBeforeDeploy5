import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, interval, takeUntil } from 'rxjs';

interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  title = 'Demo Component';
  description = 'This is a simple demo component created for testing.';
  
  // User management properties
  users: User[] = [];
  selectedUser: User | null = null;
  userSearchTerm = '';
  showUserForm = false;
  
  // Todo management properties
  todos: TodoItem[] = [];
  newTodoTitle = '';
  selectedPriority: 'low' | 'medium' | 'high' = 'medium';
  todoFilter: 'all' | 'active' | 'completed' = 'all';
  
  // UI state properties
  isLoading = false;
  errorMessage = '';
  currentTime = new Date();
  counter = 0;
  theme: 'light' | 'dark' = 'light';
  
  // Statistics
  statistics = {
    totalUsers: 0,
    activeUsers: 0,
    totalTodos: 0,
    completedTodos: 0,
    highPriorityTodos: 0
  };

  ngOnInit(): void {
    this.initializeData();
    this.startTimer();
    this.loadInitialUsers();
    this.loadInitialTodos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeData(): void {
    this.loadTheme();
    this.updateStatistics();
  }

  private startTimer(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentTime = new Date();
        this.counter++;
      });
  }

  private loadInitialUsers(): void {
    this.users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', isActive: true },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', isActive: false },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', isActive: true },
      { id: 4, name: 'Alice Brown', email: 'alice@example.com', isActive: true },
      { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', isActive: false }
    ];
    this.updateStatistics();
  }

  private loadInitialTodos(): void {
    this.todos = [
      { id: 1, title: 'Complete project setup', completed: true, priority: 'high', createdAt: new Date('2024-01-01') },
      { id: 2, title: 'Write unit tests', completed: false, priority: 'high', createdAt: new Date('2024-01-02') },
      { id: 3, title: 'Update documentation', completed: false, priority: 'medium', createdAt: new Date('2024-01-03') },
      { id: 4, title: 'Code review', completed: false, priority: 'low', createdAt: new Date('2024-01-04') },
      { id: 5, title: 'Deploy to staging', completed: true, priority: 'medium', createdAt: new Date('2024-01-05') }
    ];
    this.updateStatistics();
  }

  // User management methods
  addUser(name: string, email: string): void {
    if (!name.trim() || !email.trim()) {
      this.errorMessage = 'Name and email are required';
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    const newUser: User = {
      id: this.getNextUserId(),
      name: name.trim(),
      email: email.trim(),
      isActive: true
    };

    this.users.push(newUser);
    this.updateStatistics();
    this.errorMessage = '';
    this.showUserForm = false;
  }

  deleteUser(userId: number): void {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      this.users.splice(userIndex, 1);
      if (this.selectedUser && this.selectedUser.id === userId) {
        this.selectedUser = null;
      }
      this.updateStatistics();
    }
  }

  toggleUserStatus(userId: number): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.isActive = !user.isActive;
      this.updateStatistics();
    }
  }

  selectUser(user: User): void {
    this.selectedUser = user;
  }

  searchUsers(): User[] {
    if (!this.userSearchTerm.trim()) {
      return this.users;
    }
    
    return this.users.filter(user => 
      user.name.toLowerCase().includes(this.userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.userSearchTerm.toLowerCase())
    );
  }

  // Todo management methods
  addTodo(): void {
    if (!this.newTodoTitle.trim()) {
      this.errorMessage = 'Todo title is required';
      return;
    }

    const newTodo: TodoItem = {
      id: this.getNextTodoId(),
      title: this.newTodoTitle.trim(),
      completed: false,
      priority: this.selectedPriority,
      createdAt: new Date()
    };

    this.todos.push(newTodo);
    this.newTodoTitle = '';
    this.updateStatistics();
    this.errorMessage = '';
  }

  toggleTodo(todoId: number): void {
    const todo = this.todos.find(t => t.id === todoId);
    if (todo) {
      todo.completed = !todo.completed;
      this.updateStatistics();
    }
  }

  deleteTodo(todoId: number): void {
    const todoIndex = this.todos.findIndex(t => t.id === todoId);
    if (todoIndex > -1) {
      this.todos.splice(todoIndex, 1);
      this.updateStatistics();
    }
  }

  updateTodoPriority(todoId: number, priority: 'low' | 'medium' | 'high'): void {
    const todo = this.todos.find(t => t.id === todoId);
    if (todo) {
      todo.priority = priority;
      this.updateStatistics();
    }
  }

  getFilteredTodos(): TodoItem[] {
    switch (this.todoFilter) {
      case 'active':
        return this.todos.filter(todo => !todo.completed);
      case 'completed':
        return this.todos.filter(todo => todo.completed);
      default:
        return this.todos;
    }
  }

  getActiveTodosCount(): number {
    return this.todos.filter(todo => !todo.completed).length;
  }

  getCompletedTodosCount(): number {
    return this.todos.filter(todo => todo.completed).length;
  }

  clearCompletedTodos(): void {
    this.todos = this.todos.filter(todo => !todo.completed);
    this.updateStatistics();
  }

  // Utility methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getNextUserId(): number {
    return this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
  }

  private getNextTodoId(): number {
    return this.todos.length > 0 ? Math.max(...this.todos.map(t => t.id)) + 1 : 1;
  }

  private updateStatistics(): void {
    this.statistics = {
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.isActive).length,
      totalTodos: this.todos.length,
      completedTodos: this.todos.filter(t => t.completed).length,
      highPriorityTodos: this.todos.filter(t => t.priority === 'high').length
    };
  }

  // Theme management
  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.saveTheme();
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('demo-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.theme = savedTheme;
    }
  }

  private saveTheme(): void {
    localStorage.setItem('demo-theme', this.theme);
  }

  // Data export/import methods
  exportData(): string {
    const data = {
      users: this.users,
      todos: this.todos,
      theme: this.theme,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  exportToConsole(): void {
    const data = this.exportData();
    console.log('Exported Data:', data);
    // You could also show this in a modal or download as file
  }

  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.users && Array.isArray(data.users)) {
        this.users = data.users;
      }
      if (data.todos && Array.isArray(data.todos)) {
        this.todos = data.todos.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        }));
      }
      if (data.theme) {
        this.theme = data.theme;
      }
      this.updateStatistics();
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Invalid JSON data for import';
    }
  }

  // Bulk operations
  markAllTodosComplete(): void {
    this.todos.forEach(todo => todo.completed = true);
    this.updateStatistics();
  }

  markAllTodosIncomplete(): void {
    this.todos.forEach(todo => todo.completed = false);
    this.updateStatistics();
  }

  activateAllUsers(): void {
    this.users.forEach(user => user.isActive = true);
    this.updateStatistics();
  }

  deactivateAllUsers(): void {
    this.users.forEach(user => user.isActive = false);
    this.updateStatistics();
  }

  // Sorting methods
  sortUsersByName(): void {
    this.users.sort((a, b) => a.name.localeCompare(b.name));
  }

  sortUsersByEmail(): void {
    this.users.sort((a, b) => a.email.localeCompare(b.email));
  }

  sortTodosByPriority(): void {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    this.todos.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  sortTodosByDate(): void {
    this.todos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Reset methods
  resetAllData(): void {
    this.users = [];
    this.todos = [];
    this.selectedUser = null;
    this.userSearchTerm = '';
    this.newTodoTitle = '';
    this.errorMessage = '';
    this.updateStatistics();
  }

  resetToDefaults(): void {
    this.loadInitialUsers();
    this.loadInitialTodos();
    this.selectedUser = null;
    this.userSearchTerm = '';
    this.newTodoTitle = '';
    this.errorMessage = '';
    this.theme = 'light';
    this.todoFilter = 'all';
    this.selectedPriority = 'medium';
  }
}
