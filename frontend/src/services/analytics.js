// Performance Analytics Service
export class PerformanceAnalytics {
  static calculateTaskCompletionRate(tasks) {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 2);
    return Math.round((completedTasks.length / tasks.length) * 100);
  }

  static calculateProductivityScore(tasks) {
    if (!tasks || tasks.length === 0) return 0;
    
    const completionRate = this.calculateTaskCompletionRate(tasks);
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 2
    ).length;
    
    const completionScore = completionRate * 0.7;
    const overdueScore = Math.max(0, 100 - (overdueTasks * 10)) * 0.3;
    
    return Math.round(completionScore + overdueScore);
  }

  static getTeamProductivityMetrics(tasks, users) {
    if (!users || users.length === 0) return [];
    
    return users.map(user => {
      const userTasks = tasks.filter(task => 
        task.assignedUserId === user.id || task.userId === user.id
      );
      
      const completedTasks = userTasks.filter(task => task.status === 2).length;
      const productivity = userTasks.length > 0 
        ? Math.round((completedTasks / userTasks.length) * 100)
        : 0;
      
      return {
        id: user.id,
        name: user.name,
        totalTasks: userTasks.length,
        completedTasks,
        productivity
      };
    }).sort((a, b) => b.productivity - a.productivity);
  }

  static getWeeklyTrends(tasks) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        created: dayTasks.length,
        completed: dayTasks.filter(task => task.status === 2).length
      });
    }
    
    return days;
  }

  static generateInsights(tasks) {
    const insights = [];
    const completionRate = this.calculateTaskCompletionRate(tasks);
    
    if (completionRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Completion Rate',
        message: `Only ${completionRate}% of tasks are completed.`,
        action: 'Review pending tasks'
      });
    } else if (completionRate > 80) {
      insights.push({
        type: 'success',
        title: 'High Performance',
        message: `Excellent completion rate of ${completionRate}%!`,
        action: 'Maintain momentum'
      });
    }
    
    return insights;
  }
}