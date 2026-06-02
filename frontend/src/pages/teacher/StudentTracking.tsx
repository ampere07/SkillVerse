import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Users, Filter, Download } from 'lucide-react';

interface StudentTrackingProps {
  onNavigate?: (path: string, state?: { code?: string; language?: string }) => void;
  setViewingStudent?: (value: boolean) => void;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  level?: number;
  classroomName: string;
  classroomCode: string;
  joinedAt?: string;
  classAverage?: number;
  overallScore?: number;
}

const getSummaryBadge = (score: number) => {
  if (score >= 80) {
    return (
      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
        {score}% (Excellent)
      </span>
    );
  }
  if (score >= 60) {
    return (
      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
        {score}% (Good)
      </span>
    );
  }
  if (score >= 40) {
    return (
      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
        {score}% (Satisfactory)
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
      {score}% (Needs Attention)
    </span>
  );
};

interface Classroom {
  _id: string;
  name: string;
  code: string;
  students?: Array<{
    studentId: string | { _id: string };
    joinedAt?: string;
  }>;
}

export default function StudentTracking({ onNavigate, setViewingStudent }: StudentTrackingProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchStudentsProgress();
  }, []);



  useEffect(() => {
    if (classrooms.length > 0) {
      if (selectedClassroom) {
        const filtered = allStudents.filter((s: Student) => {
          const classroom = classrooms.find((c: Classroom) => c._id === selectedClassroom);
          return s.classroomName === classroom?.name;
        });
        setStudents(filtered);
      } else {
        setStudents(allStudents);
      }
    }
  }, [selectedClassroom, allStudents, classrooms]);

  const fetchStudentsProgress = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      console.log('Fetching classrooms...');

      const classroomsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/classrooms/teacher`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Classrooms response:', classroomsResponse.data);

      if (classroomsResponse.data.success) {
        const teacherClassrooms: Classroom[] = classroomsResponse.data.classrooms;
        console.log('Teacher classrooms:', teacherClassrooms);

        if (JSON.stringify(teacherClassrooms) !== JSON.stringify(classrooms)) {
          setClassrooms(teacherClassrooms);
        }

        const allStudentsData: Student[] = [];
        
        // Cache to prevent fetching duplicate students multiple times across classrooms
        const studentProgressCache: Record<string, { overallScore: number; userProfile: any }> = {};

        for (const classroom of teacherClassrooms) {
          console.log('Processing classroom:', classroom.name, 'Students:', classroom.students);

          const classroomStudents: Array<{
            studentEnrollment: any;
            profile: any;
            overallScore: number;
          }> = [];
          
          let totalClassScore = 0;
          const totalEnrolled = classroom.students?.length || 0;

          for (const studentEnrollment of classroom.students || []) {
            try {
              const studentId = typeof studentEnrollment.studentId === 'string'
                ? studentEnrollment.studentId
                : (studentEnrollment.studentId as { _id: string })._id || String(studentEnrollment.studentId);

              let cached = studentProgressCache[studentId];
              if (!cached) {
                console.log('Fetching student profile:', studentId);
                const studentResponse = await axios.get(
                  `${import.meta.env.VITE_API_URL}/auth/users/${studentId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                console.log('Fetching student overall progress:', studentId);
                const progressResponse = await axios.get(
                  `${import.meta.env.VITE_API_URL}/progress/student/overall?studentId=${studentId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                let overallScore = 0;
                if (progressResponse.data.success && progressResponse.data.progress) {
                  const p = progressResponse.data.progress;
                  overallScore = (p.detailedAiAnalysis?.overallScore !== undefined && p.detailedAiAnalysis?.overallScore !== null)
                    ? p.detailedAiAnalysis.overallScore
                    : p.jobReadiness?.overallScore || 0;
                }

                cached = {
                  overallScore,
                  userProfile: studentResponse.data.success ? studentResponse.data.user : null
                };
                studentProgressCache[studentId] = cached;
              }

              if (cached.userProfile) {
                classroomStudents.push({
                  studentEnrollment,
                  profile: cached.userProfile,
                  overallScore: cached.overallScore
                });
                totalClassScore += cached.overallScore;
              }
            } catch (err) {
              console.error(`Error fetching student progress for enrollment:`, err);
            }
          }

          const classAverage = totalEnrolled > 0 ? Math.round(totalClassScore / totalEnrolled) : 0;

          classroomStudents.forEach(({ studentEnrollment, profile, overallScore }) => {
            allStudentsData.push({
              _id: profile._id,
              name: profile.name,
              email: profile.email,
              profilePicture: profile.profilePicture,
              level: profile.level,
              classroomName: classroom.name,
              classroomCode: classroom.code,
              joinedAt: studentEnrollment.joinedAt,
              classAverage: classAverage,
              overallScore: overallScore
            });
          });
        }

        console.log('All students data:', allStudentsData);
        setAllStudents(allStudentsData);



        if (selectedClassroom) {
          const filtered = allStudentsData.filter((s: Student) => {
            const classroom = teacherClassrooms.find((c: Classroom) => c._id === selectedClassroom);
            return s.classroomName === classroom?.name;
          });
          setStudents(filtered);
        } else {
          setStudents(allStudentsData);
        }
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchStudentsProgress();
  };

  const handleRowClick = (student: Student) => {
    sessionStorage.setItem('viewingStudent', 'true');
    sessionStorage.setItem('studentId', student._id);
    sessionStorage.setItem('studentName', student.name);

    if (setViewingStudent) {
      setViewingStudent(true);
    }

    if (onNavigate) {
      onNavigate('/progress-tracking');
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="p-6">
        {/* Header Skeleton */}
        <div className="mb-6 flex justify-between items-center">
          <div className="h-9 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-1/3"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></th>
                  <th className="px-6 py-3 w-1/4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></th>
                  <th className="px-6 py-3 w-1/12"><div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div></th>
                  <th className="px-6 py-3 w-1/8"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></th>
                  <th className="px-6 py-3 w-1/5"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
                        <div className="ml-4 space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Student Tracking</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const csvContent = [
                ['Student Name', 'Classroom Name', 'Code', 'Class Overall Average', 'Overall Summary'],
                ...students.map((s: Student) => {
                  const summaryText = s.overallScore !== undefined 
                    ? `${s.overallScore}% (${s.overallScore >= 80 ? 'Excellent' : s.overallScore >= 60 ? 'Good' : s.overallScore >= 40 ? 'Satisfactory' : 'Needs Attention'})`
                    : 'N/A';
                  return [
                    s.name, 
                    s.classroomName, 
                    s.classroomCode, 
                    s.classAverage !== undefined ? `${s.classAverage}%` : 'N/A',
                    summaryText
                  ];
                })
              ].map(row => row.join(',')).join('\n');

              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `student_tracking_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classrooms</option>
            {classrooms.map((classroom: Classroom) => (
              <option key={classroom._id} value={classroom._id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-sm text-gray-600">
          Showing {students.length} students
        </span>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Classroom Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Class Overall
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  Overall Summary
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student: Student) => (
                <tr
                  key={`${student._id}-${student.classroomCode}`}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(student)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.classroomName}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {student.classroomCode}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-700">
                      {student.classAverage !== undefined ? `${student.classAverage}%` : '0%'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSummaryBadge(student.overallScore || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {students.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No students enrolled in this classroom
          </p>
        </div>
      )}
    </div>
  );
}
