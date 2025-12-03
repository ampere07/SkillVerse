import { useAuth } from '../contexts/AuthContext';
import { 
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileText,
  Code,
  FolderKanban,
  Settings as SettingsIcon,
  LogOut,
  Trophy,
  TrendingUp,
  Clock,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Compiler from '../pages/Compiler';
import Classrooms from '../pages/Classrooms';
import MiniProjects from '../pages/MiniProjects';
import Settings from '../pages/Settings';
import Assignments from '../pages/Assignments';
import CreateAssignment from '../pages/CreateAssignment';
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
    label: 'My Classrooms',
    href: '/classrooms',
    roles: ['student', 'teacher']
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
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const coursesResponse = await fetch(`${import.meta.env.VITE_API_URL}/courses/enrolled`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coursesData = await coursesResponse.json();
      if (coursesResponse.ok) {
        setEnrolledCoursesCount(coursesData.enrolledCourses?.length || 0);
      }

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

      const classroomsResponse = await fetch(`${import.meta.env.VITE_API_URL}/classrooms/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const classroomsData = await classroomsResponse.json();
      
      if (classroomsResponse.ok && classroomsData.classrooms) {
        const allActivities: any[] = [];
        
        for (const classroom of classroomsData.classrooms) {
          try {
            const activitiesResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/activities/classroom/${classroom._id}`,
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
            
            if (activitiesResponse.ok) {
              const activitiesData = await activitiesResponse.json();
              if (activitiesData.success && activitiesData.activities) {
                const classroomActivities = activitiesData.activities.map((activity: any) => ({
                  ...activity,
                  classroom: {
                    _id: classroom._id,
                    name: classroom.name,
                    code: classroom.code
                  }
                }));
                allActivities.push(...classroomActivities);
              }
            }
          } catch (err) {
            console.error(`Error fetching activities for classroom ${classroom._id}:`, err);
          }
        }

        const now = new Date();
        const upcomingActivities = allActivities
          .filter(activity => {
            if (!activity.dueDate) return false;
            
            const hasSubmitted = activity.submissions?.some(
              (s: any) => s.student === user?.id || s.student?._id === user?.id
            );
            if (hasSubmitted) return false;
            
            const dueDate = new Date(activity.dueDate);
            const diffTime = dueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays >= 0 && diffDays <= 7;
          })
          .sort((a, b) => {
            const dateA = new Date(a.dueDate).getTime();
            const dateB = new Date(b.dueDate).getTime();
            return dateA - dateB;
          })
          .map(activity => {
            const dueDate = new Date(activity.dueDate);
            const diffTime = dueDate.getTime() - now.getTime();
            const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
              ...activity,
              daysUntilDue
            };
          })
          .slice(0, 5);

        const activeCount = allActivities.filter(activity => {
          const hasSubmitted = activity.submissions?.some(
            (s: any) => s.student === user?.id || s.student?._id === user?.id
          );
          if (hasSubmitted) return false;
          
          if (!activity.dueDate) return true;
          
          const dueDate = new Date(activity.dueDate);
          return dueDate >= now || activity.allowLateSubmission;
        }).length;

        const recentSubmissions = allActivities
          .filter(activity => {
            const submission = activity.submissions?.find(
              (s: any) => s.student === user?.id || s.student?._id === user?.id
            );
            return submission !== undefined;
          })
          .sort((a, b) => {
            const subA = a.submissions?.find((s: any) => s.student === user?.id || s.student?._id === user?.id);
            const subB = b.submissions?.find((s: any) => s.student === user?.id || s.student?._id === user?.id);
            const dateA = subA?.submittedAt ? new Date(subA.submittedAt).getTime() : 0;
            const dateB = subB?.submittedAt ? new Date(subB.submittedAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 3)
          .map(activity => {
            const submission = activity.submissions?.find(
              (s: any) => s.student === user?.id || s.student?._id === user?.id
            );
            const submittedAt = submission?.submittedAt ? new Date(submission.submittedAt) : null;
            const timeAgo = submittedAt ? getTimeAgo(submittedAt) : '';
            
            return {
              title: `${activity.title} completed`,
              timeAgo,
              icon: '/assets/Untitled_icon/Icon-14.png'
            };
          });

        setActiveAssignmentsCount(activeCount);
        setUpcomingAssignments(upcomingActivities);
        setRecentActivities(recentSubmissions.length > 0 ? recentSubmissions : [
          { title: 'No pending assignments', timeAgo: 'Today', icon: '/assets/Untitled_icon/Icon-14.png' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return '1 day ago';
    } else {
      return `${diffDays} days ago`;
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
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-[#E0E0E0] 
        transform transition-transform duration-200 ease-in-out shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-4 h-16 border-b border-[#E0E0E0]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white border-2 border-[#1B5E20] rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[#1B5E20]" />
              </div>
              <span className="text-[15px] font-semibold text-[#212121]">SkillVerse</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.href;
              
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-[10px] rounded-lg transition-all
                    ${isActive 
                      ? 'bg-white border border-[#1B5E20] text-[#1B5E20]' 
                      : 'text-[#757575] hover:bg-[#F5F5F5]'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="px-3 pb-2 pt-3 border-t border-[#E0E0E0] space-y-2">
            <div className="flex items-center gap-3 px-3 py-3 border border-[#E0E0E0] rounded-lg">
              <div className="w-10 h-10 bg-[#F5F5F5] border border-[#E0E0E0] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-[#1B5E20]">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#212121] truncate">{user.name}</p>
                <p className="text-[11px] text-[#757575] capitalize">{user.role}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-[10px] rounded-lg text-[#757575] hover:bg-[#F5F5F5] transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-semibold text-center">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Menu Button */}
        <div className="lg:hidden p-4 bg-white border-b border-[#E0E0E0]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#757575] hover:text-[#212121]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <main className={`flex-1 overflow-auto ${activeNav === '/compiler' ? '' : 'p-6'}`}>
          {activeNav === '/compiler' ? (
            <Compiler onMenuClick={() => setSidebarOpen(true)} />
          ) : activeNav === '/classrooms' ? (
            <Classrooms />
          ) : activeNav === '/mini-projects' ? (
            <MiniProjects 
              ref={miniProjectsRef}
              onHasUnsavedChanges={setHasUnsavedChanges}
            />
          ) : activeNav === '/settings' ? (
            <Settings />
          ) : activeNav === '/assignments' ? (
            <Assignments />
          ) : activeNav === '/create-assignment' ? (
            <CreateAssignment />
          ) : (
            <StudentDashboardContent 
              user={user}
              enrolledCoursesCount={enrolledCoursesCount}
              activeAssignmentsCount={activeAssignmentsCount}
              completedProjectsCount={completedProjectsCount}
              upcomingAssignments={upcomingAssignments}
              recentActivities={recentActivities}
              onMiniProjectsClick={() => handleNavigation('/mini-projects')}
            />
          )}
        </main>
      </div>

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

interface StudentDashboardContentProps {
  user: any;
  enrolledCoursesCount: number;
  activeAssignmentsCount: number;
  completedProjectsCount: number;
  upcomingAssignments: any[];
  recentActivities: any[];
  onMiniProjectsClick: () => void;
}

function StudentDashboardContent({
  user,
  enrolledCoursesCount,
  activeAssignmentsCount,
  completedProjectsCount,
  upcomingAssignments,
  recentActivities,
  onMiniProjectsClick
}: StudentDashboardContentProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMiniProjects();
  }, []);

  const fetchMiniProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/mini-projects/available-projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && data.availableProjects) {
        setProjects(data.availableProjects.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching mini projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Welcome Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-[28px] font-semibold text-[#212121]">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <Sparkles className="w-6 h-6 text-[#FFB300]" />
        </div>
        <p className="text-[15px] text-[#757575]">
          Continue your learning journey and track your progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          icon={BookOpen}
          value={enrolledCoursesCount}
          label="Enrolled Classes"
          progress={0}
          color="green"
        />
        <StatCard
          icon={FileText}
          value={activeAssignmentsCount}
          label="Active Assignments"
          progress={0}
          color="gray"
        />
        <StatCard
          icon={Trophy}
          value={completedProjectsCount}
          label="Mini Projects Completed"
          progress={completedProjectsCount > 0 ? 20 : 0}
          color="gold"
          badge="↑ 15%"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Learning Progress */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quick Actions - Only show if there are projects */}
          {projects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[20px] font-semibold text-[#212121]">Quick Actions</h2>
                <button 
                  onClick={onMiniProjectsClick}
                  className="text-[13px] font-semibold text-[#1B5E20] hover:underline"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project, index) => (
                  <button
                    key={index}
                    onClick={onMiniProjectsClick}
                    className="bg-white border border-[#E0E0E0] rounded-xl p-5 hover:shadow-md transition-shadow text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#F5F5F5] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Code className="w-6 h-6 text-[#757575]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold text-[#212121] mb-1">{project.title}</h3>
                        <p className="text-[13px] text-[#757575] line-clamp-2">{project.description}</p>
                        {project.language && (
                          <div className="mt-2">
                            <span className="text-[11px] px-2 py-1 rounded" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
                              {project.language}
                            </span>
                          </div>
                        )}
                      </div>
                      <svg 
                        className="w-5 h-5 text-[#757575] group-hover:text-[#1B5E20] transition-colors flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Learning Progress */}
          <div>
            <h2 className="text-[20px] font-semibold text-[#212121] mb-4">Learning Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProgressCard
                title="Course Completion"
                current={0}
                total={5}
                color="green"
              />
              <ProgressCard
                title="Assignment Progress"
                current={0}
                total={10}
                color="gray"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1B5E20]" />
                <h3 className="text-[15px] font-semibold text-[#212121]">Recent Activity</h3>
              </div>
              <button className="text-[12px] font-semibold text-[#1B5E20] hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#F5F5F5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-[#757575]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#212121]">{activity.title}</p>
                    <p className="text-[12px] text-[#757575]">{activity.timeAgo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          {/* Upcoming Widget */}
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="w-5 h-5 text-[#FFB300]" />
              <h3 className="text-[15px] font-semibold text-[#212121]">Upcoming</h3>
            </div>
            
            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-[#1B5E20]" />
                </div>
                <h4 className="text-sm font-semibold text-[#212121] mb-1">You're all caught up!</h4>
                <p className="text-[13px] text-[#757575]">No upcoming assignments or deadlines</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.slice(0, 3).map((assignment, index) => (
                  <div key={index} className="p-3 bg-[#F5F5F5] rounded-lg">
                    <p className="text-sm font-semibold text-[#212121] mb-1">{assignment.title}</p>
                    <p className="text-xs text-[#757575]">{assignment.classroom?.name}</p>
                    <p className="text-xs text-[#FFB300] font-semibold mt-1">
                      {assignment.daysUntilDue === 0 ? 'Due today' : 
                       assignment.daysUntilDue === 1 ? 'Due tomorrow' : 
                       `Due in ${assignment.daysUntilDue} days`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-[#E0E0E0] flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2 text-[#757575]">
                <Clock className="w-4 h-4" />
                <span>Today</span>
              </div>
              <span className="font-semibold text-[#212121]">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Achievement Card */}
          {completedProjectsCount > 0 && (
            <div className="bg-white border-2 border-[#FFB300] rounded-xl p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-[#FFB300]" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#212121] mb-1">
                  {completedProjectsCount} Project{completedProjectsCount !== 1 ? 's' : ''} Done!
                </h3>
                <p className="text-[13px] text-[#757575]">Keep up the great work</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  value: number;
  label: string;
  progress: number;
  color: 'green' | 'gray' | 'gold';
  badge?: string;
}

function StatCard({ icon: Icon, value, label, progress, color, badge }: StatCardProps) {
  const colorClasses = {
    green: 'bg-[#1B5E20]',
    gray: 'bg-[#757575]',
    gold: 'bg-[#FFB300]'
  };

  const iconColorClasses = {
    green: 'text-[#1B5E20]',
    gray: 'text-[#757575]',
    gold: 'text-[#FFB300]'
  };

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-[#F5F5F5] rounded-lg flex items-center justify-center">
          <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
        </div>
        {badge && (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#F5F5F5] rounded-full">
            <span className="text-[11px] font-semibold text-[#1B5E20]">{badge}</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-[32px] font-semibold text-[#212121] leading-none">{value}</p>
        <p className="text-[13px] font-semibold text-[#757575]">{label}</p>
        <div className="w-full h-0.5 bg-[#F5F5F5] rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClasses[color]} rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  color: 'green' | 'gray';
}

function ProgressCard({ title, current, total, color }: ProgressCardProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const colorClasses = {
    green: { bar: 'bg-[#1B5E20]', text: 'text-[#1B5E20]' },
    gray: { bar: 'bg-[#757575]', text: 'text-[#757575]' }
  };

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#212121]">{title}</h3>
        <span className="text-[13px] font-semibold text-[#757575]">
          {current}/{total}
        </span>
      </div>
      <div className="space-y-2">
        <div className="w-full h-1 bg-[#F5F5F5] rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClasses[color].bar} rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-end gap-2">
          <span className={`text-[20px] font-semibold ${colorClasses[color].text} leading-none`}>
            {percentage}%
          </span>
          <span className="text-[12px] text-[#757575] pb-0.5">Complete</span>
        </div>
      </div>
    </div>
  );
}
