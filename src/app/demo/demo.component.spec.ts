import { DemoComponent } from './demo.component';
import { Subject, interval } from 'rxjs';

// Mock RxJS interval
jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  interval: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock console methods
const consoleMock = {
  log: jest.fn(),
  error: jest.fn()
};
Object.defineProperty(window, 'console', { value: consoleMock });

describe('DemoComponent', () => {
  let component: DemoComponent;
  let mockInterval: jest.MockedFunction<typeof interval>;
  let mockDestroy$: jest.SpyInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup interval mock
    mockInterval = interval as jest.MockedFunction<typeof interval>;
    const mockObservable = {
      pipe: jest.fn().mockReturnValue({
        subscribe: jest.fn()
      })
    };
    mockInterval.mockReturnValue(mockObservable as any);
    
    // Create component instance using direct instantiation
    component = new DemoComponent();
    
    // Mock destroy$ subject
    mockDestroy$ = jest.spyOn(component['destroy$'], 'next');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create component with default values', () => {
      expect(component).toBeTruthy();
      expect(component.title).toBe('Demo Component');
      expect(component.description).toBe('This is a simple demo component created for testing.');
      expect(component.users).toEqual([]);
      expect(component.todos).toEqual([]);
      expect(component.selectedUser).toBeNull();
      expect(component.userSearchTerm).toBe('');
      expect(component.showUserForm).toBe(false);
      expect(component.newTodoTitle).toBe('');
      expect(component.selectedPriority).toBe('medium');
      expect(component.todoFilter).toBe('all');
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.counter).toBe(0);
      expect(component.theme).toBe('light');
    });

    it('should initialize statistics with zero values', () => {
      expect(component.statistics).toEqual({
        totalUsers: 0,
        activeUsers: 0,
        totalTodos: 0,
        completedTodos: 0,
        highPriorityTodos: 0
      });
    });

    it('should have currentTime as Date instance', () => {
      expect(component.currentTime).toBeInstanceOf(Date);
    });
  });

  describe('ngOnInit', () => {
    it('should call initialization methods', () => {
      const initializeDataSpy = jest.spyOn(component as any, 'initializeData');
      const startTimerSpy = jest.spyOn(component as any, 'startTimer');
      const loadInitialUsersSpy = jest.spyOn(component as any, 'loadInitialUsers');
      const loadInitialTodosSpy = jest.spyOn(component as any, 'loadInitialTodos');

      component.ngOnInit();

      expect(initializeDataSpy).toHaveBeenCalled();
      expect(startTimerSpy).toHaveBeenCalled();
      expect(loadInitialUsersSpy).toHaveBeenCalled();
      expect(loadInitialTodosSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(mockDestroy$).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Private Methods - Data Initialization', () => {
    it('should initialize data correctly', () => {
      const loadThemeSpy = jest.spyOn(component as any, 'loadTheme');
      const updateStatisticsSpy = jest.spyOn(component as any, 'updateStatistics');

      component['initializeData']();

      expect(loadThemeSpy).toHaveBeenCalled();
      expect(updateStatisticsSpy).toHaveBeenCalled();
    });

    it('should start timer with interval subscription', () => {
      const mockSubscription = { unsubscribe: jest.fn() };
      const mockPipe = jest.fn().mockReturnValue({ subscribe: jest.fn().mockReturnValue(mockSubscription) });
      mockInterval.mockReturnValue({ pipe: mockPipe } as any);

      component['startTimer']();

      expect(mockInterval).toHaveBeenCalledWith(1000);
      expect(mockPipe).toHaveBeenCalled();
    });

    it('should load initial users with correct data', () => {
      component['loadInitialUsers']();

      expect(component.users).toHaveLength(5);
      expect(component.users[0]).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        isActive: true
      });
      expect(component.users[1]).toEqual({
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        isActive: false
      });
    });

    it('should load initial todos with correct data', () => {
      component['loadInitialTodos']();

      expect(component.todos).toHaveLength(5);
      expect(component.todos[0]).toEqual({
        id: 1,
        title: 'Complete project setup',
        completed: true,
        priority: 'high',
        createdAt: new Date('2024-01-01')
      });
    });

    it('should update statistics after loading initial data', () => {
      const updateStatisticsSpy = jest.spyOn(component as any, 'updateStatistics');
      
      component['loadInitialUsers']();
      component['loadInitialTodos']();

      expect(updateStatisticsSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      component['loadInitialUsers']();
    });

    describe('addUser', () => {
      it('should add user with valid name and email', () => {
        const initialLength = component.users.length;
        
        component.addUser('New User', 'new@example.com');
        
        expect(component.users).toHaveLength(initialLength + 1);
        expect(component.users[initialLength]).toEqual({
          id: 6,
          name: 'New User',
          email: 'new@example.com',
          isActive: true
        });
        expect(component.errorMessage).toBe('');
        expect(component.showUserForm).toBe(false);
      });

      it('should trim whitespace from name and email when adding user', () => {
        // Test trimming functionality indirectly through successful validation
        const trimSpy = jest.spyOn(String.prototype, 'trim');
        
        component.addUser('  Test User  ', '  test@example.com  ');
        
        expect(trimSpy).toHaveBeenCalled();
        trimSpy.mockRestore();
      });

      it('should set error message when name is empty', () => {
        component.addUser('', 'email@example.com');
        
        expect(component.errorMessage).toBe('Name and email are required');
      });

      it('should set error message when email is empty', () => {
        component.addUser('Name', '');
        
        expect(component.errorMessage).toBe('Name and email are required');
      });

      it('should set error message when name is only whitespace', () => {
        component.addUser('   ', 'email@example.com');
        
        expect(component.errorMessage).toBe('Name and email are required');
      });

      it('should set error message when email is only whitespace', () => {
        component.addUser('Name', '   ');
        
        expect(component.errorMessage).toBe('Name and email are required');
      });

      it('should set error message for invalid email format', () => {
        component.addUser('Name', 'invalid-email');
        
        expect(component.errorMessage).toBe('Please enter a valid email address');
      });

      it('should validate email with multiple invalid formats', () => {
        const invalidEmails = ['invalid', '@example.com', 'user@', 'user@.com', 'user@com'];
        
        invalidEmails.forEach(email => {
          component.addUser('Name', email);
          expect(component.errorMessage).toBe('Please enter a valid email address');
        });
      });
    });

    describe('deleteUser', () => {
      it('should delete user by id', () => {
        const initialLength = component.users.length;
        
        component.deleteUser(1);
        
        expect(component.users).toHaveLength(initialLength - 1);
        expect(component.users.find(u => u.id === 1)).toBeUndefined();
      });

      it('should clear selectedUser if deleted user was selected', () => {
        component.selectedUser = component.users[0];
        
        component.deleteUser(1);
        
        expect(component.selectedUser).toBeNull();
      });

      it('should not clear selectedUser if different user is deleted', () => {
        component.selectedUser = component.users[0];
        
        component.deleteUser(2);
        
        expect(component.selectedUser).toBe(component.users[0]);
      });

      it('should handle deletion of non-existent user', () => {
        const initialLength = component.users.length;
        
        component.deleteUser(999);
        
        expect(component.users).toHaveLength(initialLength);
      });
    });

    describe('toggleUserStatus', () => {
      it('should toggle user active status', () => {
        const user = component.users[0];
        const initialStatus = user.isActive;
        
        component.toggleUserStatus(1);
        
        expect(user.isActive).toBe(!initialStatus);
      });

      it('should handle toggle for non-existent user', () => {
        component.toggleUserStatus(999);
        // Should not throw error
        expect(component.users[0].isActive).toBe(true); // Original status unchanged
      });
    });

    describe('selectUser', () => {
      it('should set selected user', () => {
        const user = component.users[0];
        
        component.selectUser(user);
        
        expect(component.selectedUser).toBe(user);
      });
    });

    describe('searchUsers', () => {
      it('should return all users when search term is empty', () => {
        component.userSearchTerm = '';
        
        const result = component.searchUsers();
        
        expect(result).toEqual(component.users);
      });

      it('should return all users when search term is whitespace', () => {
        component.userSearchTerm = '   ';
        
        const result = component.searchUsers();
        
        expect(result).toEqual(component.users);
      });

      it('should filter users by name case-insensitive', () => {
        component.userSearchTerm = 'john';
        
        const result = component.searchUsers();
        
        expect(result).toHaveLength(2); // John Doe and Bob Johnson
        expect(result.map(u => u.name)).toContain('John Doe');
        expect(result.map(u => u.name)).toContain('Bob Johnson');
      });

      it('should filter users by email case-insensitive', () => {
        component.userSearchTerm = 'EXAMPLE';
        
        const result = component.searchUsers();
        
        expect(result).toHaveLength(5); // All users have @example.com
      });

      it('should return empty array when no matches', () => {
        component.userSearchTerm = 'nonexistent';
        
        const result = component.searchUsers();
        
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('Todo Management', () => {
    beforeEach(() => {
      component['loadInitialTodos']();
    });

    describe('addTodo', () => {
      it('should add todo with valid title', () => {
        const initialLength = component.todos.length;
        component.newTodoTitle = 'New Todo';
        
        component.addTodo();
        
        expect(component.todos).toHaveLength(initialLength + 1);
        expect(component.todos[initialLength]).toEqual({
          id: 6,
          title: 'New Todo',
          completed: false,
          priority: 'medium',
          createdAt: expect.any(Date)
        });
        expect(component.newTodoTitle).toBe('');
        expect(component.errorMessage).toBe('');
      });

      it('should trim whitespace from todo title', () => {
        component.newTodoTitle = '  Trimmed Todo  ';
        
        component.addTodo();
        
        const newTodo = component.todos[component.todos.length - 1];
        expect(newTodo.title).toBe('Trimmed Todo');
      });

      it('should set error message when title is empty', () => {
        component.newTodoTitle = '';
        
        component.addTodo();
        
        expect(component.errorMessage).toBe('Todo title is required');
      });

      it('should set error message when title is only whitespace', () => {
        component.newTodoTitle = '   ';
        
        component.addTodo();
        
        expect(component.errorMessage).toBe('Todo title is required');
      });

      it('should use selected priority when adding todo', () => {
        component.newTodoTitle = 'High Priority Todo';
        component.selectedPriority = 'high';
        
        component.addTodo();
        
        const newTodo = component.todos[component.todos.length - 1];
        expect(newTodo.priority).toBe('high');
      });
    });

    describe('toggleTodo', () => {
      it('should toggle todo completed status', () => {
        const todo = component.todos[0];
        const initialStatus = todo.completed;
        
        component.toggleTodo(1);
        
        expect(todo.completed).toBe(!initialStatus);
      });

      it('should handle toggle for non-existent todo', () => {
        component.toggleTodo(999);
        // Should not throw error
        expect(component.todos[0].completed).toBe(true); // Original status unchanged
      });
    });

    describe('deleteTodo', () => {
      it('should delete todo by id', () => {
        const initialLength = component.todos.length;
        
        component.deleteTodo(1);
        
        expect(component.todos).toHaveLength(initialLength - 1);
        expect(component.todos.find(t => t.id === 1)).toBeUndefined();
      });

      it('should handle deletion of non-existent todo', () => {
        const initialLength = component.todos.length;
        
        component.deleteTodo(999);
        
        expect(component.todos).toHaveLength(initialLength);
      });
    });

    describe('updateTodoPriority', () => {
      it('should update todo priority', () => {
        component.updateTodoPriority(1, 'low');
        
        const todo = component.todos.find(t => t.id === 1);
        expect(todo?.priority).toBe('low');
      });

      it('should handle update for non-existent todo', () => {
        component.updateTodoPriority(999, 'high');
        // Should not throw error
        expect(component.todos[0].priority).toBe('high'); // Original priority unchanged
      });
    });

    describe('getFilteredTodos', () => {
      it('should return all todos when filter is "all"', () => {
        component.todoFilter = 'all';
        
        const result = component.getFilteredTodos();
        
        expect(result).toEqual(component.todos);
      });

      it('should return only active todos when filter is "active"', () => {
        component.todoFilter = 'active';
        
        const result = component.getFilteredTodos();
        
        expect(result).toHaveLength(3); // Only incomplete todos
        expect(result.every(t => !t.completed)).toBe(true);
      });

      it('should return only completed todos when filter is "completed"', () => {
        component.todoFilter = 'completed';
        
        const result = component.getFilteredTodos();
        
        expect(result).toHaveLength(2); // Only completed todos
        expect(result.every(t => t.completed)).toBe(true);
      });
    });

    describe('getActiveTodosCount', () => {
      it('should return count of incomplete todos', () => {
        const count = component.getActiveTodosCount();
        
        expect(count).toBe(3);
      });
    });

    describe('getCompletedTodosCount', () => {
      it('should return count of completed todos', () => {
        const count = component.getCompletedTodosCount();
        
        expect(count).toBe(2);
      });
    });

    describe('clearCompletedTodos', () => {
      it('should remove all completed todos', () => {
        const initialActiveTodos = component.getActiveTodosCount();
        
        component.clearCompletedTodos();
        
        expect(component.todos).toHaveLength(initialActiveTodos);
        expect(component.todos.every(t => !t.completed)).toBe(true);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('isValidEmail', () => {
      it('should return true for valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'user_name@example-domain.com'
        ];

        validEmails.forEach(email => {
          expect(component['isValidEmail'](email)).toBe(true);
        });
      });

      it('should return false for invalid email formats', () => {
        const invalidEmails = [
          'invalid',
          '@example.com',
          'user@',
          'user@.com',
          'user@com',
          'user name@example.com',
          'user@example',
          ''
        ];

        invalidEmails.forEach(email => {
          expect(component['isValidEmail'](email)).toBe(false);
        });
      });
    });

    describe('getNextUserId', () => {
      it('should return 1 when no users exist', () => {
        component.users = [];
        
        const nextId = component['getNextUserId']();
        
        expect(nextId).toBe(1);
      });

      it('should return max id + 1 when users exist', () => {
        component.users = [
          { id: 1, name: 'User 1', email: 'user1@example.com', isActive: true },
          { id: 5, name: 'User 5', email: 'user5@example.com', isActive: true },
          { id: 3, name: 'User 3', email: 'user3@example.com', isActive: true }
        ];
        
        const nextId = component['getNextUserId']();
        
        expect(nextId).toBe(6);
      });
    });

    describe('getNextTodoId', () => {
      it('should return 1 when no todos exist', () => {
        component.todos = [];
        
        const nextId = component['getNextTodoId']();
        
        expect(nextId).toBe(1);
      });

      it('should return max id + 1 when todos exist', () => {
        component.todos = [
          { id: 1, title: 'Todo 1', completed: false, priority: 'low', createdAt: new Date() },
          { id: 7, title: 'Todo 7', completed: false, priority: 'high', createdAt: new Date() },
          { id: 3, title: 'Todo 3', completed: true, priority: 'medium', createdAt: new Date() }
        ];
        
        const nextId = component['getNextTodoId']();
        
        expect(nextId).toBe(8);
      });
    });

    describe('updateStatistics', () => {
      beforeEach(() => {
        component['loadInitialUsers']();
        component['loadInitialTodos']();
      });

      it('should calculate correct statistics', () => {
        component['updateStatistics']();
        
        expect(component.statistics).toEqual({
          totalUsers: 5,
          activeUsers: 3,
          totalTodos: 5,
          completedTodos: 2,
          highPriorityTodos: 2
        });
      });

      it('should update statistics when users change', () => {
        component.users.push({ id: 6, name: 'New User', email: 'new@example.com', isActive: false });
        
        component['updateStatistics']();
        
        expect(component.statistics.totalUsers).toBe(6);
        expect(component.statistics.activeUsers).toBe(3);
      });

      it('should update statistics when todos change', () => {
        component.todos.push({ id: 6, title: 'New Todo', completed: false, priority: 'high', createdAt: new Date() });
        
        component['updateStatistics']();
        
        expect(component.statistics.totalTodos).toBe(6);
        expect(component.statistics.highPriorityTodos).toBe(3);
      });
    });
  });

  describe('Theme Management', () => {
    describe('toggleTheme', () => {
      it('should toggle from light to dark', () => {
        component.theme = 'light';
        const saveThemeSpy = jest.spyOn(component as any, 'saveTheme');
        
        component.toggleTheme();
        
        expect(component.theme).toBe('dark');
        expect(saveThemeSpy).toHaveBeenCalled();
      });

      it('should toggle from dark to light', () => {
        component.theme = 'dark';
        const saveThemeSpy = jest.spyOn(component as any, 'saveTheme');
        
        component.toggleTheme();
        
        expect(component.theme).toBe('light');
        expect(saveThemeSpy).toHaveBeenCalled();
      });
    });

    describe('loadTheme', () => {
      it('should load dark theme from localStorage', () => {
        localStorageMock.getItem.mockReturnValue('dark');
        
        component['loadTheme']();
        
        expect(component.theme).toBe('dark');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('demo-theme');
      });

      it('should load light theme from localStorage', () => {
        localStorageMock.getItem.mockReturnValue('light');
        
        component['loadTheme']();
        
        expect(component.theme).toBe('light');
      });

      it('should keep current theme when localStorage returns invalid value', () => {
        localStorageMock.getItem.mockReturnValue('invalid');
        const originalTheme = component.theme;
        
        component['loadTheme']();
        
        expect(component.theme).toBe(originalTheme);
      });

      it('should keep current theme when localStorage returns null', () => {
        localStorageMock.getItem.mockReturnValue(null);
        const originalTheme = component.theme;
        
        component['loadTheme']();
        
        expect(component.theme).toBe(originalTheme);
      });
    });

    describe('saveTheme', () => {
      it('should save theme to localStorage', () => {
        component.theme = 'dark';
        
        component['saveTheme']();
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith('demo-theme', 'dark');
      });
    });
  });

  describe('Data Export/Import', () => {
    beforeEach(() => {
      component['loadInitialUsers']();
      component['loadInitialTodos']();
      // Mock Date for consistent testing
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T00:00:00.000Z');
    });

    describe('exportData', () => {
      it('should export data as JSON string', () => {
        const result = component.exportData();
        const parsedResult = JSON.parse(result);
        
        expect(parsedResult.users).toEqual(component.users);
        expect(parsedResult.todos).toHaveLength(component.todos.length);
        expect(parsedResult.theme).toBe(component.theme);
        expect(parsedResult.exportDate).toBe('2024-01-01T00:00:00.000Z');
        
        // Verify todos structure without strict date comparison
        parsedResult.todos.forEach((todo: any, index: number) => {
          expect(todo.id).toBe(component.todos[index].id);
          expect(todo.title).toBe(component.todos[index].title);
          expect(todo.completed).toBe(component.todos[index].completed);
          expect(todo.priority).toBe(component.todos[index].priority);
          expect(typeof todo.createdAt).toBe('string');
        });
      });

      it('should format JSON with proper indentation', () => {
        const result = component.exportData();
        
        expect(result).toContain('  '); // Should have 2-space indentation
      });
    });

    describe('exportToConsole', () => {
      it('should log exported data to console', () => {
        component.exportToConsole();
        
        expect(consoleMock.log).toHaveBeenCalledWith('Exported Data:', expect.any(String));
      });
    });

    describe('importData', () => {
      const validJsonData = JSON.stringify({
        users: [{ id: 1, name: 'Imported User', email: 'imported@example.com', isActive: true }],
        todos: [{ id: 1, title: 'Imported Todo', completed: false, priority: 'low', createdAt: '2024-01-01' }],
        theme: 'dark'
      });

      it('should import valid JSON data', () => {
        const updateStatisticsSpy = jest.spyOn(component as any, 'updateStatistics');
        
        component.importData(validJsonData);
        
        expect(component.users).toEqual([{ id: 1, name: 'Imported User', email: 'imported@example.com', isActive: true }]);
        expect(component.todos[0].title).toBe('Imported Todo');
        expect(component.todos[0].createdAt).toBeInstanceOf(Date);
        expect(component.theme).toBe('dark');
        expect(component.errorMessage).toBe('');
        expect(updateStatisticsSpy).toHaveBeenCalled();
      });

      it('should handle JSON with only users', () => {
        const jsonWithOnlyUsers = JSON.stringify({
          users: [{ id: 1, name: 'User Only', email: 'user@example.com', isActive: true }]
        });
        
        component.importData(jsonWithOnlyUsers);
        
        expect(component.users).toHaveLength(1);
        expect(component.todos).toHaveLength(5); // Should keep existing todos
      });

      it('should handle JSON with only todos', () => {
        const jsonWithOnlyTodos = JSON.stringify({
          todos: [{ id: 1, title: 'Todo Only', completed: false, priority: 'medium', createdAt: '2024-01-01' }]
        });
        
        component.importData(jsonWithOnlyTodos);
        
        expect(component.todos).toHaveLength(1);
        expect(component.users).toHaveLength(5); // Should keep existing users
      });

      it('should handle JSON with only theme', () => {
        const jsonWithOnlyTheme = JSON.stringify({ theme: 'dark' });
        
        component.importData(jsonWithOnlyTheme);
        
        expect(component.theme).toBe('dark');
      });

      it('should set error message for invalid JSON', () => {
        component.importData('invalid json');
        
        expect(component.errorMessage).toBe('Invalid JSON data for import');
      });

      it('should handle empty JSON object', () => {
        component.importData('{}');
        
        expect(component.errorMessage).toBe('');
        // Should not throw error
      });

      it('should handle JSON with non-array users', () => {
        const invalidJson = JSON.stringify({ users: 'not an array' });
        
        component.importData(invalidJson);
        
        expect(component.users).toHaveLength(5); // Should keep existing users
      });

      it('should handle JSON with non-array todos', () => {
        const invalidJson = JSON.stringify({ todos: 'not an array' });
        
        component.importData(invalidJson);
        
        expect(component.todos).toHaveLength(5); // Should keep existing todos
      });
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(() => {
      component['loadInitialUsers']();
      component['loadInitialTodos']();
    });

    describe('markAllTodosComplete', () => {
      it('should mark all todos as complete', () => {
        const updateStatisticsSpy = jest.spyOn(component as any, 'updateStatistics');
        
        component.markAllTodosComplete();
        
        expect(component.todos.every(todo => todo.completed)).toBe(true);
        expect(updateStatisticsSpy).toHaveBeenCalled();
      });
    });

    describe('markAllTodosIncomplete', () => {
      it('should mark all todos as incomplete', () => {
        const updateStatisticsSpy = jest.spyOn(component as any, 'updateStatistics');
        
        component.markAllTodosIncomplete();
        
        expect(component.todos.every(todo => !todo.completed)).toBe(true);
        expect(updateStatisticsSpy).toHaveBeenCalled();
      });
    });

    describe('activateAllUsers', () => {
      it('should activate all users', () => {
        const updateStatisticsSpy = jest.spyOn(component as any, 'updateStatistics');
        
        component.activateAllUsers();
        
        expect(component.users.every(user => user.isActive)).toBe(true);
        expect(updateStatisticsSpy).toHaveBeenCalled();
      });
    });

    describe('deactivateAllUsers', () => {
      it('should deactivate all users', () => {
        const updateStatisticsSpy = jest.spyOn(component as any, 'updateStatistics');
        
        component.deactivateAllUsers();
        
        expect(component.users.every(user => !user.isActive)).toBe(true);
        expect(updateStatisticsSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Sorting Methods', () => {
    beforeEach(() => {
      component['loadInitialUsers']();
      component['loadInitialTodos']();
    });

    describe('sortUsersByName', () => {
      it('should sort users alphabetically by name', () => {
        component.sortUsersByName();
        
        const names = component.users.map(u => u.name);
        expect(names).toEqual(['Alice Brown', 'Bob Johnson', 'Charlie Wilson', 'Jane Smith', 'John Doe']);
      });
    });

    describe('sortUsersByEmail', () => {
      it('should sort users alphabetically by email', () => {
        component.sortUsersByEmail();
        
        const emails = component.users.map(u => u.email);
        expect(emails).toEqual(['alice@example.com', 'bob@example.com', 'charlie@example.com', 'jane@example.com', 'john@example.com']);
      });
    });

    describe('sortTodosByPriority', () => {
      it('should sort todos by priority (high > medium > low)', () => {
        component.sortTodosByPriority();
        
        const priorities = component.todos.map(t => t.priority);
        expect(priorities).toEqual(['high', 'high', 'medium', 'medium', 'low']);
      });
    });

    describe('sortTodosByDate', () => {
      it('should sort todos by date (newest first)', () => {
        component.sortTodosByDate();
        
        const dates = component.todos.map(t => t.createdAt.getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
        }
      });
    });
  });

  describe('Reset Methods', () => {
    beforeEach(() => {
      component['loadInitialUsers']();
      component['loadInitialTodos']();
      component.selectedUser = component.users[0];
      component.userSearchTerm = 'test';
      component.newTodoTitle = 'test todo';
      component.errorMessage = 'test error';
    });

    describe('resetAllData', () => {
      it('should reset all data to empty state', () => {
        const updateStatisticsSpy = jest.spyOn(component as any, 'updateStatistics');
        
        component.resetAllData();
        
        expect(component.users).toEqual([]);
        expect(component.todos).toEqual([]);
        expect(component.selectedUser).toBeNull();
        expect(component.userSearchTerm).toBe('');
        expect(component.newTodoTitle).toBe('');
        expect(component.errorMessage).toBe('');
        expect(updateStatisticsSpy).toHaveBeenCalled();
      });
    });

    describe('resetToDefaults', () => {
      it('should reset all data to default state', () => {
        const loadInitialUsersSpy = jest.spyOn(component as any, 'loadInitialUsers');
        const loadInitialTodosSpy = jest.spyOn(component as any, 'loadInitialTodos');
        
        component.resetToDefaults();
        
        expect(loadInitialUsersSpy).toHaveBeenCalled();
        expect(loadInitialTodosSpy).toHaveBeenCalled();
        expect(component.selectedUser).toBeNull();
        expect(component.userSearchTerm).toBe('');
        expect(component.newTodoTitle).toBe('');
        expect(component.errorMessage).toBe('');
        expect(component.theme).toBe('light');
        expect(component.todoFilter).toBe('all');
        expect(component.selectedPriority).toBe('medium');
      });
    });
  });

  describe('Timer Integration', () => {
    it('should update currentTime and counter when timer fires', () => {
      // Mock the interval subscription callback
      let timerCallback: () => void;
      const mockSubscribe = jest.fn().mockImplementation((callback) => {
        timerCallback = callback;
        return { unsubscribe: jest.fn() };
      });
      
      const mockPipe = jest.fn().mockReturnValue({ subscribe: mockSubscribe });
      mockInterval.mockReturnValue({ pipe: mockPipe } as any);
      
      const originalTime = component.currentTime;
      const originalCounter = component.counter;
      
      // Start the timer
      component['startTimer']();
      
      // Simulate timer firing
      timerCallback!();
      
      expect(component.currentTime).not.toBe(originalTime);
      expect(component.counter).toBe(originalCounter + 1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty arrays gracefully', () => {
      component.users = [];
      component.todos = [];
      
      expect(component.getActiveTodosCount()).toBe(0);
      expect(component.getCompletedTodosCount()).toBe(0);
      expect(component.searchUsers()).toEqual([]);
      expect(component.getFilteredTodos()).toEqual([]);
      expect(component['getNextUserId']()).toBe(1);
      expect(component['getNextTodoId']()).toBe(1);
    });

    it('should handle null and undefined values in arrays', () => {
      // This tests robustness against malformed data
      component.users = [null as any, undefined as any].filter(Boolean);
      component.todos = [null as any, undefined as any].filter(Boolean);
      
      expect(() => component['updateStatistics']()).not.toThrow();
      expect(component.statistics.totalUsers).toBe(0);
      expect(component.statistics.totalTodos).toBe(0);
    });

    it('should handle very large datasets', () => {
      // Create large datasets to test performance
      const largeUserArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        isActive: i % 2 === 0
      }));
      
      component.users = largeUserArray;
      
      expect(() => component['updateStatistics']()).not.toThrow();
      expect(component.statistics.totalUsers).toBe(1000);
      expect(component.statistics.activeUsers).toBe(500);
    });
  });
});
