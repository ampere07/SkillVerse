import { useEffect, useState } from 'react';
import {
  BookOpen,
  FileText,
  Plus,
  TrendingUp,
  Clock,
  Calendar,
  Users,
  CheckCircle
} from 'lucide-react';

interface TeacherDashboardContentProps {
  user: any;
}

export default function TeacherDashboardContent({ user }: TeacherDashboardContentProps) {
  const [classroomsCount, setClassroomsCount] = useState(0);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [teacherActivities, setTeacherActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  const fetchTeacherStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const classroomsResponse = await fetch(`${import.meta.env.VITE_API_URL}/classrooms/teacher`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const classroomsData = await classroomsResponse.json();
      
      if (classroomsResponse.ok && classroomsData.classrooms) {
        setClassroomsCount(classroomsData.classrooms.length);

        let totalSubmissions = 0;
        const activities: any[] = [];

        for (const classroom of classroomsData.classrooms) {
          try {
            const activitiesResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/activities/classroom/${classroom._id}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (activitiesResponse.ok) {
              const activitiesData = await activitiesResponse.json();
              if (activitiesData.success && activitiesData.activities) {
                activitiesData.activities.forEach((activity: any) => {
                  totalSubmissions += activity.submissions?.length || 0;
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching activities for classroom ${classroom._id}:`, err);
          }
        }

        setSubmissionsCount(totalSubmissions);
        
        for (const classroom of classroomsData.classrooms) {
          activities.push({
            title: `Created classroom: ${classroom.name}`,
            timeAgo: getTimeAgo(new Date(classroom.createdAt)),
            type: 'classroom'
          });
        }

        setTeacherActivities(activities.sort((a, b) => 
          new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime()
        ).slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-[#212121]">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-[15px] text-[#757575]">
          Continue your learning journey and track your progress
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <StatCard
          icon={Users}
          value={classroomsCount}
          label="Classrooms"
          progress={0}
          color="green"
        />
        <StatCard
          icon={CheckCircle}
          value={submissionsCount}
          label="Assignment Submissions"
          progress={0}
          color="gray"
        />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-[20px] font-semibold text-[#212121] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionCard
              icon={Plus}
              title="Create Classroom"
              description="Start a new class"
              color="green"
              href="/classrooms"
            />
            <QuickActionCard
              icon={FileText}
              title="Create Post"
              description="Add activity or module"
              color="gray"
              href="/classrooms"
            />
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1B5E20]" />
              <h3 className="text-[15px] font-semibold text-[#212121]">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-3">
            {teacherActivities.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#757575]">No recent activities</p>
              </div>
            ) : (
              teacherActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#F5F5F5] rounded-lg flex items-center justify-center flex-shrink-0">
                    {activity.type === 'classroom' ? (
                      <Users className="w-4 h-4 text-[#1B5E20]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#1B5E20]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#212121]">{activity.title}</p>
                    <p className="text-[12px] text-[#757575]">{activity.timeAgo}</p>
                  </div>
                </div>
              ))
            )}
          </div>
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
  color: 'green' | 'gray';
}

function StatCard({ icon: Icon, value, label, progress, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-[#1B5E20]',
    gray: 'bg-[#757575]'
  };

  const iconColorClasses = {
    green: 'text-[#1B5E20]',
    gray: 'text-[#757575]'
  };

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-[#F5F5F5] rounded-lg flex items-center justify-center">
          <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[32px] font-semibold text-[#212121] leading-none">{value}</p>
        <p className="text-[13px] font-semibold text-[#757575]">{label}</p>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: any;
  title: string;
  description: string;
  color: 'green' | 'gray';
  href: string;
}

function QuickActionCard({ icon: Icon, title, description, color }: QuickActionCardProps) {
  const colorClasses = {
    green: 'bg-[#1B5E20] hover:bg-[#2E7D32]',
    gray: 'bg-[#757575] hover:bg-[#616161]'
  };

  return (
    <button className={`${colorClasses[color]} text-white rounded-xl p-4 text-left transition-colors`}>
      <Icon className="w-6 h-6 mb-3" />
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-xs opacity-90">{description}</p>
    </button>
  );
}
