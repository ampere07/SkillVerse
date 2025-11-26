import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Users,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Menu,
  X,
  Code,
  FolderKanban,
  CheckCircle2,
  Circle,
  Settings as SettingsIcon
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Compiler from '../pages/Compiler';
import MyCourses from '../pages/MyCourses';
import TeacherClassrooms from '../pages/TeacherClassrooms';
import MiniProjects from '../pages/MiniProjects';
import Settings from '../pages/Settings';
import UnsavedChangesModal from './UnsavedChangesModal';

interface NavItem {
  icon: any;
  label: string;
  href: string;
  roles: ('student' | 'teacher')[];
}

const navigationItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['student', 'teacher']
  },
  {
    icon: BookOpen,
    label: 'My Class',
    href: '/courses',
    roles: ['student']
  },
  {
    icon: FileText,
    label: 'Assignments',
    href: '/assignments',
    roles: ['student']
  },
  {
    icon: Code,
    label: 'Compiler',
    href: '/compiler',
    roles: ['student']
  },
  {
    icon: FolderKanban,
    label: 'Mini Projects',
    href: '/mini-projects',
    roles: ['student']
  },
  {
    icon: GraduationCap,
    label: 'My Classrooms',
    href: '/classrooms',
    roles: ['teacher']
  },
  {
    icon: ClipboardList,
    label: 'Create Assignment',
    href: '/create-assignment',
    roles: ['teacher']
  },
  {
    icon: Users,
    label: 'Students',
    href: '/students',
    roles: ['teacher']
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    href: '/analytics',
    roles: ['teacher']
  },
  {
    icon: SettingsIcon,
    label: 'Settings',
    href: '/settings',
    roles: ['student', 'teacher']
  }
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('/dashboard');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const miniProjectsRef = useRef<any>(null);
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);
  const [completedProjectsCount, setCompletedProjectsCount] = useState(0);
  const [activeAssignmentsCount, setActiveAssignmentsCount] = useState(0);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch enrolled courses
      const coursesResponse = await fetch(`${import.meta.env.VITE_API_URL}/courses/enrolled`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coursesData = await coursesResponse.json();
      if (coursesResponse.ok) {
        setEnrolledCoursesCount(coursesData.enrolledCourses?.length || 0);
      }

      // Fetch completed mini projects
      const miniProjectsResponse = await fetch(`${import.meta.env.VITE_API_URL}/mini-projects/completed-tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const miniProjectsData = await miniProjectsResponse.json();
      if (miniProjectsResponse.ok) {
        const completedCount = miniProjectsData.completedTasks?.filter(
          (task: any) => task.status === 'submitted'
        ).length || 0;
        setCompletedProjectsCount(completedCount);
      }

      // Fetch assignments
      const assignmentsResponse = await fetch(`${import.meta.env.VITE_API_URL}/assignments/student/my-assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const assignmentsData = await assignmentsResponse.json();
      if (assignmentsResponse.ok) {
        setActiveAssignmentsCount(assignmentsData.activeCount || 0);
        setUpcomingAssignments(assignmentsData.upcomingAssignments || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (!user) {
    return null;
  }

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  const handleNavigation = (href: string) => {
    if (hasUnsavedChanges && activeNav === '/mini-projects') {
      setPendingNavigation(href);
      setShowNavigationWarning(true);
    } else {
      setActiveNav(href);
      setHasUnsavedChanges(false);
    }
  };

  const handleCancelNavigation = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  const handleConfirmNavigation = () => {
    setShowNavigationWarning(false);
    if (pendingNavigation) {
      setActiveNav(pendingNavigation);
      setHasUnsavedChanges(false);
    }
    setPendingNavigation(null);
  };

  const handleSaveAndNavigate = async () => {
    if (miniProjectsRef.current && miniProjectsRef.current.saveProgress) {
      await miniProjectsRef.current.saveProgress();
    }
    setShowNavigationWarning(false);
    if (pendingNavigation) {
      setActiveNav(pendingNavigation);
      setHasUnsavedChanges(false);
    }
    setPendingNavigation(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-200 z-50 
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">SkillVerse</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-700">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.href;
              
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full flex items-center space-x-2 px-3 py-2 rounded transition-colors
                    ${isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-2 pb-2 border-t border-gray-200 pt-2">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-56">
        {/* Page Content */}
        <main className={activeNav === '/compiler' ? '' : 'p-4'}>
          {activeNav === '/compiler' ? (
            <Compiler onMenuClick={() => setSidebarOpen(true)} />
          ) : activeNav === '/courses' ? (
            <>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mb-4 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-5 h-5" />
              </button>
              <MyCourses />
            </>
          ) : activeNav === '/classrooms' ? (
            <>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mb-4 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-5 h-5" />
              </button>
              <TeacherClassrooms />
            </>
          ) : activeNav === '/mini-projects' ? (
            <>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mb-4 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-5 h-5" />
              </button>
              <MiniProjects 
                ref={miniProjectsRef}
                onHasUnsavedChanges={setHasUnsavedChanges}
              />
            </>
          ) : activeNav === '/settings' ? (
            <>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mb-4 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Settings />
            </>
          ) : (
            <>
              {/* Mobile Menu Button for non-compiler pages */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mb-4 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Welcome Section */}
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  Welcome back, {user.name}
                </h2>
                <p className="text-xs text-gray-500">
                  {user.role === 'teacher' 
                    ? 'Manage your courses and track student progress.' 
                    : 'Continue your learning journey and complete assignments.'}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {user.role === 'student' ? (
                  <>
                    <StatCard icon={BookOpen} label="Enrolled Classes" value={enrolledCoursesCount.toString()} />
                    <StatCard icon={FileText} label="Active Assignments" value={activeAssignmentsCount.toString()} />
                    <StatCard icon={FolderKanban} label="Mini Projects Done" value={completedProjectsCount.toString()} />
                  </>
                ) : (
                  <>
                    <StatCard icon={GraduationCap} label="Total Courses" value="8" />
                    <StatCard icon={Users} label="Total Students" value="142" />
                    <StatCard icon={ClipboardList} label="Assignments" value="24" />
                    <StatCard icon={BarChart3} label="Avg. Performance" value="82%" />
                  </>
                )}
              </div>

              {/* Content Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {user.role === 'student' ? (
                  <>
                    <QuickActionsCard
                      title="Quick Actions"
                      onMiniProjectsClick={() => handleNavigation('/mini-projects')}
                    />
                    <ContentCard
                      title="Upcoming Assignments"
                      items={upcomingAssignments.length > 0 ? upcomingAssignments.map(assignment => ({
                        label: assignment.title,
                        due: assignment.daysUntilDue === 0 
                          ? 'Due today' 
                          : assignment.daysUntilDue === 1 
                          ? 'Due tomorrow' 
                          : `Due in ${assignment.daysUntilDue} days`,
                        classroom: assignment.classroom?.name
                      })) : [
                        { label: 'No upcoming assignments', due: '' }
                      ]}
                    />
                  </>
                ) : (
                  <>
                    <ContentCard
                      title="Active Courses"
                      items={[
                        { label: 'Web Development 101', students: 42 },
                        { label: 'Advanced React', students: 35 },
                        { label: 'Backend Systems', students: 28 }
                      ]}
                    />
                    <ContentCard
                      title="Recent Activity"
                      items={[
                        { label: 'New submissions', count: 15 },
                        { label: 'Pending reviews', count: 8 },
                        { label: 'Messages', count: 3 }
                      ]}
                    />
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Unsaved Changes Warning Modal */}
      <UnsavedChangesModal
        isOpen={showNavigationWarning}
        onCancel={handleCancelNavigation}
        onConfirm={handleConfirmNavigation}
        onSaveAndLeave={handleSaveAndNavigate}
        isSaving={false}
      />
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: string;
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
      </div>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

interface ContentCardProps {
  title: string;
  items: any[];
}

function ContentCard({ title, items }: ContentCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{item.label}</p>
              {item.classroom && (
                <p className="text-xs text-gray-500 mt-0.5">{item.classroom}</p>
              )}
              {item.progress !== undefined && (
                <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className="bg-gray-900 h-1.5 rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
            <div className="ml-3 text-right flex-shrink-0">
              {item.due && <p className="text-xs text-gray-500">{item.due}</p>}
              {item.students !== undefined && (
                <p className="text-xs text-gray-500">{item.students} students</p>
              )}
              {item.count !== undefined && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gray-900 text-white text-xs font-medium rounded">
                  {item.count}
                </span>
              )}
              {item.progress !== undefined && (
                <p className="text-xs font-medium text-gray-900">{item.progress}%</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface QuickActionsCardProps {
  title: string;
  onMiniProjectsClick: () => void;
}

interface MiniProject {
  title: string;
}

function QuickActionsCard({ title, onMiniProjectsClick }: QuickActionsCardProps) {
  const [projects, setProjects] = useState<MiniProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMiniProjects();
  }, []);

  const fetchMiniProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/mini-projects/available-projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.availableProjects) {
        setProjects(data.availableProjects.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching mini projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          onClick={onMiniProjectsClick}
          className="text-xs text-gray-600 hover:text-gray-900 font-medium"
        >
          View All
        </button>
      </div>
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">No projects available</p>
          </div>
        ) : (
          projects.map((project, index) => (
            <button
              key={index}
              onClick={onMiniProjectsClick}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group text-left"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center group-hover:bg-gray-800 transition-colors flex-shrink-0">
                  <Code className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{project.title}</p>
              </div>
              <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}