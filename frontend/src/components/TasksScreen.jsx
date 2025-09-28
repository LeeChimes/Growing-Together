import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CheckSquare, Plus, Calendar, User, Building, Camera } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.patch(`${API}/tasks/${taskId}/complete`);
      
      // Update the task in the list
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: true, completed_at: new Date().toISOString() }
          : task
      ));
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 mt-16 md:mt-20">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg loading-skeleton"></div>
        ))}
      </div>
    );
  }

  const personalTasks = tasks.filter(task => task.task_type === 'personal');
  const siteTasks = tasks.filter(task => task.task_type === 'site');
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="p-4 max-w-4xl mx-auto mt-16 md:mt-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-primary">Tasks</h1>
          <p className="text-gray-600">Manage your allotment tasks and community duties</p>
        </div>
        
        <Button 
          className="btn-accessible bg-green-600 hover:bg-green-700"
          data-testid="add-task-btn"
        >
          <Plus className="mr-2" size={20} />
          Add Task
        </Button>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-800">{pendingTasks.length}</div>
            <div className="text-sm text-green-600">Pending Tasks</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-800">{completedTasks.length}</div>
            <div className="text-sm text-blue-600">Completed This Week</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-800">{siteTasks.length}</div>
            <div className="text-sm text-yellow-600">Community Tasks</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" data-testid="pending-tasks-tab">
            Pending ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="personal" data-testid="personal-tasks-tab">
            Personal ({personalTasks.length})
          </TabsTrigger>
          <TabsTrigger value="site" data-testid="site-tasks-tab">
            Site Tasks ({siteTasks.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tasks */}
        <TabsContent value="pending">
          <div className="space-y-4" data-testid="pending-tasks-list">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="p-2"
                          onClick={() => handleCompleteTask(task.id)}
                          data-testid={`complete-task-${task.id}`}
                        >
                          <CheckSquare size={16} />
                        </Button>
                        
                        <div>
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <p className="text-gray-600 text-sm">{task.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={task.task_type === 'site' ? 'default' : 'secondary'}
                          className={task.task_type === 'site' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}
                        >
                          {task.task_type === 'site' ? (
                            <><Building size={12} className="mr-1" />Site</>
                          ) : (
                            <><User size={12} className="mr-1" />Personal</>
                          )}
                        </Badge>
                        
                        {task.due_date && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar size={12} className="mr-1" />
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Created {new Date(task.created_at).toLocaleDateString()}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1"
                      >
                        <Camera size={14} />
                        <span>Add Photo</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No pending tasks</h3>
                <p className="text-gray-500">Great job! All tasks are completed.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Personal Tasks */}
        <TabsContent value="personal">
          <div className="space-y-4" data-testid="personal-tasks-list">
            {personalTasks.length > 0 ? (
              personalTasks.map((task) => (
                <Card key={task.id} className={`hover:shadow-md transition-shadow ${task.completed ? 'opacity-75' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {task.completed && <CheckSquare size={14} className="text-white" />}
                        </div>
                        
                        <div>
                          <CardTitle className={`text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </CardTitle>
                          <p className="text-gray-600 text-sm">{task.description}</p>
                        </div>
                      </div>
                      
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <User size={12} className="mr-1" />
                        Personal
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {task.completed && (
                    <CardContent>
                      <div className="text-sm text-green-600">
                        ✓ Completed on {new Date(task.completed_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <User size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No personal tasks</h3>
                <p className="text-gray-500">Create tasks to track your plot maintenance.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Site Tasks */}
        <TabsContent value="site">
          <div className="space-y-4" data-testid="site-tasks-list">
            {siteTasks.length > 0 ? (
              siteTasks.map((task) => (
                <Card key={task.id} className={`hover:shadow-md transition-shadow ${task.completed ? 'opacity-75' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {task.completed && <CheckSquare size={14} className="text-white" />}
                        </div>
                        
                        <div>
                          <CardTitle className={`text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </CardTitle>
                          <p className="text-gray-600 text-sm">{task.description}</p>
                        </div>
                      </div>
                      
                      <Badge variant="default" className="bg-orange-100 text-orange-800">
                        <Building size={12} className="mr-1" />
                        Community
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        {task.completed ? (
                          `Completed by ${task.completed_by || 'Someone'}`
                        ) : (
                          `Assigned to: ${task.assigned_to || 'Anyone'}`
                        )}
                      </span>
                      
                      {!task.completed && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteTask(task.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Building size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No site tasks</h3>
                <p className="text-gray-500">Community tasks will appear here when created by admins.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksScreen;