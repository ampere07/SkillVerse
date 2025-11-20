// API utility functions for classroom and assignment management

const API_URL = import.meta.env.VITE_API_URL;

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// ===== CLASSROOM API =====

export const classroomAPI = {
  // Get all teacher's classrooms
  getTeacherClassrooms: async () => {
    const response = await fetch(`${API_URL}/classrooms/teacher`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch classrooms');
    return response.json();
  },

  // Get all student's classrooms
  getStudentClassrooms: async () => {
    const response = await fetch(`${API_URL}/classrooms/student`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch classrooms');
    return response.json();
  },

  // Get single classroom
  getClassroom: async (id: string) => {
    const response = await fetch(`${API_URL}/classrooms/${id}`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch classroom');
    return response.json();
  },

  // Create classroom
  createClassroom: async (data: {
    name: string;
    description?: string;
    settings?: {
      allowStudentPosts?: boolean;
      requireApprovalToJoin?: boolean;
    };
  }) => {
    const response = await fetch(`${API_URL}/classrooms`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create classroom');
    }
    return response.json();
  },

  // Update classroom
  updateClassroom: async (id: string, data: {
    name?: string;
    description?: string;
    settings?: any;
  }) => {
    const response = await fetch(`${API_URL}/classrooms/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update classroom');
    return response.json();
  },

  // Delete classroom
  deleteClassroom: async (id: string) => {
    const response = await fetch(`${API_URL}/classrooms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete classroom');
    return response.json();
  },

  // Join classroom (student)
  joinClassroom: async (code: string) => {
    const response = await fetch(`${API_URL}/classrooms/join`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ code })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to join classroom');
    }
    return response.json();
  },

  // Remove student from classroom
  removeStudent: async (classroomId: string, studentId: string) => {
    const response = await fetch(`${API_URL}/classrooms/${classroomId}/students/${studentId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to remove student');
    return response.json();
  }
};

// ===== UPLOAD API =====

export const uploadAPI = {
  uploadSingle: async (file: File, metadata: { classroomName: string; postTitle: string; postType: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('classroomName', metadata.classroomName);
    formData.append('postTitle', metadata.postTitle);
    formData.append('postType', metadata.postType);

    const response = await fetch(`${API_URL}/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload file');
    }
    return response.json();
  },

  uploadMultiple: async (files: File[], metadata: { classroomName: string; postTitle: string; postType: string }) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('classroomName', metadata.classroomName);
    formData.append('postTitle', metadata.postTitle);
    formData.append('postType', metadata.postType);

    const response = await fetch(`${API_URL}/upload/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload files');
    }
    return response.json();
  },

  deleteFile: async (publicId: string) => {
    const response = await fetch(`${API_URL}/upload/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    
    if (!response.ok) throw new Error('Failed to delete file');
    return response.json();
  }
};

// ===== ACTIVITY API =====

export const activityAPI = {
  getClassroomActivities: async (classroomId: string) => {
    const response = await fetch(`${API_URL}/activities/classroom/${classroomId}`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  },

  getActivity: async (id: string) => {
    const response = await fetch(`${API_URL}/activities/${id}`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch activity');
    return response.json();
  },

  createActivity: async (data: {
    classroomId: string;
    title: string;
    description: string;
    dueDate?: string;
    points?: number;
    instructions?: string;
    requiresCompiler?: boolean;
    isPublished?: boolean;
    allowLateSubmission?: boolean;
    attachments?: any[];
  }) => {
    const response = await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create activity');
    }
    return response.json();
  },

  updateActivity: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/activities/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update activity');
    return response.json();
  },

  deleteActivity: async (id: string) => {
    const response = await fetch(`${API_URL}/activities/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete activity');
    return response.json();
  },

  submitActivity: async (id: string, data: {
    content: string;
    attachments?: any[];
  }) => {
    const response = await fetch(`${API_URL}/activities/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit activity');
    }
    return response.json();
  },

  gradeSubmission: async (activityId: string, studentId: string, data: {
    grade: number;
    feedback?: string;
  }) => {
    const response = await fetch(`${API_URL}/activities/${activityId}/grade/${studentId}`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to grade activity');
    }
    return response.json();
  }
};

// ===== MODULE API =====

export const moduleAPI = {
  getClassroomModules: async (classroomId: string) => {
    const response = await fetch(`${API_URL}/modules/classroom/${classroomId}`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch modules');
    return response.json();
  },

  getModule: async (id: string) => {
    const response = await fetch(`${API_URL}/modules/${id}`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch module');
    return response.json();
  },

  createModule: async (data: {
    classroomId: string;
    title: string;
    description: string;
    isPublished?: boolean;
    attachments?: any[];
  }) => {
    const response = await fetch(`${API_URL}/modules`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create module');
    }
    return response.json();
  },

  updateModule: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/modules/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update module');
    return response.json();
  },

  deleteModule: async (id: string) => {
    const response = await fetch(`${API_URL}/modules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete module');
    return response.json();
  }
};

// ===== ASSIGNMENT API =====

export const assignmentAPI = {
  // Get all assignments for a classroom
  getClassroomAssignments: async (classroomId: string) => {
    const response = await fetch(`${API_URL}/assignments/classroom/${classroomId}`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return response.json();
  },

  // Get single assignment
  getAssignment: async (id: string) => {
    const response = await fetch(`${API_URL}/assignments/${id}`, {
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch assignment');
    return response.json();
  },

  // Create assignment
  createAssignment: async (data: {
    classroomId: string;
    title: string;
    description: string;
    type?: string;
    dueDate?: string;
    points?: number;
    instructions?: string;
    isPublished?: boolean;
    allowLateSubmission?: boolean;
  }) => {
    const response = await fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create assignment');
    }
    return response.json();
  },

  // Update assignment
  updateAssignment: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/assignments/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update assignment');
    return response.json();
  },

  // Delete assignment
  deleteAssignment: async (id: string) => {
    const response = await fetch(`${API_URL}/assignments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete assignment');
    return response.json();
  },

  // Submit assignment (student)
  submitAssignment: async (id: string, data: {
    content: string;
    attachments?: any[];
  }) => {
    const response = await fetch(`${API_URL}/assignments/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit assignment');
    }
    return response.json();
  },

  // Grade submission (teacher)
  gradeSubmission: async (assignmentId: string, studentId: string, data: {
    grade: number;
    feedback?: string;
  }) => {
    const response = await fetch(`${API_URL}/assignments/${assignmentId}/grade/${studentId}`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to grade assignment');
    }
    return response.json();
  }
};
