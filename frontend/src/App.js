import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import KanbanView from './pages/KanbanView';
import Users from './pages/Users';
import Categories from './pages/Categories';
import TaskDetail from './pages/TaskDetail';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/EditTask';
import CreateUser from './pages/CreateUser';
import EditUser from './pages/EditUser';
import CreateCategory from './pages/CreateCategory';
import EditCategory from './pages/EditCategory';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App">
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/kanban" element={<KanbanView />} />
                <Route path="/tasks/new" element={<CreateTask />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="/tasks/:id/edit" element={<EditTask />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/new" element={<CreateUser />} />
                <Route path="/users/:id/edit" element={<EditUser />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/new" element={<CreateCategory />} />
                <Route path="/categories/:id/edit" element={<EditCategory />} />
              </Routes>
            </Layout>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
